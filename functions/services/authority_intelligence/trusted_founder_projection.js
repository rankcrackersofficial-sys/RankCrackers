/**
 * 🔱 OFFICIAL AUTHORITY WATCH R4 TRUSTED FOUNDER PROJECTION CONTRACT
 * Command: RC-AUTHORITY-WATCH-R4-TRUSTED-PROJECTION-IMPLEMENTATION-AG1-20260916
 *
 * Laws:
 *   - Raw historical authority_intelligence_events are strictly IMMUTABLE.
 *   - Pure deterministic projection layer over raw events without modifying physical stored fields.
 *   - Converts raw discovery evidence into governed Founder read projection.
 *   - Trust states: TRUSTED_CURRENT, REJECTED_CURRENT, REJECTED_LEGACY, FORENSIC_ONLY.
 *   - Source types: SECTION_PAGE, EXACT_UPDATE_DOCUMENT, EXAM_PORTAL, GENERIC_NAVIGATION, OTHER_SOURCE_OBJECT.
 *   - Terminal run states: COMPLETED, COMPLETED_WITH_ERRORS, FAILED, TIMEOUT, NOT_REACHED.
 *   - Only COMPLETED may advance that authority's baseline.
 *   - First observation yields zero trusted events.
 *   - No title/URL date hint may prove freshness.
 *   - Zero fuzzy / title / filename-only / LLM mission binding.
 *   - CSE_PRELIMS_FALSE_BIND_COUNT is strictly 0.
 */

'use strict';

const {
  deepFreeze,
  UPDATE_VOCABULARY,
  TRUST_STATES,
  SOURCE_OBJECT_TYPES,
  TERMINAL_RUN_STATES,
} = require('./registry_schema');
const { canonicalAuthorityRegistry } = require('./authority_registry_loader');
const {
  PILOT_AUTHORITY_KEYS,
  decodeHtmlEntities,
  FILE_SIZE_REGEX,
  GENERIC_ACTION_REGEX,
  SCREEN_READER_TEXT_REGEX,
  EXCLUDED_NOISE_TERMS,
  isEvergreenNavigation,
  isPyqLink,
  isHistoricalDocument,
} = require('./authority_watch_scanner');
const {
  resolveCanonicalMissionId,
  resolveCanonicalExamKey,
  resolveCanonicalAuthorityKey,
  GOVERNED_EXAM_AUTHORITY_COMPATIBILITY,
  GOVERNED_EXAM_ALIASES,
  normalizeCanonicalToken,
  stripYearDecoration,
} = require('../../canonical_mission_registry');

// Known exam-specific portal domain prefixes/roots
const EXAM_PORTAL_DOMAINS = Object.freeze([
  'jeemain.nta.nic.in',
  'neet.nta.nic.in',
  'exams.nta.nic.in',
  'cuet.nta.nic.in',
  'ugcnet.nta.nic.in',
  'upsconline.nic.in',
  'upsconline.gov.in',
  'dsssbonline.nic.in',
  'rsmssb.rajasthan.gov.in',
]);

// Known active section listing paths
const SECTION_PAGE_PATH_PATTERNS = Object.freeze([
  /^\/examinations\/active-examinations/i,
  /^\/examinations\/forthcoming-examinations/i,
  /^\/examinations\/active-exams/i,
  /^\/examinations\/forthcoming-exams/i,
  /^\/recruitment\/recruitment-advertisement/i,
  /^\/recruitment\/status-recruitment-cases/i,
  /^\/news(\/|$)/i,
  /^\/advertisements(\/|$)/i,
  /^\/syllabus(\/|$)/i,
  /^\/examinations\/revised-syllabus/i,
  /^\/examinations\/examination-calendar/i,
  /^\/examinations\/written-results/i,
  /^\/examinations\/answer-key/i,
  /^\/examinations\/answer-keys/i,
  /^\/examinations\/previous-question-papers/i,
  /^\/examscheme(\/|$)/i,
  /^\/oldpapers(\/|$)/i,
  /^\/results(\/|$)/i,
  /^\/answerkeys(\/|$)/i,
  /^\/examdashboard(\/|$)/i,
  /NoticeBoardArchive/i,
  /notice-?board/i,
  /whats-new/i,
  /current-vacancies/i,
]);

// Document extensions indicating downloadable update documents
const DOCUMENT_EXTENSIONS_REGEX = /\.(pdf|docx?|xlsx?|zip)(\?.*)?$/i;

/**
 * Classifies an official URL and title into one of the 5 required SOURCE_OBJECT_TYPES.
 * Supports both object signature ({ url, title }) and positional (rawUrl, rawTitle).
 */
function classifySourceObject(arg1, rawTitle) {
  let urlStr = '';
  let titleStr = '';

  if (arg1 && typeof arg1 === 'object') {
    urlStr = String(arg1.url || arg1.officialUrl || arg1.canonicalUrl || arg1.normalizedUrl || '').trim();
    titleStr = decodeHtmlEntities(arg1.title || '');
  } else {
    urlStr = String(arg1 || '').trim();
    titleStr = decodeHtmlEntities(rawTitle || '');
  }

  let resolvedType = SOURCE_OBJECT_TYPES.OTHER_SOURCE_OBJECT;

  if (urlStr) {
    let parsedUrl = null;
    try {
      parsedUrl = new URL(urlStr);
    } catch (e) {
      resolvedType = SOURCE_OBJECT_TYPES.OTHER_SOURCE_OBJECT;
    }

    if (parsedUrl) {
      const hostname = parsedUrl.hostname.toLowerCase();
      const pathname = parsedUrl.pathname.toLowerCase();

      // 1. Exact update document check (.pdf, .doc, .zip, or explicit document download path)
      if (DOCUMENT_EXTENSIONS_REGEX.test(pathname) || DOCUMENT_EXTENSIONS_REGEX.test(urlStr)) {
        resolvedType = SOURCE_OBJECT_TYPES.EXACT_UPDATE_DOCUMENT;
      } else if (pathname.includes('/download/notice/') || pathname.includes('/sites/default/files/') || pathname.includes('/quespapers/')) {
        if (pathname.endsWith('.pdf') || urlStr.toLowerCase().includes('.pdf')) {
          resolvedType = SOURCE_OBJECT_TYPES.EXACT_UPDATE_DOCUMENT;
        }
      }

      // 2. Domain root / portal home check
      if (resolvedType === SOURCE_OBJECT_TYPES.OTHER_SOURCE_OBJECT) {
        if (pathname === '/' || pathname === '' || pathname === '/index.html' || pathname === '/index.php' || pathname === '/default.aspx') {
          const isExamPortal = EXAM_PORTAL_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
          // Official pilot portal domains are also EXAM_PORTAL
          const isPilotDomain = ['upsc.gov.in', 'ssc.gov.in', 'nta.ac.in', 'rpsc.rajasthan.gov.in', 'rssb.rajasthan.gov.in', 'dsssb.delhi.gov.in']
            .some(d => hostname === d || hostname.endsWith('.' + d));

          if (isExamPortal || isPilotDomain) {
            resolvedType = SOURCE_OBJECT_TYPES.EXAM_PORTAL;
          } else {
            resolvedType = SOURCE_OBJECT_TYPES.GENERIC_NAVIGATION;
          }
        }
      }

      // 3. Generic navigation check (evergreen navigation, noise terms)
      if (resolvedType === SOURCE_OBJECT_TYPES.OTHER_SOURCE_OBJECT) {
        const isEvergreen = isEvergreenNavigation(titleStr, urlStr);
        const isNoise = EXCLUDED_NOISE_TERMS.some(term => {
          const t = term.toLowerCase();
          return titleStr.toLowerCase() === t || pathname === `/${t}` || pathname.includes(`/${t.replace(/\s+/g, '-')}`);
        });

        if (isEvergreen || isNoise) {
          resolvedType = SOURCE_OBJECT_TYPES.GENERIC_NAVIGATION;
        }
      }

      // 4. Exam Portal check (subdomain portal sub-paths that are not documents)
      if (resolvedType === SOURCE_OBJECT_TYPES.OTHER_SOURCE_OBJECT) {
        const isExamPortalDomain = EXAM_PORTAL_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
        if (isExamPortalDomain && (pathname === '/' || pathname === '/app' || pathname === '/registration' || pathname === '/candidate')) {
          resolvedType = SOURCE_OBJECT_TYPES.EXAM_PORTAL;
        }
      }

      // 5. Section page check (known role listing endpoints, notice archives)
      if (resolvedType === SOURCE_OBJECT_TYPES.OTHER_SOURCE_OBJECT) {
        const isSection = SECTION_PAGE_PATH_PATTERNS.some(p => p.test(parsedUrl.pathname));
        if (isSection) {
          resolvedType = SOURCE_OBJECT_TYPES.SECTION_PAGE;
        }
      }
    }
  }

  return {
    sourceObjectType: resolvedType,
    type: resolvedType,
    isTerminalDocument: resolvedType === SOURCE_OBJECT_TYPES.EXACT_UPDATE_DOCUMENT,
    isSectionPage: resolvedType === SOURCE_OBJECT_TYPES.SECTION_PAGE,
    isExamPortal: resolvedType === SOURCE_OBJECT_TYPES.EXAM_PORTAL,
    isGenericNavigation: resolvedType === SOURCE_OBJECT_TYPES.GENERIC_NAVIGATION,
    toString: () => resolvedType,
    valueOf: () => resolvedType,
  };
}

/**
 * Hardens and normalizes updateType into the controlled 15-item UPDATE_VOCABULARY.
 * Supports both object signature ({ rawType, title, url, slot }) and positional (rawType, rawTitle, rawUrl).
 */
function hardenUpdateType(arg1, rawTitle, rawUrl) {
  let rawType = '';
  let title = '';
  let url = '';
  let slot = '';

  if (arg1 && typeof arg1 === 'object') {
    rawType = arg1.rawUpdateType || arg1.updateType || arg1.rawType || '';
    title = decodeHtmlEntities(arg1.title || arg1.rawTitle || '');
    url = String(arg1.url || arg1.officialUrl || arg1.canonicalUrl || '');
    slot = String(arg1.slot || (arg1.metadata && arg1.metadata.slot) || '');
  } else {
    rawType = String(arg1 || '');
    title = decodeHtmlEntities(rawTitle || '');
    url = String(rawUrl || '');
  }

  const tLower = title.toLowerCase();
  const uLower = url.toLowerCase();
  const sLower = slot.toLowerCase();

  let resolvedType = 'OTHER_OFFICIAL_UPDATE';

  // 1. Answer keys (checked first so answer key + question booklet announcements harden to ANSWER_KEY)
  if (/\b(final answer key|revised answer key)\b/i.test(tLower) || /final.*answer.*key/i.test(uLower)) {
    resolvedType = 'FINAL_ANSWER_KEY';
  } else if (
    sLower === 'answerkeys' ||
    /\b(answer key|provisional answer key|omr sheet|model answer key)\b/i.test(tLower) ||
    /answer-?key/i.test(uLower)
  ) {
    resolvedType = 'ANSWER_KEY';
  } else if (
    // 2. Question Papers / PYQs must NEVER be classified as NEW_NOTIFICATION
    sLower === 'pyq' ||
    isPyqLink(url, title) ||
    /qp-|\/quespapers|\/oldpapers|previous.*question/i.test(uLower) ||
    /\b(question paper|previous year question|pyq|paper-[i|v|x]+|paper\s+[i|v|x|\d]+)\b/i.test(tLower)
  ) {
    resolvedType = 'PYQ';
  } else if (
    sLower === 'results' ||
    /\b(result|written result|marks|cutoff|merit list|score card|final result)\b/i.test(tLower) ||
    /written-results|result/i.test(uLower)
  ) {
    resolvedType = 'RESULT';
  } else if (
    sLower === 'syllabus' ||
    /\b(syllabus|scheme of examination|scheme & syllabus|revised syllabus)\b/i.test(tLower) ||
    /syllabus|examscheme/i.test(uLower)
  ) {
    resolvedType = 'SYLLABUS';
  } else if (
    /\b(corrigendum|addendum|amendment|cancellation notice)\b/i.test(tLower) ||
    /corrigendum|amendment/i.test(uLower)
  ) {
    resolvedType = 'CORRIGENDUM';
  } else if (
    /\b(exam date|examination date|schedule of examination|revised date)\b/i.test(tLower) ||
    /examdashboard|exam-date/i.test(uLower)
  ) {
    resolvedType = 'EXAM_DATE';
  } else if (
    sLower === 'calendar' ||
    /\b(examination calendar|annual calendar|calendar 202\d)\b/i.test(tLower) ||
    /calendar/i.test(uLower)
  ) {
    resolvedType = 'CALENDAR';
  } else if (
    /\b(admit card|hall ticket|e-admit|e-summon)\b/i.test(tLower) ||
    /admit-card|hall-ticket/i.test(uLower)
  ) {
    resolvedType = 'ADMIT_CARD_NOTICE';
  } else if (/\b(exam pattern|scheme of exam|revised pattern)\b/i.test(tLower)) {
    resolvedType = 'EXAM_PATTERN';
  } else if (/\b(eligibility criteria|relaxation in age|educational qualification)\b/i.test(tLower)) {
    resolvedType = 'ELIGIBILITY_CHANGE';
  } else if (/\b(service rules|recruitment rules|amendment in rules)\b/i.test(tLower)) {
    resolvedType = 'RULE_CHANGE';
  } else {
    // Retain rawType if already valid and controlled
    const upperRaw = String(rawType || '').toUpperCase().trim();
    if (UPDATE_VOCABULARY.includes(upperRaw)) {
      resolvedType = upperRaw;
    }
  }

  return {
    hardenedUpdateType: resolvedType,
    updateType: resolvedType,
    type: resolvedType,
    toString: () => resolvedType,
    valueOf: () => resolvedType,
  };
}

/**
 * Evaluates whether an event possesses genuine proven freshness.
 * Supports both { event, forwardWindowStart, ... } and (event, options).
 */
function evaluateFreshnessProof(arg1, arg2 = {}) {
  let event;
  let options;

  if (arg1 && arg1.event) {
    event = arg1.event;
    options = { ...arg1, ...arg2 };
  } else {
    event = arg1 || {};
    options = arg2 || {};
  }

  // First observation law: first baseline scan yields zero trusted events
  if (
    options.isFirstObservation === true ||
    options.isFirstListingObservation === true ||
    event.isFirstObservation === true ||
    event.isFirstListingObservation === true
  ) {
    return {
      isFresh: false,
      isProven: false,
      freshnessCategory: 'FIRST_OBSERVATION',
      status: 'FIRST_OBSERVATION',
      failureReason: 'FIRST_OBSERVATION_ZERO_TRUST',
      reason: 'FIRST_OBSERVATION: First observation baseline yields zero trusted events.',
      provenPublicationDate: null,
    };
  }

  const provenance = event.publicationDateProvenance || event.publicationDateSource || null;

  // Title / URL filename date hints do NOT prove freshness
  if (provenance === 'TITLE_DATE_HINT' || provenance === 'URL_FILENAME_DATE_HINT') {
    return {
      isFresh: false,
      isProven: false,
      freshnessCategory: 'DATE_HINT_ONLY',
      status: 'DATE_HINT_ONLY',
      failureReason: 'DATE_HINT_UNPROVEN',
      reason: 'DATE_HINT_ONLY: Title or URL filename date hints cannot prove official publication freshness.',
      provenPublicationDate: null,
    };
  }

  // Document SHA change to an existing known document
  if (
    event.freshnessEvidenceType === 'MATERIAL_CHANGE_TO_KNOWN_DOCUMENT' ||
    event.freshnessEvidence === 'MATERIAL_CHANGE_TO_KNOWN_DOCUMENT' ||
    event.shaChangeDetected === true
  ) {
    return {
      isFresh: true,
      isProven: true,
      freshnessCategory: 'PROVEN_FRESH',
      status: 'PROVEN_FRESH',
      failureReason: null,
      reason: 'PROVEN_FRESH: Material binary SHA-256 change to known document within forward window.',
      provenPublicationDate: event.publicationDate || null,
    };
  }

  // Snapshot delta confirmed new listing entry
  if (
    event.freshnessEvidenceType === 'PROVEN_NEW_LISTING_ENTRY' ||
    event.freshnessEvidence === 'PROVEN_NEW_LISTING_ENTRY' ||
    event.listingDeltaProven === true
  ) {
    return {
      isFresh: true,
      isProven: true,
      freshnessCategory: 'PROVEN_FRESH',
      status: 'PROVEN_FRESH',
      failureReason: null,
      reason: 'PROVEN_FRESH: Proven new listing entry verified by snapshot delta.',
      provenPublicationDate: event.publicationDate || null,
    };
  }

  // Proven official listing date or document/page metadata
  if (
    provenance === 'OFFICIAL_LISTING_DATE' ||
    provenance === 'OFFICIAL_PAGE_METADATA' ||
    provenance === 'OFFICIAL_DOCUMENT_METADATA' ||
    event.freshnessEvidenceType === 'PROVEN_AUTHORITY_PUBLICATION_DATE'
  ) {
    const pubDate = event.publicationDate;
    if (!pubDate) {
      return {
        isFresh: false,
        isProven: false,
        freshnessCategory: 'UNKNOWN',
        status: 'UNKNOWN',
        failureReason: 'MISSING_PUBLICATION_DATE',
        reason: 'UNKNOWN_FRESHNESS: Provenance claimed official date but publicationDate is null or empty.',
        provenPublicationDate: null,
      };
    }

    if (options.forwardWindowStart) {
      if (pubDate < options.forwardWindowStart) {
        return {
          isFresh: false,
          isProven: false,
          freshnessCategory: 'STALE',
          status: 'STALE',
          failureReason: 'PUBLICATION_DATE_BEFORE_WINDOW',
          reason: `STALE_DATE: Publication date ${pubDate} predates forward window start ${options.forwardWindowStart}.`,
          provenPublicationDate: null,
        };
      }
      if (options.forwardWindowEnd && pubDate > options.forwardWindowEnd) {
        return {
          isFresh: false,
          isProven: false,
          freshnessCategory: 'FUTURE_DATE_INVALID',
          status: 'FUTURE_DATE_INVALID',
          failureReason: 'FUTURE_DATE_INVALID',
          reason: `FUTURE_DATE: Publication date ${pubDate} is after forward window end ${options.forwardWindowEnd}.`,
          provenPublicationDate: null,
        };
      }
      return {
        isFresh: true,
        isProven: true,
        freshnessCategory: 'PROVEN_FRESH',
        status: 'PROVEN_FRESH',
        failureReason: null,
        reason: 'PROVEN_FRESH: Official authority publication date falls strictly inside forward window.',
        provenPublicationDate: pubDate,
      };
    }

    // Historical document evaluation without explicit forward window
    if (isHistoricalDocument(event.title || '', event.officialUrl || '', pubDate)) {
      return {
        isFresh: false,
        isProven: false,
        freshnessCategory: 'STALE',
        status: 'STALE',
        failureReason: 'HISTORICAL_DOCUMENT',
        reason: `STALE_DATE: Historical publication date ${pubDate} is not fresh.`,
        provenPublicationDate: null,
      };
    }

    if (!options.allowNoWindowFreshness) {
      return {
        isFresh: false,
        isProven: false,
        freshnessCategory: 'UNKNOWN',
        status: 'UNKNOWN',
        failureReason: 'NO_FORWARD_WINDOW',
        reason: 'UNKNOWN_FRESHNESS: Publication date cannot be validated without active forward window.',
        provenPublicationDate: null,
      };
    }

    return {
      isFresh: true,
      isProven: true,
      freshnessCategory: 'PROVEN_FRESH',
      status: 'PROVEN_FRESH',
      failureReason: null,
      reason: 'PROVEN_FRESH: Official publication date validated.',
      provenPublicationDate: pubDate,
    };
  }

  // Stale check if date is available
  if (event.publicationDate && isHistoricalDocument(event.title || '', event.officialUrl || '', event.publicationDate)) {
    return {
      isFresh: false,
      isProven: false,
      freshnessCategory: 'STALE',
      status: 'STALE',
      failureReason: 'HISTORICAL_DOCUMENT',
      reason: `STALE_DATE: Historical document with publication date ${event.publicationDate}.`,
      provenPublicationDate: null,
    };
  }

  // Default fail-closed
  return {
    isFresh: false,
    isProven: false,
    freshnessCategory: 'UNKNOWN',
    status: 'UNKNOWN',
    failureReason: 'UNKNOWN_FRESHNESS_EVIDENCE',
    reason: 'UNKNOWN_FRESHNESS: Publication date not proven by official authority source.',
    provenPublicationDate: null,
  };
}

/**
 * Exact, deterministic mission/exam binding.
 * Strictly avoids fuzzy matching, title keyword guessing, or filename heuristics.
 */
function bindExactMission(event, options = {}) {
  const authorityKey = String(event.authorityKey || '').trim();

  // Fails closed if authorityKey is not recognized
  if (!PILOT_AUTHORITY_KEYS.includes(authorityKey)) {
    return {
      isBound: false,
      status: 'UNBOUND',
      missionId: null,
      examId: null,
      examKey: null,
      authorityKey,
      bindingReason: 'UNRECOGNIZED_AUTHORITY',
      reason: `UNBOUND: Authority "${authorityKey}" is not a recognized pilot authority.`,
    };
  }

  // 1. If an explicit examKey is already present on the event
  if (event.examKey) {
    const rawExamKey = String(event.examKey).trim();
    let canonicalAuthKey = authorityKey;
    if (canonicalAuthKey.startsWith('auth_in_')) {
      canonicalAuthKey = canonicalAuthKey.replace('auth_in_', '').replace(/^[a-z]{2}_/, '');
    }

    const allowedAuthorities = GOVERNED_EXAM_AUTHORITY_COMPATIBILITY[rawExamKey];
    const isPairAllowed = Array.isArray(allowedAuthorities) && (
      allowedAuthorities.includes(authorityKey) ||
      allowedAuthorities.includes(canonicalAuthKey)
    );

    if (isPairAllowed) {
      try {
        const missionId = resolveCanonicalMissionId(rawExamKey, canonicalAuthKey);
        return {
          isBound: true,
          status: 'EXACT_BOUND',
          missionId,
          examId: missionId,
          examKey: rawExamKey,
          authorityKey,
          bindingReason: 'EXACT_EXAM_KEY_GOVERNED_MATCH',
          reason: 'EXACT_EXAM_KEY_GOVERNED_MATCH',
        };
      } catch (err) {
        return {
          isBound: false,
          status: 'UNBOUND',
          missionId: null,
          examId: null,
          examKey: rawExamKey,
          authorityKey,
          bindingReason: 'RESOLUTION_FAILED',
          reason: `UNBOUND: Mission resolution failed: ${err.message}`,
        };
      }
    } else {
      return {
        isBound: false,
        status: 'AUTHORITY_MISMATCH',
        missionId: null,
        examId: null,
        examKey: rawExamKey,
        authorityKey,
        bindingReason: 'AUTHORITY_MISMATCH',
        reason: `AUTHORITY_MISMATCH: Exam "${rawExamKey}" is not governed under authority "${authorityKey}".`,
      };
    }
  }

  // 2. Strict exact title matching ONLY (no fuzzy matching, no keyword heuristics)
  // Law: No fuzzy / title / filename-only / LLM mission binding.
  // UPSC 95 adversarial corpus: CSE_PRELIMS_FALSE_BIND_COUNT = 0
  const cleanTitle = decodeHtmlEntities(event.title || '').trim();
  const strippedTitle = stripYearDecoration(cleanTitle);
  const normalizedTitle = normalizeCanonicalToken(strippedTitle);

  let matchedExamKey = null;
  if (normalizedTitle) {
    for (const [examKey, aliases] of Object.entries(GOVERNED_EXAM_ALIASES)) {
      for (const alias of aliases) {
        const normAlias = normalizeCanonicalToken(alias);
        if (normalizedTitle === normAlias) {
          matchedExamKey = examKey;
          break;
        }
      }
      if (matchedExamKey) break;
    }
  }

  if (matchedExamKey) {
    let canonicalAuthKey = authorityKey;
    if (canonicalAuthKey.startsWith('auth_in_')) {
      canonicalAuthKey = canonicalAuthKey.replace('auth_in_', '').replace(/^[a-z]{2}_/, '');
    }
    const allowedAuthorities = GOVERNED_EXAM_AUTHORITY_COMPATIBILITY[matchedExamKey];
    const isPairAllowed = Array.isArray(allowedAuthorities) && (
      allowedAuthorities.includes(authorityKey) ||
      allowedAuthorities.includes(canonicalAuthKey)
    );

    if (isPairAllowed) {
      try {
        const missionId = resolveCanonicalMissionId(matchedExamKey, canonicalAuthKey);
        return {
          isBound: true,
          status: 'EXACT_BOUND',
          missionId,
          examId: missionId,
          examKey: matchedExamKey,
          authorityKey,
          bindingReason: 'EXACT_TITLE_GOVERNED_ALIAS_MATCH',
          reason: 'EXACT_TITLE_GOVERNED_ALIAS_MATCH',
        };
      } catch (e) {
        return {
          isBound: false,
          status: 'UNBOUND',
          missionId: null,
          examId: null,
          examKey: matchedExamKey,
          authorityKey,
          bindingReason: 'RESOLUTION_FAILED',
          reason: `UNBOUND: Mission resolution failed: ${e.message}`,
        };
      }
    } else {
      return {
        isBound: false,
        status: 'AUTHORITY_MISMATCH',
        missionId: null,
        examId: null,
        examKey: matchedExamKey,
        authorityKey,
        bindingReason: 'AUTHORITY_MISMATCH',
        reason: `AUTHORITY_MISMATCH: Exam "${matchedExamKey}" is not governed under authority "${authorityKey}".`,
      };
    }
  }

  // Fail closed: UNBOUND
  return {
    isBound: false,
    status: 'UNBOUND',
    missionId: null,
    examId: null,
    examKey: null,
    authorityKey,
    bindingReason: 'UNBOUND',
    reason: 'UNBOUND: No exact governed exam binding found without fuzzy heuristics.',
  };
}

/**
 * Evaluates admission into one of the 4 controlled TRUST_STATES.
 */
function evaluateTrustAdmission(rawEvent, classified, freshness, missionBinding, options = {}) {
  let evt = rawEvent;
  let fresh = freshness;
  let bound = missionBinding;
  let srcClass = classified;

  if (rawEvent && rawEvent.event) {
    evt = rawEvent.event;
    fresh = rawEvent.freshnessProof || evaluateFreshnessProof(evt, options);
    srcClass = rawEvent.sourceClass || classifySourceObject(evt);
    bound = rawEvent.missionBinding || bindExactMission(evt, options);
  }

  const reasons = [];

  // Check title quality
  const rawTitle = evt.title || '';
  if (SCREEN_READER_TEXT_REGEX.test(rawTitle)) {
    reasons.push('SCREEN_READER_TITLE_REJECTED');
  }
  if (GENERIC_ACTION_REGEX.test(rawTitle)) {
    reasons.push('GENERIC_ACTION_TITLE_REJECTED');
  }
  if (FILE_SIZE_REGEX.test(rawTitle)) {
    reasons.push('FILE_SIZE_ONLY_TITLE_REJECTED');
  }
  if (!rawTitle || rawTitle.trim() === '') {
    reasons.push('EMPTY_TITLE_REJECTED');
  }

  const srcType = typeof srcClass === 'object' ? srcClass.sourceObjectType : srcClass;
  if (srcType === SOURCE_OBJECT_TYPES.GENERIC_NAVIGATION) {
    reasons.push('GENERIC_NAVIGATION_REJECTED');
  }

  // Check freshness
  const isFresh = fresh ? (fresh.isFresh || fresh.isProven) : false;
  if (!isFresh) {
    reasons.push('FRESHNESS_NOT_PROVEN');
    if (fresh && fresh.reason) {
      reasons.push(fresh.reason);
    }
  }

  // Legacy baseline separation
  const discoveredIso = evt.discoveredAtIso || evt.discoveredAt || null;
  const isLegacyBaselineEvent = (
    !discoveredIso ||
    discoveredIso <= '2026-09-14T23:59:59.999Z' ||
    options.isHistoricalFixture === true
  );

  let trustState;
  if (reasons.length === 0 && isFresh) {
    trustState = TRUST_STATES.TRUSTED_CURRENT;
  } else if (isLegacyBaselineEvent) {
    trustState = TRUST_STATES.REJECTED_LEGACY;
  } else {
    trustState = TRUST_STATES.REJECTED_CURRENT;
  }

  return {
    trustState,
    isTrustedCurrent: trustState === TRUST_STATES.TRUSTED_CURRENT,
    rejectionReasons: reasons,
  };
}

/**
 * Projects a single raw authority intelligence event into a governed Founder read object.
 * Strictly READ-ONLY. Does not modify the input rawEvent object in any way.
 */
function projectAuthorityEvent(rawEvent, options = {}) {
  if (!rawEvent || typeof rawEvent !== 'object') {
    throw new Error('RAW_EVENT_REQUIRED: rawEvent must be a valid object.');
  }

  // 1. Normalization & Authority lookup (read-only)
  const authorityKey = String(rawEvent.authorityKey || '').trim();
  const authority = canonicalAuthorityRegistry.getByKey(authorityKey);

  const cleanTitle = decodeHtmlEntities(rawEvent.title || '').trim();
  const officialUrl = rawEvent.officialUrl || rawEvent.canonicalUrl || rawEvent.normalizedUrl || null;

  // 2. Source Object Classification
  const sourceClass = classifySourceObject({ url: officialUrl, title: cleanTitle });

  // 3. Hardened Update Type
  const hardenedClass = hardenUpdateType({
    rawType: rawEvent.updateType,
    title: cleanTitle,
    url: officialUrl,
    slot: rawEvent.metadata?.slot,
  });

  // 4. Freshness Proof Evaluation
  const freshnessProof = evaluateFreshnessProof(rawEvent, options);

  // 5. Exact Mission/Exam Binding
  const missionBinding = bindExactMission({
    authorityKey,
    title: cleanTitle,
    url: officialUrl,
    examKey: rawEvent.examKey || null,
  }, options);

  // 6. Trust Admission Decision
  const trustAdmission = evaluateTrustAdmission(
    rawEvent,
    sourceClass,
    freshnessProof,
    missionBinding,
    options
  );

  const eventId = rawEvent.eventId || rawEvent.docId || 'unknown_event';

  return {
    projectionId: `proj_${eventId}`,
    eventId,
    rawEventId: eventId,
    authorityKey,
    authorityShortName: authority?.shortName || rawEvent.authorityShortName || authorityKey,
    jurisdiction: authority?.jurisdiction || rawEvent.jurisdiction || 'UNKNOWN',
    stateCode: authority?.stateCode ?? rawEvent.stateCode ?? null,
    title: cleanTitle,
    rawTitle: rawEvent.title,
    officialUrl,
    canonicalUrl: rawEvent.canonicalUrl || officialUrl,
    normalizedUrl: rawEvent.normalizedUrl || officialUrl,
    sourceObjectType: sourceClass.sourceObjectType,
    sourceType: sourceClass.sourceObjectType,
    hardenedUpdateType: hardenedClass.hardenedUpdateType,
    updateType: hardenedClass.hardenedUpdateType,
    rawUpdateType: rawEvent.updateType,
    trustState: trustAdmission.trustState,
    isTrustedCurrent: trustAdmission.isTrustedCurrent,
    freshnessProof: {
      isFresh: freshnessProof.isFresh,
      isProven: freshnessProof.isProven,
      freshnessCategory: freshnessProof.freshnessCategory,
      status: freshnessProof.status,
      failureReason: freshnessProof.failureReason,
      reason: freshnessProof.reason,
      provenPublicationDate: freshnessProof.provenPublicationDate,
    },
    freshnessEvidence: {
      boundaryIso: freshnessProof.provenPublicationDate || rawEvent.admissionTimestamp || (freshnessProof.isFresh ? (rawEvent.discoveredAtIso || rawEvent.discoveredAt || null) : null),
      evidenceType: rawEvent.freshnessEvidenceType || rawEvent.freshnessEvidence || (freshnessProof.isProven ? 'PROVEN_FRESH' : 'UNKNOWN'),
      provenPublicationDate: freshnessProof.provenPublicationDate || null,
      isProven: freshnessProof.isProven,
    },
    freshnessProven: freshnessProof.isFresh,
    freshnessStatus: freshnessProof.freshnessCategory,
    freshnessReason: freshnessProof.reason,
    publicationDate: rawEvent.publicationDate || null,
    publicationDateProvenance: rawEvent.publicationDateProvenance || null,
    discoveredAtIso: rawEvent.discoveredAtIso || rawEvent.discoveredAt || null,
    exactMissionBinding: {
      isBound: missionBinding.isBound,
      status: missionBinding.status,
      missionId: missionBinding.missionId,
      examId: missionBinding.examId,
      examKey: missionBinding.examKey,
      authorityKey: missionBinding.authorityKey,
      bindingReason: missionBinding.bindingReason,
      reason: missionBinding.reason,
    },
    missionBinding: {
      isBound: missionBinding.isBound,
      status: missionBinding.status,
      missionId: missionBinding.missionId,
      examId: missionBinding.examId,
      examKey: missionBinding.examKey,
      authorityKey: missionBinding.authorityKey,
      bindingReason: missionBinding.bindingReason,
      reason: missionBinding.reason,
    },
    rejectionReasons: trustAdmission.rejectionReasons,
    suitabilityDecision: rawEvent.suitability?.decision || null,
    projectionMetadata: {
      governedAtIso: new Date().toISOString(),
      contractVersion: 'R4_20260916',
      deterministicPipeline: 'RAW->NORM->SOURCE_OBJ->HARDENED_TYPE->FRESHNESS->MISSION_BIND->TRUST->PROJECTION',
    },
    projectedAtIso: new Date().toISOString(),
  };
}

/**
 * Builds the complete Founder governed projection across a collection of raw events.
 * Strictly READ-ONLY. Zero mutation to Firestore or input events.
 */
function buildFounderGovernedProjection(rawEvents = [], options = {}) {
  const eventsArray = Array.isArray(rawEvents) ? rawEvents : [];

  let trustedCurrentCount = 0;
  let rejectedCurrentCount = 0;
  let rejectedLegacyCount = 0;
  let forensicOnlyCount = 0;
  let csePrelimsFalseBindCount = 0;

  const byAuthority = {};
  const byUpdateType = {};
  const bySourceType = {};
  const byTrustState = {};
  const byMission = {};

  const projections = [];

  for (const rawEvt of eventsArray) {
    const projected = projectAuthorityEvent(rawEvt, options);
    projections.push(projected);

    // Trust state distribution
    if (projected.trustState === TRUST_STATES.TRUSTED_CURRENT) {
      trustedCurrentCount++;
    } else if (projected.trustState === TRUST_STATES.REJECTED_CURRENT) {
      rejectedCurrentCount++;
    } else if (projected.trustState === TRUST_STATES.REJECTED_LEGACY) {
      rejectedLegacyCount++;
    } else if (projected.trustState === TRUST_STATES.FORENSIC_ONLY) {
      forensicOnlyCount++;
    }

    byTrustState[projected.trustState] = (byTrustState[projected.trustState] || 0) + 1;

    // Authority distribution
    const aKey = projected.authorityKey || 'unknown_auth';
    if (!byAuthority[aKey]) {
      byAuthority[aKey] = { total: 0, trusted: 0, rejected: 0 };
    }
    byAuthority[aKey].total++;
    if (projected.trustState === TRUST_STATES.TRUSTED_CURRENT) {
      byAuthority[aKey].trusted++;
    } else {
      byAuthority[aKey].rejected++;
    }

    // Update type distribution
    const uType = projected.hardenedUpdateType || 'UNKNOWN';
    byUpdateType[uType] = (byUpdateType[uType] || 0) + 1;

    // Source object type distribution
    const sType = projected.sourceObjectType || 'UNKNOWN';
    bySourceType[sType] = (bySourceType[sType] || 0) + 1;

    // Mission binding distribution
    if (projected.exactMissionBinding.isBound && projected.exactMissionBinding.missionId) {
      const mId = projected.exactMissionBinding.missionId;
      byMission[mId] = (byMission[mId] || 0) + 1;
    }

    // Adversarial CSE Prelims check
    if (projected.authorityKey === 'auth_in_upsc') {
      const isMainsPyq = (
        (projected.officialUrl && projected.officialUrl.includes('QP-CSM')) ||
        (projected.rawTitle && /Paper/i.test(projected.rawTitle))
      );
      if (isMainsPyq && projected.exactMissionBinding.missionId === 'mission_upsc_cse_prelims_2026') {
        csePrelimsFalseBindCount++;
      }
    }
  }

  const summary = {
    totalRawEvents: eventsArray.length,
    trustedCurrentCount,
    rejectedCurrentCount,
    rejectedLegacyCount,
    forensicOnlyCount,
    byAuthority,
    byUpdateType,
    bySourceType,
    byTrustState,
    byMission,
    csePrelimsFalseBindCount,
    projectionGeneratedAtIso: new Date().toISOString(),
  };

  return {
    summary,
    projections,
    events: projections, // alias for caller convenience
  };
}

module.exports = {
  EXAM_PORTAL_DOMAINS,
  SECTION_PAGE_PATH_PATTERNS,
  classifySourceObject,
  hardenUpdateType,
  evaluateFreshnessProof,
  bindExactMission,
  evaluateTrustAdmission,
  projectAuthorityEvent,
  buildFounderGovernedProjection,
};
