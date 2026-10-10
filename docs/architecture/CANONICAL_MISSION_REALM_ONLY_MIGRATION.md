# Canonical Mission Realm — Migration and Reset Report

Date: 2026-10-10

## Decision

`mission_realms/{missionId}` is now the only canonical mission document.
Its document ID is the permanent `missionId`, and every cycle or official
source document remains below that same hierarchy:

```text
mission_realms/{missionId}
├── cycles/{cycleKey}
├── official_documents/{documentId}
├── syllabus_atoms/{atomId}
├── pyq_archives/{archiveId}
└── ... governed mission subcollections
```

The old top-level collections are not alternate mission sources anymore:

- `recruitments/{missionId}` — legacy projection, no longer written by the
  live mission UI or callable lifecycle path.
- `student_mission_catalog/{missionId}` — legacy student projection, no longer
  read by the student mission stream and no longer written by live creation.
- `sentinel_drafts/{draftId}` and `notification_candidates/{id}` — staging and
  review records, not mission inventory. They become mission evidence only
  after governed publication into `mission_realms/{missionId}/official_documents`.

## What was changed

1. Student discovery, onboarding, Founder inventory, document command center,
   readiness panels, variables, opportunities, and mission counters now read
   `mission_realms`.
2. Mission creation creates one permanent realm and its cycle. It does not
   create recruitment/catalog shells.
3. Cycle publication updates the selected cycle and the canonical realm only.
4. Founder lifecycle, result declaration, and variable updates write only the
   canonical realm.
5. Publishing a linked notification now finalizes an official document at
   `mission_realms/{linkedRealmId}/official_documents/{sourceId}` and updates
   the realm's notification linkage. No parallel mission document is created.
6. Firestore rules allow student reads only for visible canonical realms and
   deny client writes to both legacy collections. Founder reads remain
   available temporarily for migration census.
7. The old emulator fixture and its seeder were removed, so a stale
   three-mission snapshot cannot silently override the live source.

## Why the counts previously disagreed

The old implementation combined three collections in the Founder inventory.
The project also contained a stale emulator/export fixture with three missions,
while an academic reconciliation document described fifteen mission families.
The website's reported eighteen therefore could not be treated as one database
count. The canonical count must now be the number of documents returned from
`mission_realms`, filtered by the canonical visibility gate for student views.

## 2026-10-10 mismatch forensic finding

The live Founder screen showed two different answers because the deployed web
artifact was not the same revision as this checkout. Its inventory cards showed
18 records, while the top scope widget showed 17. The checked-out source did
not contain that older `TOTAL MISSIONS / CENTRAL REALMS / STATE REALMS /
UT REALMS` widget at all. This proves the 17 counter was an older deployed
aggregate path, not a second valid count of the current 18-card snapshot.

The fix is now explicit: the Founder inventory subscribes once to
`mission_realms`, builds the card list and all scope counters from that same
snapshot, and fails if the bucket invariant is not exhaustive:

```text
TOTAL = CENTRAL + STATE + UT + UNCLASSIFIED
```

The repository guard also blocks the retired recruitment engine, student
catalog seeder, old platform audit, and stale three-mission emulator fixture.
They were removed so a future audit, test harness, or manual seed cannot bring
the discarded three-mission inventory back into the project.

## Reset procedure

The reset is deliberately guarded and was not run automatically by this code
change. First run a read-only census from the Functions environment:

```text
node functions/canonical_mission_realm_reset.js
```

For a complete backup including mission subcollections, run:

```text
node functions/canonical_mission_realm_reset.js --full-backup
```

After verifying the Firebase project ID, the saved JSON backup, and the
mission list, a full destructive reset requires both flags and the exact
confirmation token:

```text
node functions/canonical_mission_realm_reset.js --apply --delete-realms CONFIRM_CANONICAL_MISSION_REALM_RESET
```

This deletes `mission_realms` recursively, including cycles, official
documents, syllabus atoms, PYQ archives, and participant history. It also
deletes both legacy root collections. The script never deletes Cloud Storage
files, source PDFs outside Firestore, audit logs, or user accounts; those must
be handled as a separate, explicitly reviewed cleanup.

If only the duplicate projections need removal while canonical missions are
kept, use `--apply` without `--delete-realms` after the same backup review.

## Risks and controls

| Risk | Control |
|---|---|
| Wrong Firebase project | Verify `admin.app().options.projectId` before `--apply`. |
| Irrecoverable Firestore data | Apply requires an exact token and writes a JSON census; use `--full-backup` first. |
| Orphaned subcollections | Full reset uses recursive deletion. |
| Student cards disappearing | Student visibility comes only from `mission_realms.visibilityGate` and top-level visibility flags. |
| Old code recreating duplicates | Live Dart readers and callable mission writers no longer target the legacy collections; rules deny client writes. |
| Historical scripts still mention old paths | They are retained as audit/migration history and are not part of the live mission pipeline. |

## Acceptance checks

After deployment and reset, the following must all be true:

1. `mission_realms` is the only collection counted in Founder inventory.
2. `recruitments` and `student_mission_catalog` contain zero root documents,
   unless an explicitly approved migration snapshot is being retained outside
   the production project.
3. A newly created mission creates exactly one
   `mission_realms/{missionId}` root and its selected cycle.
4. A finalized notification appears only at
   `mission_realms/{missionId}/official_documents/{documentId}`.
5. Student and Founder mission counts agree when using the same visibility
   filter; no fixture or fallback count is used.

## Validation performed

- Canonical store unit test: passed.
- Cycle-store contract suite: 31/31 passed.
- Cycle-publication suite: 12/12 passed.
- Source-impact suite: 11/11 passed.
- JavaScript syntax checks: passed for all changed backend modules.
- Dart formatter: passed for all changed Dart files.
- Dart analyzer could not complete in this checkout because package
  resolution for `flutter_lints` stalled without producing diagnostics; the
  source was still formatter-validated and deployment should rerun analyzer
  after dependencies are restored.
- The live Firestore census was not executed from this checkout because the
  local Functions dependency `firebase-admin` is not installed. Therefore no
  production deletion was attempted and the website's live count remains to
  be verified by running the guarded census in the deployed Functions
  environment.
- The Firebase callable integration runner was not executed because the local
  Functions dependency `firebase-functions` is also absent; the pure backend
  contract suites remain green.
