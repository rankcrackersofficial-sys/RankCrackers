import * as functions from 'firebase-functions';

export const storageTrigger = functions.storage.object().onFinalize(async (object) => {
  const path = object.name;
  console.log('NEW FILE DETECTED:', path);

  if (!path) return;

  // ===============================================
  // SYLLABUS PIPELINE
  // ===============================================
  if (path.includes('syllabus/')) {
    console.log('STARTING SYLLABUS BREAKDOWN WORKER');
    // AI Worker Logic to parse PDF/Text and insert into Firestore
  }

  // ===============================================
  // PYQ PIPELINE
  // ===============================================
  if (path.includes('pyq/')) {
    console.log('STARTING PYQ MAPPING WORKER');
    // AI Worker Logic to classify and link PYQs to MicroNodes
  }
});
