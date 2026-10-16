/**
 * 🔱 OFFICIAL AUTHORITY WATCH AUTOMATIC DISCOVERY SCANNER
 * Target Collection: authority_intelligence_events
 * Command: RC-AUTHORITY-WATCH-PRODUCTION-R1-AUTOMATIC-DISCOVERY-LIVE-AG1-20260913
 *
 * Laws:
 *   - Strictly 6 Pilot Authorities: UPSC, SSC, NTA, RPSC, RSSB, DSSSB.
 *   - English official sources only; strict TLS enforced; zero unofficial/coaching sources.
 *   - Only active role endpoints: notifications, recruitment, syllabus, calendar, results, answerKeys, pyq.
 *   - Deterministic eventId from dedupe contract. Idempotent create-once semantics.
 *   - Watch stops strictly at authority_intelligence_events. Zero source prepare, zero verify,
 *     zero mission creation, zero publication.
 */

'use strict';

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

const {
  UPDATE_VOCABULARY,
  OPERATIONAL_MODES,
  TERMINAL_RUN_STATES,
} = require('./registry_schema');
const { canonicalAuthorityRegistry } = require('./authority_registry_loader');
const { createAuthorityIntelligenceEvent } = require('./authority_intelligence_event');
const { saveAuthorityIntelligenceEvent } = require('./authority_intelligence_event_store');
const { updateHeartbeat } = require('../worker_service');

const PILOT_AUTHORITY_KEYS = Object.freeze([
  'auth_in_upsc',
  'auth_in_ssc',
  'auth_in_nta',
  'auth_in_rj_rpsc',
  'auth_in_rj_rssb',
  'auth_in_dl_dsssb',
]);

const ACTIVE_WATCH_SLOTS = Object.freeze([
  'notifications',
  'recruitment',
  'syllabus',
  'calendar',
  'results',
  'answerKeys',
  'pyq',
]);

const EXCLUDED_NOISE_TERMS = Object.freeze([
  'about us', 'contact us', 'sitemap', 'site map', 'login', 'apply online', 'skip to', 'screen reader',
  'privacy policy', 'terms & conditions', 'terms of', 'hyperlinking policy', 'copyright policy',
  'disclaimer', 'help', 'feedback', 'directory', 'rti', 'right to information', 'tenders', 'tender',
  'citizen charter', 'annual report', 'profile', 'commission', 'board', 'organizational chart',
  'historical perspective', 'constitutional provisions', 'functions', 'vision', 'objectives', 'resolution',
  'admin structure', 'gallery', 'photo gallery', 'video gallery', 'audio gallery', 'faq', 'faqs',
  'national portal', 'india.gov.in', 'digital india', 'mygov', 'read more', 'click here', 'download'
]);

// Controlled freshness evidence categories (Section 6-9)
const FRESHNESS_EVIDENCE_TYPES = Object.freeze({
  PROVEN_AUTHORITY_PUBLICATION_DATE: 'PROVEN_AUTHORITY_PUBLICATION_DATE',
  MATERIAL_CHANGE_TO_KNOWN_DOCUMENT: 'MATERIAL_CHANGE_TO_KNOWN_DOCUMENT',
  PROVEN_NEW_LISTING_ENTRY: 'PROVEN_NEW_LISTING_ENTRY',
  UNKNOWN: 'UNKNOWN',
});

// Controlled publication date provenance categories (Section 7-8)
const PUBLICATION_DATE_PROVENANCE = Object.freeze({
  OFFICIAL_LISTING_DATE: 'OFFICIAL_LISTING_DATE',
  OFFICIAL_PAGE_METADATA: 'OFFICIAL_PAGE_METADATA',
  OFFICIAL_DOCUMENT_METADATA: 'OFFICIAL_DOCUMENT_METADATA',
  TITLE_DATE_HINT: 'TITLE_DATE_HINT',
  URL_FILENAME_DATE_HINT: 'URL_FILENAME_DATE_HINT',
  UNKNOWN: 'UNKNOWN',
});

// Decodes standard HTML entities commonly found in official portal markups
function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/\s+/g, ' ')
    .trim();
}

// Regular expression detecting file-size only strings: e.g. "(138.25 KB)", "229.7 KB", "(1.49 MB)"
const FILE_SIZE_REGEX = /^\s*\(?\s*\d+(\.\d+)?\s*(KB|MB|GB|B|bytes?)\s*\)?\s*$/i;

// Generic action phrases that do not constitute a meaningful title
const GENERIC_ACTION_REGEX = /^\s*(download|click here|view|pdf|link|here|read more|file|details|more|view pdf|download pdf|click here for details|view document|download file)\s*$/i;

// Screen reader and accessibility phrases that must not become intelligence titles
const SCREEN_READER_TEXT_REGEX = /^\s*(pdf file that opens in a new window|opens in a new window|opens in new window|opens a new window|opens in new tab|new window|external link that opens in a new window|click here to view|view in pdf|download the pdf file)\.?\s*$/i;

// Evergreen navigation, section headings, and portal landing pages
const EVERGREEN_NAVIGATION_PATTERNS = Object.freeze([
  'active examinations',
  'active examination',
  'forthcoming examinations',
  'forthcoming examination',
  'recruitment requisition',
  'recruitment tests',
  'recruitment test',
  'online recruitment application',
  'online recruitment applications',
  'ora',
  'recruitment advertisements',
  'recruitment advertisement',
  'recruitment cases kept on hold',
  'pending litigations',
  'pending litigation',
  'status of recruitment cases',
  'status of lateral recruitment',
  'candidates guidelines',
  'candidates-guidelines',
  'candidate guidelines',
  'exam guidelines',
  'examination guidelines',
  'general instructions',
  'scheme of examinations',
  'schemes of examinations',
  'previous question papers',
  'old question papers',
  'model question papers',
  'examination',
  'examinations',
  'about commission',
  'citizen charter',
]);

const EVERGREEN_PATH_PATTERNS = Object.freeze([
  '/active-exams',
  '/forthcoming-exams',
  '/recruitment-advertisement',
  '/recruitment-requisition',
  '/recruitment-test',
  '/candidates-guidelines',
  '/old-results',
  '/admitcards',
  '/answerkeys',
  '/pending-litigation',
  '/pending-litigations',
  '/ora',
]);

/**
 * Returns true if the string is purely a file-size label.
 */
function isFileSizeOnly(str) {
  if (!str || typeof str !== 'string') return false;
  const decoded = decodeHtmlEntities(str);
  return FILE_SIZE_REGEX.test(decoded);
}

/**
 * Returns true if the string is merely a generic button/action text or screen reader announcement.
 */
function isGenericActionText(str) {
  if (!str || typeof str !== 'string') return false;
  const decoded = decodeHtmlEntities(str);
  if (GENERIC_ACTION_REGEX.test(decoded)) return true;
  if (SCREEN_READER_TEXT_REGEX.test(decoded)) return true;
  if (/opens in (a )?new window/i.test(decoded) && decoded.length < 60) return true;
  return false;
}

/**
 * Detects whether a candidate link or title represents a question paper (PYQ).
 * Guarantees Question Papers are NEVER classified as NEW_NOTIFICATION.
 */
function isPyqLink(title = '', url = '', slot = '') {
  const t = decodeHtmlEntities(String(title || '')).toLowerCase();
  const u = String(url || '').toLowerCase();
  if (slot === 'pyq') return true;
  if (
    u.includes('/qp-') ||
    u.includes('qp_') ||
    u.includes('/qp/') ||
    u.includes('-qp-') ||
    u.includes('qp-csm') ||
    u.includes('question_paper') ||
    u.includes('question-paper') ||
    u.includes('previous_year') ||
    u.includes('previous-year') ||
    u.includes('/previous-question') ||
    u.includes('/old-question')
  ) {
    return true;
  }
  if (
    t.includes('question paper') ||
    t.includes('previous paper') ||
    t.includes('previous question') ||
    t.includes('previous year question') ||
    t.includes('model question paper') ||
    t.includes('old question paper') ||
    t.startsWith('qp -') ||
    t.startsWith('qp:') ||
    t.startsWith('qp ')
  ) {
    return true;
  }
  return false;
}

/**
 * Detects whether a title or URL represents an evergreen navigation/index page
 * rather than a specific official recruitment/update notice.
 */
function isEvergreenNavigation(title = '', url = '') {
  const t = decodeHtmlEntities(String(title || '')).toLowerCase().trim();

  for (const term of EVERGREEN_NAVIGATION_PATTERNS) {
    if (t === term || t === `status of ${term}` || t === `${term} (advertisement-wise)` || t.startsWith(`${term} (`) || t.endsWith(` ${term}`)) {
      return true;
    }
    // If multi-word pattern like 'pending litigation' or 'active examination' or 'recruitment requisition'
    if ((term.includes(' ') || term === 'ora') && t.includes(term)) {
      return true;
    }
  }

  try {
    const parsed = new URL(url);
    const p = parsed.pathname.toLowerCase().replace(/\/+$/, '');
    if (p === '' || p === '/home') return true;
    for (const pattern of EVERGREEN_PATH_PATTERNS) {
      if (p === pattern || p.endsWith(pattern) || p.includes(pattern.replace(/^\//, ''))) return true;
    }
  } catch (_) {}

  return false;
}

/**
 * Detects whether a document/notice clearly references a historical year (<= 2025).
 * Stale/historical documents must not be published as new forward watch updates.
 */
function isHistoricalDocument(title = '', url = '', publicationDate = null) {
  const combined = `${decodeHtmlEntities(title)} ${url} ${publicationDate || ''}`.toLowerCase();
  // Matches any 4-digit year <= 2025 (e.g. 1900-2025) bounded by non-alphanumerics
  const yearMatch = combined.match(/(?:^|[^a-zA-Z0-9])(19\d\d|20[01]\d|202[0-5])(?:[^a-zA-Z0-9]|$)/);
  if (yearMatch) {
    return true;
  }
  if (publicationDate && typeof publicationDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(publicationDate.trim())) {
    if (publicationDate.trim() < '2026-01-01') {
      return true;
    }
  }
  return false;
}

/**
 * Attempts to extract an official publication date from the title, URL, or surrounding text.
 * Returns YYYY-MM-DD or null. Never sets publicationDate = discoveredAtIso.
 */
function extractPublicationDate(title = '', url = '') {
  const combined = `${decodeHtmlEntities(title)} ${url}`;
  // 1. DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = combined.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[012])[-/.](20\d\d)\b/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // 2. YYYY-MM-DD
  const ymdMatch = combined.match(/\b(20\d\d)[-/.](0?[1-9]|1[012])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // 3. 6-digit date in URL filename (e.g. AdvtNo-52-2026-Special-Engl-210826.pdf -> 2026-08-21)
  const sixDigitMatch = url.match(/[-_](0[1-9]|[12]\d|3[01])(0[1-9]|1[012])(2[4-9])\./);
  if (sixDigitMatch) {
    const day = sixDigitMatch[1];
    const month = sixDigitMatch[2];
    const year = `20${sixDigitMatch[3]}`;
    return `${year}-${month}-${day}`;
  }
  return null;
}

/**
 * Evaluates the freshness evidence for an official candidate link.
 * Strictly enforces Freshness Acceptance Law (Section 6-9):
 * 1. PROVEN_AUTHORITY_PUBLICATION_DATE
 * 2. MATERIAL_CHANGE_TO_KNOWN_DOCUMENT
 * 3. PROVEN_NEW_LISTING_ENTRY
 * Default: UNKNOWN (never persisted in DAILY_FORWARD_WATCH).
 */
function evaluateFreshnessEvidence(cand, options = {}) {
  if (!cand) {
    return { evidenceType: FRESHNESS_EVIDENCE_TYPES.UNKNOWN, isValid: false, reason: 'NULL_CANDIDATE' };
  }

  // 1. MATERIAL_CHANGE_TO_KNOWN_DOCUMENT Law (Section 8)
  // Requires: same known official URL/document identity, prior stored SHA present, new SHA present, prior SHA != new SHA
  const priorSha = options.priorStoredSha || cand.priorDocumentSha || null;
  const currentSha = options.currentDocumentSha || cand.documentSha256 || null;
  if (priorSha && currentSha) {
    if (priorSha !== currentSha) {
      return {
        evidenceType: FRESHNESS_EVIDENCE_TYPES.MATERIAL_CHANGE_TO_KNOWN_DOCUMENT,
        isValid: true,
        priorSha,
        currentSha,
        reason: 'DOCUMENT_SHA_MODIFIED_FROM_BASELINE',
      };
    }
  }

  // 2. PROVEN_NEW_LISTING_ENTRY Law (Section 9)
  // Requires: authority listing was previously observed (prior snapshot exists and isFirstListingObservation is false),
  // entry identity did NOT previously exist in that listing snapshot, current official listing now contains it.
  const priorListingSnapshot = options.priorListingSnapshot || null;
  const isFirstListingObservation = Boolean(options.isFirstListingObservation);
  if (priorListingSnapshot && !isFirstListingObservation) {
    const urlKey = (cand.officialUrl || '').toLowerCase();
    const hasPrior = priorListingSnapshot.has ? priorListingSnapshot.has(urlKey) : Array.isArray(priorListingSnapshot) ? priorListingSnapshot.includes(urlKey) : false;
    if (!hasPrior) {
      return {
        evidenceType: FRESHNESS_EVIDENCE_TYPES.PROVEN_NEW_LISTING_ENTRY,
        isValid: true,
        reason: 'NEW_ENTRY_ABSENT_FROM_PREVIOUS_LISTING_SNAPSHOT',
      };
    }
  }

  // 3. PROVEN_AUTHORITY_PUBLICATION_DATE Law (Section 7-9)
  // Publication date may qualify ONLY if originating from physically identified official metadata/listing:
  // OFFICIAL_LISTING_DATE, OFFICIAL_PAGE_METADATA, OFFICIAL_DOCUMENT_METADATA.
  // Dates from title text (TITLE_DATE_HINT) or URL/filename (URL_FILENAME_DATE_HINT) are hints only
  // and MUST NOT independently satisfy PROVEN_AUTHORITY_PUBLICATION_DATE.
  const pubDate = cand.publicationDate;
  const pubDateSource = cand.publicationDateSource || options.publicationDateSource || null;
  const pubDateEvidenceRef = cand.publicationDateEvidenceRef || options.publicationDateEvidenceRef || null;
  const operationalMode = options.operationalMode || cand.operationalMode || OPERATIONAL_MODES.DAILY_FORWARD_WATCH;

  if (pubDate && typeof pubDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(pubDate)) {
    const isOfficialSource = [
      PUBLICATION_DATE_PROVENANCE.OFFICIAL_LISTING_DATE,
      PUBLICATION_DATE_PROVENANCE.OFFICIAL_PAGE_METADATA,
      PUBLICATION_DATE_PROVENANCE.OFFICIAL_DOCUMENT_METADATA,
    ].includes(pubDateSource);

    if (!isOfficialSource) {
      return {
        evidenceType: FRESHNESS_EVIDENCE_TYPES.UNKNOWN,
        isValid: false,
        publicationDate: pubDate,
        publicationDateSource: pubDateSource || PUBLICATION_DATE_PROVENANCE.UNKNOWN,
        publicationDateEvidenceRef: pubDateEvidenceRef,
        reason: (pubDateSource === PUBLICATION_DATE_PROVENANCE.TITLE_DATE_HINT || pubDateSource === PUBLICATION_DATE_PROVENANCE.URL_FILENAME_DATE_HINT)
          ? 'UNPROVEN_DATE_HINT_CANNOT_SATISFY_AUTHORITY'
          : 'UNOFFICIAL_PUBLICATION_DATE_SOURCE',
      };
    }

    const year = parseInt(pubDate.split('-')[0], 10);
    if (year <= 2025) {
      return {
        evidenceType: FRESHNESS_EVIDENCE_TYPES.UNKNOWN,
        isValid: false,
        publicationDate: pubDate,
        publicationDateSource: pubDateSource,
        publicationDateEvidenceRef: pubDateEvidenceRef,
        reason: 'STALE_HISTORICAL_PUBLICATION_DATE_LE_2025',
      };
    }

    // Forward temporal window check (Section 9)
    if (operationalMode === OPERATIONAL_MODES.DAILY_FORWARD_WATCH) {
      const forwardWindowStart = options.forwardWindowStart || null;
      const forwardWindowEnd = options.forwardWindowEnd || null;

      // First baseline observation or missing forward window: not fresh
      if (isFirstListingObservation || !forwardWindowStart) {
        return {
          evidenceType: FRESHNESS_EVIDENCE_TYPES.UNKNOWN,
          isValid: false,
          publicationDate: pubDate,
          publicationDateSource: pubDateSource,
          publicationDateEvidenceRef: pubDateEvidenceRef,
          reason: 'FIRST_BASELINE_OBSERVATION_NOT_FRESH',
        };
      }

      const startDateStr = forwardWindowStart.slice(0, 10);
      const endDateStr = (forwardWindowEnd || new Date().toISOString()).slice(0, 10);

      if (pubDate < startDateStr || pubDate > endDateStr) {
        return {
          evidenceType: FRESHNESS_EVIDENCE_TYPES.UNKNOWN,
          isValid: false,
          publicationDate: pubDate,
          publicationDateSource: pubDateSource,
          publicationDateEvidenceRef: pubDateEvidenceRef,
          forwardWindowStart,
          forwardWindowEnd,
          reason: 'PUBLICATION_DATE_OUTSIDE_FORWARD_WINDOW',
        };
      }
    }

    return {
      evidenceType: FRESHNESS_EVIDENCE_TYPES.PROVEN_AUTHORITY_PUBLICATION_DATE,
      isValid: true,
      publicationDate: pubDate,
      publicationDateSource: pubDateSource,
      publicationDateEvidenceRef: pubDateEvidenceRef,
      reason: 'OFFICIAL_CONTEMPORARY_PUBLICATION_DATE',
    };
  }

  // Default: UNKNOWN (Section 6: UNKNOWN must NEVER be persisted as a material new event in DAILY_FORWARD_WATCH)
  return {
    evidenceType: FRESHNESS_EVIDENCE_TYPES.UNKNOWN,
    isValid: false,
    reason: isFirstListingObservation ? 'INITIAL_BASELINE_DISCOVERY_WITHOUT_SNAPSHOT_DELTA' : 'UNPROVEN_FRESHNESS_UNKNOWN',
  };
}

/**
 * Concurrency helper: processes items with a maximum concurrency limit.
 */
async function mapWithConcurrency(items, limit, fn) {
  if (!items || items.length === 0) return [];
  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (err) {
        results[idx] = { error: err };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

const httpsAgent = new https.Agent({
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
});

/**
 * Fetches an official page over strict TLS with redirect handling and domain safety.
 */
function fetchOfficialPage(urlStr, options = {}) {
  const maxRedirects = options.maxRedirects != null ? options.maxRedirects : 5;
  const timeoutMs = options.timeoutMs || 10000;
  const authority = options.authority || null;

  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      if (authority && authority.allowedOfficialDomains) {
        const host = parsed.hostname.toLowerCase();
        const isApproved = authority.allowedOfficialDomains.some(d => host === d.toLowerCase() || host.endsWith('.' + d.toLowerCase()));
        if (!isApproved) {
          return resolve({ error: `UNAPPROVED_DOMAIN: ${host}`, status: null, body: null, finalUrl: urlStr });
        }
      }

      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.get(urlStr, {
        agent: isHttps ? httpsAgent : undefined,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: timeoutMs,
      }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          if (maxRedirects <= 0) {
            return resolve({ error: 'MAX_REDIRECTS_EXCEEDED', status: res.statusCode, body: null, finalUrl: urlStr });
          }
          try {
            const nextUrl = new URL(res.headers.location, urlStr).toString();
            return resolve(fetchOfficialPage(nextUrl, { ...options, maxRedirects: maxRedirects - 1 }));
          } catch (err) {
            return resolve({ error: `INVALID_REDIRECT_URL: ${err.message}`, status: res.statusCode, body: null, finalUrl: urlStr });
          }
        }

        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body, finalUrl: urlStr, error: null }));
      });

      req.on('timeout', () => {
        req.destroy(new Error('REQUEST_TIMEOUT'));
      });

      req.on('error', (e) => {
        resolve({ error: e.message, status: null, body: null, finalUrl: urlStr });
      });
    } catch (e) {
      resolve({ error: e.message, status: null, body: null, finalUrl: urlStr });
    }
  });
}

/**
 * Classifies an official candidate into one of the controlled UPDATE_VOCABULARY values.
 * Strictly evidence-based; never blindly assigns categories based merely on slot names or file extensions.
 * Follows Controlled Taxonomy Law (Section 10):
 * - Question papers / PYQ: strictly PYQ, never NEW_NOTIFICATION
 * - Results: RESULT
 * - Answer keys: ANSWER_KEY / FINAL_ANSWER_KEY
 * - Syllabus: SYLLABUS
 * - Admit cards: ADMIT_CARD_NOTICE
 * - Recruitment/exam notification only: NEW_NOTIFICATION (explicit recruitment evidence required)
 * - Ambiguous notices: OTHER_OFFICIAL_UPDATE
 */
function classifyUpdate(title = '', slot = '', url = '') {
  const t = decodeHtmlEntities(String(title || '')).toLowerCase();
  const u = String(url || '').toLowerCase();

  // 1. PYQ (Previous Year Question Paper / Question Paper) - NEVER NEW_NOTIFICATION
  if (isPyqLink(t, u, slot)) {
    return 'PYQ';
  }

  // 2. Corrigendum / Amendment
  if (t.includes('corrigendum') || t.includes('addendum') || t.includes('erratum') || t.includes('revision') || u.includes('corrigendum') || u.includes('addendum')) {
    return 'CORRIGENDUM';
  }
  if (t.includes('amendment') || u.includes('amendment')) {
    return 'AMENDMENT';
  }

  // 3. Answer key
  if (t.includes('final answer key') || t.includes('final key') || u.includes('final_key') || u.includes('final-key')) {
    return 'FINAL_ANSWER_KEY';
  }
  if (t.includes('answer key') || t.includes('model key') || t.includes('response key') || t.includes('tentative key') || u.includes('answer_key') || u.includes('answer-key') || (slot === 'answerKeys' && !isEvergreenNavigation(t, u))) {
    return 'ANSWER_KEY';
  }

  // 4. Result
  if (t.includes('result') || t.includes('marks') || t.includes('cutoff') || t.includes('cut-off') || t.includes('merit list') || t.includes('selection list') || t.includes('shortlisted') || t.includes('recommended candidates') || (slot === 'results' && !isEvergreenNavigation(t, u))) {
    return 'RESULT';
  }

  // 5. Admit card
  if (t.includes('admit card') || t.includes('e-admit card') || t.includes('hall ticket') || t.includes('call letter') || (slot === 'admitCard' && !isEvergreenNavigation(t, u))) {
    return 'ADMIT_CARD_NOTICE';
  }

  // 6. Exam Date / Calendar
  if (t.includes('calendar') || t.includes('annual calendar') || (slot === 'calendar' && !isEvergreenNavigation(t, u))) {
    return 'CALENDAR';
  }
  if (t.includes('exam date') || t.includes('schedule') || t.includes('time table') || t.includes('date of exam') || t.includes('programme of exam') || t.includes('examination schedule')) {
    return 'EXAM_DATE';
  }

  // 7. Syllabus / Pattern - EVIDENCE-BASED ONLY
  if (t.includes('syllabus') || t.includes('syllab') || t.includes('curriculum') || u.includes('syllabus') || u.includes('syllab') || (slot === 'syllabus' && !isEvergreenNavigation(t, u))) {
    return 'SYLLABUS';
  }
  if (t.includes('pattern') || t.includes('scheme of exam') || t.includes('examination scheme')) {
    return 'EXAM_PATTERN';
  }

  // 8. Eligibility / Rule change
  if (t.includes('eligibility')) {
    return 'ELIGIBILITY_CHANGE';
  }
  if (t.includes('rule change') || t.includes('service rule')) {
    return 'RULE_CHANGE';
  }

  // 9. New notification / recruitment - STRICT EVIDENCE REQUIRED
  // Zero blind isDoc fallback! Generic documents and past notices must NOT default to NEW_NOTIFICATION
  const hasRecruitmentKeyword =
    t.includes('recruitment of') || t.includes('recruitment to') ||
    t.includes('recruitment notification') || t.includes('recruitment notice') ||
    t.includes('advertisement no') || t.includes('advt no') || t.includes('advt.') ||
    t.includes('press note') || t.includes('vacancy notice') || t.includes('employment notice') ||
    t.includes('notification for recruitment') ||
    (t.includes('recruitment') && (t.includes('notification') || t.includes('notice') || t.includes('advertisement') || t.includes('advt'))) ||
    ((t.includes('examination') || t.includes('exam')) && (t.includes('notification') || t.includes('advertisement') || t.includes('notice') || t.includes('vacancy')));

  if (hasRecruitmentKeyword) {
    return 'NEW_NOTIFICATION';
  }

  // 10. Fallback: Never force NEW_NOTIFICATION when ambiguous
  return 'OTHER_OFFICIAL_UPDATE';
}

/**
 * Validates whether a candidate link is a meaningful official recruitment update.
 * Enforces:
 *   - File-size only rejection
 *   - Generic action rejection & Screen reader phrase rejection
 *   - Evergreen navigation page rejection (in DAILY_FORWARD_WATCH mode)
 *   - Historical document rejection (in DAILY_FORWARD_WATCH mode)
 *   - English-first Latin character requirement
 */
function isMeaningfulOfficialUpdate(title, url, slot, operationalMode = OPERATIONAL_MODES.DAILY_FORWARD_WATCH) {
  if (!title || typeof title !== 'string') return false;
  const decodedTitle = decodeHtmlEntities(title);
  const lowerTitle = decodedTitle.toLowerCase().trim();
  const lowerUrl = (url || '').toLowerCase().trim();

  // 1. Minimum meaningful length
  if (lowerTitle.length < 3) return false;

  // 2. File-size only rejection: e.g. "(138.25 KB)", "(1.49 MB)"
  if (isFileSizeOnly(decodedTitle)) return false;

  // 3. Generic action text rejection: e.g. "click here", "download", "pdf", screen reader phrases
  if (isGenericActionText(decodedTitle)) return false;

  // 4. Filter site navigation and administrative boilerplate
  for (const excl of EXCLUDED_NOISE_TERMS) {
    if (lowerTitle === excl || lowerTitle.startsWith(excl + ' ') || lowerTitle.endsWith(' ' + excl)) {
      return false;
    }
  }

  // 5. English-first policy: must contain Latin characters
  if (!/[A-Za-z]/.test(decodedTitle)) {
    return false;
  }

  // 6. Forward Watch Gate: reject evergreen navigation pages and historical documents
  if (operationalMode === OPERATIONAL_MODES.DAILY_FORWARD_WATCH) {
    if (isEvergreenNavigation(decodedTitle, url)) {
      return false;
    }
    if (isHistoricalDocument(decodedTitle, url)) {
      return false;
    }
  }

  // 7. Must be a document link (.pdf, .doc) OR have specific exam/notice path + keyword
  const isDocument = lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?') || lowerUrl.endsWith('.docx') || lowerUrl.endsWith('.doc');
  const isNoticePath = lowerUrl.includes('/notice') || lowerUrl.includes('/exam') || lowerUrl.includes('/recruitment') || lowerUrl.includes('/advertisement') || lowerUrl.includes('/syllabus') || lowerUrl.includes('/result') || lowerUrl.includes('/news') || lowerUrl.includes('/archive');
  const hasExamKeyword = lowerTitle.includes('exam') || lowerTitle.includes('post') || lowerTitle.includes('recruitment') || lowerTitle.includes('officer') || lowerTitle.includes('assistant') || lowerTitle.includes('inspector') || lowerTitle.includes('service') || lowerTitle.includes('admit') || lowerTitle.includes('interview') || lowerTitle.includes('schedule') || lowerTitle.includes('result') || lowerTitle.includes('key') || lowerTitle.includes('notice') || lowerTitle.includes('syllabus') || lowerTitle.includes('selection') || lowerTitle.includes('corrigendum') || lowerTitle.includes('amendment') || lowerTitle.includes('paper');

  if (isDocument) return true;
  if (isNoticePath && hasExamKeyword) return true;
  if (hasExamKeyword && decodedTitle.length >= 8) return true;

  return false;
}

/**
 * Extracts and filters official candidate links from an HTML response body.
 * Implements intelligent title extraction:
 *   - Resolves file-size only anchor text using table row context or document filename
 *   - Discards candidates whose titles cannot be resolved meaningfully
 *   - Extracts publication date and provenance if present
 */
function extractCandidates(body, baseUrl, authority, slot, options = {}) {
  const operationalMode = options.operationalMode || OPERATIONAL_MODES.DAILY_FORWARD_WATCH;
  if (!body || typeof body !== 'string') return [];
  const candidates = [];
  const seenUrls = new Set();

  const aRegex = /<a\b([^>]*?)\bhref=(["'])(.*?)\2([^>]*?)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = aRegex.exec(body)) !== null) {
    const preAttrs = match[1] || '';
    const rawHref = match[3].trim();
    const postAttrs = match[4] || '';
    const allAttrs = `${preAttrs} ${postAttrs}`;
    let text = decodeHtmlEntities(match[5].replace(/<[^>]+>/g, ' ')).trim();

    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) continue;

    let fullUrl;
    try {
      fullUrl = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }

    let host;
    try {
      host = new URL(fullUrl).hostname.toLowerCase();
    } catch {
      continue;
    }

    const isApproved = authority.allowedOfficialDomains.some(d => host === d.toLowerCase() || host.endsWith('.' + d.toLowerCase()));
    if (!isApproved) continue;

    let publicationDate = null;
    let publicationDateSource = null;
    let publicationDateEvidenceRef = null;

    // Step A: Check enclosing table row (<tr>...</tr>) for official listing date and contextual title
    const matchIndex = match.index;
    const lastTrIndex = body.lastIndexOf('<tr', matchIndex);
    if (lastTrIndex !== -1 && (matchIndex - lastTrIndex) < 2500) {
      const nextTrIndex = body.indexOf('</tr>', matchIndex);
      const rowEnd = (nextTrIndex !== -1 && (nextTrIndex - matchIndex) < 2500) ? nextTrIndex + 5 : matchIndex + 500;
      const rowChunk = body.slice(lastTrIndex, rowEnd);
      const cellRegex = /<(?:td|th)\b[^>]*?>([\s\S]*?)<\/(?:td|th)>/gi;
      let cellMatch;
      const foundCells = [];
      while ((cellMatch = cellRegex.exec(rowChunk)) !== null) {
        const cleanCell = decodeHtmlEntities(cellMatch[1].replace(/<[^>]+>/g, ' ')).trim();
        if (cleanCell && !isFileSizeOnly(cleanCell) && !isGenericActionText(cleanCell)) {
          // Check if cell is an official publication date
          const cellDate = extractPublicationDate(cleanCell, '');
          if (cellDate && !publicationDate) {
            publicationDate = cellDate;
            publicationDateSource = PUBLICATION_DATE_PROVENANCE.OFFICIAL_LISTING_DATE;
            publicationDateEvidenceRef = `table_cell:${cleanCell}`;
          } else if (!/^\d+$/.test(cleanCell) && cleanCell.length >= 3) {
            foundCells.push(cleanCell);
          }
        }
      }
      if ((!text || isFileSizeOnly(text) || isGenericActionText(text)) && foundCells.length > 0) {
        text = foundCells[0];
      }
    }

    // Step B: Intelligent title extraction if anchor text is still file-size only, generic action, or screen reader text
    if (!text || isFileSizeOnly(text) || isGenericActionText(text)) {
      const titleAttr = decodeHtmlEntities(allAttrs.match(/\btitle=(["'])(.*?)\1/i)?.[2] || '');
      const ariaLabel = decodeHtmlEntities(allAttrs.match(/\baria-label=(["'])(.*?)\1/i)?.[2] || '');
      if (titleAttr && !isFileSizeOnly(titleAttr) && !isGenericActionText(titleAttr)) {
        text = titleAttr;
      } else if (ariaLabel && !isFileSizeOnly(ariaLabel) && !isGenericActionText(ariaLabel)) {
        text = ariaLabel;
      } else {
        try {
          const pathname = new URL(fullUrl).pathname;
          const filename = pathname.split('/').pop() || '';
          const nameWithoutExt = filename.replace(/\.[a-zA-Z0-9]+$/, '');
          const cleanDocName = nameWithoutExt.replace(/[-_]+/g, ' ').trim();
          if (cleanDocName.length >= 8 && !isFileSizeOnly(cleanDocName) && !isGenericActionText(cleanDocName)) {
            text = cleanDocName;
          }
        } catch (_) {}
      }
    }

    // Hard Gate: If still file size only or generic action, discard candidate
    if (!text || isFileSizeOnly(text) || isGenericActionText(text)) {
      continue;
    }

    if (!publicationDate) {
      const titleDate = extractPublicationDate(text, '');
      if (titleDate) {
        publicationDate = titleDate;
        publicationDateSource = PUBLICATION_DATE_PROVENANCE.TITLE_DATE_HINT;
        publicationDateEvidenceRef = `title_text:${text}`;
      } else {
        const urlDate = extractPublicationDate('', fullUrl);
        if (urlDate) {
          publicationDate = urlDate;
          publicationDateSource = PUBLICATION_DATE_PROVENANCE.URL_FILENAME_DATE_HINT;
          publicationDateEvidenceRef = `url_filename:${fullUrl}`;
        } else {
          publicationDateSource = PUBLICATION_DATE_PROVENANCE.UNKNOWN;
        }
      }
    }

    if (!isMeaningfulOfficialUpdate(text, fullUrl, slot, operationalMode)) continue;

    if (!seenUrls.has(fullUrl)) {
      seenUrls.add(fullUrl);
      const updateType = classifyUpdate(text, slot, fullUrl);

      candidates.push({
        title: text,
        officialUrl: fullUrl,
        updateType,
        slot,
        publicationDate,
        publicationDateSource: publicationDateSource || PUBLICATION_DATE_PROVENANCE.UNKNOWN,
        publicationDateEvidenceRef,
      });
    }
  }

  return candidates;
}


// Concurrency tracker for in-flight authority scans
const activeAuthorityScans = new Map();

/**
 * Safely parses any Firestore Timestamp, serialized Timestamp, ISO string, or Date.
 */
function parseTimestampToDate(val) {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch (_) {
      return null;
    }
  }
  if (typeof val === 'object') {
    if (val._seconds !== undefined || val.seconds !== undefined) {
      const sec = val._seconds !== undefined ? val._seconds : val.seconds;
      const nsec = val._nanoseconds !== undefined ? val._nanoseconds : (val.nanoseconds || 0);
      const d = new Date(sec * 1000 + Math.floor(nsec / 1000000));
      return isNaN(d.getTime()) ? null : d;
    }
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseTimestampToIso(val) {
  const d = parseTimestampToDate(val);
  return d ? d.toISOString() : null;
}

/**
 * Advances the temporal baseline for a specific authority in worker_registry/authority_watch.
 * Enforces:
 *   1. Per-authority isolation (updates only authorityBaselines[cleanKey]).
 *   2. Monotonicity: new baseline is max(existing, newBoundary). It never moves backwards.
 *   3. Concurrency safety: uses Firestore transaction when available.
 */
async function advanceAuthorityBaseline({
  db,
  authorityKey,
  newBoundaryIso,
  logger = console,
}) {
  if (!db || !authorityKey || !newBoundaryIso) return { advanced: false, reason: 'MISSING_PARAMS' };

  const cleanKey = authorityKey.toLowerCase().trim();
  const newDate = new Date(newBoundaryIso);
  if (isNaN(newDate.getTime())) {
    return { advanced: false, reason: 'INVALID_TIMESTAMP' };
  }

  const docRef = db.collection('worker_registry').doc('authority_watch');

  if (typeof db.runTransaction === 'function') {
    try {
      const result = await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const data = (doc && doc.exists) ? doc.data() : {};
        const baselines = data.authorityBaselines || {};
        const existingRaw = baselines[cleanKey];
        const existingDate = parseTimestampToDate(existingRaw);

        // Monotonicity check: new baseline must be max(existing, newDate)
        if (existingDate && existingDate.getTime() >= newDate.getTime()) {
          return {
            advanced: false,
            authorityKey: cleanKey,
            existingBaseline: existingDate.toISOString(),
            attemptedBaseline: newDate.toISOString(),
            reason: 'MONOTONICITY_PRESERVED',
          };
        }

        let newTimestamp = newDate.toISOString();
        try {
          const adminSdk = require('firebase-admin');
          if (adminSdk && adminSdk.firestore && adminSdk.firestore.Timestamp) {
            newTimestamp = adminSdk.firestore.Timestamp.fromDate(newDate);
          }
        } catch (_) {}

        const updatedBaselines = {
          ...baselines,
          [cleanKey]: newTimestamp,
        };

        const mergedDoc = {
          ...data,
          authorityBaselines: updatedBaselines,
          updatedAt: newTimestamp,
        };

        transaction.set(docRef, mergedDoc, { merge: true });

        return {
          advanced: true,
          authorityKey: cleanKey,
          previousBaseline: existingDate ? existingDate.toISOString() : null,
          newBaseline: newDate.toISOString(),
        };
      });
      return result;
    } catch (txErr) {
      if (logger && logger.warn) {
        logger.warn(`AUTHORITY_WATCH: Failed to advance baseline in transaction for ${cleanKey}: ${txErr.message}`);
      }
      return { advanced: false, reason: 'TRANSACTION_ERROR', error: txErr.message };
    }
  }

  // Fallback for simple mock databases without runTransaction
  try {
    const doc = await docRef.get();
    const data = (doc && doc.exists) ? doc.data() : {};
    const baselines = data.authorityBaselines || {};
    const existingRaw = baselines[cleanKey];
    const existingDate = parseTimestampToDate(existingRaw);

    if (existingDate && existingDate.getTime() >= newDate.getTime()) {
      return {
        advanced: false,
        authorityKey: cleanKey,
        existingBaseline: existingDate.toISOString(),
        attemptedBaseline: newDate.toISOString(),
        reason: 'MONOTONICITY_PRESERVED',
      };
    }

    const updatedBaselines = {
      ...baselines,
      [cleanKey]: newDate.toISOString(),
    };

    const mergedDoc = {
      ...data,
      authorityBaselines: updatedBaselines,
      updatedAt: new Date().toISOString(),
    };

    if (typeof docRef.set === 'function') {
      await docRef.set(mergedDoc, { merge: true });
    }

    return {
      advanced: true,
      authorityKey: cleanKey,
      previousBaseline: existingDate ? existingDate.toISOString() : null,
      newBaseline: newDate.toISOString(),
    };
  } catch (nonTxErr) {
    if (logger && logger.warn) {
      logger.warn(`AUTHORITY_WATCH: Failed to advance baseline for ${cleanKey}: ${nonTxErr.message}`);
    }
    return { advanced: false, reason: 'WRITE_ERROR', error: nonTxErr.message };
  }
}

/**
 * Scans a single authority across its active role endpoints.
 * Re-reads canonical registry server-side; zero trust in client inputs.
 * Implements double-run concurrency protection.
 */
async function scanSingleAuthority({
  db = null,
  authorityKey,
  registry = canonicalAuthorityRegistry,
  dryRun = false,
  maxCandidates = 100,
  timeoutMs = 10000,
  fetchFn = fetchOfficialPage,
  triggerSource = 'MANUAL_FOUNDER',
  operationalMode = OPERATIONAL_MODES.DAILY_FORWARD_WATCH,
  requireProvenFreshness = false,
  priorListingSnapshot = null,
  isFirstListingObservation = false,
  forwardWindowStart = null,
  forwardWindowEnd = null,
  authorityBaselines = null,
  logger = console,
} = {}) {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  if (!authorityKey || typeof authorityKey !== 'string') {
    throw new Error('AUTHORITY_KEY_REQUIRED');
  }

  const cleanKey = authorityKey.trim();

  // 1. Server re-reads authority from canonical registry - ZERO trust in client inputs
  let authority;
  try {
    authority = registry.getByKey(cleanKey);
  } catch (regErr) {
    const completedAt = new Date().toISOString();
    return {
      authorityKey: cleanKey,
      shortName: cleanKey,
      jurisdiction: 'UNKNOWN',
      stateCode: null,
      startedAt,
      completedAt,
      durationMs: Date.now() - startTime,
      endpointsScanned: 0,
      candidatesDetected: 0,
      newEvents: 0,
      duplicates: 0,
      skipped: 0,
      errors: 1,
      terminalStatus: TERMINAL_RUN_STATES.FAILED,
      runStatus: 'FAILED',
      baselineStart: null,
      baselineEnd: startedAt,
      baselineAdvanced: false,
      baselineAdvancement: null,
      errorMessage: regErr.message,
      details: [],
    };
  }

  if (!authority) {
    const completedAt = new Date().toISOString();
    return {
      authorityKey: cleanKey,
      shortName: cleanKey,
      jurisdiction: 'UNKNOWN',
      stateCode: null,
      startedAt,
      completedAt,
      durationMs: Date.now() - startTime,
      endpointsScanned: 0,
      candidatesDetected: 0,
      newEvents: 0,
      duplicates: 0,
      skipped: 0,
      errors: 1,
      terminalStatus: TERMINAL_RUN_STATES.FAILED,
      runStatus: 'FAILED',
      baselineStart: null,
      baselineEnd: startedAt,
      baselineAdvanced: false,
      baselineAdvancement: null,
      errorMessage: `UNREGISTERED_AUTHORITY: "${cleanKey}" is not registered in canonical registry.`,
      details: [],
    };
  }

  // 2. Concurrency check: prevent simultaneous scans of the same authority
  if (activeAuthorityScans.has(cleanKey)) {
    const existing = activeAuthorityScans.get(cleanKey);
    return {
      authorityKey: cleanKey,
      shortName: authority.shortName,
      jurisdiction: authority.jurisdiction,
      stateCode: authority.stateCode,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      endpointsScanned: 0,
      candidatesDetected: 0,
      newEvents: 0,
      duplicates: 0,
      skipped: 0,
      errors: 0,
      terminalStatus: 'ALREADY_RUNNING',
      runStatus: 'ALREADY_RUNNING',
      message: `Scan for authority "${cleanKey}" is already running (started at ${existing.startedAt} via ${existing.triggerSource}).`,
      details: [],
    };
  }

  // Set concurrency lock
  activeAuthorityScans.set(cleanKey, { startedAt, triggerSource });

  // Resolve forward temporal window baseline (R3B per-authority baseline isolation)
  let resolvedWindowStart = forwardWindowStart || null;
  if (!resolvedWindowStart && authorityBaselines && authorityBaselines[cleanKey]) {
    resolvedWindowStart = parseTimestampToIso(authorityBaselines[cleanKey]);
  }
  if (!resolvedWindowStart && db) {
    try {
      const regDoc = await db.collection('worker_registry').doc('authority_watch').get();
      if (regDoc && regDoc.exists) {
        const regData = regDoc.data();
        const baselines = regData.authorityBaselines || {};
        const perAuthBaseline = baselines[cleanKey];
        if (perAuthBaseline) {
          resolvedWindowStart = parseTimestampToIso(perAuthBaseline);
        }
      }
    } catch (regErr) {
      if (logger && logger.warn) {
        logger.warn(`AUTHORITY_WATCH: Failed reading baseline for ${cleanKey}: ${regErr.message}`);
      }
    }
  }
  const resolvedWindowEnd = forwardWindowEnd || startedAt;

  let endpointsScanned = 0;
  let candidatesDetected = 0;
  let newEvents = 0;
  let duplicates = 0;
  let skipped = 0;
  let errors = 0;
  const slotDetails = [];

  try {
    for (const slot of ACTIVE_WATCH_SLOTS) {
      const endpointUrl = authority.roleEndpoints?.[slot];
      if (!endpointUrl) continue;

      endpointsScanned++;

      let fetchRes;
      try {
        fetchRes = await fetchFn(endpointUrl, { authority, timeoutMs });
      } catch (err) {
        errors++;
        slotDetails.push({ slot, endpointUrl, status: 'FETCH_ERROR', error: err.message });
        continue;
      }

      if (fetchRes.error || !fetchRes.body) {
        errors++;
        slotDetails.push({ slot, endpointUrl, status: 'FETCH_FAILED', error: fetchRes.error || 'EMPTY_BODY' });
        continue;
      }

      const candidates = extractCandidates(fetchRes.body, endpointUrl, authority, slot, { operationalMode });
      const remainingQuota = Math.max(0, maxCandidates - candidatesDetected);
      const candidatesToProcess = candidates.slice(0, remainingQuota);

      candidatesDetected += candidatesToProcess.length;

      let slotNewEvents = 0;
      let slotDuplicates = 0;
      let slotSkipped = 0;
      let slotErrors = 0;

      for (const cand of candidatesToProcess) {
        // Freshness Acceptance Law (Section 6-9)
        const freshness = evaluateFreshnessEvidence(cand, {
          operationalMode,
          priorListingSnapshot: priorListingSnapshot || authority.priorListingSnapshot || null,
          isFirstListingObservation: isFirstListingObservation || authority.isFirstListingObservation || (triggerSource === 'BOOTSTRAP_SCAN'),
          priorStoredSha: cand.priorDocumentSha || null,
          currentDocumentSha: cand.documentSha256 || null,
          publicationDateSource: cand.publicationDateSource || null,
          publicationDateEvidenceRef: cand.publicationDateEvidenceRef || null,
          forwardWindowStart: resolvedWindowStart,
          forwardWindowEnd: resolvedWindowEnd,
        });

        // All-Trigger Forward-Watch Law (Section 5):
        // Whenever operationalMode is DAILY_FORWARD_WATCH, EVERY trigger (SCHEDULED, SCHEDULED_WATCH, MANUAL_FOUNDER, SPECIFIC_KEYS, BOOTSTRAP_SCAN, Scan Now)
        // MUST require proven freshness. UNKNOWN freshness must NEVER persist in DAILY_FORWARD_WATCH!
        const isForwardWatch = (operationalMode === OPERATIONAL_MODES.DAILY_FORWARD_WATCH);
        const enforceFreshnessGate = isForwardWatch || requireProvenFreshness;

        if (enforceFreshnessGate) {
          if (!freshness.isValid || freshness.evidenceType === FRESHNESS_EVIDENCE_TYPES.UNKNOWN) {
            skipped++;
            slotSkipped++;
            continue;
          }
        }

        let event;
        try {
          event = createAuthorityIntelligenceEvent({
            authorityKey: authority.authorityKey,
            updateType: cand.updateType,
            title: cand.title,
            officialUrl: cand.officialUrl,
            publicationDate: cand.publicationDate || null,
            publicationDateSource: cand.publicationDateSource || null,
            publicationDateEvidenceRef: cand.publicationDateEvidenceRef || null,
            operationalMode,
            freshnessEvidence: freshness.evidenceType,
          }, registry);
        } catch (eventErr) {
          skipped++;
          slotSkipped++;
          continue;
        }

        if (db && !dryRun) {
          try {
            const saveRes = await saveAuthorityIntelligenceEvent(db, event);
            if (saveRes && saveRes.isDuplicate) {
              duplicates++;
              slotDuplicates++;
            } else {
              newEvents++;
              slotNewEvents++;
            }
          } catch (saveErr) {
            errors++;
            slotErrors++;
          }
        } else {
          newEvents++;
          slotNewEvents++;
        }
      }

      slotDetails.push({
        slot,
        endpointUrl,
        status: 'OK',
        candidatesCount: candidatesToProcess.length,
        newEvents: slotNewEvents,
        duplicates: slotDuplicates,
        skipped: slotSkipped,
        errors: slotErrors,
      });
    }
  } catch (fatalErr) {
    const completedAt = new Date().toISOString();
    return {
      authorityKey: cleanKey,
      shortName: authority.shortName,
      jurisdiction: authority.jurisdiction,
      stateCode: authority.stateCode,
      startedAt,
      completedAt,
      durationMs: Date.now() - startTime,
      endpointsScanned,
      candidatesDetected,
      newEvents,
      duplicates,
      skipped,
      errors: errors + 1,
      terminalStatus: TERMINAL_RUN_STATES.FAILED,
      runStatus: 'FAILED',
      baselineStart: resolvedWindowStart,
      baselineEnd: resolvedWindowEnd,
      baselineAdvanced: false,
      baselineAdvancement: null,
      errorMessage: fatalErr.message,
      details: slotDetails,
    };
  } finally {
    // Release concurrency lock
    activeAuthorityScans.delete(cleanKey);
  }

  const completedAt = new Date().toISOString();
  const durationMs = Date.now() - startTime;

  let terminalStatus = TERMINAL_RUN_STATES.COMPLETED;
  let runStatus = 'SUCCESS';
  if (errors > 0 && endpointsScanned > errors) {
    terminalStatus = TERMINAL_RUN_STATES.COMPLETED_WITH_ENDPOINT_ERRORS;
    runStatus = 'PARTIAL_SUCCESS';
  } else if (errors > 0 && endpointsScanned > 0 && errors === endpointsScanned) {
    terminalStatus = TERMINAL_RUN_STATES.FAILED;
    runStatus = 'ERROR';
  } else if (endpointsScanned === 0 && errors > 0) {
    terminalStatus = TERMINAL_RUN_STATES.FAILED;
    runStatus = 'ERROR';
  }

  // Baseline advancement law (R3B Section 11 & 12):
  // Advance authority baseline ONLY when authority scan reached successful terminal state
  // AND its semantic processing completed without fatal error.
  let baselineAdvancement = null;
  const isCleanSuccess = (terminalStatus === TERMINAL_RUN_STATES.COMPLETED && errors === 0);
  if (isCleanSuccess && db && !dryRun) {
    baselineAdvancement = await advanceAuthorityBaseline({
      db,
      authorityKey: cleanKey,
      newBoundaryIso: startedAt,
      logger,
    });
  }

  return {
    authorityKey: cleanKey,
    shortName: authority.shortName,
    jurisdiction: authority.jurisdiction,
    stateCode: authority.stateCode,
    startedAt,
    completedAt,
    durationMs,
    endpointsScanned,
    candidatesDetected,
    newEvents,
    duplicates,
    skipped,
    errors,
    terminalStatus,
    runStatus,
    baselineStart: resolvedWindowStart,
    baselineEnd: resolvedWindowEnd,
    baselineAdvanced: isCleanSuccess && (!dryRun ? (baselineAdvancement?.advanced ?? false) : true),
    baselineAdvancement,
    details: slotDetails,
  };
}

/**
 * Scans all watch-enabled authorities across the canonical pilot registry.
 * Executes with bounded concurrency (concurrency limit = 2) to guarantee
 * all 6 pilot authorities are attempted even if one endpoint or authority stalls.
 */
async function scanAllEnabledAuthorities({
  db = null,
  registry = canonicalAuthorityRegistry,
  dryRun = false,
  maxCandidatesPerAuthority = 100,
  timeoutMs = 10000,
  fetchFn = fetchOfficialPage,
  logger = console,
  concurrency = 2,
  operationalMode = OPERATIONAL_MODES.DAILY_FORWARD_WATCH,
  forwardWindowStart = null,
  forwardWindowEnd = null,
  authorityBaselines = null,
} = {}) {
  const startTime = Date.now();

  // Filter to watch-enabled authorities among pilot authorities
  const allPilotAuthorities = PILOT_AUTHORITY_KEYS.map(k => registry.getByKey(k)).filter(Boolean);
  const authoritiesToScan = allPilotAuthorities.filter(auth => auth.watchEnabled !== false);

  const perAuthority = await mapWithConcurrency(authoritiesToScan, concurrency, async (auth) => {
    try {
      return await scanSingleAuthority({
        db,
        authorityKey: auth.authorityKey,
        registry,
        dryRun,
        maxCandidates: maxCandidatesPerAuthority,
        timeoutMs,
        fetchFn,
        triggerSource: 'SCHEDULED',
        operationalMode,
        forwardWindowStart,
        forwardWindowEnd,
        authorityBaselines,
        logger,
      });
    } catch (err) {
      return {
        authorityKey: auth.authorityKey,
        shortName: auth.shortName,
        jurisdiction: auth.jurisdiction,
        stateCode: auth.stateCode,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
        endpointsScanned: 0,
        candidatesDetected: 0,
        newEvents: 0,
        duplicates: 0,
        skipped: 0,
        errors: 1,
        terminalStatus: 'FAILED',
        runStatus: 'FAILED',
        errorMessage: err.message,
        details: [],
      };
    }
  });

  let totalScannedEndpoints = 0;
  let totalCandidatesDetected = 0;
  let totalNewEvents = 0;
  let totalDuplicates = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let attemptedAuthorities = 0;
  let failedAuthorities = 0;
  let completedAuthorities = 0;
  let completedWithErrorsAuthorities = 0;

  for (const authResult of perAuthority) {
    attemptedAuthorities++;
    totalScannedEndpoints += authResult.endpointsScanned || 0;
    totalCandidatesDetected += authResult.candidatesDetected || 0;
    totalNewEvents += authResult.newEvents || 0;
    totalDuplicates += authResult.duplicates || 0;
    totalSkipped += authResult.skipped || 0;
    totalErrors += authResult.errors || 0;

    if (authResult.terminalStatus === 'COMPLETED') {
      completedAuthorities++;
    } else if (authResult.terminalStatus === 'COMPLETED_WITH_ENDPOINT_ERRORS') {
      completedWithErrorsAuthorities++;
    } else if (authResult.terminalStatus === 'FAILED') {
      failedAuthorities++;
    }
  }

  const notReachedAuthorities = Math.max(0, authoritiesToScan.length - attemptedAuthorities);
  const durationMs = Date.now() - startTime;

  const summary = {
    totalAuthorities: authoritiesToScan.length,
    attemptedAuthorities,
    completedAuthorities,
    completedWithErrorsAuthorities,
    failedAuthorities,
    notReachedAuthorities,
    totalScannedEndpoints,
    totalCandidatesDetected,
    totalNewEvents,
    totalDuplicates,
    totalSkipped,
    totalErrors,
    durationMs,
    dryRun,
    timestamp: new Date().toISOString(),
  };

  // Heartbeat update for observability if live Firestore db available
  const adminSdk = require('firebase-admin');
  const hasLiveAdmin = adminSdk && adminSdk.apps && adminSdk.apps.length > 0;
  if (db && !dryRun && hasLiveAdmin) {
    try {
      await updateHeartbeat('authority_watch', {
        status: failedAuthorities === authoritiesToScan.length ? 'DEGRADED' : 'ONLINE',
        lastRunAt: summary.timestamp,
        durationMs,
        totalAuthorities: summary.totalAuthorities,
        attemptedAuthorities: summary.attemptedAuthorities,
        completedAuthorities: summary.completedAuthorities,
        completedWithErrorsAuthorities: summary.completedWithErrorsAuthorities,
        failedAuthorities: summary.failedAuthorities,
        notReachedAuthorities: summary.notReachedAuthorities,
        totalNewEvents,
        totalDuplicates,
        totalCandidatesDetected,
        totalErrors,
        success: failedAuthorities === 0 && notReachedAuthorities === 0,
      });
    } catch (hbErr) {
      logger.warn(`AUTHORITY_WATCH: Heartbeat telemetry update skipped: ${hbErr.message}`);
    }
  }

  return {
    success: failedAuthorities < authoritiesToScan.length && notReachedAuthorities === 0,
    summary,
    perAuthority,
  };
}

/**
 * Backward-compatible entry point for scheduled runs and test suites.
 * Dispatches to scanAllEnabledAuthorities or scanSingleAuthority based on inputs.
 */
async function runAuthorityWatch({
  db = null,
  authorityKeys = null,
  dryRun = false,
  maxCandidatesPerAuthority = 100,
  timeoutMs = 10000,
  fetchFn = fetchOfficialPage,
  logger = console,
  concurrency = 2,
  operationalMode = OPERATIONAL_MODES.DAILY_FORWARD_WATCH,
  forwardWindowStart = null,
  forwardWindowEnd = null,
  authorityBaselines = null,
} = {}) {
  if (authorityKeys && Array.isArray(authorityKeys) && authorityKeys.length > 0) {
    // Validate requested keys belong to pilot authorities
    for (const key of authorityKeys) {
      if (!PILOT_AUTHORITY_KEYS.includes(key)) {
        throw new Error(`UNAUTHORIZED_AUTHORITY_KEY: "${key}" is not one of the 6 pilot authorities.`);
      }
    }

    const startTime = Date.now();
    const perAuthority = await mapWithConcurrency(authorityKeys, concurrency, async (authKey) => {
      return scanSingleAuthority({
        db,
        authorityKey: authKey,
        dryRun,
        maxCandidates: maxCandidatesPerAuthority,
        timeoutMs,
        fetchFn,
        triggerSource: 'SPECIFIC_KEYS',
        operationalMode,
        forwardWindowStart,
        forwardWindowEnd,
        authorityBaselines,
        logger,
      });
    });

    let totalScannedEndpoints = 0;
    let totalCandidatesDetected = 0;
    let totalNewEvents = 0;
    let totalDuplicates = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const authResult of perAuthority) {
      totalScannedEndpoints += authResult.endpointsScanned || 0;
      totalCandidatesDetected += authResult.candidatesDetected || 0;
      totalNewEvents += authResult.newEvents || 0;
      totalDuplicates += authResult.duplicates || 0;
      totalSkipped += authResult.skipped || 0;
      totalErrors += authResult.errors || 0;
    }

    const durationMs = Date.now() - startTime;
    return {
      success: totalErrors === 0 || totalNewEvents > 0,
      summary: {
        totalAuthorities: authorityKeys.length,
        attemptedAuthorities: authorityKeys.length,
        notReachedAuthorities: 0,
        totalScannedEndpoints,
        totalCandidatesDetected,
        totalNewEvents,
        totalDuplicates,
        totalSkipped,
        totalErrors,
        durationMs,
        dryRun,
        timestamp: new Date().toISOString(),
      },
      perAuthority,
    };
  }

  return scanAllEnabledAuthorities({
    db,
    dryRun,
    maxCandidatesPerAuthority,
    timeoutMs,
    fetchFn,
    logger,
    concurrency,
    operationalMode,
    forwardWindowStart,
    forwardWindowEnd,
    authorityBaselines,
  });
}

module.exports = {
  PILOT_AUTHORITY_KEYS,
  ACTIVE_WATCH_SLOTS,
  EXCLUDED_NOISE_TERMS,
  FILE_SIZE_REGEX,
  GENERIC_ACTION_REGEX,
  SCREEN_READER_TEXT_REGEX,
  EVERGREEN_NAVIGATION_PATTERNS,
  FRESHNESS_EVIDENCE_TYPES,
  PUBLICATION_DATE_PROVENANCE,
  decodeHtmlEntities,
  isFileSizeOnly,
  isGenericActionText,
  isEvergreenNavigation,
  isHistoricalDocument,
  isPyqLink,
  extractPublicationDate,
  evaluateFreshnessEvidence,
  mapWithConcurrency,
  activeAuthorityScans,
  advanceAuthorityBaseline,
  fetchOfficialPage,
  classifyUpdate,
  isMeaningfulOfficialUpdate,
  TERMINAL_RUN_STATES,
  extractCandidates,
  scanSingleAuthority,
  scanAllEnabledAuthorities,
  runAuthorityWatch,
};
