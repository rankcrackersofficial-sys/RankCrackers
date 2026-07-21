const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const MISSION_ID = "jee_main_2026";

function hasValue(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function pickKnownFields(atom = {}) {
  const keys = [
    "subject",
    "subjectName",
    "title",
    "name",
    "topic",
    "canonicalKey",
    "reviewStatus",
    "verification_status",
    "founderApproved",
    "rejected",
    "excludeFromQuestionCells",
    "holdReason",
    "canonicalKeyHoldReason",
    "qcellHoldReason",
    "holdType",
    "status",
    "legacy",
    "is_legacy",
    "source",
    "createdByPhase",
    "phase",
    "runId",
    "parentAtomId",
    "duplicateOf",
    "duplicateCanonicalKey",
    "needsFounderDecision",
    "qcellDecision",
    "canonicalDecision",
    "risk",
    "riskReason"
  ];

  const out = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(atom, key)) {
      out[key] = atom[key];
    }
  }
  return out;
}

function inferReason(atom = {}) {
  const text = JSON.stringify(atom).toLowerCase();

  if (
    atom.reviewStatus === "REJECTED" ||
    atom.verification_status === "REJECTED" ||
    atom.rejected === true ||
    atom.excludeFromQuestionCells === true ||
    text.includes("rejected")
  ) {
    return "LIKELY_REJECTED_EXCLUDED";
  }

  if (
    atom.holdReason === "DUPLICATE_CANONICAL_KEY" ||
    atom.canonicalKeyHoldReason === "DUPLICATE_CANONICAL_KEY" ||
    atom.qcellHoldReason === "DUPLICATE_CANONICAL_KEY" ||
    atom.holdType === "DUPLICATE_DISAMBIGUATION" ||
    text.includes("duplicate") ||
    text.includes("disambiguation")
  ) {
    return "LIKELY_HELD_DUPLICATE";
  }

  return "UNCLASSIFIED_MISSING_CANONICAL_KEY";
}

async function main() {
  const snap = await db
    .collection("mission_realms")
    .doc(MISSION_ID)
    .collection("syllabus_atoms")
    .get();

  const missing = [];
  const byReason = {};

  snap.forEach((doc) => {
    const atom = doc.data() || {};
    if (hasValue(atom.canonicalKey)) return;

    const inferredReason = inferReason(atom);
    byReason[inferredReason] = (byReason[inferredReason] || 0) + 1;

    missing.push({
      atomId: doc.id,
      inferredReason,
      knownFields: pickKnownFields(atom),
      allFieldNames: Object.keys(atom).sort()
    });
  });

  const summary = {
    phase: "FUP_2C_QCELL5_FIX2",
    mode: "READ_ONLY_CLASSIFICATION_AUDIT",
    firestoreWrite: false,
    qcell6: false,
    missionId: MISSION_ID,
    missingCanonicalKeyCount: missing.length,
    byReason,
    expectedMissing: 13,
    expectedHeldDuplicates: 12,
    expectedRejectedExcluded: 1,
    pass: missing.length === 13
  };

  console.log(JSON.stringify({ summary, missing }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
