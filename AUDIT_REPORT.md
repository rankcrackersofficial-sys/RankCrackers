Audit Report - RankCrackers (summary)

Scope
- Quick security & runtime audit focused on Firebase functions and Gemini integration.

What I changed (safe, non-UI):
- Removed hardcoded Gemini API keys from `test-gemini.js` and `list-models.js` and switched to `process.env.GEMINI_API_KEY`.
- Added `functions/.env.example` and `functions/.gitignore`; removed committed `functions/.env` from the repo.
- Replaced deprecated model `gemini-1.5-flash` with `gemini-flash-latest` in `functions/src/providers/geminiProvider.ts` and built JS in `functions/lib/providers`.
- Bumped `firebase-admin` to a compatible 12.x series for stability with the emulator and updated `firebase-functions` to `^5.1.0` with matching dev dependencies; installed deps and reduced vulnerabilities.

Findings
- Secrets: Several API keys were present in `functions/.env` and in two JS files. These have been removed from code, but the keys should be rotated immediately.
- Vulnerabilities: After conservative dependency alignment, vulnerabilities reduced to 11 (9 moderate, 2 high). Full remediation would require additional dependency upgrades and testing.
- Model usage: Some modules used deprecated Gemini model IDs (`gemini-1.5-flash`). Replaced with `gemini-flash-latest` where code was present.
- Emulator: Firebase Functions emulator runs locally; I validated `vertex_ai_service` can call Gemini directly and return a response.
- Callable auth: I was unable to fully exercise `processAITask` and `getSystemHealth` via the HTTP emulator endpoint with an HTTP spoofed auth header; invoking function logic directly requires authenticated context or additional emulator Auth setup. The function logic itself was tested by running provider call directly and by direct module checks.

Immediate recommended actions (in priority order)
1. Rotate all API keys that were present in the repository (`GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.). Treat them as compromised.
2. Remove secrets from git history (BFG or `git filter-repo`) and force-push if repo is remote. I can prepare the exact commands.
3. Run full test suite and CI after bumping `firebase-functions` to v5 and `firebase-admin` compatibility changes — I already applied a conservative set; run integration tests that exercise callable endpoints.
4. If you want fewer vulnerabilities, plan a staged upgrade of other transitive deps (e.g., google-gax related fixes require firebase-admin@14 — but `firebase-functions@5` currently peers with admin 11–12). This requires careful testing before deploying to production.

How to run locally (what I ran)

1. Install functions deps
```bash
cd e:/RankCrackers/functions
npm install --legacy-peer-deps
```

2. Start emulator
```bash
npm run serve
# Emulator UI: http://127.0.0.1:4000/
```

3. Quick provider test (I ran this):
```bash
# from e:/RankCrackers/functions
node -e "const fs=require('fs'); const env=fs.existsSync('.env')?fs.readFileSync('.env','utf8').split(/\r?\n/).filter(Boolean):[]; env.forEach(l=>{ const i=l.indexOf('='); if(i>0){ process.env[l.slice(0,i)]=l.slice(i+1); }}); const { callVertexGemini } = require('./services/vertex_ai_service'); callVertexGemini('Say hello from local validation').then(console.log).catch(err=>{ console.error('CALL_FAILED', err); process.exit(1); });"
```

Next steps I can execute for you (pick any or multiple):
- `rotate-keys`: Prepare commands and guidance to rotate keys (recommended immediately).
- `remove-secrets-history`: Run `git filter-repo`/BFG commands to purge secrets from repo history and prepare a push plan (I will not push without your go-ahead).
- `full-upgrade`: Attempt to upgrade to `firebase-admin@14` and resolve any breaking changes; run emulator and smoke tests (risk: may require code changes).
- `verify-callables`: Set up emulator Auth (or a test harness) and run `getSystemHealth` and `processAITask` end-to-end.

Would you like me to proceed with one of the next steps? If yes, reply with the action name (e.g., `rotate-keys`, `remove-secrets-history`, `full-upgrade`, `verify-callables`, or `report-only`).
