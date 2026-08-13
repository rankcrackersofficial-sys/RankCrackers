"use strict";

const DIGIBOOK_DRAFT_SCHEMA = Object.freeze({
  type: "OBJECT",
  properties: {
    artifactVersion: {
      type: "STRING",
    },
    atomId: {
      type: "STRING",
    },
    overview: {
      type: "STRING",
    },
    concepts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          explanation: { type: "STRING" },
        },
        required: ["title", "explanation"],
      },
    },
    formulaRegister: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          formula: { type: "STRING" },
          applicability: { type: "STRING" },
          variables: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                symbol: { type: "STRING" },
                meaning: { type: "STRING" },
                unit: { type: "STRING" },
              },
              required: ["symbol", "meaning", "unit"],
            },
          },
        },
        required: [
          "label",
          "formula",
          "applicability",
          "variables"
        ],
      },
    },
    commonMisconceptions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          misconception: { type: "STRING" },
          correction: { type: "STRING" },
        },
        required: ["misconception", "correction"],
      },
    },
    workedExamples: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          problem: { type: "STRING" },
          steps: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          answer: { type: "STRING" },
        },
        required: ["problem", "steps", "answer"],
      },
    },
    selfChecks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          answer: { type: "STRING" },
        },
        required: ["question", "answer"],
      },
    },
    sourceReferences: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  required: [
    "artifactVersion",
    "atomId",
    "overview",
    "concepts",
    "formulaRegister",
    "commonMisconceptions",
    "workedExamples",
    "selfChecks",
    "sourceReferences"
  ],
});

module.exports = {
  DIGIBOOK_DRAFT_SCHEMA,
};
