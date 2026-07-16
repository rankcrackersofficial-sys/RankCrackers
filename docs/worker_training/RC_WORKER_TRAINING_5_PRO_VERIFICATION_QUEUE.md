# RC-WORKER-TRAINING-5 — Pro Verification Queue Schema + Dry-Run Audit

## Purpose
Prepare the professional Pro verifier layer for RankCrackers worker outputs without running any Pro AI call or writing Firestore queue data.

## Why Pro Verification Is Needed
Fast workers can extract page text and draft structured outputs, but high-trust academic delivery needs another verification layer before Founder approval. The Pro verifier is designed to catch source mismatch, weak text, low confidence, duplication, and category-specific risk before anything can move toward student delivery.

## Fast Worker vs Pro Verifier
- Fast Worker: extracts or drafts data from official source documents.
- Pro Verifier: reviews selected worker outputs against source proof and risk policy.
- Founder: remains the final approving authority.

## Pro Verifier Permissions
- Can block unsafe output: yes
- Can publish to students: no
- Founder final approval required: yes

## Mandatory Categories
- syllabus
- PYQ
- notification
- answer_key
- cutoff
- result
- exam_rules
- low_confidence_output
- weak_or_empty_text
- duplicate_risk
- random_sample_per_run

## Output Schema
Required Pro verification output fields:

- verificationStatus
- riskScore
- issues
- sampledPages
- sourceAgreement
- recommendation
- verifiedAt
- verifierModel
- decision
- founderReviewRequired

## Risk Bands
- LOW: 0-20
- MEDIUM: 21-50
- HIGH: 51-80
- CRITICAL: 81-100

## Dry-Run Queue Behavior
WT5 only simulates the queue item that would later be created for Pro verification. It does not write to Firestore.

Dry-run sample:

- Document: hash_b18d5d608dda0a274eaa1bcaa4127e0ab7e49d2fd0e78840bd9c96707400960e
- Source run: WT4
- Pages: 16-24
- Category: notification
- Reasons: official_document, random_sample_per_run, new_extraction_batch
- Firestore writes: false

## Founder Final Approval Rule
The Pro verifier can recommend, block, or send back work, but it cannot publish. Founder final approval remains mandatory before any student-facing delivery.

## Why Pro Verifier Cannot Publish
Publishing directly from a verifier would bypass RankCrackers' authority chain. The safe chain is Fast Worker -> Pro Verifier -> Founder Review -> controlled publish.

## Future Implementation Phases
1. Create actual Firestore queue writers after schema approval.
2. Add Pro verifier execution in dry-run mode.
3. Add Pro verifier apply mode with strict confirmation.
4. Add Founder Review Queue dashboard.
5. Only after Founder approval, connect verified outputs to student delivery promotion.

## WT5 Safety Lock
- No extraction apply
- No Firestore write
- No Pro AI call
- No AI/OCR
- No deploy
- No live SAFE_AUTO scheduler
- No student delivery change
- No syllabus/topic_nodes change

## Verdict
RC_WORKER_TRAINING_5_PRO_VERIFICATION_DRY_RUN_READY