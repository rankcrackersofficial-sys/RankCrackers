"use strict";

const path = require('path');
const { MissionAcademicFactory } = require('./mission_factory_orchestrator');

function printUsage() {
  console.log("Usage: node tools/academic_factory/run_factory.js --mission-manifest <path_to_manifest> --workspace <path_to_workspace>");
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  let manifestPath = null;
  let workspacePath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mission-manifest' && args[i + 1]) {
      manifestPath = args[i + 1];
      i++;
    } else if (args[i] === '--workspace' && args[i + 1]) {
      workspacePath = args[i + 1];
      i++;
    }
  }

  if (!manifestPath || !workspacePath) {
    printUsage();
  }

  try {
    const report = await MissionAcademicFactory.run({
      manifestPath: path.resolve(manifestPath),
      workspacePath: path.resolve(workspacePath)
    });
    console.log("FACTORY_RUN=SUCCESS");
    console.log("Report:", JSON.stringify(report, null, 2));
  } catch (err) {
    console.error("FACTORY_RUN=FAIL");
    console.error(err.stack || err.message || err);
    process.exit(1);
  }
}

main();
