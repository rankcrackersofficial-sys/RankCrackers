const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const MISSION_ID = "jee_main_2026";

function hasValue(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isRejected(atom = {}) {
  const status = String(atom.status || "").toUpperCase();
  const reviewStatus = String(atom.reviewStatus || "").toUpperCase();
  const verificationStatus = String(atom.verification_status || atom.verificationStatus || "").toUpperCase();

  return (
    status === "REJECTED" ||
    reviewStatus === "REJECTED" ||
    verificationStatus === "REJECTED" ||
    atom.rejected === true ||
    atom.excludeFromQuestionCells === true
  );
}

async function main() {
  const atomSnap = await db
    .collection("mission_realms")
    .doc(MISSION_ID)
    .collection("syllabus_atoms")
    .get();

  const cellSnap = await db
    .collection("mission_realms")
    .doc(MISSION_ID)
    .collection("atomic_question_cells")
    .get();

  const atoms = [];

  atomSnap.forEach((doc) => {
    const atom = doc.data() || {};
    atoms.push({
      atomId: doc.id,
      canonicalKey: atom.canonicalKey || "",
      hasCanonicalKey: hasValue(atom.canonicalKey),
      rejected: isRejected(atom)
    });
  });

  const canonicalAtoms = atoms.filter((x) => x.hasCanonicalKey);
  const missingCanonical = atoms.filter((x) => !x.hasCanonicalKey);
  const rejectedMissing = missingCanonical.filter((x) => x.rejected);
  const nonRejectedMissing = missingCanonical.filter((x) => !x.rejected);

  const existingCellIds = new Set();
  cellSnap.forEach((doc) => existingCellIds.add(doc.id));

  const proposedWrites = canonicalAtoms.map((x) => ({
    cellId: x.atomId,
    atomId: x.atomId,
    canonicalKey: x.canonicalKey,
    targetPath: `mission_realms/${MISSION_ID}/atomic_question_cells/${x.atomId}`,
    operation: "CREATE_EMPTY_CELL_IF_ABSENT",
    initialQuestionCount: 0,
    locked: true,
    createdByPhase: "FUP_2C_QCELL6"
  }));

  const collisions = proposedWrites.filter((x) => existingCellIds.has(x.cellId));

  const summary = {
    phase: "FUP_2C_QCELL6_GATE1",
    mode: "READ_ONLY_FINAL_LIVE_WRITE_READINESS",

    firestoreWrite: false,
    qcell6LiveWrite: false,
    atomicQuestionCellsWrite: false,
    syllabusAtomsMutation: false,
    canonicalKeyWrite: false,
    topicNodesTouched: false,
    studentDeliveryTouched: false,
    deploy: false,

    missionId: MISSION_ID,
    totalAtoms: atoms.length,
    canonicalKeyPresent: canonicalAtoms.length,
    canonicalKeyMissing: missingCanonical.length,
    existingAtomicQuestionCells: cellSnap.size,
    proposedEmptyCellWrites: proposedWrites.length,
    writeCollisionCount: collisions.length,

    founderDecisionExcludedLegacyDuplicates: 12,
    rejectedExcluded: rejectedMissing.length,
    remainingNonRejectedMissingCanonicalKey: nonRejectedMissing.length,

    expectedTotalAtoms: 430,
    expectedCanonicalKeyPresent: 417,
    expectedCanonicalKeyMissing: 13,
    expectedExistingAtomicQuestionCells: 0,
    expectedProposedEmptyCellWrites: 417,
    expectedWriteCollisionCount: 0,
    expectedRejectedExcluded: 1,
    expectedRemainingNonRejectedMissingCanonicalKey: 12
  };

  summary.pass =
    summary.totalAtoms === summary.expectedTotalAtoms &&
    summary.canonicalKeyPresent === summary.expectedCanonicalKeyPresent &&
    summary.canonicalKeyMissing === summary.expectedCanonicalKeyMissing &&
    summary.existingAtomicQuestionCells === summary.expectedExistingAtomicQuestionCells &&
    summary.proposedEmptyCellWrites === summary.expectedProposedEmptyCellWrites &&
    summary.writeCollisionCount === summary.expectedWriteCollisionCount &&
    summary.rejectedExcluded === summary.expectedRejectedExcluded &&
    summary.remainingNonRejectedMissingCanonicalKey === summary.expectedRemainingNonRejectedMissingCanonicalKey;

  const result = {
    summary,
    samples: {
      proposedWritesSample: proposedWrites.slice(0, 20),
      collisions,
      rejectedMissing,
      nonRejectedMissingSample: nonRejectedMissing.slice(0, 20)
    }
  };

  console.log(JSON.stringify(result, null, 2));

  if (!summary.pass) process.exit(2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
