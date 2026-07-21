const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const MISSION_ID = "jee_main_2026";

function norm(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function hasCanonical(atom) {
  return typeof atom.canonicalKey === "string" && atom.canonicalKey.trim().length > 0;
}

function pick(atom = {}) {
  return {
    subject: atom.subject || "",
    topic: atom.topic || "",
    subtopic: atom.subtopic || "",
    unit: atom.unit || "",
    chapter: atom.chapter || "",
    verification_status: atom.verification_status || atom.verificationStatus || "",
    founder_approved: atom.founder_approved,
    founderApproved: atom.founderApproved,
    status: atom.status || "",
    atom_id: atom.atom_id || "",
    atom_title: atom.atom_title || atom.atomTitle || "",
    createdByPhase: atom.createdByPhase || "",
    runId: atom.runId || atom.extractionRunId || "",
    sourceDocumentId: atom.sourceDocumentId || atom.source_document_id || "",
    sourcePage: atom.sourcePage || atom.source_page || atom.sourcePageNumber || "",
    sourceTextExcerpt: atom.sourceTextExcerpt || atom.source_text_excerpt || ""
  };
}

async function main() {
  const snap = await db.collection("mission_realms").doc(MISSION_ID).collection("syllabus_atoms").get();

  const all = [];
  const missing = [];

  snap.forEach(doc => {
    const atom = doc.data() || {};
    const item = {
      atomId: doc.id,
      key: [
        norm(atom.subject),
        norm(atom.unit),
        norm(atom.chapter),
        norm(atom.topic),
        norm(atom.subtopic)
      ].join("::"),
      looseKey: [
        norm(atom.subject),
        norm(atom.topic),
        norm(atom.subtopic)
      ].join("::"),
      hasCanonical: hasCanonical(atom),
      fields: pick(atom)
    };

    all.push(item);
    if (!item.hasCanonical) missing.push(item);
  });

  const missingUnclassified = missing.filter(x =>
    x.fields.status !== "REJECTED" &&
    x.fields.verification_status !== "rejected" &&
    x.fields.verification_status !== "REJECTED"
  );

  const evidence = missingUnclassified.map(m => {
    const strictMatches = all.filter(x => x.atomId !== m.atomId && x.key === m.key);
    const looseMatches = all.filter(x => x.atomId !== m.atomId && x.looseKey === m.looseKey);
    const sameTitleMatches = all.filter(x =>
      x.atomId !== m.atomId &&
      norm(x.fields.subject) === norm(m.fields.subject) &&
      norm(x.fields.topic) === norm(m.fields.topic)
    );

    return {
      missingAtomId: m.atomId,
      missingFields: m.fields,
      strictMatchCount: strictMatches.length,
      looseMatchCount: looseMatches.length,
      sameTitleMatchCount: sameTitleMatches.length,
      strictMatches: strictMatches.slice(0, 10),
      looseMatches: looseMatches.slice(0, 10),
      sameTitleMatches: sameTitleMatches.slice(0, 10),
      inferredDecision:
        sameTitleMatches.some(x => x.hasCanonical)
          ? "LIKELY_LEGACY_DUPLICATE_OF_CANONICAL_ATOM"
          : sameTitleMatches.length > 0
            ? "LIKELY_LEGACY_DUPLICATE_BUT_NO_CANONICAL_PAIR"
            : "NEEDS_CANONICAL_KEY_DECISION"
    };
  });

  const byDecision = {};
  for (const e of evidence) {
    byDecision[e.inferredDecision] = (byDecision[e.inferredDecision] || 0) + 1;
  }

  const summary = {
    phase: "FUP_2C_QCELL5_FIX3",
    mode: "READ_ONLY_DUPLICATE_PAIR_EVIDENCE_AUDIT",
    firestoreWrite: false,
    qcell6: false,
    missionId: MISSION_ID,
    totalAtoms: all.length,
    missingCanonicalKey: missing.length,
    unclassifiedMissingChecked: missingUnclassified.length,
    byDecision
  };

  console.log(JSON.stringify({ summary, evidence }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
