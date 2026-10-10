/**
 * 🔱 RANKCRACKERS SOURCE IMPACT ROUTER
 * Gate 48CS2 — One-Source Multi-Output Backend Engine Lane
 *
 * Implements the domain module capable of receiving ONE VERIFIED SOURCE DOCUMENT
 * and producing DRY-RUN impacts across:
 *   - MissionImpact (Permanent Mission Profile / Materializer updates)
 *   - CareerSignalImpact (RecruitmentCycle / CareerSignalEvent updates)
 *   - AcademicImpactRef (Syllabus atoms, topic nodes)
 *   - PyqPatternImpactRef (Question paper patterns, marking schemes)
 *
 * Core Principles:
 *   - One verified document can impact zero, one, or multiple subsystems
 *   - Provenance required: unverified documents produce zero signals
 *   - Idempotent: repeated document SHA256 produces NO_OP
 *   - Zero production writes: produces dry-run impact descriptors only
 */

'use strict';

const crypto = require('crypto');
const {
  CAREER_SIGNAL_EVENT_TYPE,
  VERIFICATION_STATE,
  normalizeSourceProvenance,
  normalizeCareerSignalEvent,
  computeSemanticHash
} = require('./career_signal_models');
const { reduceEventsToEffectiveState } = require('./career_signal_reducer');

/**
 * Evaluates document classification from content and metadata.
 */
function classifyDocumentRole(doc = {}) {
  const title = String(doc.title || doc.documentIdentity || '').toLowerCase();
  const docType = String(doc.documentType || '').toUpperCase();

  const isAdvertisement = docType === 'NOTIFICATION' || docType === 'ADVERTISEMENT' ||
                          title.includes('advt') || title.includes('notification') || title.includes('bulletin');
  const isCorrigendum = docType === 'CORRIGENDUM' || title.includes('corrigendum') ||
                        title.includes('amendment') || title.includes('extension');
  const isExamSchedule = docType === 'EXAM_SCHEDULE' || title.includes('schedule') || title.includes('time table');
  const isResult = docType === 'RESULT' || title.includes('result') || title.includes('merit list');
  const isSyllabus = docType === 'SYLLABUS' || title.includes('syllabus') || title.includes('scheme');
  const isPyq = docType === 'QUESTION_PAPER' || title.includes('question paper') || title.includes('answer key');

  return {
    isAdvertisement,
    isCorrigendum,
    isExamSchedule,
    isResult,
    isSyllabus,
    isPyq
  };
}

/**
 * Routes a verified source document payload to produce dry-run impacts.
 */
function routeSourceDocumentImpact(sourceDocument = {}, options = {}) {
  const nowIso = options.nowIso || new Date().toISOString();
  const processedShaStore = options.processedShaStore || new Set();
  const existingCyclesStore = options.existingCyclesStore || {};
  const existingMissionsStore = options.existingMissionsStore || {};

  // Step 1: Validate Provenance
  const provenance = normalizeSourceProvenance(sourceDocument.provenance || sourceDocument);
  if (!provenance || provenance.verificationState !== VERIFICATION_STATE.VERIFIED_SOURCE) {
    return {
      success: false,
      rejectionReason: 'UNVERIFIED_SOURCE_PROVENANCE: Document lacks verified source provenance; zero signals emitted.',
      impacts: {
        missionImpact: null,
        careerSignalImpact: null,
        academicImpactRef: null,
        pyqPatternImpactRef: null
      },
      duplicateDetected: false
    };
  }

  // Step 2: Idempotency check via document SHA256
  const docSha = provenance.documentSha256;
  if (processedShaStore.has(docSha)) {
    return {
      success: true,
      duplicateDetected: true,
      idempotencyNote: `Document with SHA256 ${docSha.substring(0, 12)}... already processed; NO_OP.`,
      impacts: {
        missionImpact: { operation: 'NO_OP', reason: 'Document SHA256 already recorded' },
        careerSignalImpact: { operation: 'NO_OP', reason: 'Document SHA256 already recorded' },
        academicImpactRef: null,
        pyqPatternImpactRef: null
      }
    };
  }

  // Step 3: Classify impacts
  const classification = classifyDocumentRole(sourceDocument);
  const targetMissionId = sourceDocument.permanentMissionId || sourceDocument.targetMissionId || null;
  const targetCycleId = sourceDocument.cycleId || (targetMissionId ? `rc_${provenance.authorityBinding}_${targetMissionId}_${sourceDocument.year || 'current'}` : null);

  // 1. Mission Impact
  let missionImpact = null;
  if (classification.isSyllabus || classification.isAdvertisement) {
    missionImpact = {
      operation: 'UPDATE_MISSION_SOURCE_LINKAGE',
      permanentMissionId: targetMissionId,
      authorityKey: provenance.authorityBinding,
      documentRef: provenance.documentIdentity,
      sourceSha: docSha,
      verifiedAt: provenance.publishedAt || nowIso,
      dryRunDetails: {
        linkOfficialSource: true,
        updateLatestEffectiveSource: true,
        sourceLocator: provenance.officialUrl
      }
    };
  }

  // 2. Career Signal Impact
  let careerSignalImpact = null;
  if (classification.isAdvertisement || classification.isCorrigendum || classification.isExamSchedule || classification.isResult) {
    let eventType = CAREER_SIGNAL_EVENT_TYPE.NEW_NOTIFICATION;
    if (classification.isCorrigendum) eventType = CAREER_SIGNAL_EVENT_TYPE.DEADLINE_EXTENSION;
    else if (classification.isExamSchedule) eventType = CAREER_SIGNAL_EVENT_TYPE.EXAM_SCHEDULED;
    else if (classification.isResult) eventType = CAREER_SIGNAL_EVENT_TYPE.RESULT_DECLARED;

    const eventId = `evt_${docSha.substring(0, 16)}`;
    const eventCandidate = normalizeCareerSignalEvent({
      eventId,
      cycleId: targetCycleId || `rc_${provenance.authorityBinding}_${docSha.substring(0, 8)}`,
      permanentMissionId: targetMissionId,
      authorityKey: provenance.authorityBinding,
      eventType: eventType,
      effectiveDate: sourceDocument.effectiveDate || provenance.publishedAt || nowIso,
      payload: sourceDocument.payload || {},
      documentProvenance: provenance,
      emittedAt: nowIso
    });

    careerSignalImpact = {
      operation: 'EMIT_CAREER_SIGNAL_EVENT',
      cycleId: eventCandidate.cycleId,
      permanentMissionId: targetMissionId,
      event: eventCandidate,
      dryRunDetails: {
        cycleExists: Boolean(existingCyclesStore[eventCandidate.cycleId]),
        isOneOffRecruitment: targetMissionId === null,
        plannedAction: existingCyclesStore[eventCandidate.cycleId] ? 'APPEND_EVENT_AND_REDUCE' : 'CREATE_CYCLE_AND_EMIT_SIGNAL'
      }
    };
  }

  // 3. Academic Impact Ref
  let academicImpactRef = null;
  if (classification.isSyllabus) {
    academicImpactRef = {
      permanentMissionId: targetMissionId,
      documentId: provenance.documentIdentity,
      action: 'TRIGGER_S2_SYLLABUS_ATOMS_VALIDATION_PREFLIGHT',
      readinessState: 'PREPARING_VERIFICATION'
    };
  }

  // 4. PYQ Pattern Impact Ref
  let pyqPatternImpactRef = null;
  if (classification.isPyq) {
    pyqPatternImpactRef = {
      permanentMissionId: targetMissionId,
      documentId: provenance.documentIdentity,
      action: 'REGISTER_CANONICAL_PYQ_EVIDENCE',
      paperReference: sourceDocument.paperReference || null
    };
  }

  return {
    success: true,
    duplicateDetected: false,
    documentIdentity: provenance.documentIdentity,
    documentSha256: docSha,
    impacts: {
      missionImpact,
      careerSignalImpact,
      academicImpactRef,
      pyqPatternImpactRef
    }
  };
}

module.exports = {
  classifyDocumentRole,
  routeSourceDocumentImpact
};
