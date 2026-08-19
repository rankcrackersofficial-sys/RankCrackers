"use strict";

const crypto = require("crypto");

function normalize(value) {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = normalize(value[key]);
        return result;
      }, {});
  }

  return value;
}

function stableJson(value) {
  return JSON.stringify(normalize(value));
}

function sha256(value) {
  return crypto
    .createHash("sha256")
    .update(stableJson(value), "utf8")
    .digest("hex");
}

function buildArtifactId({
  missionId,
  pillar,
  canonicalId,
  artifactVersion = 1,
}) {
  if (!missionId || !pillar || !canonicalId) {
    throw new Error("ARTIFACT_IDENTITY_FIELDS_REQUIRED");
  }

  return [
    missionId,
    pillar,
    canonicalId,
    `v${artifactVersion}`,
  ].join(":");
}

function buildContentHash(payload) {
  return sha256(payload);
}

function buildReviewHash({
  artifactId,
  contentHash,
  reviewerModel,
  reviewPayload,
}) {
  if (!artifactId || !contentHash || !reviewerModel) {
    throw new Error("REVIEW_IDENTITY_FIELDS_REQUIRED");
  }

  return sha256({
    artifactId,
    contentHash,
    reviewerModel,
    reviewPayload,
  });
}

module.exports = {
  stableJson,
  sha256,
  buildArtifactId,
  buildContentHash,
  buildReviewHash,
};
