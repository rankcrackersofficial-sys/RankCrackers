"use strict";

const {
  generateFactoryContent,
  generateStructuredFactoryContent,
  WORKLOADS,
} = require('../student_pillars_r2_fasttrack/vertex_factory_client');

async function callWithRetries({ workload, contents, config, label }) {
  let lastError;
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await generateFactoryContent({ workload, contents, config });
    } catch (error) {
      lastError = error;
      const message = String(error && error.message ? error.message : error);
      const transient =
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.toLowerCase().includes('timeout');
      if (!transient || attempt === maxAttempts - 1) break;
      const waitTime = (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) ? 30000 : 15000;
      console.warn(`[Retry Warning] ${label} attempt ${attempt + 1} failed: ${message}. Retrying in ${waitTime/1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * (attempt + 1)));
    }
  }
  throw new Error(`${label} failed after bounded retries: ${lastError.message || lastError}`);
}

async function callStructuredWithRetries({ workload, contents, responseSchema, config, label }) {
  let lastError;
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await generateStructuredFactoryContent({ workload, contents, responseSchema, config });
    } catch (error) {
      lastError = error;
      const message = String(error && error.message ? error.message : error);
      const transient =
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.toLowerCase().includes('timeout') ||
        message.includes('STRUCTURED_RESPONSE_JSON_PARSE_FAILED');
      if (!transient || attempt === maxAttempts - 1) break;
      const waitTime = (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) ? 30000 : 15000;
      console.warn(`[Retry Warning] ${label} attempt ${attempt + 1} failed: ${message}. Retrying in ${waitTime/1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * (attempt + 1)));
    }
  }
  throw new Error(`${label} failed after bounded retries: ${lastError.message || lastError}`);
}

module.exports = {
  callWithRetries,
  callStructuredWithRetries,
  WORKLOADS,
};
