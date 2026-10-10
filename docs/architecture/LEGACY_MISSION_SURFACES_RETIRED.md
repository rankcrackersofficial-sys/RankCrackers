# Retired Mission Surfaces

Date: 2026-10-10

`mission_realms/{missionId}` is the only mission authority. The following
surfaces are retired and must not be restored:

- `recruitments/{missionId}`
- `student_mission_catalog/{missionId}`
- the old recruitment auto-creation worker
- the old student-catalog backfill/readiness seeders
- the stale three-mission emulator inventory

The canonical boundary audit (`node functions/audit_canonical_mission_boundary.js`)
fails when a retired file is present, when a known runtime file targets either
retired collection, or when the materializer is invoked without
`canonicalOnly: true`.

The staged-state guard separately blocks commits that attempt to re-add the
retired filenames. Historical documents may mention the old collections for
forensic context, but they are not deployable runtime authority and cannot be
used as an inventory source.

The live 18-versus-17 discrepancy was caused by a deployed-build/source
divergence: the 18-card inventory and the 17-item scope aggregate came from
different revisions and different count paths. After the corrected web build
is deployed, both must be derived from the same `mission_realms` snapshot.
