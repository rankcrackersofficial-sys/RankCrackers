const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const PROJECT_ID = 'rankcrackers-55';
const BASELINE_HEAD = '39d853f2f2b2d24e87ff02019cc530a7827b2d22';
const CANDIDATE_REALM_IDS = [
  'jee_main_2026',
  'neet_(ug)-2027',
  'RPSC_FIRST_GRADE2026_2026_1782713222215',
];
const COLLECTIONS = [
  'mission_realms',
  'recruitments',
  'student_mission_catalog',
];

const FIELD_ALLOWLIST = {
  mission_realms: [
    'realmId', 'missionId', 'displayName', 'title', 'name', 'examName', 'examYear',
    'category', 'type', 'status', 'lifecycleState', 'publishState',
    'createdAt', 'updatedAt', 'createdBy', 'founderId',
    'visibility', 'studentVisible', 'catalogVisible', 'userPanelVisible', 'cardVisible',
    'archived', 'studentEligibility', 'studentEligibilityStatus', 'eligibleForStudents',
  ],
  recruitments: [
    'realmId', 'missionId', 'canonicalRealmId', 'recruitmentId', 'displayName', 'title', 'name',
    'examName', 'examYear', 'year', 'category', 'type', 'status', 'lifecycleState',
    'publishState', 'visibility', 'studentVisible', 'catalogVisible', 'userPanelVisible',
    'cardVisible', 'archived', 'studentEligibility', 'studentEligibilityStatus',
    'createdAt', 'updatedAt',
  ],
  student_mission_catalog: [
    'realmId', 'missionId', 'displayName', 'title', 'name', 'examName', 'examYear',
    'year', 'category', 'type', 'status', 'lifecycleState', 'publishState',
    'userPanelVisible', 'cardVisible', 'visibility', 'studentVisible', 'catalogVisible',
    'archived', 'contentLocks', 'studentEligibility', 'studentEligibilityStatus',
    'createdAt', 'updatedAt',
  ],
};

function serialize(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serialize);
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = serialize(item);
    }
    return out;
  }
  return value;
}

function pickAllowed(collection, data) {
  if (!data) return null;
  const out = {};
  for (const field of FIELD_ALLOWLIST[collection]) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      out[field] = serialize(data[field]);
    }
  }
  return out;
}

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function surfaceValue(record, keys) {
  if (!record || !record.selectedFields) return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record.selectedFields, key)) {
      return record.selectedFields[key];
    }
  }
  return undefined;
}

function compareField(mission, label, keys) {
  const values = {
    missionRealms: surfaceValue(mission.missionRealms, keys),
    recruitments: surfaceValue(mission.recruitments, keys),
    studentMissionCatalog: surfaceValue(mission.studentMissionCatalog, keys),
  };
  const present = Object.values(values).filter((value) => value !== undefined);
  const normalized = present.map((value) => JSON.stringify(value));
  const unique = new Set(normalized);
  let result = 'MISSING';
  if (present.length > 0 && unique.size === 1) result = 'MATCH';
  if (present.length > 0 && unique.size > 1) result = 'DIFFER';
  return { field: label, values, result };
}

function classifyEligibility(mission) {
  const catalog = mission.studentMissionCatalog && mission.studentMissionCatalog.selectedFields;
  if (!catalog) return 'ELIGIBILITY_NOT_PROVEN';
  const visibility = catalog.visibility || {};
  const userPanelVisible = firstPresent(catalog.userPanelVisible, visibility.userPanelVisible);
  const cardVisible = firstPresent(catalog.cardVisible, visibility.cardVisible);
  const studentVisible = firstPresent(catalog.studentVisible, visibility.studentVisible);
  const catalogVisible = firstPresent(catalog.catalogVisible, visibility.catalogVisible);
  const archived = catalog.archived;

  if (userPanelVisible === true && cardVisible === true && archived !== true) {
    return 'STUDENT_ELIGIBLE_PROVEN';
  }
  if (
    userPanelVisible === false ||
    cardVisible === false ||
    studentVisible === false ||
    catalogVisible === false ||
    archived === true
  ) {
    return 'STUDENT_HIDDEN_PROVEN';
  }
  return 'ELIGIBILITY_NOT_PROVEN';
}

function categoryOf(mission) {
  return firstPresent(
    surfaceValue(mission.missionRealms, ['category', 'type']),
    surfaceValue(mission.recruitments, ['category', 'type']),
    surfaceValue(mission.studentMissionCatalog, ['category', 'type'])
  );
}

function missionSummary(mission) {
  return {
    realmId: mission.realmId,
    displayName: firstPresent(
      surfaceValue(mission.missionRealms, ['displayName', 'title', 'name']),
      surfaceValue(mission.recruitments, ['displayName', 'title', 'name']),
      surfaceValue(mission.studentMissionCatalog, ['displayName', 'title', 'name'])
    ) || null,
    category: categoryOf(mission) || null,
    status: firstPresent(
      surfaceValue(mission.missionRealms, ['status', 'lifecycleState', 'publishState']),
      surfaceValue(mission.recruitments, ['status', 'lifecycleState', 'publishState']),
      surfaceValue(mission.studentMissionCatalog, ['status', 'lifecycleState', 'publishState'])
    ) || null,
    createdAt: firstPresent(
      surfaceValue(mission.missionRealms, ['createdAt']),
      surfaceValue(mission.recruitments, ['createdAt']),
      surfaceValue(mission.studentMissionCatalog, ['createdAt'])
    ) || null,
    updatedAt: firstPresent(
      surfaceValue(mission.missionRealms, ['updatedAt']),
      surfaceValue(mission.recruitments, ['updatedAt']),
      surfaceValue(mission.studentMissionCatalog, ['updatedAt'])
    ) || null,
    eligibility: mission.eligibility,
    missionRealms: mission.missionRealms ? mission.missionRealms.selectedFields : null,
    recruitments: mission.recruitments ? mission.recruitments.selectedFields : null,
    studentMissionCatalog: mission.studentMissionCatalog ? mission.studentMissionCatalog.selectedFields : null,
  };
}

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();
  const startedAt = new Date().toISOString();
  const stamp = startedAt.replace(/[-:TZ.]/g, '').slice(0, 14);
  const outDir = path.resolve(__dirname, '..', 'docs', 'patch_safety');

  const reads = [];
  const missions = [];

  for (const realmId of CANDIDATE_REALM_IDS) {
    const mission = { realmId };
    for (const collection of COLLECTIONS) {
      const documentPath = `${collection}/${realmId}`;
      const snap = await db.doc(documentPath).get();
      reads.push({
        timestamp: new Date().toISOString(),
        projectId: PROJECT_ID,
        documentPath,
        exists: snap.exists,
        documentId: realmId,
        readMethod: 'firebase-admin direct document get',
      });
      mission[collection === 'mission_realms'
        ? 'missionRealms'
        : collection === 'recruitments'
          ? 'recruitments'
          : 'studentMissionCatalog'] = snap.exists ? {
        documentPath,
        documentId: realmId,
        exists: true,
        selectedFields: pickAllowed(collection, snap.data()),
      } : {
        documentPath,
        documentId: realmId,
        exists: false,
        selectedFields: null,
      };
    }
    missions.push(mission);
  }

  const missingMissionRealms = missions.filter((mission) => !mission.missionRealms.exists);
  for (const mission of missions) {
    mission.eligibility = classifyEligibility(mission);
    mission.parityMatrix = [
      compareField(mission, 'realmId', ['realmId', 'missionId', 'canonicalRealmId', 'recruitmentId']),
      compareField(mission, 'displayName', ['displayName', 'title', 'name']),
      compareField(mission, 'category', ['category', 'type']),
      compareField(mission, 'examYear', ['examYear', 'year']),
      compareField(mission, 'status', ['status', 'lifecycleState', 'publishState']),
      compareField(mission, 'visibility', ['visibility']),
      compareField(mission, 'studentVisible', ['studentVisible']),
      compareField(mission, 'catalogVisible', ['catalogVisible']),
      compareField(mission, 'userPanelVisible', ['userPanelVisible']),
      compareField(mission, 'cardVisible', ['cardVisible']),
      compareField(mission, 'createdAt', ['createdAt']),
      compareField(mission, 'updatedAt', ['updatedAt']),
    ];
  }

  const categories = missions.map(categoryOf).filter(Boolean).map((value) => String(value).toLowerCase());
  const competitiveCount = categories.filter((value) => value.includes('competitive')).length;
  const qualifyingCount = categories.filter((value) => value.includes('qualifying')).length;
  const divergence = missions.some((mission) => mission.parityMatrix.some((row) => row.result === 'DIFFER'));
  const surfaceVisibilityDivergence = missions.some((mission) => {
    return mission.parityMatrix.some((row) => {
      return ['visibility', 'studentVisible', 'catalogVisible', 'userPanelVisible', 'cardVisible'].includes(row.field) &&
        row.result === 'DIFFER';
    });
  });
  const catalogHiddenWithRecruitmentPublished = missions.some((mission) => {
    const recruitmentStatus = surfaceValue(mission.recruitments, ['status', 'publishState']);
    return String(recruitmentStatus || '').toLowerCase().includes('publish') &&
      mission.eligibility === 'STUDENT_HIDDEN_PROVEN';
  });

  let verdict = 'RANKCRACKERS_ONE_TIME_READ_ONLY_PRODUCTION_MISSION_EXPORT_PASSED';
  if (missingMissionRealms.length > 0) {
    verdict = 'ONE_TIME_PRODUCTION_EXPORT_BLOCKED_BY_REALM_ID_MISMATCH';
  } else if (divergence || surfaceVisibilityDivergence || catalogHiddenWithRecruitmentPublished) {
    verdict = 'RANKCRACKERS_ONE_TIME_READ_ONLY_PRODUCTION_MISSION_EXPORT_PASSED_WITH_PROJECTION_DIVERGENCE';
  }

  const sourceContractVerdict = divergence || surfaceVisibilityDivergence || catalogHiddenWithRecruitmentPublished
    ? 'PRODUCTION_PARITY_SHOWS_MIGRATION_INCOMPLETE'
    : 'STUDENT_MISSION_CATALOG_CONFIRMED_CANONICAL_STUDENT_SOURCE';

  const result = {
    gate: 'ONE_TIME_READ_ONLY_PRODUCTION_MISSION_EXPORT',
    authorization: 'EXPLICIT_ONE_TIME_PRODUCTION_READ_EXCEPTION_GRANTED',
    verdict,
    baseline: {
      expectedHead: BASELINE_HEAD,
      branch: 'safety/rc-g2-pre-notification-schema',
    },
    mode: 'PRODUCTION_READ_ONLY_EVIDENCE_EXPORT_ONLY',
    projectId: PROJECT_ID,
    productionReadExceptionUsed: true,
    productionWriteCount: 0,
    startedAt,
    completedAt: new Date().toISOString(),
    candidateRealmIds: CANDIDATE_REALM_IDS,
    readAccounting: {
      mission_realms: reads.filter((read) => read.documentPath.startsWith('mission_realms/')).length,
      recruitments: reads.filter((read) => read.documentPath.startsWith('recruitments/')).length,
      student_mission_catalog: reads.filter((read) => read.documentPath.startsWith('student_mission_catalog/')).length,
      totalProductionReads: reads.length,
      totalProductionWrites: 0,
      readPolicy: 'DIRECT_DOCUMENT_GETS_ONLY',
      collectionScans: 0,
      queries: 0,
    },
    rawReadProof: reads,
    inventoryVerification: {
      exactRecordCount: missingMissionRealms.length > 0 ? missions.length - missingMissionRealms.length : missions.length,
      founderExpectedTotal: 3,
      competitiveCount,
      founderExpectedCompetitive: 2,
      qualifyingCount,
      founderExpectedQualifying: 1,
      missingMissionRealms: missingMissionRealms.map((mission) => mission.realmId),
    },
    sourceContractVerdict,
    criticalVisibilityQuestion: {
      missionProjectionVisibilityDivergence: surfaceVisibilityDivergence || catalogHiddenWithRecruitmentPublished,
      surfaceVisibilityDivergence,
      catalogHiddenWithRecruitmentPublished,
      founderCreatedMissionsRemainHidden: missions
        .filter((mission) => mission.eligibility === 'STUDENT_HIDDEN_PROVEN')
        .map((mission) => mission.realmId),
      visibilityFlagsPromoted: missions
        .filter((mission) => mission.eligibility === 'STUDENT_ELIGIBLE_PROVEN')
        .map((mission) => mission.realmId),
    },
    missions,
    safetyProof: {
      NO_WRITE: true,
      NO_SET: true,
      NO_UPDATE: true,
      NO_MERGE: true,
      NO_CREATE: true,
      NO_DELETE: true,
      NO_TRANSACTION: true,
      NO_BATCH: true,
      NO_BACKFILL: true,
      NO_RULES_CHANGE: true,
      NO_IAM_CHANGE: true,
      NO_DEPLOY: true,
      NO_STUDENT_PUBLISH: true,
      NO_MISSION_ACTIVATION: true,
      NO_VISIBILITY_CHANGE: true,
      NO_STATUS_CHANGE: true,
      NO_PROJECTION_REBUILD: true,
      NO_REPAIR_DURING_EXPORT: true,
      NO_DASHBOARD_CHANGE: true,
      NO_MISSION_REALM_CHANGE: true,
      NO_FALLBACK_REMOVAL: true,
      NO_MOJIBAKE_PATCH: true,
      NO_GRADLE_TOUCH: true,
    },
  };

  const inventory = {
    source: 'one_time_read_only_production_export',
    projectId: PROJECT_ID,
    recordCount: result.inventoryVerification.exactRecordCount,
    missions: missions.map(missionSummary),
  };

  const jsonPath = path.join(outDir, `RANKCRACKERS_ONE_TIME_READ_ONLY_PRODUCTION_MISSION_EXPORT_${stamp}.json`);
  const mdPath = path.join(outDir, `RANKCRACKERS_ONE_TIME_READ_ONLY_PRODUCTION_MISSION_EXPORT_${stamp}.md`);
  const inventoryPath = path.join(outDir, `FOUNDER_MISSION_EXACT_PRODUCTION_INVENTORY_${stamp}.json`);

  const md = `# RANKCRACKERS ONE TIME READ ONLY PRODUCTION MISSION EXPORT

Verdict:

\`${verdict}\`

## Authorization

- Authorization: \`EXPLICIT_ONE_TIME_PRODUCTION_READ_EXCEPTION_GRANTED\`
- Project: \`${PROJECT_ID}\`
- Mode: \`PRODUCTION READ-ONLY / EVIDENCE EXPORT ONLY\`
- This gate does not authorize general production read access.

## Read Accounting

- mission_realms reads: ${result.readAccounting.mission_realms}
- recruitments reads: ${result.readAccounting.recruitments}
- student_mission_catalog reads: ${result.readAccounting.student_mission_catalog}
- total production reads: ${result.readAccounting.totalProductionReads}
- total production writes: ${result.readAccounting.totalProductionWrites}
- collection scans: 0
- queries: 0

## Inventory Verification

- exact record count: ${result.inventoryVerification.exactRecordCount}
- Founder expected total: 3
- competitive count: ${competitiveCount}
- Founder expected competitive: 2
- qualifying count: ${qualifyingCount}
- Founder expected qualifying: 1
- missing mission_realms: ${missingMissionRealms.length ? missingMissionRealms.map((mission) => `\`${mission.realmId}\``).join(', ') : 'none'}

## Source Contract Verdict

\`${sourceContractVerdict}\`

## Mission Summary

${missions.map((mission) => {
  const summary = missionSummary(mission);
  return `### ${mission.realmId}

- displayName: ${summary.displayName === null ? 'not present in selected fields' : `\`${summary.displayName}\``}
- category: ${summary.category === null ? 'not present in selected fields' : `\`${summary.category}\``}
- status: ${summary.status === null ? 'not present in selected fields' : `\`${summary.status}\``}
- eligibility: \`${mission.eligibility}\`
- mission_realms exists: ${mission.missionRealms.exists}
- recruitments exists: ${mission.recruitments.exists}
- student_mission_catalog exists: ${mission.studentMissionCatalog.exists}
`;
}).join('\n')}

## Visibility

- MISSION_PROJECTION_VISIBILITY_DIVERGENCE: ${surfaceVisibilityDivergence || catalogHiddenWithRecruitmentPublished}
- surface visibility divergence: ${surfaceVisibilityDivergence}
- catalog hidden while recruitments published: ${catalogHiddenWithRecruitmentPublished}
- hidden missions: ${result.criticalVisibilityQuestion.founderCreatedMissionsRemainHidden.length ? result.criticalVisibilityQuestion.founderCreatedMissionsRemainHidden.map((id) => `\`${id}\``).join(', ') : 'none'}
- visible/promoted missions: ${result.criticalVisibilityQuestion.visibilityFlagsPromoted.length ? result.criticalVisibilityQuestion.visibilityFlagsPromoted.map((id) => `\`${id}\``).join(', ') : 'none'}

## Safety Proof

- NO_WRITE
- NO_SET
- NO_UPDATE
- NO_MERGE
- NO_CREATE
- NO_DELETE
- NO_TRANSACTION
- NO_BATCH
- NO_BACKFILL
- NO_RULES_CHANGE
- NO_IAM_CHANGE
- NO_DEPLOY
- NO_STUDENT_PUBLISH
- NO_MISSION_ACTIVATION
- NO_VISIBILITY_CHANGE
- NO_STATUS_CHANGE
- NO_PROJECTION_REBUILD
- NO_REPAIR_DURING_EXPORT
- NO_DASHBOARD_CHANGE
- NO_MISSION_REALM_CHANGE
- NO_FALLBACK_REMOVAL
- NO_MOJIBAKE_PATCH
- NO_GRADLE_TOUCH

## Full JSON Evidence

See:

- \`${path.basename(jsonPath)}\`
- \`${path.basename(inventoryPath)}\`
`;

  fs.writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
  fs.writeFileSync(mdPath, md);

  console.log(JSON.stringify({
    verdict,
    projectId: PROJECT_ID,
    readAccounting: result.readAccounting,
    inventoryVerification: result.inventoryVerification,
    sourceContractVerdict,
    files: { mdPath, jsonPath, inventoryPath },
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    verdict: 'ONE_TIME_PRODUCTION_EXPORT_BLOCKED_BY_READ_ONLY_ACCESS_BOUNDARY',
    error: error && error.message ? error.message : String(error),
    productionWriteCount: 0,
  }, null, 2));
  process.exit(1);
});
