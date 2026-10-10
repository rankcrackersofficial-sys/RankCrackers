/**
 * 🔱 OFFICIAL AUTHORITY INTELLIGENCE SYSTEM — PACKAGE ENTRYPOINT
 * Command: RC-AUTHORITY-INTELLIGENCE-B1-AG2-PILOT-REGISTRY-AND-PURE-MONITOR-FOUNDATION-20260912
 */

'use strict';

const schema = require('./registry_schema');
const loader = require('./authority_registry_loader');
const urlNorm = require('./url_normalization');
const dedupe = require('./dedupe_contract');
const suitability = require('./suitability_classifier');
const eventModel = require('./authority_intelligence_event');
const evidenceVerifier = require('./role_evidence_verifier');

module.exports = {
  ...schema,
  ...loader,
  ...urlNorm,
  ...dedupe,
  ...suitability,
  ...eventModel,
  ...evidenceVerifier,
};
