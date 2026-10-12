'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE', 'BLOCKED'];
const ALLOWED_TRANSITIONS = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['DONE', 'BLOCKED'],
  BLOCKED: ['IN_PROGRESS', 'DONE'],
  DONE: [],
};

function validateTaskTransition({ auth, task, nextStatus }) {
  if (!auth || !auth.uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const isFounder = auth.token && auth.token.founder === true;
  const isAdmin = auth.token && auth.token.admin === true;

  if (!isFounder && !isAdmin) {
    throw new Error('PERMISSION_DENIED_NOT_ADMIN');
  }

  const normalizedNext = (nextStatus || '').toString().trim().toUpperCase();
  if (!VALID_STATUSES.includes(normalizedNext)) {
    throw new Error('INVALID_TARGET_STATUS');
  }

  const currentStatus = (task.status || 'OPEN').toUpperCase();

  if (!isFounder) {
    if (task.assignedToUid !== auth.uid) {
      throw new Error('TASK_NOT_ASSIGNED_TO_CALLER');
    }

    if (task.requiredScope) {
      const callerScopes = Array.isArray(auth.token.scopes) ? auth.token.scopes : [];
      if (!callerScopes.includes(task.requiredScope)) {
        throw new Error('INSUFFICIENT_SCOPE');
      }
    }

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(normalizedNext)) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }
  }

  return {
    taskId: task.taskId,
    status: normalizedNext,
    lastUpdatedByUid: auth.uid,
  };
}

test('admin task transition enforces authentication and admin role', () => {
  const task = {
    taskId: 'task_001',
    status: 'OPEN',
    assignedToUid: 'admin_1',
    requiredScope: 'SYLLABUS_REVIEW',
  };

  assert.throws(
    () => validateTaskTransition({ auth: null, task, nextStatus: 'IN_PROGRESS' }),
    /UNAUTHENTICATED/
  );

  assert.throws(
    () => validateTaskTransition({
      auth: { uid: 'student_1', token: {} },
      task,
      nextStatus: 'IN_PROGRESS',
    }),
    /PERMISSION_DENIED_NOT_ADMIN/
  );
});

test('delegated admin can only transition assigned task with required scope', () => {
  const task = {
    taskId: 'task_001',
    status: 'OPEN',
    assignedToUid: 'admin_1',
    requiredScope: 'SYLLABUS_REVIEW',
  };

  // Other admin cannot touch it
  assert.throws(
    () => validateTaskTransition({
      auth: { uid: 'admin_other', token: { admin: true, scopes: ['SYLLABUS_REVIEW'] } },
      task,
      nextStatus: 'IN_PROGRESS',
    }),
    /TASK_NOT_ASSIGNED_TO_CALLER/
  );

  // Assigned admin missing scope cannot touch it
  assert.throws(
    () => validateTaskTransition({
      auth: { uid: 'admin_1', token: { admin: true, scopes: ['DOCUMENTS_VIEW'] } },
      task,
      nextStatus: 'IN_PROGRESS',
    }),
    /INSUFFICIENT_SCOPE/
  );

  // Assigned admin with scope succeeds
  const res = validateTaskTransition({
    auth: { uid: 'admin_1', token: { admin: true, scopes: ['SYLLABUS_REVIEW'] } },
    task,
    nextStatus: 'IN_PROGRESS',
  });
  assert.equal(res.status, 'IN_PROGRESS');
  assert.equal(res.lastUpdatedByUid, 'admin_1');
});

test('state machine enforces allowed transition path for delegated admin', () => {
  const auth = {
    uid: 'admin_1',
    token: { admin: true, scopes: ['SYLLABUS_REVIEW'] },
  };

  // Cannot jump OPEN -> DONE directly
  assert.throws(
    () => validateTaskTransition({
      auth,
      task: { taskId: 't1', status: 'OPEN', assignedToUid: 'admin_1', requiredScope: 'SYLLABUS_REVIEW' },
      nextStatus: 'DONE',
    }),
    /INVALID_STATUS_TRANSITION/
  );

  // OPEN -> IN_PROGRESS is valid
  const step1 = validateTaskTransition({
    auth,
    task: { taskId: 't1', status: 'OPEN', assignedToUid: 'admin_1', requiredScope: 'SYLLABUS_REVIEW' },
    nextStatus: 'IN_PROGRESS',
  });
  assert.equal(step1.status, 'IN_PROGRESS');

  // IN_PROGRESS -> BLOCKED is valid
  const step2 = validateTaskTransition({
    auth,
    task: { taskId: 't1', status: 'IN_PROGRESS', assignedToUid: 'admin_1', requiredScope: 'SYLLABUS_REVIEW' },
    nextStatus: 'BLOCKED',
  });
  assert.equal(step2.status, 'BLOCKED');

  // BLOCKED -> IN_PROGRESS is valid
  const step3 = validateTaskTransition({
    auth,
    task: { taskId: 't1', status: 'BLOCKED', assignedToUid: 'admin_1', requiredScope: 'SYLLABUS_REVIEW' },
    nextStatus: 'IN_PROGRESS',
  });
  assert.equal(step3.status, 'IN_PROGRESS');

  // IN_PROGRESS -> DONE is valid
  const step4 = validateTaskTransition({
    auth,
    task: { taskId: 't1', status: 'IN_PROGRESS', assignedToUid: 'admin_1', requiredScope: 'SYLLABUS_REVIEW' },
    nextStatus: 'DONE',
  });
  assert.equal(step4.status, 'DONE');

  // Terminal DONE cannot be transitioned by delegated admin
  assert.throws(
    () => validateTaskTransition({
      auth,
      task: { taskId: 't1', status: 'DONE', assignedToUid: 'admin_1', requiredScope: 'SYLLABUS_REVIEW' },
      nextStatus: 'IN_PROGRESS',
    }),
    /INVALID_STATUS_TRANSITION/
  );
});

test('founder can transition any task regardless of assignee or scope', () => {
  const founderAuth = {
    uid: 'founder_1',
    token: { founder: true },
  };

  const task = {
    taskId: 't2',
    status: 'DONE',
    assignedToUid: 'admin_someone_else',
    requiredScope: 'PYQ_REVIEW',
  };

  // Re-opening or changing task by Founder is allowed
  const res = validateTaskTransition({
    auth: founderAuth,
    task,
    nextStatus: 'IN_PROGRESS',
  });
  assert.equal(res.status, 'IN_PROGRESS');
  assert.equal(res.lastUpdatedByUid, 'founder_1');
});


test('production task callable logs the actual previous status', async () => {
  const Module = require('node:module');
  const originalLoad = Module._load;
  const activity = [];
  const task = { status: 'OPEN', assignedToUid: 'admin_1', requiredScope: 'SCOPE' };
  const updated = [];
  const db = {
    collection: () => ({ doc: () => ({}) }),
    runTransaction: async (callback) => callback({
      get: async () => ({ exists: true, data: () => task }),
      update: (_ref, payload) => updated.push(payload),
    }),
  };
  const fakeAdmin = {
    firestore: Object.assign(() => db, { FieldValue: { serverTimestamp: () => 'NOW' } }),
  };
  const fakeFunctions = {
    https: {
      onCall: (handler) => handler,
      HttpsError: class HttpsError extends Error {
        constructor(code, message) { super(message); this.code = code; }
      },
    },
  };
  Module._load = function(request, parent, isMain) {
    if (request === 'firebase-functions') return fakeFunctions;
    if (request === 'firebase-admin') return fakeAdmin;
    if (request === '../services/audit_service' && parent.filename.endsWith('/admin_tasks.js')) {
      return { logFounderActivity: async (entry) => activity.push(entry) };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const callablePath = require.resolve('../callable/admin_tasks');
    delete require.cache[callablePath];
    const { transitionAdminTask } = require(callablePath);
    await transitionAdminTask(
      { taskId: 'task-1', nextStatus: 'IN_PROGRESS' },
      { auth: { uid: 'admin_1', token: { admin: true, scopes: ['SCOPE'] } } }
    );
    assert.equal(updated[0].status, 'IN_PROGRESS');
    assert.match(activity[0].message, /from OPEN to IN_PROGRESS/);
  } finally {
    Module._load = originalLoad;
  }
});
