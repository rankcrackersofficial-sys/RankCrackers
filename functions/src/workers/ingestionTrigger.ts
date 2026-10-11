/**
 * RETIRED: old founder_uploads ingestion trigger.
 *
 * This code formerly populated every incoming mission with hard-coded NEET
 * Cell Biology atoms and queued exam-specific DigiBook/Crucible drafts.
 * It is deliberately NOT a Firebase trigger and must not run for any mission.
 *
 * Canonical ingestion is exclusively the governed mission_realms source
 * pipeline. Historical source evidence remains intact in Git history.
 */
export const LEGACY_FOUNDER_UPLOAD_CONVEYOR_RETIRED = true as const;
