'use strict';

const { assertActiveFounder } = require('./mission_lifecycle_governance');
const { preflightSourceBinding } = require('./mission_source_preflight');
const { finalizeOfficialSource } = require('./mission_official_source_finalizer');
const { verifyOfficialSource } = require('./mission_official_source_verifier');
const { executeOfficialSourcePairCoordinator } = require('./mission_official_source_pair_coordinator');

function required(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}

function sourceInput(payload, role) {
  const prefix = role === 'notification' ? 'notification' : 'syllabus';
  return {
    sourceType: role,
    sourceUrl: required(payload[`${prefix}SourceUrl`], `MISSION_${role.toUpperCase()}_URL_REQUIRED`),
    stagedStoragePath: payload[`${prefix}StagedStoragePath`] || null,
    mimeType: payload[`${prefix}MimeType`] || 'application/pdf',
  };
}

/**
 * Trusted two-document finalizer for the separate notification/syllabus flow.
 * Client input may identify staged bytes and official URLs, but cannot create
 * VERIFIED records: both documents are finalized, re-read, hash-checked and
 * independently origin-correlated by backend code before the pair is queued.
 */
async function runSeparateSourcePairPipeline({ db, storage, auth, payload = {}, recordedAt }) {
  if (!db || !storage || typeof db.runTransaction !== 'function') throw new Error('MISSION_PAIR_RUNTIME_REQUIRED');
  if (!auth || !auth.uid) throw new Error('MISSION_PAIR_EXECUTOR_AUTHORITY_MISSING');
  const missionId = required(payload.missionId, 'MISSION_ID_REQUIRED');
  const cycleKey = required(payload.cycleKey, 'CYCLE_KEY_REQUIRED');
  const authorityKey = required(payload.authorityKey, 'AUTHORITY_KEY_REQUIRED');
  const language = required(payload.sourceLanguage || 'english', 'MISSION_SOURCE_LANGUAGE_REQUIRED').toLowerCase();
  if (!['en', 'eng', 'english'].includes(language)) throw new Error('MISSION_SOURCE_LANGUAGE_UNSUPPORTED');

  const userSnap = await db.collection('users').doc(auth.uid).get();
  assertActiveFounder(auth, userSnap.exists ? userSnap.data() : {});
  const realmRef = db.collection('mission_realms').doc(missionId);
  const realmSnap = await realmRef.get();
  if (!realmSnap.exists) throw new Error('MISSION_REALM_NOT_FOUND');
  const realm = realmSnap.data() || {};
  if (realm.authorityKey !== authorityKey) throw new Error('MISSION_REALM_AUTHORITY_MISMATCH');
  const gate = realm.visibilityGate || {};
  if (realm.studentVisible === true || realm.catalogVisible === true || realm.userPanelVisible === true
      || realm.cardVisible === true || gate.studentVisible === true || gate.catalogVisible === true
      || gate.userPanelVisible === true || gate.cardVisible === true) {
    throw new Error('MISSION_STUDENT_VISIBILITY_FORBIDDEN');
  }

  const sources = {};
  for (const role of ['notification', 'syllabus']) {
    const input = sourceInput(payload, role);
    const pending = await finalizeOfficialSource({
      storage, missionId, cycleKey, authorityKey, ...input,
      recordedAt: recordedAt || new Date().toISOString(),
    });
    sources[role] = await verifyOfficialSource({
      storage, source: { ...pending, language }, preflight: preflightSourceBinding,
    });
  }

  const recorded = recordedAt || new Date().toISOString();
  await db.runTransaction(async transaction => {
    const refs = [realmRef,
      realmRef.collection('official_documents').doc(sources.notification.documentId),
      realmRef.collection('official_documents').doc(sources.syllabus.documentId)];
    const snaps = await Promise.all(refs.map(ref => transaction.get(ref)));
    if (!snaps[0].exists) throw new Error('MISSION_REALM_NOT_FOUND');
    for (let i = 1; i < refs.length; i += 1) {
      const existing = snaps[i].exists ? snaps[i].data() || {} : null;
      if (existing && (existing.contentSha256 !== sources[i === 1 ? 'notification' : 'syllabus'].contentSha256
          || existing.storagePath !== sources[i === 1 ? 'notification' : 'syllabus'].storagePath
          || existing.status !== 'VERIFIED')) throw new Error('MISSION_SOURCE_IMMUTABLE_CONFLICT');
      if (!existing) transaction.create(refs[i], { ...sources[i === 1 ? 'notification' : 'syllabus'], createdAt: recorded, updatedAt: recorded });
    }
  });

  const pairResult = await db.runTransaction(transaction => executeOfficialSourcePairCoordinator({
    transaction, db, missionId, cycleKey, authorityKey,
    notification: sources.notification, syllabus: sources.syllabus,
    preflight: preflightSourceBinding, recordedAt: recorded,
  }));
  return {
    success: true, missionId, cycleKey, sourceState: 'VERIFIED',
    notificationDocumentId: sources.notification.documentId,
    syllabusDocumentId: sources.syllabus.documentId,
    pairResult,
  };
}

module.exports = { runSeparateSourcePairPipeline };
