# 🔱 RANKCRACKERS WORKER STATUS REPORT

## 1. scout_worker
- **Trigger**: pubsub.schedule('every 6 hours')
- **Input**: External Website Scans (RPSC, RSSB, SSC)
- **Output**: `ai_queue` (type: `scout_discovery`), `scout_downloads`
- **Status**: ONLINE
- **Duplicate Protection**: SHA256 hashing of URL + Title. Checks Queue, Drafts, and Downloads.
- **Error Handling**: Heartbeat update with error message.

## 2. sentinel_worker
- **Trigger**: `ai_queue/{taskId}` (status: `received` | `parsing`)
- **Input**: Raw files (PDF, Image, DOCX, XLSX, JSON)
- **Output**: `sentinel_drafts`, `ingestion_refinery` (status update), `ai_queue` (status: `classified`)
- **Status**: ONLINE
- **Duplicate Protection**: FileHash check in `sentinel_drafts`. Transaction-based queue locking.
- **Error Handling**: Moves task to `ai_failed_tasks`. Updates heartbeat.

## 3. structural_worker
- **Trigger**: `ai_queue/{taskId}` (type: `STRUCTURAL`)
- **Input**: Raw text from classification.
- **Output**: `semantic_units`, `transformation_lineage`, `ai_queue` (type: `SVO_EXTRACTION`)
- **Status**: ONLINE
- **Duplicate Protection**: Lineage check (inputId + workerId + promptVersion).
- **Error Handling**: Rule-based fallback segmenter if AI fails. Dead letter redirection.

## 4. svo_worker
- **Trigger**: `ai_queue/{taskId}` (type: `SVO_EXTRACTION`)
- **Input**: `semantic_units`
- **Output**: `atomic_facts`, `transformation_lineage`
- **Status**: ONLINE
- **Duplicate Protection**: Forensic Hashing of Subject + Predicate + Object + Context + Type.
- **Error Handling**: "Unknown" filter. Mandatory validation of Subject/Predicate.

## 5. promotion_worker
- **Trigger**: `sentinel_drafts/{draftId}` (status: `verified` | `published`)
- **Input**: Verified drafts.
- **Output**: `recruitments`, `micro_nodes`, `digibook_refinery`, `ai_queue` (manifestation)
- **Status**: ONLINE
- **Duplicate Protection**: Canonical ID generation (rec_org_exam_year).
- **Error Handling**: Severity-HIGH logging to founder activity ledger.

## 6. queue_cleanup_worker
- **Trigger**: pubsub.schedule('every 30 minutes')
- **Objective**: Reset stuck tasks or move to DLQ.
- **Policy**: 3 retries max.
- **Status**: ONLINE

## 7. alert_worker (founderCriticalAlert)
- **Trigger**: `ai_critical_alerts/{alertId}`
- **Objective**: Immediate notification of pipeline collapse.
- **Status**: OPERATIONAL
