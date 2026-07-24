const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const MISSION_ID = "jee_main_2026";
const PHASE = "FUP_2C_QCELL6";

function hasValue(v) {
  return typeof v === "string" && v.trim().length > 0;
}

async function main() {
  const missionRef = db.collection("mission_realms").doc(MISSION_ID);
  const atomsRef = missionRef.collection("syllabus_atoms");
  const cellsRef = missionRef.collection("atomic_question_cells");

  const atomSnap = await atomsRef.get();
  const cellSnap = await cellsRef.get();

  let totalAtoms = 0;
  let canonicalKeyPresent = 0;
  let canonicalKeyMissing = 0;

  atomSnap.forEach((doc) => {
    totalAtoms++;
    const atom = doc.data() || {};
    if (hasValue(atom.canonicalKey)) canonicalKeyPresent++;
    else canonicalKeyMissing++;
  });

  let totalCells = 0;
  let createdByQcell6 = 0;
  let emptyLockedCount = 0;
  let nonZeroQuestionCount = 0;
  let malformedCells = 0;
  const sampleCells = [];

  cellSnap.forEach((doc) => {
    totalCells++;
    const cell = doc.data() || {};

    if (cell.createdByPhase === PHASE) createdByQcell6++;
    if (cell.cellStatus === "EMPTY_LOCKED" && cell.locked === true) emptyLockedCount++;
    if ((cell.questionCount || 0) !== 0) nonZeroQuestionCount++;
    if (!hasValue(cell.atomId) || !hasValue(cell.canonicalKey)) malformedCells++;

    if (sampleCells.length < 20) {
      sampleCells.push({
        cellId: doc.id,
        atomId: cell.atomId || "",
        canonicalKeyPresent: hasValue(cell.canonicalKey),
        questionCount: cell.questionCount || 0,
        cellStatus: cell.cellStatus || "",
        locked: cell.locked === true,
        createdByPhase: cell.createdByPhase || ""
      });
    }
  });

  const interpretation =
    totalCells === 417 &&
    createdByQcell6 === 417 &&
    emptyLockedCount === 417 &&
    nonZeroQuestionCount === 0 &&
    malformedCells === 0
      ? "QCELL6_LIVE_WRITE_CONFIRMED_SUCCESS_NO_RETRY_REQUIRED"
      : totalCells === 0
        ? "NO_CELLS_CREATED_UNEXPECTED_AFTER_LIVE_ATTEMPT"
        : "PARTIAL_OR_UNEXPECTED_CELL_STATE_DO_NOT_RETRY";

  const result = {
    phase: "FUP_2C_QCELL6_LIVE_FAILURE_DIAG1",
    mode: "READ_ONLY_POST_FAILURE_STATE_AUDIT_CONFIRMED",
    firestoreWrite: false,
    qcell6Retry: false,
    atomicQuestionCellsWrite: false,
    syllabusAtomsMutation: false,
    canonicalKeyWrite: false,
    topicNodesTouched: false,
    studentDeliveryTouched: false,
    deploy: false,

    missionId: MISSION_ID,

    atoms: {
      totalAtoms,
      canonicalKeyPresent,
      canonicalKeyMissing
    },

    atomicQuestionCells: {
      totalCells,
      createdByQcell6,
      emptyLockedCount,
      nonZeroQuestionCount,
      malformedCells
    },

    interpretation,
    pass:
      totalAtoms === 430 &&
      canonicalKeyPresent === 417 &&
      canonicalKeyMissing === 13 &&
      totalCells === 417 &&
      createdByQcell6 === 417 &&
      emptyLockedCount === 417 &&
      nonZeroQuestionCount === 0 &&
      malformedCells === 0,

    sampleCells
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.pass) process.exit(2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
