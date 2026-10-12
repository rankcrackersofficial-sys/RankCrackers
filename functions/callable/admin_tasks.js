'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { logFounderActivity } = require('../services/audit_service');

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE', 'BLOCKED'];

const ALLOWED_TRANSITIONS = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['DONE', 'BLOCKED'],
  BLOCKED: ['IN_PROGRESS', 'DONE'],
  DONE: [], // Terminal for delegated admins
};

/**
 * 🔱 GOVERNED ADMIN TASK TRANSITIONS (P0)
 * Replaces direct client writes with server-authoritative state transitions,
 * assigned-user verification, and scope validation.
 */
exports.transitionAdminTask = functions.https.onCall(async (data, context) => {
  const { auth } = context;
  if (!auth || !auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED: Authentication required.');
  }

  const isFounder = auth.token.founder === true;
  const isAdmin = auth.token.admin === true;

  if (!isFounder && !isAdmin) {
    throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Admin clearance required.');
  }

  const { taskId, nextStatus, adminNote } = data || {};
  if (!taskId || typeof taskId !== 'string' || !taskId.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'TASK_ID_REQUIRED');
  }

  const normalizedNextStatus = (nextStatus || '').toString().trim().toUpperCase();
  if (!VALID_STATUSES.includes(normalizedNextStatus)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `INVALID_TARGET_STATUS: Must be one of ${VALID_STATUSES.join(', ')}`
    );
  }

  const db = admin.firestore();
  const taskRef = db.collection('admin_tasks').doc(taskId.trim());

  let updatedTask;
  await db.runTransaction(async (txn) => {
    const taskSnap = await txn.get(taskRef);
    if (!taskSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'ADMIN_TASK_NOT_FOUND');
    }

    const task = taskSnap.data();
    const currentStatus = (task.status || 'OPEN').toUpperCase();

    // 1. Assignee verification: Delegated Admins can only transition their own assigned tasks
    if (!isFounder) {
      if (task.assignedToUid !== auth.uid) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'TASK_NOT_ASSIGNED_TO_CALLER: You can only transition tasks assigned directly to you.'
        );
      }

      // 2. Scope verification
      if (task.requiredScope) {
        const callerScopes = Array.isArray(auth.token.scopes) ? auth.token.scopes : [];
        if (!callerScopes.includes(task.requiredScope)) {
          throw new functions.https.HttpsError(
            'permission-denied',
            `INSUFFICIENT_SCOPE: Task requires scope '${task.requiredScope}'`
          );
        }
      }

      // 3. State machine transition check
      const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(normalizedNextStatus)) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `INVALID_STATUS_TRANSITION: Cannot transition from '${currentStatus}' to '${normalizedNextStatus}'. Allowed: ${allowedNext.join(', ')}`
        );
      }
    }

    const updatePayload = {
      status: normalizedNextStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdatedByUid: auth.uid,
    };

    if (adminNote !== undefined && adminNote !== null) {
      updatePayload.adminNote = typeof adminNote === 'string' ? adminNote.trim() : '';
    }

    if (normalizedNextStatus === 'DONE' && !task.completedAt) {
      updatePayload.completedAt = admin.firestore.FieldValue.serverTimestamp();
      updatePayload.completedByUid = auth.uid;
    }

    txn.update(taskRef, updatePayload);
    updatedTask = { ...task, ...updatePayload };
  });

  await logFounderActivity({
    type: 'ADMIN_TASK_TRANSITIONED',
    message: `Admin ${auth.uid} moved task '${taskId}' from ${updatedTask.status} to ${normalizedNextStatus}`,
    metadata: {
      taskId: taskId.trim(),
      nextStatus: normalizedNextStatus,
      callerUid: auth.uid,
      isFounder,
    },
  });

  return {
    success: true,
    taskId: taskId.trim(),
    status: normalizedNextStatus,
  };
});

/**
 * 🔱 GOVERNED TASK CREATION (Founder Only)
 */
exports.createAdminTask = functions.https.onCall(async (data, context) => {
  const { auth } = context;
  if (!auth || !auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED: Authentication required.');
  }

  if (auth.token.founder !== true) {
    throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Founder clearance required.');
  }

  const { title, description, assignedToUid, taskType, requiredScope, missionId } = data || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'TASK_TITLE_REQUIRED');
  }
  if (!assignedToUid || typeof assignedToUid !== 'string' || !assignedToUid.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'ASSIGNED_TO_UID_REQUIRED');
  }

  const db = admin.firestore();
  const taskRef = db.collection('admin_tasks').doc();

  const taskDoc = {
    taskId: taskRef.id,
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    assignedToUid: assignedToUid.trim(),
    taskType: (taskType || 'GENERAL').toString().trim().toUpperCase(),
    requiredScope: requiredScope ? requiredScope.toString().trim() : null,
    missionId: missionId ? missionId.toString().trim() : null,
    status: 'OPEN',
    adminNote: '',
    createdByUid: auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await taskRef.set(taskDoc);

  return {
    success: true,
    taskId: taskRef.id,
  };
});
