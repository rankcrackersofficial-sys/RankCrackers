# FUP-2C-RX6F Pro Verification Queue Manifest Dry-Run

## Purpose
Prepare the exact dry-run manifest for future Pro verification queue docs for 206 RX6D syllabus atoms. No Firestore write, queue doc creation, Pro AI call, approval, or student publish happens in RX6F.

## RX6E Input Summary
- Mission: jee_main_2026
- RX6D run: fup2c_rx6d_live_jee_main_2026_20260720060432
- Total atoms: 206
- Mathematics: 43
- Physics: 66
- Chemistry: 97

## Queue Schema
Future collection: `pro_verification_queue`. Dry-run locks: `writeAllowedNow=false`, `canPublish=false`, `founderReviewRequired=true`, `status=PENDING_PRO_VERIFICATION`, `proVerificationStatus=PENDING`.

## Queue Item ID Policy
Format: `pvq_jee_main_2026_rx6d_<subjectCode>_<sourceAtomIdShort>_<hash>`

Verdict: QUEUE_ID_GATE_PASS

## Priority Rules
HIGH for blocked/weak/high-risk items, MEDIUM for Chemistry/Physics and conceptual items, LOW for clean low-risk items.

## Subject-wise Queue Load
| Subject | Queue Items | HIGH | MEDIUM | LOW | Avg Risk | Suggested Order |
| --- | --- | --- | --- | --- | --- | --- |
| Chemistry | 97 | 0 | 97 | 0 | 35 | 1 |
| Physics | 66 | 0 | 66 | 0 | 25 | 2 |
| Mathematics | 43 | 0 | 0 | 43 | 15 | 3 |

## Batch Plan
Suggested future batch size: 20. Total batches: 12. Pro AI called now: NO.

| Batch | Subject | Priority | Count | Reason |
| --- | --- | --- | --- | --- |
| 1 | Chemistry | MEDIUM | 20 | Chemistry_SYLLABUS_ATOM, RISK_MEDIUM, PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW |
| 2 | Chemistry | MEDIUM | 20 | Chemistry_SYLLABUS_ATOM, RISK_MEDIUM, PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW |
| 3 | Chemistry | MEDIUM | 20 | Chemistry_SYLLABUS_ATOM, RISK_MEDIUM, PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW |
| 4 | Chemistry | MEDIUM | 20 | Chemistry_SYLLABUS_ATOM, RISK_MEDIUM, PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW |
| 5 | Chemistry | MEDIUM | 17 | Chemistry_SYLLABUS_ATOM, RISK_MEDIUM, PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW |

## Founder Review Routing
| Subject | Queue Items | Avg Risk | Suggested Founder Review Mode |
| --- | --- | --- | --- |
| Chemistry | 97 | 35 | GROUPED_PARENT_REVIEW |
| Physics | 66 | 25 | BULK_LOW_RISK_REVIEW_AFTER_PRO_PASS |
| Mathematics | 43 | 15 | BULK_LOW_RISK_REVIEW_AFTER_PRO_PASS |

## Readiness Verdict
READY_FOR_PRO_QUEUE_WRITE

## Safety Locks
No Firestore write. No queue doc creation. No Pro AI call. No syllabus atom approval. No topic_nodes publish. No student delivery change.

## Recommended Next Phase
RX6G can write a limited Pro verification queue only after explicit Founder authorization.

## Full JSON

```json
{
  "runId": "fup2c_rx6d_live_jee_main_2026_20260720060432",
  "prerequisiteCheck": {
    "total": 206,
    "counts": {
      "Mathematics": 43,
      "Physics": 66,
      "Chemistry": 97,
      "Unknown": 0
    },
    "statuses": {
      "needsReview": 206,
      "founderFalse": 206,
      "studentTopicFalse": 206,
      "topicNodeFalse": 206,
      "requiresFounder": 206,
      "requiresPro": 206
    },
    "blocks": {
      "missingSource": 0,
      "missingParent": 0,
      "duplicateAtomIds": 0,
      "duplicateCanonicalKeys": 0,
      "crossSubjectParents": 0,
      "statusUnlocked": 0
    },
    "result": "PASS"
  },
  "queueManifest": {
    "generated": true,
    "futureTargetCollection": "pro_verification_queue",
    "proposedQueueItems": 206,
    "writeAllowedNow": false,
    "canPublish": false,
    "founderReviewRequired": true
  },
  "queueIdGate": {
    "proposedQueueIds": 206,
    "duplicateQueueIds": 0,
    "missingSourceAtomId": 0,
    "verdict": "QUEUE_ID_GATE_PASS"
  },
  "priorityAssignment": {
    "HIGH": 0,
    "MEDIUM": 163,
    "LOW": 43,
    "blocked": 0,
    "reasonSummary": "RX6F queue priority is stricter than RX6E risk split: Chemistry and Physics are sent MEDIUM for Pro verification ordering, while clean Mathematics remains LOW."
  },
  "subjectWiseQueueLoad": [
    {
      "Subject": "Chemistry",
      "Queue Items": 97,
      "HIGH": 0,
      "MEDIUM": 97,
      "LOW": 0,
      "Avg Risk": 35,
      "Suggested Order": 1
    },
    {
      "Subject": "Physics",
      "Queue Items": 66,
      "HIGH": 0,
      "MEDIUM": 66,
      "LOW": 0,
      "Avg Risk": 25,
      "Suggested Order": 2
    },
    {
      "Subject": "Mathematics",
      "Queue Items": 43,
      "HIGH": 0,
      "MEDIUM": 0,
      "LOW": 43,
      "Avg Risk": 15,
      "Suggested Order": 3
    }
  ],
  "batchPlan": {
    "suggestedBatchSize": 20,
    "totalBatches": 12,
    "first5Batches": [
      {
        "Batch": 1,
        "Subject": "Chemistry",
        "Priority": "MEDIUM",
        "Count": 20,
        "Reason": "Chemistry_SYLLABUS_ATOM, RISK_MEDIUM, PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW"
      },
      {
        "Batch": 2,
        "Subject": "Chemistry",
        "Priority": "MEDIUM",
        "Count": 20,
        "Reason": "Chemistry_SYLLABUS_ATOM, RISK_MEDIUM, PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW"
      },
      {
        "Batch": 3,
        "Subject": "Chemistry",
        "Priority": "MEDIUM",
        "Count": 20,
        "Reason": "Chemistry_SYLLABUS_ATOM, RISK_MEDIUM, PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW"
      },
      {
        "Batch": 4,
        "Subject": "Chemistry",
        "Priority": "MEDIUM",
        "Count": 20,
        "Reason": "Chemistry_SYLLABUS_ATOM, RISK_MEDIUM, PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW"
      },
      {
        "Batch": 5,
        "Subject": "Chemistry",
        "Priority": "MEDIUM",
        "Count": 17,
        "Reason": "Chemistry_SYLLABUS_ATOM, RISK_MEDIUM, PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW"
      }
    ],
    "subjectCoherent": true,
    "proAiCalled": false
  },
  "founderReviewRouting": [
    {
      "Subject": "Chemistry",
      "Queue Items": 97,
      "Avg Risk": 35,
      "Suggested Founder Review Mode": "GROUPED_PARENT_REVIEW"
    },
    {
      "Subject": "Physics",
      "Queue Items": 66,
      "Avg Risk": 25,
      "Suggested Founder Review Mode": "BULK_LOW_RISK_REVIEW_AFTER_PRO_PASS"
    },
    {
      "Subject": "Mathematics",
      "Queue Items": 43,
      "Avg Risk": 15,
      "Suggested Founder Review Mode": "BULK_LOW_RISK_REVIEW_AFTER_PRO_PASS"
    }
  ],
  "schemaPreview": [
    {
      "queueItemId": "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_365c8a9710",
      "missionId": "jee_main_2026",
      "sourceType": "syllabus_atom",
      "sourceCollection": "mission_realms/jee_main_2026/syllabus_atoms",
      "sourceAtomId": "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U01_T_8B08B474_CH001",
      "expansionRunId": "fup2c_rx6d_live_jee_main_2026_20260720060432",
      "subject": "Chemistry",
      "parentAtomId": "JEE_MAIN_2026_CHEM_U01_T_8b08b474",
      "title": "Matter and its nature, Dalton's atomic theory, Concept of atom, molecule, element and compound, Laws of chemical combination, Atomic and molecular masses, mole concept, molar mass, percentage composition, empirical and molecular formulae, Chemical equations and stoichiometry. - focused learning unit 11",
      "canonicalKey": "Chemistry::matter and its nature dalton s atomic theory concept of atom molecule element and compound laws of chemical combination atomic and molecular masses mole concept molar mass percentage composition empirical and molecular formulae chemical equations and stoichiometry focused learning unit 11",
      "sourceDocumentId": "hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      "sourceTraceQuality": "EXACT_PAGE_EXACT_TEXT",
      "priority": "MEDIUM",
      "riskScore": 35,
      "riskLevel": "MEDIUM",
      "reason": [
        "Chemistry_SYLLABUS_ATOM",
        "RISK_MEDIUM",
        "PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW"
      ],
      "status": "PENDING_PRO_VERIFICATION",
      "proVerificationStatus": "PENDING",
      "founderReviewRequired": true,
      "canPublish": false,
      "writeAllowedNow": false,
      "createdByPhase": "FUP_2C_RX6F_DRY_RUN_ONLY"
    },
    {
      "queueItemId": "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_01789b3f53",
      "missionId": "jee_main_2026",
      "sourceType": "syllabus_atom",
      "sourceCollection": "mission_realms/jee_main_2026/syllabus_atoms",
      "sourceAtomId": "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U01_T_8B08B474_CH002",
      "expansionRunId": "fup2c_rx6d_live_jee_main_2026_20260720060432",
      "subject": "Chemistry",
      "parentAtomId": "JEE_MAIN_2026_CHEM_U01_T_8b08b474",
      "title": "Matter and its nature, Dalton's atomic theory, Concept of atom, molecule, element and compound, Laws of chemical combination, Atomic and molecular masses, mole concept, molar mass, percentage composition, empirical and molecular formulae, Chemical equations and stoichiometry. - focused learning unit 74",
      "canonicalKey": "Chemistry::matter and its nature dalton s atomic theory concept of atom molecule element and compound laws of chemical combination atomic and molecular masses mole concept molar mass percentage composition empirical and molecular formulae chemical equations and stoichiometry focused learning unit 74",
      "sourceDocumentId": "hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      "sourceTraceQuality": "EXACT_PAGE_EXACT_TEXT",
      "priority": "MEDIUM",
      "riskScore": 35,
      "riskLevel": "MEDIUM",
      "reason": [
        "Chemistry_SYLLABUS_ATOM",
        "RISK_MEDIUM",
        "PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW"
      ],
      "status": "PENDING_PRO_VERIFICATION",
      "proVerificationStatus": "PENDING",
      "founderReviewRequired": true,
      "canPublish": false,
      "writeAllowedNow": false,
      "createdByPhase": "FUP_2C_RX6F_DRY_RUN_ONLY"
    },
    {
      "queueItemId": "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_c46adc14a8",
      "missionId": "jee_main_2026",
      "sourceType": "syllabus_atom",
      "sourceCollection": "mission_realms/jee_main_2026/syllabus_atoms",
      "sourceAtomId": "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U02_T_C2AFC301_CH001",
      "expansionRunId": "fup2c_rx6d_live_jee_main_2026_20260720060432",
      "subject": "Chemistry",
      "parentAtomId": "JEE_MAIN_2026_CHEM_U02_T_c2afc301",
      "title": "Nature of electromagnetic radiation, photoelectric effect, spectrum of the hydrogen atom, Bohr model of a hydrogen atom - its postulates, derivation of the relations for the energy of the electron and radii of the different orbits, limitations of Bohr's model, dual nature of matter, de Broglie's relationship, Heisenberg uncertainty principle, elementary ideas of quantum mechanics, the quantum mechanical model of the atom and its important features, concept of atomic orbitals as one-electron wave functions, variation of 𝐀 and 𝐀 2 with r for 1s and 2s orbitals, various quantum numbers (principal, angular momentum and magnetic quantum numbers) and their significance, shapes of s, p and d - orbitals, electron spin and spin quantum number, rules for filling electrons in orbitals – Aufbau principle, Pauli's exclusion principle and Hund's rule, electronic configuration of elements and extra stability of half-filled and completely filled orbitals. - focused learning unit 1",
      "canonicalKey": "Chemistry::nature of electromagnetic radiation photoelectric effect spectrum of the hydrogen atom bohr model of a hydrogen atom its postulates derivation of the relations for the energy of the electron and radii of the different orbits limitations of bohr s model dual nature of matter de broglie s relationship heisenberg uncertainty principle elementary ideas of quantum mechanics the quantum mechanical model of the atom and its important features concept of atomic orbitals as one electron wave functions variation of and 2 with r for 1s and 2s orbitals various quantum numbers principal angular momentum and magnetic quantum numbers and their significance shapes of s p and d orbitals electron spin and spin quantum number rules for filling electrons in orbitals aufbau principle pauli s exclusion principle and hund s rule electronic configuration of elements and extra stability of half filled and completely filled orbitals focused learning unit 1",
      "sourceDocumentId": "hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      "sourceTraceQuality": "EXACT_PAGE_EXACT_TEXT",
      "priority": "MEDIUM",
      "riskScore": 35,
      "riskLevel": "MEDIUM",
      "reason": [
        "Chemistry_SYLLABUS_ATOM",
        "RISK_MEDIUM",
        "PRO_VERIFICATION_BEFORE_FOUNDER_REVIEW"
      ],
      "status": "PENDING_PRO_VERIFICATION",
      "proVerificationStatus": "PENDING",
      "founderReviewRequired": true,
      "canPublish": false,
      "writeAllowedNow": false,
      "createdByPhase": "FUP_2C_RX6F_DRY_RUN_ONLY"
    }
  ],
  "queueWriteReadiness": "READY_FOR_PRO_QUEUE_WRITE",
  "confirmations": {
    "noFirestoreWrite": true,
    "noProVerificationQueueWrite": true,
    "noVerificationRunsWrite": true,
    "noSyllabusAtomsWrite": true,
    "noAtomApproval": true,
    "noTopicNodesPublish": true,
    "noStudentDeliveryChange": true,
    "noAiOrOcr": true,
    "noProAiCall": true,
    "noExtractionApply": true,
    "noDeploy": true,
    "noCrucibleGeneration": true,
    "noDigiBookGeneration": true,
    "noVestaCityTouch": true
  },
  "finalVerdict": "FUP_2C_RX6F_QUEUE_MANIFEST_READY"
}
```
