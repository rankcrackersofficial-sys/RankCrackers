"use strict";

const fs = require("fs");
const path = require("path");

function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

class MissionFactoryStateStore {
  constructor({ workspaceRoot, missionId }) {
    if (!workspaceRoot || !missionId) {
      throw new Error("STATE_STORE_CONFIGURATION_REQUIRED");
    }

    this.workspaceRoot = path.resolve(workspaceRoot);
    this.missionId = missionId;
    this.missionDirectory = path.join(
      this.workspaceRoot,
      missionId
    );
    this.statePath = path.join(
      this.missionDirectory,
      "factory_state.json"
    );
  }

  exists() {
    return fs.existsSync(this.statePath);
  }

  load() {
    if (!this.exists()) {
      return null;
    }

    return JSON.parse(
      fs.readFileSync(this.statePath, "utf8")
    );
  }

  save(state) {
    if (!state || state.missionId !== this.missionId) {
      throw new Error("STATE_MISSION_ID_MISMATCH");
    }

    ensureDirectory(this.missionDirectory);

    const temporaryPath = `${this.statePath}.tmp`;

    fs.writeFileSync(
      temporaryPath,
      `${JSON.stringify(state, null, 2)}\n`,
      "utf8"
    );

    fs.renameSync(temporaryPath, this.statePath);
  }
}

module.exports = {
  MissionFactoryStateStore,
};
