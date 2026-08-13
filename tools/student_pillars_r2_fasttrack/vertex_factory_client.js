"use strict";

const { GoogleGenAI } = require("@google/genai");

const DEFAULT_LOCATION = "global";

const DEFAULT_MODELS = Object.freeze({
  deepReasoningPro: "gemini-3.1-pro-preview",
  factoryFlash: "gemini-3.6-flash",
  bulkLite: "gemini-3.5-flash-lite",
});

const WORKLOADS = Object.freeze({
  deepReasoningPro: "deepReasoningPro",
  factoryFlash: "factoryFlash",
  bulkLite: "bulkLite",
});

function requireEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`MISSING_REQUIRED_ENV:${name}`);
  }
  return value.trim();
}

function optionalEnv(name, fallback) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function resolveModel(workload = "factoryFlash") {
  const compatibilityOverride = optionalEnv("RC_VERTEX_MODEL", "") || optionalEnv("RC_GEMINI_MODEL", "");
  if (compatibilityOverride) {
    return {
      model: compatibilityOverride,
      source: "compatibility_override",
      workload,
      fallbackUsed: false,
    };
  }

  if (workload === "deepReasoningPro") {
    const override = optionalEnv("RC_VERTEX_MODEL_PRO", "");
    return {
      model: override || DEFAULT_MODELS.deepReasoningPro,
      source: override ? "task_override" : "policy_default",
      workload,
      fallbackUsed: false,
    };
  }

  if (workload === "bulkLite") {
    const override = optionalEnv("RC_VERTEX_MODEL_LITE", "");
    return {
      model: override || DEFAULT_MODELS.bulkLite,
      source: override ? "task_override" : "policy_default",
      workload,
      fallbackUsed: false,
    };
  }

  const override = optionalEnv("RC_VERTEX_MODEL_FLASH", "");
  return {
    model: override || DEFAULT_MODELS.factoryFlash,
    source: override ? "task_override" : "policy_default",
    workload: "factoryFlash",
    fallbackUsed: false,
  };
}

function createVertexFactoryClient() {
  const project = requireEnv("GOOGLE_CLOUD_PROJECT");
  const location = optionalEnv("GOOGLE_CLOUD_LOCATION", DEFAULT_LOCATION);
  const client = new GoogleGenAI({
    vertexai: true,
    project,
    location,
  });
  return { client, project, location };
}

function extractResponseText(response) {
  if (typeof response.text === "string") return response.text;
  const parts = response.candidates?.[0]?.content?.parts || [];
  return parts.map(part => part.text || "").join("");
}

async function generateFactoryContent({ workload = "factoryFlash", contents, config }) {
  const vertex = createVertexFactoryClient();
  const routing = resolveModel(workload);
  if (!contents) {
    throw new Error("FACTORY_CONTENTS_REQUIRED");
  }
  const response = await vertex.client.models.generateContent({
    model: routing.model,
    contents,
    config,
  });
  return {
    text: extractResponseText(response),
    metadata: {
      backend: "vertex_ai",
      project: vertex.project,
      location: vertex.location,
      requestedModel: routing.model,
      actualModel: routing.model,
      workload: routing.workload,
      modelSource: routing.source,
      fallbackUsed: false,
      fallbackReason: null,
    },
  };
}

async function generateStructuredFactoryContent({
  workload = "factoryFlash",
  contents,
  responseSchema,
  config = {},
}) {
  if (!responseSchema || typeof responseSchema !== "object") {
    throw new Error("STRUCTURED_RESPONSE_SCHEMA_REQUIRED");
  }

  const vertex = createVertexFactoryClient();
  const routing = resolveModel(workload);

  if (!contents) {
    throw new Error("FACTORY_CONTENTS_REQUIRED");
  }

  const response = await vertex.client.models.generateContent({
    model: routing.model,
    contents,
    config: {
      ...config,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  let rawText = String(response.text || "").trim();

  // Strip markdown code fences if present
  if (rawText.startsWith("```")) {
    const lines = rawText.split("\n");
    if (lines[0].startsWith("```")) {
      lines.shift();
    }
    if (lines.length > 0 && lines[lines.length - 1].startsWith("```")) {
      lines.pop();
    }
    rawText = lines.join("\n").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(rawText.slice(start, end + 1));
      } catch (e2) {
        const wrapped = new Error("STRUCTURED_RESPONSE_JSON_PARSE_FAILED");
        wrapped.cause = e2;
        throw wrapped;
      }
    } else {
      const wrapped = new Error("STRUCTURED_RESPONSE_JSON_PARSE_FAILED");
      wrapped.cause = error;
      throw wrapped;
    }
  }

  return {
    data: parsed,
    metadata: {
      backend: "vertex_ai",
      project: vertex.project,
      location: vertex.location,
      requestedModel: routing.model,
      actualModel: routing.model,
      workload: routing.workload,
      modelSource: routing.source,
      fallbackUsed: false,
      fallbackReason: null,
      structuredOutput: true,
    },
  };
}

module.exports = {
  DEFAULT_MODELS,
  WORKLOADS,
  createVertexFactoryClient,
  resolveModel,
  generateFactoryContent,
  generateStructuredFactoryContent,
};
