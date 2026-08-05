const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) admin.initializeApp({ projectId: 'rankcrackers-55' });
const db = admin.firestore();

const MISSION_ID = 'jee_main_2026';
const DISPLAY_EXAM = 'JEE Main 2027';
const RUN_ID = 'nebula_vs0_founder_preview_20260805183000';
const repoRoot = process.cwd();
const outDir = path.join(repoRoot, 'assets', 'data', 'preview', 'jee_main_2027');
const patchDir = path.join(repoRoot, 'docs', 'patch_safety');

function hasValue(v) { return typeof v === 'string' && v.trim().length > 0; }
function value(...items) {
  for (const item of items) {
    if (item !== undefined && item !== null && String(item).trim() !== '') return item;
  }
  return '';
}
function text(v) { return String(v || '').trim(); }
function norm(v) { return text(v).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' '); }
function titleCase(v) {
  const s = text(v).replace(/_/g, ' ').replace(/\s+/g, ' ');
  if (!s) return 'Unlabeled';
  return s.split(' ').map((p) => p ? p[0].toUpperCase() + p.slice(1) : p).join(' ');
}
function classifySubject(atom) {
  const raw = norm(value(atom.subject, atom.subjectName, atom.domain, atom.canonicalKey, atom.atomId, atom.atom_id));
  if (raw.includes('math') || raw.includes('mathematics') || raw.includes('mat')) return 'Mathematics';
  if (raw.includes('physics') || raw.includes('phy')) return 'Physics';
  if (raw.includes('chem') || raw.includes('chemistry')) return 'Chemistry';
  return 'Unknown';
}
function isRejected(atom = {}) {
  const status = String(value(atom.status, atom.reviewStatus, atom.verificationStatus, atom.verification_status)).toUpperCase();
  return status === 'REJECTED' || atom.rejected === true || atom.excludeFromQuestionCells === true;
}
function atomIdOf(doc, atom) { return text(value(atom.atomId, atom.atom_id, doc.id)); }
function canonicalKeyOf(atom) { return text(atom.canonicalKey); }
function sourceTraceStatus(atom) {
  if (hasValue(value(atom.sourceDocumentId, atom.source_document_id)) && hasValue(value(atom.sourceTextExcerpt, atom.source_text_excerpt))) return 'SOURCE_TRACE_PRESENT';
  if (hasValue(value(atom.sourceTraceQuality, atom.source_trace_quality))) return text(value(atom.sourceTraceQuality, atom.source_trace_quality));
  return 'SOURCE_TRACE_UNCONFIRMED_IN_PREVIEW_BUNDLE';
}
function hierarchyParts(atom, atomId) {
  const canonical = canonicalKeyOf(atom);
  const pieces = canonical.split('|').map((x) => x.trim()).filter(Boolean);
  const subject = classifySubject({ ...atom, canonicalKey: canonical, atomId });
  const unit = titleCase(value(atom.unit, atom.unitTitle, atom.officialUnit, atom.unitName, pieces[2], 'General Unit'));
  const chapter = titleCase(value(atom.chapter, atom.chapterTitle, atom.officialSection, atom.chapterName, pieces[2], 'General Chapter'));
  const topic = titleCase(value(atom.topic, atom.topicTitle, atom.parentTitle, pieces[3], atom.title, atom.displayTitle, 'General Topic'));
  const label = titleCase(value(atom.atomicTopicLabel, atom.atomTitle, atom.atom_title, atom.displayTitle, atom.title, atom.subtopic, atom.subTopic, atomId));
  return { subject, unit, chapter, topic, label };
}
function readinessForAtom(atomId, digibookAtomSet, assessmentAtomSet) {
  return {
    syllabusStatus: 'AVAILABLE',
    digibookReadiness: digibookAtomSet.has(atomId) ? 'AVAILABLE' : 'IN_PROGRESS',
    assessmentReadiness: assessmentAtomSet.has(atomId) ? 'INTERNAL_DRAFT' : 'NOT_STARTED',
    pyqLinkageStatus: 'IN_PROGRESS'
  };
}
function groupBy(arr, fn) {
  const map = new Map();
  for (const item of arr) {
    const key = fn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}
function classifyHold(atom, atomId, canonical) {
  if (isRejected(atom)) return 'REJECTED';
  if (!hasValue(canonical)) return 'HELD_MISSING_CANONICAL_KEY';
  return 'INVALID_HIERARCHY';
}
function makeNode(name, extra = {}) { return { name, ...extra, children: [] }; }
function makeScheduleState(schedule) {
  if (schedule.digibookAvailableCount === schedule.assignedAtomIds.length && schedule.questionPoolReadyCount > 0) return 'PREVIEW_READY';
  if (schedule.digibookAvailableCount > 0) return 'CONTENT_PARTIAL';
  if (schedule.questionPoolReadyCount === 0) return 'QUESTION_POOL_BLOCKED';
  return 'DIGIBOOK_BLOCKED';
}
function percent(n, d) { return d === 0 ? 0 : Math.round((n / d) * 1000) / 10; }

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(patchDir, { recursive: true });

  const [atomSnap, cellSnap] = await Promise.all([
    db.collection('mission_realms').doc(MISSION_ID).collection('syllabus_atoms').get(),
    db.collection('mission_realms').doc(MISSION_ID).collection('atomic_question_cells').get()
  ]);

  const digibook = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/digibook/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_V1.json'), 'utf8'));
  const assessmentPack = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/assessment/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ORIGINAL_ITEM_DRAFT_PACK_V1.json'), 'utf8'));
  const answerContract = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/assessment/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ANSWER_SOLUTION_CONTRACT_V1.json'), 'utf8'));

  const digibookAtomSet = new Set(digibook.authorizedAtoms || []);
  const assessmentAtomSet = new Set();
  for (const item of assessmentPack.items || []) {
    if (item.primaryAuthorizedAtomId && item.primaryAuthorizedAtomId !== 'NOT_APPLICABLE') assessmentAtomSet.add(item.primaryAuthorizedAtomId);
    for (const secondary of item.secondaryAuthorizedAtomIds || []) {
      if (secondary && secondary !== 'NOT_APPLICABLE') assessmentAtomSet.add(secondary);
    }
  }

  const allAtoms = atomSnap.docs.map((doc) => {
    const atom = doc.data() || {};
    const atomId = atomIdOf(doc, atom);
    const canonicalKey = canonicalKeyOf(atom);
    const hierarchy = hierarchyParts(atom, atomId);
    const rejected = isRejected(atom);
    const eligible = hasValue(canonicalKey) && !rejected && hierarchy.subject !== 'Unknown';
    const classification = eligible ? 'CANONICAL_PREVIEW_ELIGIBLE' : classifyHold(atom, atomId, canonicalKey);
    return { docId: doc.id, atomId, canonicalKey, raw: atom, hierarchy, classification, sourceTraceStatus: sourceTraceStatus(atom) };
  });

  const canonicalAtoms = allAtoms.filter((a) => a.classification === 'CANONICAL_PREVIEW_ELIGIBLE');
  const heldAtoms = allAtoms.filter((a) => a.classification !== 'CANONICAL_PREVIEW_ELIGIBLE');
  canonicalAtoms.sort((a, b) => `${a.hierarchy.subject}|${a.hierarchy.unit}|${a.hierarchy.chapter}|${a.hierarchy.topic}|${a.atomId}`.localeCompare(`${b.hierarchy.subject}|${b.hierarchy.unit}|${b.hierarchy.chapter}|${b.hierarchy.topic}|${b.atomId}`));

  const atomRecords = canonicalAtoms.map((a) => ({
    atomId: a.atomId,
    canonicalKey: a.canonicalKey,
    subject: a.hierarchy.subject,
    unit: a.hierarchy.unit,
    chapter: a.hierarchy.chapter,
    topic: a.hierarchy.topic,
    atomicTopicLabel: a.hierarchy.label,
    sourceTraceStatus: a.sourceTraceStatus,
    ...readinessForAtom(a.atomId, digibookAtomSet, assessmentAtomSet),
    previewOnly: true,
    studentPublishReady: false,
    productionMaterializationAuthorized: false,
    progressPersistenceEnabled: false
  }));

  const subjectCounts = {};
  const unitCounts = {};
  const chapterCounts = {};
  const topicCounts = {};
  for (const atom of atomRecords) {
    subjectCounts[atom.subject] = (subjectCounts[atom.subject] || 0) + 1;
    unitCounts[`${atom.subject} > ${atom.unit}`] = (unitCounts[`${atom.subject} > ${atom.unit}`] || 0) + 1;
    chapterCounts[`${atom.subject} > ${atom.unit} > ${atom.chapter}`] = (chapterCounts[`${atom.subject} > ${atom.unit} > ${atom.chapter}`] || 0) + 1;
    topicCounts[`${atom.subject} > ${atom.unit} > ${atom.chapter} > ${atom.topic}`] = (topicCounts[`${atom.subject} > ${atom.unit} > ${atom.chapter} > ${atom.topic}`] || 0) + 1;
  }

  const tree = {
    previewOnly: true,
    studentPublishReady: false,
    productionMaterializationAuthorized: false,
    progressPersistenceEnabled: false,
    missionId: MISSION_ID,
    displayMission: DISPLAY_EXAM,
    badge: 'INTERNAL FOUNDER PREVIEW',
    summary: {
      totalAtoms: allAtoms.length,
      previewEligibleAtoms: atomRecords.length,
      heldExcludedAtoms: heldAtoms.length,
      subjectCounts,
      unitCount: Object.keys(unitCounts).length,
      chapterCount: Object.keys(chapterCounts).length,
      topicCount: Object.keys(topicCounts).length
    },
    subjects: []
  };

  for (const [subject, subjectAtoms] of groupBy(atomRecords, (a) => a.subject)) {
    const subjectNode = makeNode(subject, { atomCount: subjectAtoms.length });
    for (const [unit, unitAtoms] of groupBy(subjectAtoms, (a) => a.unit)) {
      const unitNode = makeNode(unit, { atomCount: unitAtoms.length });
      for (const [chapter, chapterAtoms] of groupBy(unitAtoms, (a) => a.chapter)) {
        const chapterNode = makeNode(chapter, { atomCount: chapterAtoms.length });
        for (const [topic, topicAtoms] of groupBy(chapterAtoms, (a) => a.topic)) {
          chapterNode.children.push({ name: topic, atomCount: topicAtoms.length, atoms: topicAtoms });
        }
        unitNode.children.push(chapterNode);
      }
      subjectNode.children.push(unitNode);
    }
    tree.subjects.push(subjectNode);
  }

  const subjectBuckets = ['Physics', 'Chemistry', 'Mathematics'].map((s) => atomRecords.filter((a) => a.subject === s));
  const ordered = [];
  let cursor = 0;
  while (ordered.length < atomRecords.length) {
    const bucket = subjectBuckets[cursor % subjectBuckets.length];
    const index = Math.floor(cursor / subjectBuckets.length);
    if (bucket[index]) ordered.push(bucket[index]);
    cursor++;
    if (cursor > atomRecords.length * 4) break;
  }
  const missingFromRoundRobin = atomRecords.filter((a) => !ordered.some((b) => b.atomId === a.atomId));
  ordered.push(...missingFromRoundRobin);

  const scheduleCount = 42;
  const schedules = Array.from({ length: scheduleCount }, (_, i) => ({
    scheduleId: `jee_main_2027_preview_schedule_${String(i + 1).padStart(2, '0')}`,
    scheduleNumber: i + 1,
    phaseId: `phase_${Math.floor(i / 6) + 1}`,
    dayRange: `${i * 2 + 1}-${Math.min(100, i * 2 + 2)}`,
    assignedAtomIds: [],
    subjectMix: {},
    estimatedCoverage: 0,
    digibookAvailableCount: 0,
    digibookMissingCount: 0,
    questionPoolReadyCount: 0,
    microTestStatus: 'NOT_READY',
    microTestReason: 'REVIEWED_QUESTION_POOL_NOT_AVAILABLE',
    scheduleReadiness: 'QUESTION_POOL_BLOCKED',
    pilotDigibookUnits: [],
    previewOnly: true,
    studentPublishReady: false,
    productionMaterializationAuthorized: false,
    progressPersistenceEnabled: false
  }));
  ordered.forEach((atom, index) => {
    const schedule = schedules[index % scheduleCount];
    schedule.assignedAtomIds.push(atom.atomId);
    schedule.subjectMix[atom.subject] = (schedule.subjectMix[atom.subject] || 0) + 1;
    if (atom.digibookReadiness === 'AVAILABLE') schedule.digibookAvailableCount++;
    else schedule.digibookMissingCount++;
    if (atom.assessmentReadiness === 'INTERNAL_DRAFT') schedule.questionPoolReadyCount++;
  });
  if (schedules[0]) {
    schedules[0].pilotDigibookUnits.push({
      unitId: digibook.unitId,
      title: digibook.title,
      label: 'INTERNAL PILOT CONTENT',
      note: 'Pilot DigiBook is bound for Founder preview. Its legacy authorized atom IDs remain excluded from the normal student syllabus tree until canonical governance restores or remaps them.',
      authorizedAtoms: digibook.authorizedAtoms,
      studentPublishReady: false
    });
    schedules[0].digibookAvailableCount += digibook.authorizedAtoms.length;
  }
  for (const schedule of schedules) {
    schedule.estimatedCoverage = percent(schedule.assignedAtomIds.length, atomRecords.length);
    schedule.scheduleReadiness = makeScheduleState(schedule);
  }

  const phases = Array.from({ length: 7 }, (_, i) => {
    const phaseSchedules = schedules.filter((s) => s.phaseId === `phase_${i + 1}`);
    const atomCount = phaseSchedules.reduce((sum, s) => sum + s.assignedAtomIds.length, 0);
    return {
      phaseId: `phase_${i + 1}`,
      phaseNumber: i + 1,
      title: [
        'Foundation Ignition', 'Concept Build', 'Application Push', 'Mixed Practice', 'Revision Rebuild', 'Mock Pressure', 'Final Consolidation'
      ][i],
      scheduleIds: phaseSchedules.map((s) => s.scheduleId),
      atomCount,
      estimatedCoverage: percent(atomCount, atomRecords.length),
      previewOnly: true
    };
  });

  const allocated = schedules.flatMap((s) => s.assignedAtomIds);
  const duplicateAllocation = allocated.length - new Set(allocated).size;
  const missingAllocation = atomRecords.filter((a) => !allocated.includes(a.atomId)).map((a) => a.atomId);

  const crucible = {
    previewOnly: true,
    studentPublishReady: false,
    productionMaterializationAuthorized: false,
    progressPersistenceEnabled: false,
    missionId: MISSION_ID,
    displayMission: DISPLAY_EXAM,
    planType: 'FOUNDER_ONLY_STRUCTURAL_PREVIEW',
    cycleDays: 100,
    phaseCount: 7,
    scheduleCount: 42,
    rebuildWindowCount: 7,
    macroTestSlotCount: 7,
    majorTestSlotCount: 1,
    phases,
    schedules,
    rebuildWindows: phases.map((p, i) => ({ rebuildId: `rebuild_window_${i + 1}`, phaseId: p.phaseId, status: 'STRUCTURAL_SLOT_ONLY', previewOnly: true })),
    macroTestSlots: phases.map((p, i) => ({ macroTestId: `macro_test_${i + 1}`, phaseId: p.phaseId, status: 'NOT_READY', reason: 'REVIEWED_QUESTION_POOL_NOT_AVAILABLE', previewOnly: true })),
    majorTestSlot: { majorTestId: 'major_test_final', status: 'NOT_READY', reason: 'REVIEWED_FULL_MISSION_QUESTION_POOL_NOT_AVAILABLE', previewOnly: true },
    allocationIntegrity: {
      previewEligibleAtoms: atomRecords.length,
      allocatedPrimaryAtoms: allocated.length,
      uniqueAllocatedAtoms: new Set(allocated).size,
      duplicateAllocationCount: duplicateAllocation,
      missingAllocationCount: missingAllocation.length,
      missingAllocation
    }
  };

  const digibookCatalog = {
    previewOnly: true,
    studentPublishReady: false,
    productionMaterializationAuthorized: false,
    progressPersistenceEnabled: false,
    missionId: MISSION_ID,
    displayMission: DISPLAY_EXAM,
    units: [{
      unitId: digibook.unitId,
      title: digibook.title,
      subtitle: digibook.subtitle,
      subject: 'Physics',
      contentLabel: 'INTERNAL PILOT CONTENT',
      status: 'AVAILABLE_FOR_FOUNDER_PREVIEW',
      studentPublishReady: false,
      authorizedAtoms: digibook.authorizedAtoms,
      sectionCount: digibook.content.sections.length,
      formulaCount: digibook.content.formulaRegister.length,
      misconceptionCount: digibook.content.misconceptionRegister.length,
      workedExampleCount: digibook.content.workedExamples.length,
      selfCheckCount: digibook.content.selfCheckPrompts.length,
      sections: digibook.content.sections,
      formulaRegister: digibook.content.formulaRegister,
      misconceptionRegister: digibook.content.misconceptionRegister,
      workedExamples: digibook.content.workedExamples,
      selfCheckPrompts: digibook.content.selfCheckPrompts
    }],
    missingContentState: {
      title: 'Content in progress',
      reason: 'DigiBook is generated only from reviewed/accepted atomic teaching content. Empty fake reader pages are blocked.'
    }
  };

  const assessment = {
    previewOnly: true,
    studentPublishReady: false,
    productionMaterializationAuthorized: false,
    progressPersistenceEnabled: false,
    missionId: MISSION_ID,
    displayMission: DISPLAY_EXAM,
    assessments: [{
      assessmentId: assessmentPack.assessmentPackId,
      title: assessmentPack.title,
      subject: 'Physics',
      unit: 'Mechanics Foundations',
      itemCount: assessmentPack.items.length,
      totalPoints: assessmentPack.items.reduce((sum, item) => sum + Number(item.pointValue || 0), 0),
      state: 'INTERNAL_ASSESSMENT_PREVIEW',
      answerContractStatus: answerContract.status,
      answerReviewStatus: answerContract.safetyFlags.answerReviewStatus,
      solutionReviewStatus: answerContract.safetyFlags.solutionReviewStatus,
      resultsSaved: false,
      masteryUpdated: false,
      officialAnswerKey: false,
      studentPublishReady: false,
      sampleItems: assessmentPack.items.slice(0, 3).map((item) => ({
        itemId: item.itemId,
        format: item.itemFormat,
        stem: item.stem,
        pointValue: item.pointValue,
        studentPublishReady: false
      }))
    }]
  };

  const manifest = {
    previewOnly: true,
    studentPublishReady: false,
    productionMaterializationAuthorized: false,
    progressPersistenceEnabled: false,
    runId: RUN_ID,
    missionId: MISSION_ID,
    displayMission: DISPLAY_EXAM,
    title: 'Mission NEBULA - JEE Main 2027 Founder Student-End Preview',
    banner: 'INTERNAL FOUNDER PREVIEW',
    copy: {
      headline: 'JEE Main 2027 - Internal Preview',
      syllabus: 'The verified syllabus structure is available.',
      crucible: 'The Crucible structure is being generated from syllabus topics.',
      digibook: 'Pilot DigiBook content is available for Mechanics Foundations.',
      assessment: 'Assessments and tests remain under internal academic review.'
    },
    files: {
      syllabusPreviewTree: 'assets/data/preview/jee_main_2027/syllabus_preview_tree.json',
      cruciblePreviewPlan: 'assets/data/preview/jee_main_2027/crucible_preview_plan.json',
      digibookPreviewCatalog: 'assets/data/preview/jee_main_2027/digibook_preview_catalog.json',
      assessmentPreviewManifest: 'assets/data/preview/jee_main_2027/assessment_preview_manifest.json'
    },
    inventory: tree.summary,
    crucibleIntegrity: crucible.allocationIntegrity,
    safety: {
      noProductionDeploy: true,
      noFirestoreProductionWrite: true,
      noRulesDeploy: true,
      noCallableDeploy: true,
      noStudentPublication: true,
      noLiveCrucibleActivation: true,
      noMasteryWrite: true,
      noCoverageWrite: true,
      noStreakWrite: true,
      noQuestionPackAttachment: true,
      noFakeTestData: true,
      noFakeDigiBookContent: true,
      noSyllabusAtomMutation: true,
      noCanonicalKeyMutation: true,
      noTopicNodeProductionPublish: true
    }
  };

  const heldDiagnostics = heldAtoms.map((a) => ({
    atomId: a.atomId,
    classification: a.classification,
    canonicalKeyPresent: hasValue(a.canonicalKey),
    subject: a.hierarchy.subject,
    unit: a.hierarchy.unit,
    chapter: a.hierarchy.chapter,
    topic: a.hierarchy.topic,
    atomicTopicLabel: a.hierarchy.label,
    sourceTraceStatus: a.sourceTraceStatus,
    previewOnly: true
  }));
  manifest.heldDiagnostics = {
    count: heldDiagnostics.length,
    byReason: heldDiagnostics.reduce((acc, item) => { acc[item.classification] = (acc[item.classification] || 0) + 1; return acc; }, {}),
    sample: heldDiagnostics.slice(0, 20)
  };

  fs.writeFileSync(path.join(outDir, 'mission_preview_manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'syllabus_preview_tree.json'), JSON.stringify(tree, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'crucible_preview_plan.json'), JSON.stringify(crucible, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'digibook_preview_catalog.json'), JSON.stringify(digibookCatalog, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'assessment_preview_manifest.json'), JSON.stringify(assessment, null, 2) + '\n');

  const report = {
    phase: 'RANKCRACKERS_NEBULA_VS0_PHASE_A_B_C_D_PREVIEW_BUNDLE',
    verdict: duplicateAllocation === 0 && missingAllocation.length === 0 && atomRecords.length > 0
      ? 'NEBULA_VS0_PREVIEW_BUNDLE_GENERATED_READY_FOR_UI_BINDING'
      : 'NEBULA_VS0_BLOCKED_BY_CRUCIBLE_ALLOCATION',
    runId: RUN_ID,
    missionId: MISSION_ID,
    displayMission: DISPLAY_EXAM,
    firestoreReadOnly: true,
    firestoreWrite: false,
    atomMutation: false,
    topicNodePublish: false,
    studentPublish: false,
    deploy: false,
    inventory: tree.summary,
    heldDiagnostics: manifest.heldDiagnostics,
    crucibleIntegrity: crucible.allocationIntegrity,
    digibookDemo: {
      units: digibookCatalog.units.length,
      firstUnit: digibookCatalog.units[0].title,
      authorizedAtoms: digibookCatalog.units[0].authorizedAtoms.length,
      sections: digibookCatalog.units[0].sectionCount,
      formulas: digibookCatalog.units[0].formulaCount,
      misconceptions: digibookCatalog.units[0].misconceptionCount,
      workedExamples: digibookCatalog.units[0].workedExampleCount,
      selfChecks: digibookCatalog.units[0].selfCheckCount
    },
    assessmentPreview: assessment.assessments[0],
    generatedFiles: Object.values(manifest.files).concat(['assets/data/preview/jee_main_2027/mission_preview_manifest.json']),
    safety: manifest.safety
  };
  fs.writeFileSync(path.join(patchDir, 'RANKCRACKERS_NEBULA_VS0_preview_bundle_20260805183000.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(patchDir, 'RANKCRACKERS_NEBULA_VS0_preview_bundle_20260805183000.md'), `# RANKCRACKERS NEBULA-VS0 Founder Preview Bundle\n\nVerdict: **${report.verdict}**\n\n## Mission\n\n- Internal mission ID: \`${MISSION_ID}\`\n- Display: ${DISPLAY_EXAM}\n- Mode: Founder-only local/internal preview assets\n\n## Inventory\n\n- Total atoms: ${report.inventory.totalAtoms}\n- Preview eligible atoms: ${report.inventory.previewEligibleAtoms}\n- Held/excluded atoms: ${report.inventory.heldExcludedAtoms}\n- Subjects: ${JSON.stringify(report.inventory.subjectCounts)}\n- Units: ${report.inventory.unitCount}\n- Chapters: ${report.inventory.chapterCount}\n- Topics: ${report.inventory.topicCount}\n\n## Crucible Structural Preview\n\n- 100-day cycle: YES\n- 7 phases: YES\n- 42 schedules: YES\n- 7 rebuild windows: YES\n- 7 macro-test slots: YES\n- 1 major-test slot: YES\n- Allocated primary atoms: ${report.crucibleIntegrity.allocatedPrimaryAtoms}\n- Unique allocated atoms: ${report.crucibleIntegrity.uniqueAllocatedAtoms}\n- Duplicate allocation count: ${report.crucibleIntegrity.duplicateAllocationCount}\n- Missing allocation count: ${report.crucibleIntegrity.missingAllocationCount}\n\n## DigiBook Demo\n\n- Demo unit: ${report.digibookDemo.firstUnit}\n- Authorized atoms: ${report.digibookDemo.authorizedAtoms}\n- Sections: ${report.digibookDemo.sections}\n- Formula entries: ${report.digibookDemo.formulas}\n- Misconceptions: ${report.digibookDemo.misconceptions}\n- Worked examples: ${report.digibookDemo.workedExamples}\n- Self-checks: ${report.digibookDemo.selfChecks}\n\n## Assessment Preview\n\n- Items: ${report.assessmentPreview.itemCount}\n- Total points: ${report.assessmentPreview.totalPoints}\n- State: ${report.assessmentPreview.state}\n- Results saved: ${report.assessmentPreview.resultsSaved}\n- Mastery updated: ${report.assessmentPreview.masteryUpdated}\n\n## Generated Files\n\n${report.generatedFiles.map((file) => `- \`${file}\``).join('\n')}\n\n## Safety\n\n- NO_PRODUCTION_DEPLOY\n- NO_FIRESTORE_PRODUCTION_WRITE\n- NO_RULES_DEPLOY\n- NO_CALLABLE_DEPLOY\n- NO_STUDENT_PUBLICATION\n- NO_LIVE_CRUCIBLE_ACTIVATION\n- NO_MASTERY_WRITE\n- NO_COVERAGE_WRITE\n- NO_STREAK_WRITE\n- NO_QUESTION_PACK_ATTACHMENT\n- NO_FAKE_TEST_DATA\n- NO_FAKE_DIGIBOOK_CONTENT\n- NO_SYLLABUS_ATOM_MUTATION\n- NO_CANONICAL_KEY_MUTATION\n- NO_TOPIC_NODE_PRODUCTION_PUBLISH\n`);

  console.log(JSON.stringify(report, null, 2));
  if (!report.verdict.includes('READY_FOR_UI_BINDING')) process.exit(2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});