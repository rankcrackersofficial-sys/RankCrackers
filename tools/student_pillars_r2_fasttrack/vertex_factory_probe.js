"use strict";

const { generateFactoryContent } = require("./vertex_factory_client");

async function main() {
  console.log("VERTEX_FACTORY_PROBE_START");
  const result = await generateFactoryContent({
    workload: "factoryFlash",
    contents: "Return exactly this token and nothing else: RANKCRACKERS_VERTEX_OK",
    config: {
      maxOutputTokens: 256,
    },
  });
  const normalized = String(result.text || "").trim();
  if (!normalized.includes("RANKCRACKERS_VERTEX_OK")) {
    throw new Error(`VERTEX_FACTORY_UNEXPECTED_RESPONSE:${normalized}`);
  }
  console.log("VERTEX_FACTORY_PROBE=PASS");
  console.log(`BACKEND=${result.metadata.backend}`);
  console.log(`LOCATION=${result.metadata.location}`);
  console.log(`MODEL=${result.metadata.actualModel}`);
  console.log(`WORKLOAD=${result.metadata.workload}`);
  console.log(`FALLBACK_USED=${result.metadata.fallbackUsed}`);
}

main().catch((error) => {
  console.error("VERTEX_FACTORY_PROBE=FAIL");
  console.error(`ERROR=${error?.message || error}`);
  process.exitCode = 1;
});