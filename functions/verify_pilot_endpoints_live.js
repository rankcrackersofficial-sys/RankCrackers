'use strict';

/**
 * Strict-TLS live verifier for the canonical pilot authority registry.
 *
 * The default invocation is an offline contract census. Network probing is
 * opt-in with --live and never writes Firestore or changes registry state.
 */
const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');
const { canonicalAuthorityRegistry } = require('./services/authority_intelligence/authority_registry_loader');
const { evaluateRoleEvidence, ROLE_EVIDENCE_VERDICTS } = require('./services/authority_intelligence/role_evidence_verifier');

const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;

// Keep certificate verification enabled. Legacy state servers may require the
// compatibility flag, but it must never be paired with a certificate bypass.
const STRICT_TLS_OPTIONS = Object.freeze({
  minVersion: 'TLSv1.2',
  rejectUnauthorized: true,
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
});

function parsePageEvidence(body) {
  const source = String(body || '');
  const titleMatch = source.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const headings = [...source.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)]
    .map(match => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 40);
  return {
    title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '',
    headings,
    bodySnippet: source.replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20_000),
  };
}

function requestHttps(url, redirectsRemaining = MAX_REDIRECTS) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (error) {
      resolve({ error: `INVALID_URL:${error.message}` });
      return;
    }
    if (parsed.protocol !== 'https:') {
      resolve({ error: 'NON_HTTPS_ENDPOINT_REJECTED' });
      return;
    }

    const request = https.request(parsed, {
      ...STRICT_TLS_OPTIONS,
      headers: { 'user-agent': 'RankCrackers-Authority-Endpoint-Verifier/1.0' },
      timeout: REQUEST_TIMEOUT_MS,
    }, response => {
      const chunks = [];
      let byteCount = 0;
      response.on('data', chunk => {
        if (byteCount < MAX_BODY_BYTES) {
          const remaining = MAX_BODY_BYTES - byteCount;
          const piece = Buffer.isBuffer(chunk) ? chunk.subarray(0, remaining) : String(chunk).slice(0, remaining);
          chunks.push(piece);
          byteCount += Buffer.byteLength(piece);
        }
      });
      response.on('end', async () => {
        const location = response.headers.location;
        if (response.statusCode >= 300 && response.statusCode < 400 && location && redirectsRemaining > 0) {
          const nextUrl = new URL(location, parsed).toString();
          const next = await requestHttps(nextUrl, redirectsRemaining - 1);
          resolve(next);
          return;
        }
        const body = Buffer.concat(chunks.map(chunk => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString('utf8');
        resolve({
          status: response.statusCode,
          finalUrl: parsed.toString(),
          finalHost: parsed.hostname,
          ...parsePageEvidence(body),
        });
      });
    });
    request.on('timeout', () => request.destroy(new Error('REQUEST_TIMEOUT')));
    request.on('error', error => resolve({ error: error.message }));
    request.end();
  });
}

async function verifyPilotEndpoints({ live = false, authorityKey = null } = {}) {
  const authorities = canonicalAuthorityRegistry.getAll()
    .filter(authority => !authorityKey || authority.authorityKey === authorityKey);
  const results = [];
  for (const authority of authorities) {
    for (const [slot, contract] of Object.entries(authority.roleEndpointEvidence)) {
      if (!contract || contract.canonicalUrl === null) {
        results.push({ authorityKey: authority.authorityKey, slot, verdict: ROLE_EVIDENCE_VERDICTS.SAFE_NULL });
        continue;
      }
      if (!live) {
        results.push({ authorityKey: authority.authorityKey, slot, verdict: 'NOT_PROBED', url: contract.canonicalUrl });
        continue;
      }
      const probe = await requestHttps(contract.canonicalUrl);
      const evaluated = evaluateRoleEvidence(contract, probe, authority.allowedOfficialDomains);
      results.push({ authorityKey: authority.authorityKey, slot, url: contract.canonicalUrl, ...probe, ...evaluated });
    }
  }
  return results;
}

async function main() {
  const live = process.argv.includes('--live');
  const authorityArg = process.argv.find(arg => arg.startsWith('--authority='));
  const authorityKey = authorityArg ? authorityArg.slice('--authority='.length) : null;
  const results = await verifyPilotEndpoints({ live, authorityKey });
  console.log(JSON.stringify({
    mode: live ? 'LIVE_READ_ONLY' : 'DRY_RUN_CONTRACT_CENSUS',
    authorityCount: new Set(results.map(result => result.authorityKey)).size,
    endpointCount: results.length,
    results,
  }, null, 2));
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.stack || error.message || error);
    process.exitCode = 1;
  });
}

module.exports = {
  STRICT_TLS_OPTIONS,
  parsePageEvidence,
  requestHttps,
  verifyPilotEndpoints,
};
