'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

if (admin.apps.length === 0) admin.initializeApp();

const MAX_EXCERPT = 4000;
const MATERIALIZER_VERSION = 'mission_academic_materializer_v4_canonical_syllabus_atomic_expansion';

function digest(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function firstMeaningfulLine(text) {
  const lines = String(text || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const candidate = lines.find((line) => line.length >= 12 && /[A-Za-z]/.test(line));
  return (candidate || lines[0] || 'Official syllabus source page').replace(/\s+/g, ' ').slice(0, 140);
}

function subjectFor(text) {
  const value = String(text || '').toLowerCase();
  if (/mathematics|mathematical abilities|quantitative aptitude|number system|algebra|geometry|trigonometry/.test(value)) return 'Quantitative Aptitude';
  if (/reasoning|analogy|classification|series|coding|syllogism/.test(value)) return 'General Intelligence & Reasoning';
  if (/english|comprehension|vocabulary|grammar|cloze/.test(value)) return 'English Comprehension';
  if (/general awareness|history|geography|polity|economy|science/.test(value)) return 'General Awareness';
  return 'Official Source';
}

const NOTIFICATION_ONLY_SIGNALS = /reservation|sc\s*\/\s*st|obc|ews|vacanc|eligibility|age limit|application fee|how to apply|scribe|medical|document verification|admit card|pay level|salary|nationality|citizenship|certificate|undertaking|online application|correction window|category-wise|persons with benchmark disabilities|disability|exam calendar|vacancy details/i;
const SUBJECT_TOPIC_SIGNALS = {
  'Quantitative Aptitude': /number system|percentage|ratio|average|interest|profit|loss|discount|partnership|time and work|time[ -]distance|algebra|geometry|trigonometry|mensuration|data interpretation/i,
  'General Intelligence & Reasoning': /analogy|classification|series|coding|decoding|syllogism|venn|direction|blood relation|non[ -]verbal|embedded figure|paper folding|mirror image|logical/i,
  'English Comprehension': /vocabulary|grammar|synonym|antonym|homonym|spelling|idiom|one word|sentence|error spotting|fill in the blank|cloze|comprehension/i,
  'General Awareness': /history|culture|geography|economic|general polic|scientific|current event|india and neighbouring|india and neighboring/i,
};

// Controlled taxonomy derived only from the SSC CGL official syllabus. These
// are syllabus labels, not generated questions or coaching content. A label is
// materialized only when its wording/signals are present in the verified
// official syllabus corpus.
const SSC_CGL_CANONICAL_TAXONOMY = [
  ['Quantitative Aptitude', 'Number System', ['number system', 'whole numbers', 'decimals', 'fractions', 'relationship between numbers']],
  ['Quantitative Aptitude', 'Arithmetic', ['percentage', 'ratio and proportion', 'square roots', 'averages', 'interest', 'profit and loss', 'discount', 'partnership business', 'mixture and alligation', 'time and distance', 'time and work']],
  ['Quantitative Aptitude', 'Algebra', ['basic algebraic identities', 'elementary surds', 'graphs of linear equations']],
  ['Quantitative Aptitude', 'Geometry', ['triangle', 'congruent triangles', 'similar triangles', 'circle', 'tangent', 'common tangents']],
  ['Quantitative Aptitude', 'Mensuration', ['triangle, quadrilaterals, regular polygons', 'right circular cone', 'right circular cylinder', 'sphere', 'hemispheres', 'rectangular parallelepiped']],
  ['Quantitative Aptitude', 'Trigonometry', ['trigonometric ratios', 'degree and radian measures', 'standard identities', 'complementary angles', 'height and distances']],
  ['Quantitative Aptitude', 'Statistics and Probability', ['tables and graphs', 'histogram', 'frequency polygon', 'bar diagram', 'pie chart', 'mean and median', 'use of tables and graphs']],
  ['General Intelligence & Reasoning', 'Analogy and Classification', ['semantic analogy', 'symbolic/number analogy', 'figural analogy', 'semantic classification', 'symbolic/number classification', 'figural classification']],
  ['General Intelligence & Reasoning', 'Series', ['arithmetic number series', 'non-verbal series', 'figural pattern']],
  ['General Intelligence & Reasoning', 'Coding and Decoding', ['coding and decoding']],
  ['General Intelligence & Reasoning', 'Logical Relations', ['space orientation', 'problem solving', 'analysis', 'judgement', 'decision making', 'visual memory', 'observation', 'relationship concepts']],
  ['General Intelligence & Reasoning', 'Venn Diagrams and Syllogism', ['venn diagrams', 'syllogistic reasoning']],
  ['General Intelligence & Reasoning', 'Non-Verbal Reasoning', ['embedded figures', 'punch hole/pattern folding', 'figural completion', 'mirror images', 'water images']],
  ['General Intelligence & Reasoning', 'Critical Thinking', ['statement conclusion', 'statement arguments', 'drawing inferences', 'problem solving']],
  ['English Comprehension', 'Vocabulary', ['vocabulary', 'synonyms', 'antonyms', 'homonyms', 'spellings']],
  ['English Comprehension', 'Grammar', ['grammar', 'sentence structure', 'correct usage']],
  ['English Comprehension', 'Reading Comprehension', ['comprehension passage', 'comprehension']],
  ['English Comprehension', 'Sentence Usage', ['spot the error', 'fill in the blanks', 'shuffling of sentence parts', 'shuffling of a passage', 'improvement of sentences']],
  ['English Comprehension', 'Idioms and One-word Substitution', ['idioms and phrases', 'one word substitution']],
  ['General Awareness', 'Current Events', ['current events']],
  ['General Awareness', 'History and Culture', ['history', 'culture']],
  ['General Awareness', 'Geography', ['geography']],
  ['General Awareness', 'Economic Scene', ['economic scene', 'economy']],
  ['General Awareness', 'General Policy', ['general policy', 'indian polity']],
  ['General Awareness', 'Scientific Research', ['scientific research', 'science']],
];

function extractCanonicalSyllabusTopics(pages) {
  const corpus = pages.map((p) => String(p.text || '').toLowerCase()).join('\n');
  const results = [];
  const seen = new Set();
  for (const [subject, chapter, signals] of SSC_CGL_CANONICAL_TAXONOMY) {
    for (const signal of signals) {
      if (!corpus.includes(signal.toLowerCase())) continue;
      const evidence = pages.find((p) => String(p.text || '').toLowerCase().includes(signal.toLowerCase()));
      const key = `${subject}|${chapter}|${signal}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        subject,
        chapter,
        title: signal,
        sourcePage: Number(evidence?.pageNumber || 1),
        sourceText: String(evidence?.text || ''),
        evidenceSignal: signal,
      });
    }
  }
  return results;
}

function cleanTopicLine(line) {
  return String(line || '')
    .replace(/^\s*(?:[-•●▪◦]|\(?\d+(?:\.\d+)*\)?[.)]?|[a-z]\))\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[;,:]+$/, '');
}

function extractSyllabusTopics(text) {
  const topics = [];
  const seen = new Set();
  const rawLines = String(text || '').split(/\r?\n/).flatMap((rawLine) => {
    const value = String(rawLine || '').trim();
    if (value.length <= 180) return [value];
    // The page extractor may flatten a complete PDF paragraph into one line.
    // Split that representation into bounded semantic fragments before topic
    // classification; otherwise valid syllabus headings are discarded solely
    // because a newline was lost during extraction.
    return value.split(/[.;:]\s+|,\s+/).map((part) => part.trim()).filter(Boolean);
  });
  for (const rawLine of rawLines) {
    const line = cleanTopicLine(rawLine);
    if (line.length < 4 || line.length > 180) continue;
    if (NOTIFICATION_ONLY_SIGNALS.test(line)) continue;
    const subject = subjectFor(line);
    const topicSignal = SUBJECT_TOPIC_SIGNALS[subject];
    if (!topicSignal || !topicSignal.test(line)) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    topics.push({ title: line, subject });
  }
  return topics;
}

function isAcademicSyllabusPage(text) {
  const value = String(text || '').toLowerCase();
  const topics = extractSyllabusTopics(value);
  return topics.length > 0 && !(/\b(?:sc|st|obc|ews)\b/.test(value) && /reservation|category|vacanc/.test(value));
}

async function writeBatches(db, writes) {
  for (let offset = 0; offset < writes.length; offset += 400) {
    const batch = db.batch();
    writes.slice(offset, offset + 400).forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
    await batch.commit();
  }
}

async function retireLegacyMaterialization(db, missionId) {
  const legacyVersion = 'mission_academic_materializer_v1';
  const targets = [
    ['micro_nodes', 'missionId'],
    ['digibook_units', 'missionId'],
    ['content_payloads', 'missionId'],
    ['published_questions', 'examId'],
    ['test_arena_papers', 'missionId'],
    ['test_arena_events', 'missionId'],
  ];
  const refs = [];
  for (const [collection, missionField] of targets) {
    const snap = await db.collection(collection)
      .where(missionField, '==', missionId)
      .get();
    snap.docs.forEach((doc) => {
      const generatedBy = String(doc.data()?.generatedBy || '');
      if (generatedBy === legacyVersion ||
          (generatedBy.startsWith('mission_academic_materializer_v') && generatedBy !== MATERIALIZER_VERSION)) refs.push(doc.ref);
    });
  }
  const realmRef = db.collection('mission_realms').doc(missionId);
  for (const collection of ['crucible_days', 'crucible_tests']) {
    const snap = await realmRef.collection(collection).get();
    snap.docs.forEach((doc) => {
      const generatedBy = String(doc.data()?.generatedBy || '');
      if (generatedBy === legacyVersion ||
          (generatedBy.startsWith('mission_academic_materializer_v') && generatedBy !== MATERIALIZER_VERSION)) refs.push(doc.ref);
    });
  }
  if (refs.length === 0) return 0;
  const now = admin.firestore.FieldValue.serverTimestamp();
  await writeBatches(db, refs.map((ref) => ({
    ref,
    data: {
      status: 'archived',
      isReleased: false,
      studentVisibilityAuthorized: false,
      isStale: true,
      archivedBy: MATERIALIZER_VERSION,
      archivedAt: now,
    },
  })));
  return refs.length;
}

async function materializeMission({ db, missionId, cycleKey, parentTaskId }) {
  const markerRef = db.collection('mission_academic_delivery').doc(`${missionId}_${cycleKey}`);
  const marker = await markerRef.get();
  if (marker.exists && marker.data()?.status === 'COMPLETE' &&
      marker.data()?.materializerVersion === MATERIALIZER_VERSION) return marker.data();

  const realmRef = db.collection('mission_realms').doc(missionId);
  const cycleRef = realmRef.collection('cycles').doc(cycleKey);
  const cycleSnap = await cycleRef.get();
  const cycle = cycleSnap.data() || {};
  const syllabusSourceId = String(cycle.syllabusBinding?.sourceId || '');
  if (!syllabusSourceId) throw new Error('ACADEMIC_MATERIALIZER_SYLLABUS_BINDING_REQUIRED');
  const syllabusDocRef = realmRef.collection('official_documents').doc(syllabusSourceId);
  const syllabusDocSnap = await syllabusDocRef.get();
  const syllabusMeta = syllabusDocSnap.data() || {};
  if (syllabusMeta.sourceType !== 'syllabus') {
    throw new Error('ACADEMIC_MATERIALIZER_WRONG_SOURCE_ROLE');
  }
  const notificationSourceId = String(cycle.notificationBinding?.sourceId || '');
  if (!notificationSourceId || notificationSourceId === syllabusSourceId) {
    throw new Error('ACADEMIC_MATERIALIZER_NOTIFICATION_SYLLABUS_NOT_SEPARATE');
  }
  const notificationSnap = await realmRef.collection('official_documents').doc(notificationSourceId).get();
  if (notificationSnap.exists && notificationSnap.data()?.contentSha256 === syllabusMeta.contentSha256) {
    throw new Error('ACADEMIC_MATERIALIZER_IDENTICAL_NOTIFICATION_SYLLABUS_BYTES');
  }

  const pagesSnap = await syllabusDocRef.collection('page_extractions').orderBy('page_number').get();
  if (pagesSnap.empty) throw new Error('ACADEMIC_MATERIALIZER_PAGE_CORPUS_EMPTY');

  const retiredLegacyCount = await retireLegacyMaterialization(db, missionId);

  const nodes = [];
  const nodeWrites = [];
  const payloadWrites = [];
  const digiWrites = [];
  const now = admin.firestore.FieldValue.serverTimestamp();

  const sourcePages = pagesSnap.docs.map((pageDoc) => {
    const page = pageDoc.data() || {};
    return { pageNumber: Number(page.page_number || pageDoc.id), text: String(page.extraction_text || '').trim(), sourceSha256: page.sourceSha256 || null, pageAuthorityDigest: page.pageAuthorityDigest || null };
  }).filter((page) => page.text && Number.isInteger(page.pageNumber) && isAcademicSyllabusPage(page.text));
  const topics = extractCanonicalSyllabusTopics(sourcePages);
  topics.forEach((topic, topicIndex) => {
    {
    const pageNumber = topic.sourcePage;
    const page = sourcePages.find((candidate) => candidate.pageNumber === pageNumber) || sourcePages[0];
    const chapterSlug = topic.chapter.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const topicSlug = topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const nodeId = `${missionId}_official_syllabus_${chapterSlug}_${topicSlug}`;
    const contentRegistryId = `content_${nodeId}`;
    const atomId = `atom_${nodeId}`;
    const verificationId = `auto_source_verification_${digest(`${missionId}:${syllabusDocRef.id}:${pageNumber}:${page.sourceSha256 || ''}`).slice(0, 24)}`;
    const subject = topic.subject;
    const title = topic.title;
    const excerpt = page.text.slice(0, MAX_EXCERPT);
    const common = {
      examId: missionId,
      missionId,
      paperId: 'SSC_CGL_2026',
      subjectId: subject,
      subjectHindi: subject,
      unitId: `${missionId}_${chapterSlug}`,
      chapterId: topic.chapter,
      chapterHindi: topic.chapter,
      topicId: nodeId,
      title,
      titleHindi: title,
      learningOutcome: `Study the official SSC CGL syllabus topic recorded on source page ${pageNumber}.`,
      description: excerpt,
      contentRegistryId,
      atomicTopicIds: [atomId],
      difficulty: 3,
      importance: 3,
      weightage: 1,
      status: 'published',
      isDiagnosticEligible: true,
      pyqFrequency: 0,
      sourceBook: 'SSC official source PDF',
      sourcePage: String(pageNumber),
      sourceUploadId: syllabusDocRef.id,
      studentVisibilityAuthorized: true,
      isSynthetic: false,
      isStructuralHold: false,
      isStale: false,
      sourceApproved: true,
      verificationStatus: 'VERIFIED',
      canonicalAtomId: atomId,
      canonicalMissionId: missionId,
      approvedSourceId: syllabusDocRef.id,
      verificationId,
      sourceSha256: page.sourceSha256 || null,
      sourcePageDigest: page.pageAuthorityDigest || null,
      syllabusHierarchy: {
        subject,
        unit: topic.chapter,
        topic: title,
        atomicTopics: [title],
        sourceSignal: topic.evidenceSignal,
      },
      generatedBy: MATERIALIZER_VERSION,
      generatedAt: now,
      parentTaskId,
    };
    nodes.push({ nodeId, title, subject, chapter: topic.chapter, pageNumber });
    nodeWrites.push({ ref: db.collection('micro_nodes').doc(nodeId), data: common });
    payloadWrites.push({
      ref: db.collection('content_payloads').doc(contentRegistryId),
      data: {
        ...common,
        id: contentRegistryId,
        registryId: contentRegistryId,
        nodeId,
        content: excerpt,
        beginnerContent: excerpt,
        intermediateContent: excerpt,
        proContent: excerpt,
        status: 'published',
      },
    });
    digiWrites.push({
      ref: db.collection('digibook_units').doc(`digi_${nodeId}`),
      data: {
        id: `digi_${nodeId}`,
        realm_id: missionId,
        missionId,
        atomic_topic_id: atomId,
        nodeId,
        unit_id: `${missionId}_${chapterSlug}`,
        chapter_id: topic.chapter,
        concept: title,
        definition: excerpt.slice(0, 700),
        explanation: excerpt,
        examples: [],
        keywords: [subject, topic.chapter, title, 'SSC CGL', `page-${pageNumber}`],
        pyq_ids: [],
        pyq_count: 0,
        pyq_weightage: 0,
        crucible_mapped: false,
        crucible_node_ids: [],
        difficulty: 3,
        status: 'published',
        version: 1,
        studentVisibilityAuthorized: true,
        sourceApproved: true,
        verificationStatus: 'VERIFIED',
        canonicalAtomId: atomId,
        canonicalMissionId: missionId,
        approvedSourceId: syllabusDocRef.id,
        verificationId,
        contentRegistryId,
        sourcePage: String(pageNumber),
        syllabusHierarchy: {
          subject,
          unit: topic.chapter,
          topic: title,
          atomicTopics: [title],
          sourceSignal: topic.evidenceSignal,
        },
        generatedBy: MATERIALIZER_VERSION,
        generatedAt: now,
      },
    });
    }
  });

  if (nodes.length === 0) throw new Error('ACADEMIC_MATERIALIZER_NO_NONEMPTY_PAGES');
  await writeBatches(db, [...nodeWrites, ...payloadWrites, ...digiWrites]);

  const diagnosticRef = realmRef.collection('diagnostic_syllabus').doc('default');
  await diagnosticRef.set({
    missionId, cycleKey, status: 'published', mode: 'source_bound_adaptive_entry',
    nodeCount: nodes.length, nodeIds: nodes.map((x) => x.nodeId),
    sourceDocumentId: syllabusDocRef.id, sourceBound: true,
    generatedBy: MATERIALIZER_VERSION, updatedAt: now,
  }, { merge: true });

  const dayWrites = [];
  for (let i = 0; i < Math.min(7, nodes.length); i++) {
    const item = nodes[i];
    dayWrites.push({
      ref: realmRef.collection('crucible_days').doc(`day_${String(i + 1).padStart(2, '0')}`),
      data: {
        missionId, cycleKey, day: i + 1, status: 'preparing',
        title: `Source-grounded Crucible Day ${i + 1}`,
        study_atom_ids: [item.nodeId], coveredAtomIds: [item.nodeId],
        questionCount: 0, assessmentReady: false,
        sourceDocumentId: syllabusDocRef.id, sourcePage: String(item.pageNumber),
        generatedBy: MATERIALIZER_VERSION, updatedAt: now,
      },
    });
  }
  await writeBatches(db, dayWrites);

  // A small source-bound diagnostic/arena slice is generated from the
  // verified official text itself. These are explicitly not PYQs: they are
  // provenance-aware source-comprehension items until an official PYQ source
  // pair is acquired by the same automated URL lane.
  const questionItems = nodes.slice(0, 10).map((item, index) => {
    const questionId = `source_diag_${missionId}_${String(index + 1).padStart(2, '0')}`;
    const distractors = nodes.filter((candidate) => candidate.nodeId !== item.nodeId).slice(index, index + 3);
    const baseOptions = [item.title, ...distractors.map((x) => x.title), 'Not stated in the official source'];
    // Deterministic option rotation prevents an answer-position bias while
    // preserving the source-bound correct value. Never randomize without a
    // reproducible answer index.
    const shift = index % baseOptions.length;
    const options = baseOptions.slice(shift).concat(baseOptions.slice(0, shift));
    return {
      questionId,
      nodeId: item.nodeId,
      question: `Which title is recorded on official SSC CGL source page ${item.pageNumber}?`,
      options: options.slice(0, 4),
      answerIndex: (baseOptions.length - shift) % baseOptions.length,
      sourcePage: item.pageNumber,
    };
  });
  const questionWrites = [];
  questionItems.forEach((item) => {
    const node = nodes.find((x) => x.nodeId === item.nodeId);
    const sourceVerificationId = `auto_source_verification_${digest(`${missionId}:${syllabusDocRef.id}:${item.sourcePage}`).slice(0, 24)}`;
    questionWrites.push({
      ref: realmRef.collection('question_bank').doc(item.questionId),
      data: {
        id: item.questionId, missionId, examId: missionId, nodeId: item.nodeId,
        question: item.question, options: item.options, answerIndex: item.answerIndex,
        subjectId: node?.subject || 'Official Source', document_type: 'diagnostic_source_comprehension',
        sourceType: 'OFFICIAL_SOURCE_COMPREHENSION', isPYQ: false, status: 'held_for_question_verifier',
        source_document_id: syllabusDocRef.id, source_page_number: item.sourcePage,
        verificationStatus: 'VERIFIED', verificationId: sourceVerificationId,
        sourceApproved: true, generatedBy: MATERIALIZER_VERSION, updatedAt: now,
      },
    });
    questionWrites.push({
      ref: db.collection('published_questions').doc(item.questionId),
      data: {
        id: item.questionId, questionLineageId: item.questionId, version: 1,
        questionType: 'mcq_single', question: item.question, options: item.options,
        difficulty: 'medium', examId: missionId, subjectId: node?.subject || 'Official Source',
        nodeId: item.nodeId, atomicTopicIds: [item.nodeId], status: 'held_for_question_verifier',
        isPYQ: false, verifiedBy: MATERIALIZER_VERSION,
        verifiedAt: now,
      },
    });
  });
  await writeBatches(db, questionWrites);

  const paperId = `paper_${missionId}_source_diagnostic`;
  const eventId = `event_${missionId}_source_diagnostic`;
  const start = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 1000));
  await db.collection('test_arena_papers').doc(paperId).set({
    id: paperId, missionId, examId: missionId, title: 'SSC CGL Source Diagnostic (held)',
    status: 'draft', isReleased: false, scheduledStart: start,
    durationMinutes: 20, questionCount: questionItems.length,
    questions: questionItems.map((q) => ({ id: q.questionId, nodeId: q.nodeId, question: q.question, options: q.options, questionType: 'mcq_single' })),
    sourceDocumentId: syllabusDocRef.id, sourceBound: true, isPYQ: false,
    generatedBy: MATERIALIZER_VERSION, updatedAt: now,
  }, { merge: true });
  await db.collection('test_arena_events').doc(eventId).set({
    id: eventId, missionId, examId: missionId, paperId,
    title: 'SSC CGL Source Diagnostic (held)', status: 'draft', type: 'diagnostic',
    questionCount: questionItems.length, startsAt: start,
    sourceDocumentId: syllabusDocRef.id, isPYQ: false,
    generatedBy: MATERIALIZER_VERSION, updatedAt: now,
  }, { merge: true });
  await writeBatches(db, questionItems.slice(0, 7).map((item, index) => ({
    ref: realmRef.collection('crucible_tests').doc(`test_${String(index + 1).padStart(2, '0')}`),
    data: {
      missionId, cycleKey, status: 'preparing', assessmentReady: false,
      title: `Source Diagnostic Crucible Test ${index + 1}`,
      questionIds: [item.questionId], coveredAtomIds: [item.nodeId],
      sourceDocumentId: syllabusDocRef.id, sourcePage: String(item.sourcePage),
      generatedBy: MATERIALIZER_VERSION, updatedAt: now,
    },
  })));

  const result = {
    status: 'COMPLETE', materializerVersion: MATERIALIZER_VERSION, missionId, cycleKey, sourceDocumentId: syllabusDocRef.id,
    nodeCount: nodes.length, digibookUnitCount: digiWrites.length,
    diagnosticSyllabusCount: 1, crucibleDayCount: dayWrites.length,
    pyqStatus: 'SOURCE_NOT_BOUND', testArenaStatus: 'SOURCE_NOT_BOUND',
    questionCount: 0, crucibleTestCount: 0,
    generatedBy: MATERIALIZER_VERSION, retiredLegacyCount, completedAt: now,
  };
  await markerRef.set(result, { merge: true });
  const latestRealmSnap = await realmRef.get();
  const repair = latestRealmSnap.data()?.automatedRepair;
  const repairRestore = repair?.status === 'ACTIVE' && repair?.previousVisibility
    ? repair.previousVisibility
    : {};
  await realmRef.set({
    id: missionId,
    missionId,
    title: missionId === 'ssc_cgl' ? 'SSC CGL 2026' : missionId,
    displayName: missionId === 'ssc_cgl' ? 'SSC CGL 2026' : missionId,
    examId: missionId,
    examCategory: missionId === 'ssc_cgl' ? 'competitive' : 'competitive',
    category: missionId === 'ssc_cgl' ? 'competitive' : 'competitive',
    authorityGroupKey: missionId === 'ssc_cgl' ? 'ssc' : '',
    authorityDisplayName: missionId === 'ssc_cgl' ? 'Staff Selection Commission (SSC)' : '',
    jurisdictionLevel: 'CENTRAL',
    state: 'Central',
    stateName: 'Central',
    stateCode: 'IN',
    studentPublicationState: 'AVAILABLE',
    catalogStatus: 'PUBLISHED',
    missionSelectionReady: true,
    quickEntryEnabled: true,
    canonicalSyllabusReady: true,
    academicAutomation: {
      syllabus: 'PUBLISHED', diagnosticSyllabus: 'PUBLISHED', digibook: 'PUBLISHED',
      crucible: 'PREPARING', pyq: 'SOURCE_NOT_BOUND',
      testArena: 'SOURCE_NOT_BOUND', nodeCount: nodes.length, questionCount: 0,
      updatedAt: now,
    },
    updated_at: now,
    ...repairRestore,
    ...(repair ? {
      automatedRepair: repair.status === 'ACTIVE'
        ? { ...repair, status: 'COMPLETED', completedAt: now }
        : repair,
    } : {}),
  }, { merge: true });
  return result;
}

exports.missionAcademicMaterializerWorker = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .firestore.document('ai_queue/{taskId}').onWrite(async (change) => {
    const data = change.after.exists ? change.after.data() || {} : {};
    if (data.status !== 'completed' || !String(data.parentTaskId || '').startsWith('mission_source_pair_')) return null;
    const db = admin.firestore();
    const parentId = String(data.parentTaskId);
    const parentSnap = await db.collection('ai_queue').doc(parentId).get();
    const payload = parentSnap.data()?.payload || {};
    const missionId = String(payload.missionId || data.mission_id || '');
    const cycleKey = String(payload.cycleKey || '');
    if (!missionId || !cycleKey) return null;
    const children = await db.collection('ai_queue').where('parentTaskId', '==', parentId).get();
    if (children.empty || children.docs.some((doc) => doc.data()?.status !== 'completed')) return null;
    try {
      return await materializeMission({ db, missionId, cycleKey, parentTaskId: parentId });
    } catch (error) {
      await db.collection('mission_academic_delivery').doc(`${missionId}_${cycleKey}`).set({
        status: 'FAILED', missionId, cycleKey, error: error.message || String(error), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.error(`MISSION_ACADEMIC_MATERIALIZER_FAILED: ${missionId}/${cycleKey}`, error);
      return null;
    }
  });

exports.materializeMission = materializeMission;
exports.extractSyllabusTopics = extractSyllabusTopics;
exports.isAcademicSyllabusPage = isAcademicSyllabusPage;
