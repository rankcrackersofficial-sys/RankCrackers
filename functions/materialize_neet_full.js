// Retired legacy exam-specific executable. Data remains archived for audit.
require('./services/mission_agnostic_policy').rejectLegacyMissionSpecificExecution('materialize_neet_full.js');

const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

  const atoms = [
    // PHYSICS - UNIT 6
    { atom_id: 'ATOM_NEET_PHY_U06_001', atom_title: 'Universal Law of Gravitation', subject: 'Physics', unit: 'UNIT 6: GRAVITATION', topic: 'Gravitation', subtopic: 'Universal Law', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U06_002', atom_title: 'Acceleration due to Gravity', subject: 'Physics', unit: 'UNIT 6: GRAVITATION', topic: 'Gravitation', subtopic: 'g variation with altitude/depth', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U06_003', atom_title: 'Kepler\'s Laws of Planetary Motion', subject: 'Physics', unit: 'UNIT 6: GRAVITATION', topic: 'Gravitation', subtopic: 'Kepler\'s Laws', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U06_004', atom_title: 'Gravitational Potential Energy', subject: 'Physics', unit: 'UNIT 6: GRAVITATION', topic: 'Gravitation', subtopic: 'Potential & Energy', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U06_005', atom_title: 'Escape Velocity', subject: 'Physics', unit: 'UNIT 6: GRAVITATION', topic: 'Gravitation', subtopic: 'Escape Velocity', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U06_006', atom_title: 'Motion of a Satellite', subject: 'Physics', unit: 'UNIT 6: GRAVITATION', topic: 'Gravitation', subtopic: 'Orbital velocity, time period, energy', page_number: 67 },

    // PHYSICS - UNIT 7
    { atom_id: 'ATOM_NEET_PHY_U07_001', atom_title: 'Elastic Behaviour and Hooke\'s Law', subject: 'Physics', unit: 'UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS', topic: 'Solids', subtopic: 'Stress-strain, Moduli', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U07_002', atom_title: 'Pascal\'s Law and Applications', subject: 'Physics', unit: 'UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS', topic: 'Liquids', subtopic: 'Pressure, Pascal\'s Law', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U07_003', atom_title: 'Viscosity and Stokes\' Law', subject: 'Physics', unit: 'UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS', topic: 'Liquids', subtopic: 'Terminal velocity, Streamline flow', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U07_004', atom_title: 'Bernoulli\'s Principle', subject: 'Physics', unit: 'UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS', topic: 'Liquids', subtopic: 'Bernoulli\'s Applications', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U07_005', atom_title: 'Surface Tension and Capillary Rise', subject: 'Physics', unit: 'UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS', topic: 'Liquids', subtopic: 'Angle of contact, Drops, Bubbles', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U07_006', atom_title: 'Calorimetry and Latent Heat', subject: 'Physics', unit: 'UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS', topic: 'Heat', subtopic: 'Expansion, Specific heat, State change', page_number: 67 },
    { atom_id: 'ATOM_NEET_PHY_U07_007', atom_title: 'Heat Transfer Mechanisms', subject: 'Physics', unit: 'UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS', topic: 'Heat', subtopic: 'Conduction, Convection, Radiation', page_number: 67 },

    // CHEMISTRY - UNIT 2
    { atom_id: 'ATOM_NEET_CHE_U02_001', atom_title: 'Bohr Model of Hydrogen Atom', subject: 'Chemistry', unit: 'UNIT 2: ATOMIC STRUCTURE', topic: 'Atomic Models', subtopic: 'Bohr\'s Postulates & Energy', page_number: 71 },
    { atom_id: 'ATOM_NEET_CHE_U02_002', atom_title: 'Quantum Mechanical Model of Atom', subject: 'Chemistry', unit: 'UNIT 2: ATOMIC STRUCTURE', topic: 'Quantum Mechanics', subtopic: 'Wave functions (Ψ, Ψ²)', page_number: 71 },
    { atom_id: 'ATOM_NEET_CHE_U02_003', atom_title: 'Orbitals and Quantum Numbers', subject: 'Chemistry', unit: 'UNIT 2: ATOMIC STRUCTURE', topic: 'Quantum Mechanics', subtopic: 'n, l, m, s, shapes of s,p,d', page_number: 71 },
    { atom_id: 'ATOM_NEET_CHE_U02_004', atom_title: 'Electronic Configuration Rules', subject: 'Chemistry', unit: 'UNIT 2: ATOMIC STRUCTURE', topic: 'Electronic Configuration', subtopic: 'Aufbau, Pauli, Hund', page_number: 71 },

    // CHEMISTRY - UNIT 4
    { atom_id: 'ATOM_NEET_CHE_U04_001', atom_title: 'First Law of Thermodynamics', subject: 'Chemistry', unit: 'UNIT 4: CHEMICAL THERMODYNAMICS', topic: 'Thermodynamics', subtopic: 'Internal energy, Enthalpy', page_number: 71 },
    { atom_id: 'ATOM_NEET_CHE_U04_002', atom_title: 'Second Law and Spontaneity', subject: 'Chemistry', unit: 'UNIT 4: CHEMICAL THERMODYNAMICS', topic: 'Thermodynamics', subtopic: 'Entropy (ΔS), Gibbs (ΔG, ΔG°)', page_number: 72 },

    // CHEMISTRY - UNIT 11
    { atom_id: 'ATOM_NEET_CHE_U11_001', atom_title: 'Potassium Dichromate and Permanganate', subject: 'Chemistry', unit: 'UNIT 11: d- and f- BLOCK ELEMENTS', topic: 'Transition Elements', subtopic: 'K₂Cr₂O₇, KMnO₄', page_number: 73 },

    // BIOLOGY - UNIT 4
    { atom_id: 'ATOM_NEET_BIO_U04_001', atom_title: 'Photosynthesis Phases', subject: 'Biology', unit: 'UNIT 4: PLANT PHYSIOLOGY', topic: 'Photosynthesis', subtopic: 'Photochemical & Biosynthetic', page_number: 77 },
    { atom_id: 'ATOM_NEET_BIO_U04_002', atom_title: 'C₃ and C₄ Pathways', subject: 'Biology', unit: 'UNIT 4: PLANT PHYSIOLOGY', topic: 'Photosynthesis', subtopic: 'Photorespiration', page_number: 78 },

    // BIOLOGY - UNIT 8
    { atom_id: 'ATOM_NEET_BIO_U08_001', atom_title: 'Common Human Diseases', subject: 'Biology', unit: 'UNIT 8: BIOLOGY AND HUMAN WELFARE', topic: 'Health and Disease', subtopic: 'Malaria, Typhoid, etc.', page_number: 79 },
    { atom_id: 'ATOM_NEET_BIO_U08_002', atom_title: 'Basic Concepts of Immunology', subject: 'Biology', unit: 'UNIT 8: BIOLOGY AND HUMAN WELFARE', topic: 'Health and Disease', subtopic: 'Vaccines, Cancer, AIDS', page_number: 79 }
  ];

  console.log(`Writing ${atoms.length} canonical atoms to mission_realms/${missionId}/syllabus_atoms...`);
  const batch = db.batch();
  const atomsRef = db.collection('mission_realms').doc(missionId).collection('syllabus_atoms');

  for (const atom of atoms) {
    const docRef = atomsRef.doc(atom.atom_id);
    batch.set(docRef, {
      ...atom,
      verification_status: 'verified_from_source',
      founder_approved: true,
      source_document_id: docId,
      source_sha256: '2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925',
      materialization_version: 'v1.0',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      created_by: 'ANTI_GRAVITY_SYLLABUS_END_TO_END_COMPLETION_ENGINEER'
    });
  }

  await batch.commit();
  console.log('Materialization SUCCESS.');
}

main().catch(console.error);
