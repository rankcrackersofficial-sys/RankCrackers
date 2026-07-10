const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

const PROJECT_ID = 'rankcrackers-55';

function getAccessToken() {
  try {
    return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Authentication Error: Could not get gcloud access token. Ensure gcloud is logged in.', e.message);
    process.exit(1);
  }
}

function getField(data, keys, fallback = null) {
  for (const key of keys) {
    if (data && data[key] !== undefined && data[key] !== null && data[key] !== '') return data[key];
  }
  return fallback;
}

function textExists(val) {
  return val != null && String(val).trim().length > 0;
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH RC-X2 - ATOMIC LINKAGE INTEGRITY AUDIT');
  console.log('================================================================================');
  console.log('Mode: READ ONLY - auditing Syllabus, Crucible, DigiBook, and PYQ linkages');
  console.log('FOUNDER_VERIFICATION_REQUIRED_BEFORE_PUBLISH = true');

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  const missionSnap = await db.collection('mission_realms').get();

  let totalSyllabusAtoms = 0;
  let atomsWithSourceProof = 0;
  let atomsMissingSourceProof = 0;
  let verifiedAtoms = 0;
  let unverifiedAtoms = 0;

  let totalCrucibleItems = 0;
  let crucibleWithAtomLinks = 0;
  let crucibleBrokenLinks = 0;

  let totalDigibookUnits = 0;
  let digibookWithAtomLinks = 0;
  let digibookBrokenLinks = 0;

  let totalPyqItems = 0;
  let pyqWithSourceProof = 0;
  let pyqBrokenLinks = 0;

  const blockers = [];

  for (const missionDoc of missionSnap.docs) {
    const missionId = missionDoc.id;
    const missionRef = db.collection('mission_realms').doc(missionId);

    // 1. Load Syllabus Atoms
    const atomsSnap = await missionRef.collection('syllabus_atoms').get();
    const atomsMap = new Map();
    atomsSnap.forEach(d => {
      const data = d.data();
      const atomId = d.id;
      atomsMap.set(atomId, data);
      totalSyllabusAtoms++;

      const hasDocId = textExists(getField(data, ['source_document_id', 'sourceDocumentId']));
      const hasPageNum = getField(data, ['source_page_number', 'sourcePageNumber', 'page_number', 'pageNumber']) != null;
      const hasExcerpt = textExists(getField(data, ['source_text_excerpt', 'sourceTextExcerpt', 'sourceExcerpt', 'source_text']));

      const status = String(getField(data, ['verification_status', 'verificationStatus', 'status'], '')).toLowerCase();
      const isVerified = status.includes('verified') || data.verified === true || data.founderApproved === true || data.founder_approved === true;

      if (isVerified) {
        verifiedAtoms++;
      } else {
        unverifiedAtoms++;
        blockers.push(`SYLLABUS_ATOM_WITHOUT_VERIFICATION: Atom ${atomId} is unverified`);
      }

      if (hasDocId && hasPageNum && hasExcerpt) {
        atomsWithSourceProof++;
      } else {
        atomsMissingSourceProof++;
        if (!hasDocId && !hasPageNum && !hasExcerpt) {
          blockers.push(`ATOM_CREATED_MANUALLY_WITHOUT_SOURCE_PROOF: Atom ${atomId} has no source proof`);
        } else if (!hasPageNum) {
          blockers.push(`SYLLABUS_ATOM_WITHOUT_SOURCE_PAGE: Atom ${atomId} has no source page number`);
        }
      }

      // Check hierarchy
      const subject = getField(data, ['subject', 'subject_name', 'subjectName']);
      const paper = getField(data, ['paper', 'paper_name', 'paperName']);
      const section = getField(data, ['section', 'section_name', 'sectionName']);
      const topic = getField(data, ['topic', 'topic_name', 'topicName']);

      if (!subject || !paper || !section || !topic) {
        blockers.push(`SYLLABUS_ATOM_WITHOUT_HIERARCHY: Atom ${atomId} missing subject/paper/section/topic`);
      }
    });

    // 2. Load Crucible Days and Tests
    const daysSnap = await missionRef.collection('crucible_days').get();
    daysSnap.forEach(d => {
      const data = d.data();
      totalCrucibleItems++;
      const atomIds = data.study_atom_ids || data.studyAtomIds || data.atom_ids || data.atomIds || [];
      if (atomIds.length > 0) {
        crucibleWithAtomLinks++;
        atomIds.forEach(id => {
          if (!atomsMap.has(id)) {
            crucibleBrokenLinks++;
            blockers.push(`DIGIBOOK_OR_CRUCIBLE_LINK_BROKEN: Crucible Day ${d.id} references non-existent Atom ${id}`);
          } else {
            const atom = atomsMap.get(id);
            const atomStatus = String(getField(atom, ['verification_status', 'verificationStatus', 'status'], '')).toLowerCase();
            const atomVerified = atomStatus.includes('verified') || atom.verified === true;
            if (data.published === true && !atomVerified) {
              blockers.push(`PUBLISHED_ITEM_WITHOUT_VERIFIED_SOURCE_CHAIN: Published Day ${d.id} references unverified Atom ${id}`);
            }
          }
        });
      } else {
        blockers.push(`CRUCIBLE_ITEM_WITHOUT_ATOM_LINK: Crucible Day ${d.id} has no atom links`);
      }
    });

    const testsSnap = await missionRef.collection('crucible_tests').get();
    testsSnap.forEach(d => {
      const data = d.data();
      totalCrucibleItems++;
      const atomIds = data.covered_atom_ids || data.coveredAtomIds || [];
      if (atomIds.length > 0) {
        crucibleWithAtomLinks++;
        atomIds.forEach(id => {
          if (!atomsMap.has(id)) {
            crucibleBrokenLinks++;
            blockers.push(`DIGIBOOK_OR_CRUCIBLE_LINK_BROKEN: Crucible Test ${d.id} references non-existent Atom ${id}`);
          } else {
            const atom = atomsMap.get(id);
            const atomStatus = String(getField(atom, ['verification_status', 'verificationStatus', 'status'], '')).toLowerCase();
            const atomVerified = atomStatus.includes('verified') || atom.verified === true;
            if (data.published === true && !atomVerified) {
              blockers.push(`PUBLISHED_ITEM_WITHOUT_VERIFIED_SOURCE_CHAIN: Published Test ${d.id} references unverified Atom ${id}`);
            }
          }
        });
      } else {
        blockers.push(`CRUCIBLE_ITEM_WITHOUT_ATOM_LINK: Crucible Test ${d.id} has no atom links`);
      }
    });

    // 3. Load DigiBook Units
    const digibookSnap = await missionRef.collection('digibook_units').get();
    digibookSnap.forEach(d => {
      const data = d.data();
      totalDigibookUnits++;
      const atomId = data.atom_id || data.atomId;
      if (atomId) {
        digibookWithAtomLinks++;
        if (!atomsMap.has(atomId)) {
          digibookBrokenLinks++;
          blockers.push(`DIGIBOOK_OR_CRUCIBLE_LINK_BROKEN: DigiBook unit ${d.id} references non-existent Atom ${atomId}`);
        } else {
          const atom = atomsMap.get(atomId);
          const atomStatus = String(getField(atom, ['verification_status', 'verificationStatus', 'status'], '')).toLowerCase();
          const atomVerified = atomStatus.includes('verified') || atom.verified === true;
          if (data.published === true && !atomVerified) {
            blockers.push(`PUBLISHED_ITEM_WITHOUT_VERIFIED_SOURCE_CHAIN: Published DigiBook Unit ${d.id} references unverified Atom ${atomId}`);
          }
        }
      } else {
        blockers.push(`DIGIBOOK_UNIT_WITHOUT_ATOM_LINK: DigiBook unit ${d.id} has no atom link`);
      }
    });

    // 4. Load PYQs from question_bank
    const pyqSnap = await missionRef.collection('question_bank').get();
    pyqSnap.forEach(d => {
      const data = d.data();
      const isPyq = data.document_type === 'pyq' || data.documentType === 'pyq' || String(d.id).includes('pyq') || String(getField(data, ['category', 'type'], '')).toLowerCase().includes('pyq');
      if (isPyq) {
        totalPyqItems++;
        const hasDocId = textExists(getField(data, ['source_document_id', 'sourceDocumentId']));
        const hasPageNum = getField(data, ['source_page_number', 'sourcePageNumber', 'page_number', 'pageNumber']) != null;

        if (hasDocId && hasPageNum) {
          pyqWithSourceProof++;
        } else {
          blockers.push(`PYQ_ITEM_WITHOUT_SOURCE_PAGE: PYQ Question ${d.id} has missing source_document_id or source_page_number`);
        }

        const mappedAtoms = data.mapped_atom_ids || data.mappedAtomIds || [];
        mappedAtoms.forEach(id => {
          if (!atomsMap.has(id)) {
            pyqBrokenLinks++;
            blockers.push(`DIGIBOOK_OR_CRUCIBLE_LINK_BROKEN: PYQ Question ${d.id} maps to non-existent Atom ${id}`);
          }
        });
      }
    });
  }

  console.log('\n==============================================');
  console.log('ATOMIC LINKAGE SUMMARY REPORT');
  console.log('==============================================');
  console.log(`1. Total syllabus atoms audited: ${totalSyllabusAtoms}`);
  console.log(`2. Atoms with source proof: ${atomsWithSourceProof}`);
  console.log(`3. Atoms missing source proof: ${atomsMissingSourceProof}`);
  console.log(`4. Verified atoms: ${verifiedAtoms}`);
  console.log(`5. Unverified atoms: ${unverifiedAtoms}`);
  console.log(`6. Crucible items audited: ${totalCrucibleItems}`);
  console.log(`7. Crucible items with atom links: ${crucibleWithAtomLinks}`);
  console.log(`8. Crucible broken links: ${crucibleBrokenLinks}`);
  console.log(`9. DigiBook units audited: ${totalDigibookUnits}`);
  console.log(`10. DigiBook units with atom links: ${digibookWithAtomLinks}`);
  console.log(`11. DigiBook broken links: ${digibookBrokenLinks}`);
  console.log(`12. PYQ items audited: ${totalPyqItems}`);
  console.log(`13. PYQ items with source proof: ${pyqWithSourceProof}`);
  console.log(`14. PYQ broken links: ${pyqBrokenLinks}`);

  if (blockers.length > 0) {
    console.error('\nRC_X2_ATOMIC_LINKAGE_BLOCKED');
    console.error(`Total Blockers found: ${blockers.length}`);
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  } else {
    console.log('\nRC_X2_ATOMIC_LINKAGE_AUDIT_READY');
  }
}

main().catch(e => {
  console.error('\nRC_X2_ATOMIC_LINKAGE_BLOCKED');
  console.error(e);
  process.exit(1);
});
