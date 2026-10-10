/**
 * 🔱 OFFICIAL URL & DOMAIN NORMALIZATION CONTRACT
 * Command: RC-AUTHORITY-INTELLIGENCE-B1-AG2-PILOT-REGISTRY-AND-PURE-MONITOR-FOUNDATION-20260912
 *
 * Provides pure, deterministic normalization of official government URLs.
 * Strips tracking parameters, enforces canonical hostname/casing, and eliminates cache-busting junk.
 */

'use strict';

const crypto = require('crypto');

// Tracking query parameters to strip
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'fbclid',
  'gclid',
  'sessionid',
  'jsessionid',
  '_',
  'rnd',
  'timestamp',
]);

/**
 * Normalizes an official URL into a deterministic canonical string.
 */
function normalizeOfficialUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    throw new Error('URL_NORMALIZATION_ERROR: Invalid or empty URL input.');
  }

  const trimmed = rawUrl.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    throw new Error(`URL_NORMALIZATION_ERROR: Malformed URL "${rawUrl}": ${err.message}`);
  }

  // 1. Lowercase protocol and hostname
  const protocol = parsed.protocol.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();

  // 2. Remove default ports
  let port = parsed.port;
  if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
    port = '';
  }

  // 3. Normalize pathname (collapse redundant slashes, strip trailing slash unless root)
  let pathname = parsed.pathname.replace(/\/+/g, '/');
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // 4. Clean and sort search parameters (strip tracking, sort keys alphabetically)
  const searchParams = new URLSearchParams();
  const sortedKeys = Array.from(parsed.searchParams.keys())
    .filter(k => !TRACKING_PARAMS.has(k.toLowerCase()))
    .sort();

  for (const key of sortedKeys) {
    const values = parsed.searchParams.getAll(key);
    for (const val of values) {
      searchParams.append(key, val);
    }
  }

  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';

  // Return canonical string (fragments are excluded as they represent client state)
  const hostPart = port ? `${hostname}:${port}` : hostname;
  return `${protocol}//${hostPart}${pathname}${search}`;
}

/**
 * Computes a deterministic SHA-256 hash of a normalized URL.
 */
function computeUrlHash(rawUrl) {
  const canonical = normalizeOfficialUrl(rawUrl);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Extracts the canonical hostname from a URL.
 */
function extractHostname(rawUrl) {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

module.exports = {
  normalizeOfficialUrl,
  computeUrlHash,
  extractHostname,
};
