# FUP-2C-RX6H Pro Processor Contract Dry-Run

## Purpose
Define how the RX6G Pro verification queue will be processed safely later. RX6H does not call Pro AI and does not update queue/source/student data.

## RX6G Queue State
- Queue run: fup2c_rx6g_pro_queue_jee_main_2026_20260720080015
- Queue docs: 206
- Mathematics: 43
- Physics: 66
- Chemistry: 97
- HIGH: 0
- MEDIUM: 163
- LOW: 43

## Queue/Source Prerequisites
PASS

## Processor Selection Contract
Eligible pending docs: 206. RX6I pilot: first 10 Chemistry MEDIUM queue items.

## Future Pro Input Schema
Defined in JSON below. No credentials, no student personal data, no Founder private data, no VESTA/city context.

## Future Pro Result Schema
Future target: pro_verification_results/{resultId}. canAutoApprove=false and canPublish=false.

## Queue/Result Mutation Contract
Queue docs may later receive processing metadata only. Result docs may be created later. Source atom auto approval and publish are forbidden.

## Forbidden Automatic Source Atom Mutations
No verificationStatus VERIFIED, founderApproved true, studentTopicNodePublished true, topicNodePublished true, crucibleReady true, digibookReady true, or publishStatus PUBLISHED.

## Publish Lock / Student Safety Contract
PUBLISH_LOCK_PASS

## RX6I Tiny Pilot Recommendation
READY_FOR_RX6I_TINY_PRO_PILOT

## Risks
RX6I must remain tiny and explicitly authorized because it will be the first Pro AI call.

## Next Phase
FUP-2C-RX6I tiny Pro AI pilot for 10 Chemistry MEDIUM queue items, only after explicit approval.

## Full JSON

```json
{
  "queueRunId": "fup2c_rx6g_pro_queue_jee_main_2026_20260720080015",
  "prerequisites": {
    "queueDocs": 206,
    "subjectCounts": {
      "Mathematics": 43,
      "Physics": 66,
      "Chemistry": 97,
      "Unknown": 0
    },
    "priorityCounts": {
      "HIGH": 0,
      "MEDIUM": 163,
      "LOW": 43,
      "blocked": 0
    },
    "queueDefaults": {
      "pending": 206,
      "proPending": 206,
      "proAiCalledTrue": 0,
      "canPublishTrue": 0,
      "writeAllowedNowTrue": 0,
      "studentPublishAllowedTrue": 0,
      "atomStatusMutationAllowedTrue": 0
    },
    "source": {
      "exists": 206,
      "needsReview": 206,
      "founderApprovedTrue": 0,
      "studentTopicNodePublishedTrue": 0,
      "topicNodePublishedTrue": 0,
      "crucibleReadyTrue": 0,
      "digibookReadyTrue": 0
    },
    "result": "PASS"
  },
  "processorSelection": {
    "eligiblePendingQueueDocs": 206,
    "rx6iPilotSelectableCount": 10,
    "suggestedFirst10QueueItemIds": [
      "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_01789b3f53",
      "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_05f6787b6e",
      "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_0a0d548f0b",
      "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_0a1f621857",
      "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_0da591a0e9",
      "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_0e2ac78c6a",
      "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_122636da23",
      "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_155e53306f",
      "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_15b5ebfafb",
      "pvq_jee_main_2026_rx6d_chem_DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHE_16b37814e7"
    ],
    "first10SubjectSplit": {
      "Chemistry": 10
    },
    "first10PrioritySplit": {
      "MEDIUM": 10
    },
    "selectionVerdict": "SELECTION_CONTRACT_PASS"
  },
  "futureProInputSchema": {
    "schemaDefined": true,
    "sourceExcerptsIncluded": true,
    "credentialsIncluded": false,
    "unrelatedProjectContextIncluded": false,
    "schema": {
      "taskType": "SYLLABUS_ATOM_PRO_VERIFICATION",
      "missionId": "jee_main_2026",
      "queueItemId": "",
      "sourceAtomId": "",
      "subject": "",
      "title": "",
      "displayTitle": "",
      "parentAtomId": "",
      "parentTitle": "",
      "canonicalKey": "",
      "granularity": "",
      "hierarchyPath": "",
      "sourceDocumentId": "",
      "sourceTextExcerpt": "",
      "sourceTraceQuality": "",
      "expectedOutput": {
        "academicCorrectness": "",
        "granularityVerdict": "",
        "sourceAlignment": "",
        "parentChildValidity": "",
        "duplicateRisk": "",
        "studentClarity": "",
        "cruciblePlanningSuitability": "",
        "digibookSuitability": "",
        "recommendation": ""
      }
    },
    "verdict": "INPUT_SCHEMA_PASS"
  },
  "futureProResultSchema": {
    "targetCollection": "pro_verification_results",
    "schemaDefined": true,
    "canAutoApprove": false,
    "canPublish": false,
    "founderFinalReviewMandatory": true,
    "schema": {
      "resultId": "",
      "queueItemId": "",
      "queueRunId": "fup2c_rx6g_pro_queue_jee_main_2026_20260720080015",
      "sourceAtomId": "",
      "missionId": "jee_main_2026",
      "subject": "",
      "proRunId": "",
      "model": "",
      "status": "PRO_VERIFIED | PRO_REJECTED | PRO_NEEDS_HUMAN_REVIEW | PRO_UNCERTAIN",
      "academicCorrectness": "PASS | FAIL | UNCERTAIN",
      "granularityVerdict": "GOOD | TOO_BROAD | TOO_FRAGMENTED | UNCERTAIN",
      "sourceAlignment": "PASS | FAIL | WEAK | UNCERTAIN",
      "parentChildValidity": "PASS | FAIL | UNCERTAIN",
      "duplicateRisk": "LOW | MEDIUM | HIGH",
      "studentClarity": "GOOD | NEEDS_EDIT | POOR",
      "cruciblePlanningSuitability": "GOOD | NEEDS_REBALANCE | NOT_SUITABLE",
      "digibookSuitability": "GOOD | NEEDS_REBALANCE | NOT_READY",
      "confidence": 0,
      "issues": [],
      "recommendedFounderAction": "APPROVE | REJECT | SEND_BACK | REVIEW_REQUIRED",
      "canAutoApprove": false,
      "canPublish": false,
      "createdAt": ""
    },
    "verdict": "RESULT_SCHEMA_PASS"
  },
  "futureMutationContract": {
    "queueUpdatesAllowed": [
      "proAiCalled",
      "proVerificationStatus",
      "status",
      "proRunId",
      "resultId",
      "processedAt",
      "processingError"
    ],
    "resultDocsAllowed": [
      "create pro_verification_results/{resultId}"
    ],
    "sourceAtomAutoApprovalAllowed": false,
    "sourceAtomPublishAllowed": false,
    "topicNodesAllowed": false,
    "studentDeliveryAllowed": false,
    "verdict": "MUTATION_CONTRACT_PASS"
  },
  "publishLock": {
    "topicNodesWriteAllowedByProcessor": false,
    "studentMissionCatalogWriteAllowed": false,
    "publishAllowed": false,
    "canAutoApprove": false,
    "founderFinalReviewMandatory": true,
    "proVerifierCannotPublish": true,
    "proVerifierCannotApprove": true,
    "proVerifierCannotCreateCrucibleDigiBook": true,
    "verdict": "PUBLISH_LOCK_PASS"
  },
  "rx6iPilotReadiness": {
    "pilotSelectable": true,
    "maxPilotSize": 10,
    "suggestedSubject": "Chemistry",
    "suggestedPriority": "MEDIUM",
    "reason": "Chemistry has highest queue load and avg risk, first medium batch is subject-coherent.",
    "risk": "MEDIUM",
    "readinessVerdict": "READY_FOR_RX6I_TINY_PRO_PILOT"
  },
  "confirmations": {
    "noFirestoreWrite": true,
    "noQueueStatusUpdate": true,
    "noVerificationRunsWrite": true,
    "noProVerificationResultsWrite": true,
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
  "finalVerdict": "FUP_2C_RX6H_PROCESSOR_CONTRACT_READY"
}
```
