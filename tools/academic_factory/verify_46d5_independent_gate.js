/**
 * ===============================================================================
 * RC_CANONICAL_MISSION_AUTHORITY_INDEPENDENT_BASELINE_AND_REPAIR_GATE_46D5
 * AGENT-3 — INDEPENDENT RUNTIME / DATA BREAKER
 * READ-ONLY VERIFICATION HARNESS & CERTIFICATION GATE
 * ===============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TARGET_MISSION_IDS = [
  'jee_main_2026',
  'neet_(ug)-2027',
  'RPSC_FIRST_GRADE2026_2026_1782713222215'
];

function sha256(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

function loadBaseline() {
  const baselinePath = path.resolve(__dirname, '../../docs/academic_review/46d5_independent_before_baseline.json');
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`BASELINE_FILE_NOT_FOUND: ${baselinePath}`);
  }
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

/**
 * Pure, read-only comparator: BEFORE vs AFTER
 */
function verifyRepairContract(beforeBaseline, afterSnapshot) {
  const errors = [];
  const unauthorizedMutations = [];
  const authorizedDiffs = [];
  let neetPointerCorrected = false;

  // 1. Mission ID Set Parity
  const beforeIds = Object.keys(beforeBaseline.missions || {}).sort();
  const afterIds = Object.keys(afterSnapshot.missions || {}).sort();

  const canonicalToRepairSetEqual = JSON.stringify(beforeIds) === JSON.stringify(afterIds) &&
    JSON.stringify(beforeIds) === JSON.stringify(TARGET_MISSION_IDS.slice().sort());

  if (!canonicalToRepairSetEqual) {
    errors.push(`CANONICAL_SET_MISMATCH: Expected [${TARGET_MISSION_IDS.join(', ')}], Got [${afterIds.join(', ')}]`);
  }

  let missingRealmParentCountAfter = 0;

  // 2. Per-Mission Assertions
  for (const missionId of TARGET_MISSION_IDS) {
    const bMission = beforeBaseline.missions[missionId];
    const aMission = (afterSnapshot.missions && afterSnapshot.missions[missionId]) || null;

    if (!aMission) {
      errors.push(`MISSION_MISSING_AFTER: ${missionId}`);
      continue;
    }

    // A. Check Realm Parent Creation
    const realmParentExists = aMission.missionRealmsParent && aMission.missionRealmsParent.exists === true;
    if (!realmParentExists) {
      missingRealmParentCountAfter++;
      errors.push(`REALM_PARENT_NOT_REPAIRED: mission_realms/${missionId} parent document missing.`);
    }

    // B. Check Recruitment Immutability (FORBID_RECRUITMENT_MUTATION)
    const bRec = bMission.recruitmentRecord ? bMission.recruitmentRecord.fields : null;
    const aRec = aMission.recruitmentRecord ? aMission.recruitmentRecord.fields : null;
    if (JSON.stringify(bRec) !== JSON.stringify(aRec)) {
      unauthorizedMutations.push({
        missionId,
        component: 'recruitments',
        before: bRec,
        after: aRec,
        reason: 'Recruitment record was mutated during repair.'
      });
    }

    // C. Check Student Mission Catalog (FORBID_CATALOG_UNAUTHORIZED_MUTATION)
    const bCat = bMission.studentMissionCatalogRecord ? { ...bMission.studentMissionCatalogRecord.fields } : null;
    const aCat = aMission.studentMissionCatalogRecord ? { ...aMission.studentMissionCatalogRecord.fields } : null;

    if (bCat && aCat) {
      if (missionId === 'neet_(ug)-2027') {
        // Specifically allowed exception: NEET recruitmentGroupId pointer fix
        const bNeetPtr = bCat.recruitmentGroupId;
        const aNeetPtr = aCat.recruitmentGroupId;

        if (bNeetPtr === 'student_mission_catalog' && (aNeetPtr === 'neet_(ug)-2027' || aNeetPtr === undefined)) {
          neetPointerCorrected = true;
          authorizedDiffs.push({
            missionId,
            field: 'recruitmentGroupId',
            before: bNeetPtr,
            after: aNeetPtr,
            note: 'PROVEN_NEET_IDENTITY_POINTER_CORRECTION'
          });
          // For remaining catalog fields, compare without recruitmentGroupId
          delete bCat.recruitmentGroupId;
          delete aCat.recruitmentGroupId;
        }
      }

      // Check remaining catalog fields for unauthorized mutation
      for (const [key, val] of Object.entries(bCat)) {
        if (JSON.stringify(aCat[key]) !== JSON.stringify(val)) {
          unauthorizedMutations.push({
            missionId,
            component: 'student_mission_catalog',
            field: key,
            before: val,
            after: aCat[key],
            reason: `Unauthorized mutation of catalog field '${key}'`
          });
        }
      }
    }

    // D. Check Lifecycle State Immutability
    const bLife = bMission.lifecycleState;
    const aLife = aMission.lifecycleState;
    if (bLife && aLife) {
      if (bLife.catalogStatus !== aLife.catalogStatus || bLife.recruitmentStatus !== aLife.recruitmentStatus) {
        unauthorizedMutations.push({
          missionId,
          component: 'lifecycleState',
          before: bLife,
          after: aLife,
          reason: 'Mission lifecycle state mutated.'
        });
      }
    }

    // E. Check Visibility Flags Immutability
    const bVis = bMission.visibility;
    const aVis = aMission.visibility;
    if (bVis && aVis) {
      if (bVis.cardVisible !== aVis.cardVisible || bVis.userPanelVisible !== aVis.userPanelVisible) {
        unauthorizedMutations.push({
          missionId,
          component: 'visibility',
          before: bVis,
          after: aVis,
          reason: 'Visibility flags mutated.'
        });
      }
    }

    // F. Check Publication State Immutability
    const bPub = bMission.publicationState;
    const aPub = aMission.publicationState;
    if (bPub && aPub) {
      if (bPub.isPublished !== aPub.isPublished || bPub.studentPublicationState !== aPub.studentPublicationState) {
        unauthorizedMutations.push({
          missionId,
          component: 'publicationState',
          before: bPub,
          after: aPub,
          reason: 'Publication state mutated.'
        });
      }
    }

    // G. Check Content Locks Immutability
    const bLocks = bMission.contentLocks;
    const aLocks = aMission.contentLocks;
    if (bLocks && aLocks) {
      if (JSON.stringify(bLocks) !== JSON.stringify(aLocks)) {
        unauthorizedMutations.push({
          missionId,
          component: 'contentLocks',
          before: bLocks,
          after: aLocks,
          reason: 'Content locks mutated.'
        });
      }
    }

    // H. Check Subcollections and Academic Data Preservation
    const bSubs = bMission.subcollectionInventory;
    const aSubs = aMission.subcollectionInventory;
    if (bSubs && aSubs) {
      for (const [subName, subInfo] of Object.entries(bSubs)) {
        const afterSubInfo = aSubs[subName];
        if (!afterSubInfo) {
          unauthorizedMutations.push({
            missionId,
            component: `subcollection/${subName}`,
            reason: `Subcollection '${subName}' missing in post-repair state.`
          });
        } else if (subInfo.count !== undefined && afterSubInfo.count < subInfo.count) {
          unauthorizedMutations.push({
            missionId,
            component: `subcollection/${subName}`,
            beforeCount: subInfo.count,
            afterCount: afterSubInfo.count,
            reason: `Document count reduced in subcollection '${subName}'.`
          });
        }
      }
    }
  }

  const isCertified = canonicalToRepairSetEqual &&
    missingRealmParentCountAfter === 0 &&
    unauthorizedMutations.length === 0 &&
    errors.length === 0;

  return {
    gateVerdict: isCertified ? '46D5_CANONICAL_REALM_REPAIR_CERTIFIED' : '46D5_CANONICAL_REALM_REPAIR_REJECTED',
    canonicalToRepairSetEqual,
    unauthorizedMutationCount: unauthorizedMutations.length,
    missingRealmParentCountAfter,
    neetPointerOnlyAllowedDiff: authorizedDiffs.length > 0 && unauthorizedMutations.length === 0,
    secondRunIdempotency: afterSnapshot.idempotentRunVerified === true,
    unauthorizedMutations,
    authorizedDiffs,
    errors
  };
}

function runBaselineValidation() {
  console.log("===============================================================================");
  console.log("RC_CANONICAL_MISSION_AUTHORITY_INDEPENDENT_BASELINE_AND_REPAIR_GATE_46D5");
  console.log("AGENT-3 — INDEPENDENT RUNTIME / DATA BREAKER");
  console.log("===============================================================================");
  
  const baseline = loadBaseline();
  console.log(`\n[BASELINE CAPTURE CHECK]: baselineCaptured = ${baseline.baselineCaptured}`);
  console.log(`[TARGET MISSIONS]: ${baseline.targetMissionIds.join(', ')}`);
  
  console.log("\n[BLOCKER REPRODUCTION SUMMARY]:");
  console.log(`- MISSING_REALM_PARENT_COUNT: ${baseline.blockerReproduction.missingRealmParentCount.count} (${baseline.blockerReproduction.missingRealmParentCount.status})`);
  console.log(`- NEET_RECRUITMENT_GROUP_ID_DEFECT: ${baseline.blockerReproduction.neetRecruitmentGroupIdDefect.status}`);
  console.log(`- MANIFEST_REALM_MUTATES_NON_REPAIR_FIELDS: ${baseline.blockerReproduction.manifestRealmMutesNonRepairFields.status}`);

  console.log("\n[VERIFIER STATUS]: Read-only verification engine compiled and initialized.");
  console.log("\nFINAL PRE-REPAIR VERDICT: 46D5_REPAIR_VERIFIER_READY_WAITING_FOR_46A5");
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--verify-after') && args[1]) {
    const afterSnapshot = JSON.parse(fs.readFileSync(path.resolve(args[1]), 'utf8'));
    const beforeBaseline = loadBaseline();
    const results = verifyRepairContract(beforeBaseline, afterSnapshot);
    console.log(JSON.stringify(results, null, 2));
    if (results.gateVerdict !== '46D5_CANONICAL_REALM_REPAIR_CERTIFIED') {
      process.exit(1);
    }
  } else {
    runBaselineValidation();
  }
}

module.exports = {
  loadBaseline,
  verifyRepairContract
};
