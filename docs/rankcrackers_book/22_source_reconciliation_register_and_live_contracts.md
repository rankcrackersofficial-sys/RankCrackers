# Volume I — Source Reconciliation Register & Live Contract Notes

**Document role:** Canonical cross-chapter evidence register and long-form correction appendix  
**Audit date:** 10 October 2026 (IST)  
**Status:** `WORKING MANUSCRIPT — SOURCE RECONCILIATION BATCH 02`  
**Authority:** Chief Author audit order, Chapter 21  

यह appendix उस अंतर को बंद करने के लिए जोड़ा गया है जो narrative manuscript और वर्तमान repository के बीच था। इसका नियम सरल है: कोई path केवल इसलिए live नहीं माना जाएगा क्योंकि वह पुराने chapter में लिखा है। प्रत्येक path को current checkout में existence check, symbol search और relevant line-range readback से मिलाया गया है। जहाँ replacement उपलब्ध नहीं है, वहाँ पुराने नाम को verified code की तरह दोहराने के बजाय `UNRESOLVED`, `HISTORICAL` या `PROPOSED` status दिया गया है।

## 1. Verification vocabulary

| Status | अर्थ | पुस्तक में उपयोग |
|---|---|---|
| `VERIFIED` | वर्तमान checkout में file और symbol/behaviour readback से मिला | Current implementation के रूप में लिखा जा सकता है |
| `CORRECTED` | पहले का path/symbol गलत था; live replacement मिल गया | पुराने claim और नए evidence का संबंध स्पष्ट करें |
| `UNRESOLVED` | पुराने claim का current replacement नहीं मिला | इसे implementation नहीं, open evidence gap लिखें |
| `HISTORICAL` | पुरानी architecture या prior draft का नाम | केवल migration/history context में |
| `PROPOSED` | भविष्य की design या intended contract | current behaviour से visually अलग |

Line ranges snapshot evidence हैं, API guarantee नहीं। Source बदलने पर register को दोबारा चलाना होगा। `functions/index.js` को deployed entry point और `functions/src/index.ts` को अलग TypeScript worker tree मानना होगा; दोनों को एक ही export surface नहीं माना जा सकता।

## 2. Corrected source-claim ledger

नीचे work order में सूचीबद्ध stale references का complete batch register है। `Written path` वह नाम है जो पुराने manuscript में था; `Live path / symbol` current source से निकला replacement है।

| Claim ID | Chapter / location | Written path | Live path / symbol | Line range | Status | Evidence note |
|---|---|---|---|---:|---|---|
| `RC-08-001` | Ch 08 §11.11 | `lib/core/services/firestore_service.dart` | `lib/core/firebase/firestore_service.dart::FirestoreService.saveUserProfile` | 742–750 | `CORRECTED` | Profile write uses `users/{uid}.set(..., merge:true)`; old directory absent. |
| `RC-09-001` | Ch 09 §16.3 | `lib/core/battle/battle_engine.dart` | `lib/features/crucible/core/battle_engine.dart::BattleEngine.getPriorityNode` | 68–96 | `CORRECTED` | Actual input is `MicroTopicNode` plus `NodeRuntimeState`; optional `riskFactor` defaults to `0.0`. |
| `RC-13-001` | Ch 13 §11.2 | `lib/web/founder/repository/command_center_repository.dart` | `lib/features/admin/data/repositories/health_repository.dart::getSystemHealth`, `toggleAiSystem` | 27–31, 61–110 | `CORRECTED` | No founder repository directory was found; live UI uses admin health repository and callable names. |
| `RC-13-002` | Ch 13 §11.3 | `lib/web/founder/repository/command_center_repository.dart` | `lib/web/founder/mission_control/founder_mission_inventory.dart::FounderMissionInventory._reconcile` | 47–53, 153–182 | `CORRECTED` | Current method reconciles three query snapshots in memory; it is not a `toggleWorker` write service. |
| `RC-13-003` | Ch 13 §11.4 | `lib/web/founder/outcomes/outcome_verification_center.dart` | `lib/features/admin/presentation/widgets/review_queue/outcome_verification_center.dart` | 103–175, 355–356, 499–505 | `CORRECTED` | Review actions invoke `handleSentinelAction`; old web path was stale. |
| `RC-13-004` | Ch 13 §11.5 | `lib/web/founder/missions/founder_mission_inventory.dart` | `lib/web/founder/mission_control/founder_mission_inventory.dart` | 7–182, 364–431 | `CORRECTED` | Directory is `mission_control`; local `_reconcile` returns inventory rows, not a backend `ReconciliationReport`. |
| `RC-13-005` | Ch 13 §11.7 | `functions/src/founder/admin_claims.ts` | `functions/callable/manage_access.js::manageUserAccess`, wired by `functions/index.js` | 10–80; 11–26 | `CORRECTED` | Live access callable checks auth, founder/admin claims and `ensureFounderClaims`. |
| `RC-13-006` | Ch 13 §11.8 | `functions/src/founder/forensic_purge.ts` | `functions/callable/handle_sentinel_action.js` purge branch; `functions/services/audit_service.js::logFounderActivity` | 164–222; 8–18 | `CORRECTED / SCOPED` | No separate forensic purge module exists. Current evidence is limited to the callable branch and its audit helper. |
| `RC-14-001` | Ch 14 §11.5 | `lib/core/services/firestore_service.dart` | `lib/core/firebase/firestore_service.dart::saveUserProfile` | 742–750 | `CORRECTED` | Correct Firebase service location. |
| `RC-14-002` | Ch 14 §11.6 | `lib/core/services/firestore_service.dart` | `lib/core/firebase/firestore_service.dart::streamProtocolState` | 230–238 | `CORRECTED` | User-scoped protocol stream reads `users/{uid}/{protocolCollection}/{recruitmentId}`. |
| `RC-14-003` | Ch 14 §11.7 | `lib/core/services/firestore_service.dart` | `lib/core/firebase/firestore_service.dart::streamSchedules` | 252–259 | `CORRECTED` | Schedule stream filters by `recruitmentId` and orders by `scheduleIndex`. |
| `RC-14-004` | Ch 14 §11.8 | `functions/src/audit/founder_logger.ts` | `functions/services/audit_service.js::logFounderActivity` | 8–18 | `CORRECTED` | JavaScript helper is live; retry/immutability claims require separate evidence. |
| `RC-15-001` | Ch 15 §8.1 | `test/canonical_reconciliation_emulator.js` | `functions/test/canonical_reconciliation_emulator.js` | 7 | `CORRECTED` | Current runner lives under `functions/test`. |
| `RC-15-002` | Ch 15 §8.1 | `test/mission_lifecycle_emulator_roundtrip.js` | `functions/test/mission_lifecycle_emulator_roundtrip.js` | 1–119 | `CORRECTED` | Current runner exports `EXPECTED` and `guard`; it is not in repository-root `test/`. |
| `RC-15-003` | Ch 15 §8.1 | `test/realEmulatorE2EWorkerProof.test.ts` | `functions/src/test/realEmulatorE2EWorkerProof.test.ts` | 28–185 | `CORRECTED` | Jest suite contains emulator claim, lease, retry, idempotency and fail-closed tests. |
| `RC-15-004` | Ch 15 §9.1 | `functions/callables/manage_user_access.js` | `functions/callable/manage_access.js::manageUserAccess` | 10–96 | `CORRECTED` | Directory is singular `callable`; filename is `manage_access.js`. |
| `RC-15-005` | Ch 15 §9.2 | `functions/callables/toggle_ai_system.js` | `functions/callable/toggle_ai_system.js::toggleAiSystem` | 8–26 | `CORRECTED` | Callable writes `system_config/global.aiEnabled` and calls audit helper. |
| `RC-15-006` | Ch 15 §9.3 | `functions/callables/get_system_health.js` | `functions/callable/system_health.js::getSystemHealth` | 8–72 | `CORRECTED` | Live callable checks admin/founder claims and performs health read/write diagnostics. |
| `RC-15-007` | Ch 15 §9.4 | `functions/callables/process_ai_task.js` | `functions/callable/process_ai_task.js::processAITask` | 11–63 | `CORRECTED` | Live function checks admin auth, AI enablement and budget before Gemini processing. |
| `RC-15-008` | Ch 15 §9.5 | `functions/callables/get_secure_asset_url.js` | `functions/callable/secure_download.js::getSecureAssetUrl` | 8–71 | `CORRECTED` | Live input names are `assetUrl`, `realmId`, `assetType`; old input contract was not evidence-backed. |
| `RC-15-009` | Ch 15 §9.7 | `functions/callables/handle_sentinel_action.js` | `functions/callable/handle_sentinel_action.js::handleSentinelAction` | 164–222 | `CORRECTED` | Singular directory; 1,177-line callable contains multiple action branches. |
| `RC-15-010` | Ch 15 §9.8 | `functions/callables/handle_mission_action.js` | `functions/callable/handle_mission_action.js::handleMissionAction` | 8–90 | `CORRECTED` | Live inputs begin with `action`, `realmId`, `payload`. |
| `RC-16-001` | Ch 16 §8.1 | `scripts/audit_repo_head_freeze_guard.js` | `functions/audit_repo_head_freeze_guard.js` | 1–46 | `CORRECTED` | Gate script is in `functions/`, not `scripts/`. |
| `RC-16-002` | Ch 16 §8.2 | `scripts/verify_48ui8.js` | `verify_48ui8.js` | 1–343 | `CORRECTED` | Script is repository-root. |
| `RC-16-003` | Ch 16 §8.3 | `lib/core/backend/firebase_emulator_config.dart` | `lib/core/firebase/firebase_emulator_config.dart::configureFirebaseEmulatorsFromDartDefines` | 57–95 | `CORRECTED` | Current config validates release/debug mode and auth/firestore ports; it does not configure Functions emulator. |
| `RC-16-004` | Ch 16 §8.7 | `test/canonical_reconciliation_emulator.js` | `functions/test/canonical_reconciliation_emulator.js` | 7 | `CORRECTED` | Same test path correction as RC-15-001. |
| `RC-16-005` | Ch 16 §9 | `web/main.dart.js` | Generated `build/web/main.dart.js`; source `lib/main_web.dart` | generated after build | `CORRECTED / GENERATED` | `web/main.dart.js` is not a current source path. Never cite generated output as source evidence. |
| `RC-18-001` | Ch 18 §14.3 | `lib/core/utils/math_renderer_util.dart` | `lib/shared/widgets/formatted_math_text.dart` | source readback required | `CORRECTED / REGISTERED` | Old utility is absent; replacement is the observed formatting widget. |
| `RC-18-002` | Ch 18 §14.3 | `lib/core/utils/security_hasher.dart` | Inline hashing in telemetry code; no standalone replacement | — | `UNRESOLVED / REGISTERED` | Do not invent a reusable `SecurityHasher` symbol. |
| `RC-18-003` | Ch 18 §14.3 | `lib/core/utils/string_utils.dart` | No dedicated replacement found | — | `UNRESOLVED / REGISTERED` | Generic string helpers are inline/Dart core. |
| `RC-18-004` | Ch 18 §14.3 | `lib/core/widgets/paywall/tactical_paywall_overlay.dart` | `lib/core/widgets/paywall/premium_paywall_widget.dart` | file exists | `CORRECTED / REGISTERED` | Paywall directory contains the premium widget. |
| `RC-18-005` | Ch 18 §14.3 | `lib/core/authority/founder_authority.dart` | `lib/core/constants/founder_identity.dart::FounderIdentity.isFounderUser` | source readback required | `CORRECTED / REGISTERED` | Founder identity is held in constants, not authority directory. |
| `RC-18-006` | Ch 18 §14.3 | `lib/core/authority/authority_boundary_guard.dart` | No standalone guard; router/AuthGate checks | — | `UNRESOLVED / REGISTERED` | Keep as absent historical label. |
| `RC-18-007` | Ch 18 §14.3 | `lib/core/storage/local_vault.dart` | `lib/core/storage/token_storage.dart`, `local_storage_service.dart` | file inventory | `CORRECTED / REGISTERED` | Current storage is split; no `LocalVault` class asserted. |
| `RC-18-008` | Ch 18 §14.3 | `lib/core/services/sound_service.dart` | No dedicated sound service found | — | `UNRESOLVED / REGISTERED` | Do not imply an audio engine. |
| `RC-18-009` | Ch 18 §14.3 | `lib/core/services/haptic_feedback_service.dart` | Inline Flutter `HapticFeedback` call sites | search evidence | `CORRECTED / REGISTERED` | No standalone service file. |
| `RC-18-010` | Ch 18 §14.3 | `lib/core/notifications/notification_service.dart` | `lib/core/notifications/notification_engine.dart`, `lib/core/services/sentinel_notification_service.dart` | file inventory | `CORRECTED / REGISTERED` | Notification functionality is split across live files. |
| `RC-19-001` | Ch 19 §11.7 | `functions/src/assessment/verification.ts` | No current replacement found | — | `UNRESOLVED / HISTORICAL` | `SolutionVerificationRecord.computeSha256` is not a live verified symbol. |
| `RC-20-001` | Ch 20 §9 | `functions/src/assessment.ts` | `functions/workers/evaluate_attempt_worker.js::createAttemptSession`, `evaluateAttempt` | 9–55, 57–217 | `CORRECTED` | Actual worker lives in JavaScript workers directory. It uses an existing-result guard and a Firestore batch commit for attempt/evidence/outbox writes; no transactionally closed exactly-once guarantee is claimed. |
| `RC-20-002` | Ch 20 §9 | `functions/src/admin.ts` | `functions/callable/manage_access.js`, `toggle_ai_system.js` | 8–96; 8–26 | `CORRECTED` | Admin callable topology is flat JavaScript. |
| `RC-20-003` | Ch 20 §9 | `functions/src/health.ts` | `functions/callable/system_health.js` | 8–72 | `CORRECTED` | Health callable mapped to live file. |
| `RC-20-004` | Ch 20 §9 | `functions/src/assets.ts` | `functions/callable/secure_download.js` | 8–71 | `CORRECTED` | Secure asset URL callable mapped to live file. |
| `RC-20-005` | Ch 20 §9 | `functions/src/triggers.ts` | No current replacement found | — | `UNRESOLVED / HISTORICAL` | Former trigger aggregate file is absent. |
| `RC-20-006` | Ch 20 §9 | `functions/src/workers.ts` | `functions/src/workers/` directory and `functions/index.js` exports | index 1–63 | `CORRECTED / SCOPED` | Worker topology is distributed; no aggregate `workers.ts` file exists. |
| `RC-20-007` | Ch 20 §11 | `scripts/run_emulators.sh` | `functions/package.json::serve` (`firebase emulators:start --only functions`) | package script | `CORRECTED` | Shell script absent; package command is live. |
| `RC-20-008` | Ch 20 §11 | `scripts/seed_fixtures.py` | No current replacement found | — | `UNRESOLVED / HISTORICAL` | `functions/fixtures/` exists, but the former Python seeder does not. |

## 3. Actual backend topology

### 3.1 Deployed entry point

`functions/package.json` declares `"main": "index.js"`. The live JavaScript entry point is therefore `functions/index.js`. It imports callable modules from the singular `functions/callable/` directory and exports names such as `manageUserAccess`, `toggleAiSystem`, `getSystemHealth`, `processAITask`, `handleSentinelAction`, `handleMissionAction` और `getSecureAssetUrl`. A book reader can verify the public name in `index.js`, then follow the `require()` into the callable file, and finally read the `exports.<name>` definition.

`functions/src/index.ts` is a separate TypeScript worker export surface. It exports `queueWorker`, `storageTrigger`, `ingestionTrigger`, `aafQueueWorker`, syllabus lifecycle workers, canonical reconciliation workers and test-arena scoring workers. It does not export the callable set described above. This distinction matters for deployment and for documentation: a TypeScript worker path must not be substituted into a JavaScript callable contract merely because both sit below `functions/`.

### 3.2 Callable request chain

The verified founder AI-toggle path is a compact example of the full chain:

`SystemVitals UI → HealthRepository.toggleAiSystem(bool) → FirebaseFunctions.httpsCallable('toggleAiSystem') → functions/index.js export → functions/callable/toggle_ai_system.js → auth/claim check → system_config/global write → logFounderActivity`.

The UI/repository edge is not the security boundary. A forged client can call the network endpoint, so the callable must re-check `context.auth` and the founder claim. The live callable does that before writing `aiEnabled`. The result is `{ success: true }` on success; exception behaviour is represented by Firebase callable errors and transport failure, not by an invented `status: 'success'` contract.

The verified secure-download chain is similarly:

`DigiBook/asset caller → getSecureAssetUrl(assetUrl, realmId, assetType) → auth check → input validation → Storage path resolution → object existence check → time-limited signed URL → access audit`.

The current code accepts the URL-oriented field names shown above. The former `assetId, guId` claim is not copied into this book as if it were current. If the client uses a different payload in a future revision, the callable and client caller must be audited together.

## 4. Long-form workflow evidence notes

### 4.1 Student profile persistence

The profile workflow begins in `UnifiedIdentityScreen`, but the persistence boundary is `FirestoreService.saveUserProfile`. The method receives a required UID and a dynamic profile map, then writes to `users/{uid}` with `SetOptions(merge: true)`. Merge semantics mean unrelated fields are retained; they do not by themselves prove that privileged fields are safe. The rules layer remains the authorization boundary and must be read alongside this method.

The observable state chain is therefore: form controllers collect name/mobile/state/consent; submit validation decides whether the CTA may proceed; the service call awaits Firestore; success allows local session completion; failure must leave the saving state and user-visible error path consistent with the screen implementation. The manuscript must not claim a four-second timeout unless the caller actually wraps the future with that timeout. The current service method itself does not establish that number.

### 4.2 Protocol and schedule streams

`streamProtocolState(uid, recruitmentId)` is a user-scoped document listener. A missing document maps to `null` through `snap.exists ? ... : null`, so an empty state is semantically different from a network error. `streamSchedules(recruitmentId)` queries the schedule collection, filters by recruitment ID, orders by `scheduleIndex`, and maps each document to `CrucibleSchedule`. The long-form chapter should explain all three states separately: data available, no matching document/rows, and stream error. “Automatic reconnect” should only be used when the SDK/runtime behaviour is explicitly cited; the service method itself does not implement a custom retry loop.

### 4.3 Dashboard priority selection

`BattleEngine.getPriorityNode` is synchronous and in-memory. It first removes completed nodes, returns `null` for an empty active set, then scores each remaining node using mastery, importance, difficulty, revision level and an optional risk stabilization bonus. The score is not a backend mutation, does not fetch a question pool, and does not prove that a chosen question is human-verified. That publication property belongs to the content-governance path and must not be smuggled into the selection algorithm description.

`generateWeaknessCombat` is a separate method. It receives weak nodes, runtime states, a `DigiBookContent` map and optional risk facts. When targeted facts are present it composes a targeted/breadth set; when absent it falls back to an easy/medium node pool. The fallback is local list selection, not a network retry. This distinction is now reflected in Chapter 19.

### 4.4 Founder mission inventory

`FounderMissionInventory._reconcile` is a presentation-side reconciliation function. It joins snapshots by document ID and derives a filter classification such as live, draft, passive or archived. It is useful for showing a founder a cross-collection inventory, but it is not proof that a backend repair transaction ran. The actual mutation path is the `handleSentinelAction` callable invoked by buttons in the mission-control UI. A professional description must show both halves: read-side discrepancy display and write-side authorized action.

### 4.5 Emulator configuration

`configureFirebaseEmulatorsFromDartDefines` reads `RC_USE_FIREBASE_EMULATOR`, `RC_FIREBASE_EMULATOR_HOST`, `RC_FIREBASE_AUTH_EMULATOR_PORT` and `RC_FIRESTORE_EMULATOR_PORT`. It rejects emulator mode in release builds, rejects empty hosts and rejects non-positive ports. It configures Auth and Firestore only. The current function does not configure a Functions emulator, so the previous three-port claim (Auth, Firestore, Functions) has been narrowed. A future chapter may document Functions emulator wiring only after a live source or command confirms it.

### 4.6 Evidence excerpts

निम्न snippets current checkout से verbatim छोटा excerpt हैं। इनके उद्देश्य contract को समझाना है, न कि पूरी source file को appendix में duplicate करना।

#### Profile write — `lib/core/firebase/firestore_service.dart:742–750`

```dart
static Future<void> saveUserProfile({
  required String uid,
  required Map<String, dynamic> profileData,
}) async {
  // Personal profile setup must not write privileged role fields from client.
  await _firestore
      .collection('users')
      .doc(uid)
      .set(profileData, SetOptions(merge: true));
}
```

यह excerpt बताता है कि write merge है, पर यह अपने-आप privileged-field protection सिद्ध नहीं करता। इसलिए Chapter 08 और Chapter 14 इसे rules evidence के साथ cross-reference करते हैं।

#### Priority selection — `lib/features/crucible/core/battle_engine.dart:68–96`

```dart
static MicroTopicNode? getPriorityNode(
  List<MicroTopicNode> nodes,
  Map<String, NodeRuntimeState> states, {
  double riskFactor = 0.0,
}) {
  final activeNodes = nodes.where((n) {
    final state = states[n.id];
    return state == null || !state.completed;
  }).toList();

  if (activeNodes.isEmpty) {
    return null;
  }

  activeNodes.sort((a, b) {
    final aState = states[a.id] ?? NodeRuntimeState(nodeId: a.id);
    final bState = states[b.id] ?? NodeRuntimeState(nodeId: b.id);
    final aScore = _battleScore(a, aState, riskFactor: riskFactor);
    final bScore = _battleScore(b, bState, riskFactor: riskFactor);
    return bScore.compareTo(aScore);
  });

  return activeNodes.first;
}
```

Excerpt का बाकी scoring code उसी file में है। इससे दो boundaries स्पष्ट हैं: function synchronous है और completed-node filtering के बाद `null` एक valid empty-state output है।

#### Callable export and guard — `functions/callable/toggle_ai_system.js:8–24`

```javascript
exports.toggleAiSystem = functions.https.onCall(async (data, context) => {
  const { auth } = context;
  if (!auth || !auth.token.founder) {
    throw new functions.https.HttpsError(
      'permission-denied',
      '🔱 ONLY FOUNDERS CAN OPERATE KILL SWITCH.',
    );
  }

  const { enabled } = data;
  await admin.firestore().collection('system_config').doc('global').set({
    aiEnabled: enabled,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: auth.uid
  }, { merge: true });

  await logFounderActivity({
    type: 'SYSTEM_CONFIG',
    message: `AI System ${enabled ? 'ENABLED' : 'DISABLED'} by Founder.`,
    severity: enabled ? 'MEDIUM' : 'CRITICAL'
  });

  return { success: true };
});
```

`functions/index.js` इस module को `exports.toggleAiSystem = toggleAiSystem` के रूप में public deployment surface में रखता है। Code में मौजूद timestamp/audit fields को ऊपर readability के लिए संक्षिप्त नहीं माना जाना चाहिए; full file authoritative है।

#### Emulator guard — `lib/core/firebase/firebase_emulator_config.dart:39–60`

```dart
void validate() {
  if (!enabled) return;
  if (kReleaseMode) {
    throw StateError(
      'Firebase emulator mode is debug/test only and cannot run in release.',
    );
  }
  if (host.trim().isEmpty) {
    throw StateError(
      'RC_USE_FIREBASE_EMULATOR=true requires RC_FIREBASE_EMULATOR_HOST.',
    );
  }
  if (authPort <= 0 || firestorePort <= 0) {
    throw StateError('Firebase emulator ports must be positive integers.');
  }
}
```

इस guard से release isolation और missing-host failure directly सिद्ध होते हैं। Functions emulator wiring का absence भी इसी file की readback से स्पष्ट होता है: यह Auth और Firestore configure करता है, Functions नहीं।

## 5. Unsupported-claim corrections

The following wording is intentionally prohibited as an unscoped certification in Chapters 17, 19 and 20: “100% truthful codebase reflection”, “zero placeholders”, “zero stubs”, “100% verified route/model/database specifications” and “exhaustive” when it refers to the whole repository. Scoped examples such as a fixture reaching `coverage == 100%` may remain if they name the fixture, file, input and observed output. Product goals such as “100% academic authenticity” must be labelled as a goal or policy objective, not as a measured repository state.

The academic engine sections now prefer the live symbols `MasteryDecayEngine.calculateRetention`, `MasteryEngine.calculateScore`, `RiskEngine.calculate`, `ReadinessEngine.calculate` and `CoverageEngine.calculate`. The formulas in those files are evidence-backed only to the input and output scope visible in the source. A Bayesian update engine, rank forecaster, FNV-1a helper, dwell discount helper or assessment verification module must not be presented as current until a future census finds the exact file and symbol.

## 6. Asset evidence note

The canonical white source mark remains `assets/images/logo.png`. The non-destructive black-background display variant is `assets/images/logo_on_black.png`. The variant exists for white-logo-on-white-page readability and must not replace or overwrite the canonical source. The book may use the black variant on a title-page panel, cover block or dark figure frame; every use should preserve aspect ratio and should be recorded as a display treatment, not a new official logo.

## 7. Remaining acceptance work

Batch 01 closed the first path/topology corrections and recorded open claims. Batch 02 is recorded below; it does not close Chapter 18 or Google Docs parity. Final publication language remains `working manuscript` until the unresolved register is either closed with live evidence or intentionally accepted as historical/proposed scope.

## 8. Batch 02 fresh audit snapshot

This section is the machine-auditable handoff for the next audit. A row is “live” only when the path exists, the named symbol was found, the cited line range was read from the current checkout, and the evidence note states the observed boundary. A historical path may appear only in a row whose status is immediately `UNRESOLVED / HISTORICAL` or `HISTORICAL`; it must not appear in a live contract table.

| claim_id | chapter/section | written path / symbol | live path / symbol | line range | status | evidence note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RC-B02-15-001` | Ch 15 §4.1 | `createAttemptSession` | `functions/workers/evaluate_attempt_worker.js::createAttemptSession` | 9–55; export 219–220 | `VERIFIED HELPER` | deterministic session ID; existing document returned; 3-hour expiry; writes `attempt_sessions` |
| `RC-B02-15-002` | Ch 15 §4.2 | `evaluateAttempt` | `functions/workers/evaluate_attempt_worker.js::evaluateAttempt` | 57–217; export 219–220 | `VERIFIED HELPER` | reads pinned question/key versions; scores MCQ/numerical; batch writes attempt/evidence/outbox; no direct mastery write |
| `RC-B02-15-003` | Ch 15 §9.7 | `finalizeTestArenaAttempt` | `functions/src/workers/testArenaFinalScorerWorker.ts::finalizeTestArenaAttempt` | 289–296; worker 74–282 | `VERIFIED CALLABLE` | auth, ownership/status gates, existing-result guard, authoritative result write |
| `RC-B02-15-004` | Ch 15 §9.1 | `manageUserAccess` | `functions/callable/manage_access.js::manageUserAccess` | 10–96 | `VERIFIED CALLABLE` | claims + user doc + founder audit mutations; caught failures become internal |
| `RC-B02-15-005` | Ch 15 §9.2 | `toggleAiSystem` | `functions/callable/toggle_ai_system.js::toggleAiSystem` | 8–26 | `VERIFIED CALLABLE` | founder gate; `system_config/global` merge and activity log; no type validation/retry |
| `RC-B02-15-006` | Ch 15 §9.3 | `getSystemHealth` | `functions/callable/system_health.js::getSystemHealth` | 8–72 | `VERIFIED CALLABLE` | diagnostic write/read to heartbeat; status mapping; outer error returned in payload |
| `RC-B02-15-007` | Ch 15 §9.4 | `processAITask` | `functions/callable/process_ai_task.js::processAITask` | 12–63 | `VERIFIED CALLABLE` | admin + kill switch + budget + Gemini + audit; returns parsed result, not queue envelope |
| `RC-B02-15-008` | Ch 15 §9.5 | `getSecureAssetUrl` | `functions/callable/secure_download.js::getSecureAssetUrl` | 8–71 | `VERIFIED CALLABLE` | validates asset fields, checks Storage object, signs five-minute URL, logs download audit |
| `RC-B02-15-009` | Ch 15 §5.1 | `knowledgeManifestationWorker` | `functions/workers/manifestation_worker.js::knowledgeManifestationWorker` | 13–116 | `VERIFIED TRIGGER` | reads up to 50 atomic facts; writes review blocks; failed task status; schema/idempotency not declared |
| `RC-B02-15-010` | Ch 15 §5.3 | `sovereignWebsiteScout` | `functions/workers/scout_worker.js::sovereignWebsiteScout` | 12–99 | `VERIFIED TRIGGER` | six-hour schedule, registry deduplication and queue/download writes; external network success not certified |
| `RC-B02-19-001` | Ch 19 §11.1 | `KnowledgeEngine.calculateAtomicMastery` | `KnowledgeEngine._applyDeltaProgress` | `lib/core/knowledge/knowledge_engine.dart:350–434` | `CORRECTED` | former public symbol absent; live orchestration updates in-memory mastery/coverage/node maps |
| `RC-B02-19-002` | Ch 19 §11.2 | decay/mastery formulas | `MasteryDecayEngine.calculateRetention`, `MasteryEngine.calculateScore` | `mastery_decay_engine.dart:8–20`; `mastery_engine.dart:12–28` | `VERIFIED` | pure clamped calculations; no persistence/retry |
| `RC-B02-19-003` | Ch 19 §11.3 | coverage contract | `CoverageEngine.calculateAtomic`, `CoverageEngine.calculate` | `coverage_engine.dart:15–38,44–80` | `VERIFIED` | evidence weights and empty-node zero state directly observed |
| `RC-B02-19-004` | Ch 19 §11.4 | readiness/momentum contract | `ReadinessEngine.calculate`, `MomentumEngine.calculate` | `readiness_engine.dart:14–56`; `momentum_engine.dart:10–38` | `VERIFIED` | synchronous outputs; zero evidence maps to `Pending Evidence` readiness |
| `RC-B02-19-005` | Ch 19 §11.6 | `BattleSession.recordQuestionOutcome` | no current method; `BattleSession.toMap/fromMap/copyWith` | `battle_session.dart:34–108` | `UNRESOLVED / HISTORICAL` | model is immutable; former mutator symbol not found |
| `RC-B02-20-001` | Ch 20 Appendix E | old callable table | live callable/helper index | `20_master_reference_appendices.md:230–250` | `CORRECTED` | inaccurate payloads and outputs replaced; helper rows separated from callable rows |
| `RC-B02-20-002` | Ch 20 Appendix G | `evaluateAttempt`/`createAttemptSession` as old assessment.ts | `functions/workers/evaluate_attempt_worker.js` | 9–55,57–217,219–220 | `CORRECTED` | old aggregate path remains historical only; live helper replacement recorded |
| `RC-B02-10-001` | Ch 10 §1.1 | 100-Day linear schedule / Day 99 | `lib/features/crucible/core/crucible_clock_engine.dart:187–208` & `RC-CRUCIBLE-C98-001` | 187–208 | `CORRECTED / RATIFIED` | 98-day continuous modulo ring ($7 \times 14 = 98$d); 42 micros, 7 rebuilds, 7 macros; wraps Day 98 to Day 1 |
| `RC-B02-10-002` | Ch 10 §1.3 | Crucible test eligibility | `lib/features/crucible/core/micro_test_engine.dart:148–340` & `RC-ASSESSMENT-CAE-001` | 148–340 | `VERIFIED CONTRACT` | 7-criterion eligibility intersection; zero-PYQ valid; fail-closed bank depth (<50 returns []); immutable attempts |
| `RC-B02-10-003` | Ch 10 §1.4 | `sacred_major_test_throne.dart` as live Crucible test | `lib/features/crucible/presentation/widgets/sacred_major_test_throne.dart:623` & `RC-ASSESSMENT-CTA-001` | 1–762 | `SUPERSEDED_PROTOTYPE / QUARANTINED` | Major Test excluded from Crucible; belongs to Test Arena; Day 99 prototype quarantined |
| `RC-B02-10-004` | Ch 10 §6.1 | 5-gate eligibility | `lib/features/crucible/core/micro_test_engine.dart:148–340` | 148–340 | `VERIFIED ENGINE` | 9-gate pipeline (Gates A–I): type, atom scope, fact provenance, Human Authority, answer key, SHA-256 solution, PYQ proof, publication, lineage |
| `RC-B02-10-005` | Ch 10 §5.2 | schedule window | `lib/features/crucible/core/crucible_engine.dart:253–276` | 253–276 | `VERIFIED ENGINE` | Hour-47 Micro Trigger (`learningStart + 47h` to `+ 48h`); 48h dual-day cadence |

### 8.1 Fresh census rules and result

The current audit used three independent checks: (a) repository path existence, (b) symbol/export search, and (c) line-range readback. The resulting source-reference census for Chapters 08–20 found no unlabelled missing file in a `Source File & Location` field. Remaining absent paths are intentionally confined to explicit historical/unresolved ledgers: Chapter 18 stale ledger, `functions/src/assessment/verification.ts`, former `functions/src/assessment.ts`, former `functions/src/triggers.ts`, former `functions/src/workers.ts`, and former fixture/CI labels. `build/web` and `build/web/main.dart.js` are generated artifacts, not live source paths.

### 8.2 Contract evidence vocabulary for future batches

```text
VERIFIED = path + symbol + cited lines read in current checkout, with observed behavior recorded
CORRECTED = written claim was replaced by a current path/symbol and old claim is not live
UNRESOLVED = a required replacement or behavior is not proven by current source/tests
HISTORICAL = retained only to explain prior manuscript vocabulary; never a live table entry
PROPOSED = design intent or future contract, clearly separated from implementation
```

## 9. Remaining acceptance work

Batch 02 closes the identified live-path corrections for the assessment helpers, callable matrix, and academic engines, and records their evidence boundaries. It does not close Chapter 18 or Google Docs parity. The next writing batch must perform branch-level reconciliation for `handleSentinelAction` and `handleMissionAction`, then expand student/dashboard workflows with caller, input validation, output, mutation, error, offline/permission state, test evidence and cross-reference blocks. Final publication language remains `working manuscript` until the unresolved register is either closed with live evidence or intentionally accepted as historical/proposed scope.
