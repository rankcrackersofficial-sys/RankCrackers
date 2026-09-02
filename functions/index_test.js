const admin = require("firebase-admin");
admin.initializeApp();

const { syllabusLifecycleWorker, syllabusIngestionOrchestrator } = require("./lib/workers/syllabusLifecycleWorker");

exports.syllabusLifecycleWorker = syllabusLifecycleWorker;
exports.syllabusIngestionOrchestrator = syllabusIngestionOrchestrator;
