"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageTrigger = exports.queueWorker = void 0;
var queueWorker_1 = require("./workers/queueWorker");
Object.defineProperty(exports, "queueWorker", { enumerable: true, get: function () { return queueWorker_1.queueWorker; } });
var storageTrigger_1 = require("./workers/storageTrigger");
Object.defineProperty(exports, "storageTrigger", { enumerable: true, get: function () { return storageTrigger_1.storageTrigger; } });
//# sourceMappingURL=index.js.map