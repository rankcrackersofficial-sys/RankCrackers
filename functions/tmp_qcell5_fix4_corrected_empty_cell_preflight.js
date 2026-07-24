const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const MISSION_ID = "jee_main_2026";

function hasValue(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function norm(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
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

function strictKey(atom = {}) {
  return [
    norm(atom.subject),
    norm(atom.unit),
    norm(atom.chapter),
    norm(atom.topic),
    norm(atom.subtopic)
  ].join("::");
}

function looseKey(atom = {}) {
  return [
    norm(atom.subject),
    norm(atom.topic),
    norm(atom.subtopic)
  ].join("::");
}

function pick(atom = {}) {
  return {
    subject: atom.subject || "",
    topic: atom.topic || "",
    subtopic: atom.subtopic || "",
    unit: atom.unit || "",
    chapter: atom.chapter || "",
    atom_id: atom.atom_id || "",
    atom_title: atom.atom_title || atom.atomTitle || "",
    status: atom.status || "",
    verification_status: atom.verification_status || atom.verificationStatus || "",
    founder_approved: atom.founder_approved,
    founderApproved: atom.founderApproved,
    canonicalKey: atom.canonicalKey || ""
  };
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
      atom,
      hasCanonicalKey: hasValue(atom.canonicalKey),
      rejected: isRejected(atom),
      strictKey: strictKey(atom),
      looseKey: looseKey(atom),
      fields: pick(atom)
    });
  });

  const canonicalAtoms = atoms.filter((x) => x.hasCanonicalKey);
  const missingCanonical = atoms.filter((x) => !x.hasCanonicalKey);
  const rejectedExcluded = missingCanonical.filter((x) => x.rejected);
  const nonRejectedMissing = missingCanonical.filter((x) => !x.rejected);

  const legacyDuplicateExcluded = [];
  const unresolvedMissing = [];

  for (const item of nonRejectedMissing) {
    const strictMatches = atoms.filter((x) => x.atomId !== item.atomId && x.strictKey === item.strictKey);
    const looseMatches = atoms.filter((x) => x.atomId !== item.atomId && x.looseKey === item.looseKey);

    if (strictMatches.length > 0 || looseMatches.length > 0) {
      legacyDuplicateExcluded.push({
        atomId: item.atomId,
        reason: "LEGACY_DUPLICATE_EXCLUDED_BY_FOUNDER_DECISION",
        fields: item.fields,
        strictMatchIds: strictMatches.map((x) => x.atomId),
        looseMatchIds: looseMatches.map((x) => x.atomId)
      });
    } else {
      unresolvedMissing.push({
        atomId: item.atomId,
        reason: "UNRESOLVED_MISSING_CANONICAL_KEY",
        fields: item.fields
      });
    }
  }

  const proposedEmptyCellManifest = canonicalAtoms.map((x) => ({
    atomId: x.atomId,
    canonicalKey: x.atom.canonicalKey,
    targetPath: `mission_realms/${MISSION_ID}/atomic_question_cells/${x.atomId}`,
    action: "PROPOSE_EMPTY_CELL_ONLY",
    questionCount: 0,
    locked: true
  }));

  const summary = {
    phase: "FUP_2C_QCELL5_FIX4",
    mode: "READ_ONLY_CORRECTED_EMPTY_CELL_PREFLIGHT",
    founderApprovalPhrase: "APPROVE_EXCLUDE_8_LEGACY_DUPLICATE_PAIRS_FROM_QCELL6",

    firestoreWrite: false,
    qcell6: false,
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

    proposedEmptyCellManifestCount: proposedEmptyCellManifest.length,
    excludedLegacyDuplicates: legacyDuplicateExcluded.length,
    excludedRejected: rejectedExcluded.length,
    unresolvedMissingCanonicalKey: unresolvedMissing.length,

    expectedTotalAtoms: 430,
    expectedCanonicalKeyPresent: 417,
    expectedCanonicalKeyMissing: 13,
    expectedExistingAtomicQuestionCells: 0,
    expectedProposedEmptyCells: 417,
    expectedExcludedLegacyDuplicates: 12,
    expectedExcludedRejected: 1,
    expectedUnresolvedMissing: 0
  };

  summary.pass =
    summary.totalAtoms === summary.expectedTotalAtoms &&
    summary.canonicalKeyPresent === summary.expectedCanonicalKeyPresent &&
    summary.canonicalKeyMissing === summary.expectedCanonicalKeyMissing &&
    summary.existingAtomicQuestionCells === summary.expectedExistingAtomicQuestionCells &&
    summary.proposedEmptyCellManifestCount === summary.expectedProposedEmptyCells &&
    summary.excludedLegacyDuplicates === summary.expectedExcludedLegacyDuplicates &&
    summary.excludedRejected === summary.expectedExcludedRejected &&
    summary.unresolvedMissingCanonicalKey === summary.expectedUnresolvedMissing;

  const result = {
    summary,
    samples: {
      proposedEmptyCellManifestSample: proposedEmptyCellManifest.slice(0, 10),
      legacyDuplicateExcludedSample: legacyDuplicateExcluded.slice(0, 20),
      rejectedExcluded: rejectedExcluded.map((x) => ({
        atomId: x.atomId,
        reason: "REJECTED_EXCLUDED_FROM_QCELL6",
        fields: x.fields
      })),
      unresolvedMissing
    }
  };

  console.log(JSON.stringify(result, null, 2));

  if (!summary.pass) process.exit(2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
