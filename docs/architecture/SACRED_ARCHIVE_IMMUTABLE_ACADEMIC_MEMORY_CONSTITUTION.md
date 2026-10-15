# Sacred Archive Immutable Academic Memory Constitution

Architecture ID: `RC-SACRED-ARCHIVE-001`

The Sacred Archive is a server-side, append-only historical memory of qualified events emitted by existing canonical authorities. Current source authority remains the owner of current truth. The archive never creates or recalculates current rank, eligibility, mastery, retention, revision debt, recovery, taught status, answer correctness, or selection status.

Archive identity is deterministic over student, mission, source authority, source family, source event, and source version. Reprocessing the same source event is idempotent. A new attempt receives a distinct event identity. Corrections append a new event and link it to the preserved predecessor with `supersedes`/`supersededBy` lineage.

Canonical recorded time is server supplied; source occurrence time is retained separately. Provenance and recognized source authority are mandatory. Unknown authorities, missing provenance, client authorship, and unresolved policy fail closed. Mission, cohort, paper, stage, form, ranking policy, percentile semantics, and linkage context remain in the historical event payload and are never recomputed from later current state.

Student and Founder clients cannot author canonical archive truth. Client archive/history widgets are projections or legacy compatibility surfaces only; they are not canonical writers.
