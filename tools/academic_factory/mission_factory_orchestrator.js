"use strict";

const fs = require('fs');
const path = require('path');
const { MissionFactoryStateStore } = require('./mission_factory_state_store');
const { runSyllabusWorker } = require('./syllabus_source_worker');
const { runDigiBookWorker } = require('./digibook_worker');
const { runCrucibleWorker } = require('./crucible_worker');

const STATE_TEMPLATE_PATH = path.join(__dirname, 'mission_factory_state_template.json');
const POLICY_PATH = path.join(__dirname, 'factory_policy.json');
const RUNTIME_POLICY_PATH = path.join(__dirname, 'factory_runtime_policy.json');

function flattenAtoms(node) {
  if (Array.isArray(node)) {
    const seen = new Set();
    return node.filter((atom) => {
      if (!atom.atomId || seen.has(atom.atomId)) return false;
      seen.add(atom.atomId);
      return true;
    });
  }
  const atoms = [];
  const walk = (item) => {
    if (!item || typeof item !== 'object') return;
    if (Array.isArray(item.atoms)) {
      for (const atom of item.atoms) atoms.push(atom);
    }
    if (Array.isArray(item.children)) {
      for (const child of item.children) walk(child);
    }
    if (Array.isArray(item.subjects)) {
      for (const subject of item.subjects) walk(subject);
    }
  };
  walk(node);
  const seen = new Set();
  return atoms.filter((atom) => {
    if (!atom.atomId || seen.has(atom.atomId)) return false;
    seen.add(atom.atomId);
    return true;
  });
}

class MissionAcademicFactory {
  static async run({ manifestPath, workspacePath }) {
    if (!manifestPath || !workspacePath) {
      throw new Error("MANIFEST_PATH_AND_WORKSPACE_PATH_REQUIRED");
    }

    console.log(`[Factory Orchestrator] Loading manifest: ${manifestPath}`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const missionId = manifest.missionId;
    if (!missionId) {
      throw new Error("MANIFEST_MISSION_ID_REQUIRED");
    }

    const policy = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
    const runtimePolicy = JSON.parse(fs.readFileSync(RUNTIME_POLICY_PATH, 'utf8'));

    // Check runtime boundary safety
    if (runtimePolicy.executionMode !== 'offline_local_evidence_only') {
      throw new Error("RUNTIME_BOUNDARY_VIOLATION: offline mode required");
    }

    console.log(`[Factory Orchestrator] Starting factory loop for mission: ${missionId}`);
    const store = new MissionFactoryStateStore({ workspaceRoot: workspacePath, missionId });
    
    let factoryState;
    if (store.exists()) {
      console.log(`[Factory Orchestrator] State store found. Resuming factory loop...`);
      factoryState = store.load();
    } else {
      console.log(`[Factory Orchestrator] No state store found. Initializing from template...`);
      const template = JSON.parse(fs.readFileSync(STATE_TEMPLATE_PATH, 'utf8'));
      factoryState = {
        ...template,
        missionId,
        syllabus: {
          ...template.syllabus,
          denominator: manifest.syllabusDenominator || 0
        },
        digibook: {
          ...template.digibook,
          denominator: manifest.digibookDenominator || 0
        }
      };
    }

    // Load and flatten atoms
    let rawAtomsTree = manifest.atoms;
    if (typeof rawAtomsTree === 'string') {
      const resolvedPath = path.isAbsolute(rawAtomsTree) ? rawAtomsTree : path.resolve(rawAtomsTree);
      console.log(`[Factory Orchestrator] Loading atoms from file: ${resolvedPath}`);
      rawAtomsTree = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    }
    const atoms = flattenAtoms(rawAtomsTree);
    console.log(`[Factory Orchestrator] Loaded ${atoms.length} canonical atoms.`);

    if (typeof manifest.officialSourceIndex === 'string') {
      const resolvedPath = path.isAbsolute(manifest.officialSourceIndex) ? manifest.officialSourceIndex : path.resolve(manifest.officialSourceIndex);
      manifest.officialSourceIndex = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    }

    if (typeof manifest.cruciblePlan === 'string') {
      const resolvedPath = path.isAbsolute(manifest.cruciblePlan) ? manifest.cruciblePlan : path.resolve(manifest.cruciblePlan);
      manifest.cruciblePlan = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    }

    if (!factoryState.exceptionQueue) {
      factoryState.exceptionQueue = [];
    }

    const checkpoint = () => {
      console.log('[Factory Orchestrator] Checkpoint: Saving current state...');
      store.save(factoryState);
    };

    // Run Syllabus Worker
    await runSyllabusWorker({
      manifest,
      factoryState,
      policy,
      workspaceDirectory: workspacePath,
      atoms,
      checkpoint
    });
    checkpoint();

    // Run DigiBook Worker
    await runDigiBookWorker({
      manifest,
      factoryState,
      policy,
      workspaceDirectory: workspacePath,
      atoms,
      checkpoint
    });
    checkpoint();

    // Run Crucible Worker
    await runCrucibleWorker({
      manifest,
      factoryState,
      policy,
      workspaceDirectory: workspacePath,
      atoms,
      checkpoint
    });
    checkpoint();

    console.log('[Factory Orchestrator] Finalizing job checkpoints and saving state store...');
    store.save(factoryState);

    const report = {
      missionId,
      status: factoryState.status,
      syllabus: {
        totalVerified: factoryState.syllabus.verified,
        denominator: factoryState.syllabus.denominator,
        held: factoryState.syllabus.held,
        pending: factoryState.syllabus.pending
      },
      digibook: {
        totalApproved: factoryState.digibook.approved,
        denominator: factoryState.digibook.denominator,
        held: factoryState.digibook.held,
        pending: factoryState.digibook.pending
      },
      crucible: {
        packsReady: factoryState.crucible.packsReady,
        packsTotal: factoryState.crucible.packsTotal,
        reviewedMacro: factoryState.crucible.reviewedMacro,
        macroTotal: factoryState.crucible.macroTotal,
        reviewedMajor: factoryState.crucible.reviewedMajor,
        majorTotal: factoryState.crucible.majorTotal,
        keysVerified: factoryState.crucible.keysVerified
      },
      exceptionsCount: factoryState.exceptionQueue.length
    };

    console.log('[Factory Orchestrator] Execution report summary:', JSON.stringify(report, null, 2));
    return report;
  }
}

module.exports = {
  MissionAcademicFactory
};
