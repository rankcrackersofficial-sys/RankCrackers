const fs = require('fs');
const path = require('path');

const audit675 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'academic_review', 'canonical_675_question_authority_audit.json'), 'utf8'));
const micro600 = audit675.allDrafts.filter(q => q.scheduleOrEventId.startsWith('sch_jee_main_2026_'));

console.log(`Total Micro drafts: ${micro600.length}`);

// Canonical schedule mapping from pipeline manifests
const canonicalSchedules = {
  sch_jee_main_2026_1: { title: 'Kinematics 1D (Motion in a Straight Line)', doc: 'NCERT_CLASS_11_PHYSICS_CH03' },
  sch_jee_main_2026_2: { title: 'Laws of Motion & Friction', doc: 'NCERT_CLASS_11_PHYSICS_CH05' },
  sch_jee_main_2026_3: { title: 'Work, Energy & Power', doc: 'NCERT_CLASS_11_PHYSICS_CH06' },
  sch_jee_main_2026_4: { title: 'Centre of Mass & Rotational Motion', doc: 'NCERT_CLASS_11_PHYSICS_CH07' },
  sch_jee_main_2026_5: { title: 'Gravitation & Satellite Motion', doc: 'NCERT_CLASS_11_PHYSICS_CH08' },
  sch_jee_main_2026_6: { title: 'Properties of Matter & Fluids', doc: 'NCERT_CLASS_11_PHYSICS_CH09' },
  sch_jee_main_2026_7: { title: 'Thermodynamics', doc: 'NCERT_CLASS_11_PHYSICS_CH11' },
  sch_jee_main_2026_8: { title: 'Kinetic Theory of Gases', doc: 'NCERT_CLASS_11_PHYSICS_CH12' },
  sch_jee_main_2026_9: { title: 'Oscillations & SHM', doc: 'NCERT_CLASS_11_PHYSICS_CH13' },
  sch_jee_main_2026_10: { title: 'Waves & Acoustics', doc: 'NCERT_CLASS_11_PHYSICS_CH14' },
  sch_jee_main_2026_11: { title: 'Electrostatics', doc: 'NCERT_CLASS_12_PHYSICS_CH01' },
  sch_jee_main_2026_12: { title: 'Potential & Capacitance', doc: 'NCERT_CLASS_12_PHYSICS_CH02' }
};

let mismatches = 0;
const scheduleCounts = {};

micro600.forEach(q => {
  const schId = q.scheduleOrEventId;
  const canonical = canonicalSchedules[schId];
  scheduleCounts[schId] = (scheduleCounts[schId] || 0) + 1;

  if (!canonical) {
    mismatches++;
    console.log(`Unknown schedule: ${schId} on question ${q.questionId}`);
  } else {
    // Check if source document matches canonical document
    if (q.sourceDocumentId && q.sourceDocumentId !== canonical.doc) {
      // check if it's a known alias
      console.log(`Doc mismatch on ${q.questionId}: stored=${q.sourceDocumentId} vs canonical=${canonical.doc}`);
    }
  }
});

console.log('Schedule Counts in 600 Micro drafts:', scheduleCounts);
console.log(`Total Schedule Binding Mismatches: ${mismatches}`);
