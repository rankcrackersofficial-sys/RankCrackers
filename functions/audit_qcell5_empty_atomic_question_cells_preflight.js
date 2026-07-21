const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const MISSION_ID = "jee_main_2026";
const RUN_ID = `fup2c_qcell5_fix1_empty_cell_preflight_${MISSION_ID}_${Date.now()}`;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isRejected(atom = {}) {
  return atom.reviewStatus === "REJECTED" ||
         atom.verification_status === "REJECTED" ||
         atom.founderApproved === false && atom.rejected === true ||
         atom.excludeFromQuestionCells === true;
}

function isHeldDuplicate(atom = {}) {
  return atom.holdReason === "DUPLICATE_CANONICAL_KEY" ||
         atom.canonicalKeyHoldReason === "DUPLICATE_CANONICAL_KEY" ||
         atom.qcellHoldReason === "DUPLICATE_CANONICAL_KEY" ||
         atom.holdType === "DUPLICATE_DISAMBIGUATION";
}

async function main() {
  const atomsSnap = await db
    .collection("mission_realms")
    .doc(MISSION_ID)
    .collection("syllabus_atoms")
    .get();

  const existingCellsSnap = await db
    .collection("mission_realms")
    .doc(MISSION_ID)
    .collection("atomic_question_cells")
    .get();

  let totalAtoms = 0;
  let canonicalKeyPresent = 0;
  let canonicalKeyMissing = 0;
  let heldDuplicates = 0;
  let rejectedExcluded = 0;

  const manifest = [];
  const blocked = [];

  atomsSnap.forEach((doc) => {
    totalAtoms += 1;
    const atom = doc.data() || {};
    const atomId = doc.id;
    const canonicalKey = atom.canonicalKey;

    if (isNonEmptyString(canonicalKey)) {
      canonicalKeyPresent += 1;
    } else {
      canonicalKeyMissing += 1;
    }

    if (isRejected(atom)) {
      rejectedExcluded += 1;
      blocked.push({
        atomId,
        reason: "REJECTED_EXCLUDED",
        canonicalKey: canonicalKey || null,
        title: atom.title || atom.name || atom.topic || ""
      });
      return;
    }

    if (isHeldDuplicate(atom)) {
      heldDuplicates += 1;
      blocked.push({
        atomId,
        reason: "HELD_DUPLICATE",
        canonicalKey: canonicalKey || null,
        title: atom.title || atom.name || atom.topic || ""
      });
      return;
    }

    if (!isNonEmptyString(canonicalKey)) {
      blocked.push({
        atomId,
        reason: "MISSING_CANONICAL_KEY",
        canonicalKey: null,
        title: atom.title || atom.name || atom.topic || ""
      });
      return;
    }

    manifest.push({
      cellId: atomId,
      atomId,
      canonicalKey,
      missionId: MISSION_ID,
      subject: atom.subject || atom.subjectName || "",
      unitId: atom.unitId || atom.parentUnitId || "",
      title: atom.title || atom.name || atom.topic || "",
      plannedPath: `mission_realms/${MISSION_ID}/atomic_question_cells/${atomId}`,
      initialQuestionCounts: {
        PYQ: 0,
        SAMPLE: 0,
        PRACTICE: 0,
        MODEL: 0,
        TOTAL: 0
      },
      publishLocks: {
        published: false,
        founderApproved: false,
        verified: false
      },
      writeMode: "PREFLIGHT_ONLY_NO_FIRESTORE_WRITE"
    });
  });

  const summary = {
    phase: "FUP_2C_QCELL5_FIX1",
    runId: RUN_ID,
    missionId: MISSION_ID,
    mode: "READ_ONLY_PREFLIGHT",
    firestoreWrite: false,
    qcell6: false,
    topicNodesTouched: false,
    studentDeliveryTouched: false,
    totalAtoms,
    canonicalKeyPresent,
    canonicalKeyMissing,
    heldDuplicates,
    rejectedExcluded,
    existingAtomicQuestionCells: existingCellsSnap.size,
    proposedEmptyCellManifestCount: manifest.length,
    blockedCount: blocked.length,
    expectedBaseline: {
      totalAtoms: 430,
      canonicalKeyPresent: 417,
      canonicalKeyMissing: 13,
      heldDuplicates: 12,
      rejectedExcluded: 1,
      existingAtomicQuestionCells: 0,
      proposedEmptyCellManifestCount: 417
    },
    pass:
      totalAtoms === 430 &&
      canonicalKeyPresent === 417 &&
      canonicalKeyMissing === 13 &&
      heldDuplicates === 12 &&
      rejectedExcluded === 1 &&
      existingCellsSnap.size === 0 &&
      manifest.length === 417
  };

  console.log(JSON.stringify({
    summary,
    sampleManifest: manifest.slice(0, 10),
    blockedSample: blocked.slice(0, 25)
  }, null, 2));

  if (!summary.pass) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
