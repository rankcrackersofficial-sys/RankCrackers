"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aafJobRegistry = void 0;
/**
 * 🔱 AAF JOB REGISTRY
 * Maps task types to specialized AAF worker adapters.
 * Implements AAF-004D Real Governed Worker Bindings.
 */
class AafJobRegistry {
    constructor() {
        this.handlers = new Map();
    }
    register(type, handler) {
        this.handlers.set(type, handler);
    }
    getHandler(type) {
        return this.handlers.get(type);
    }
    getRegisteredTypes() {
        return Array.from(this.handlers.keys());
    }
}
exports.aafJobRegistry = new AafJobRegistry();
/**
 * 🛡️ WORKER BINDINGS (FIXED CONTRACT)
 * Binding AAF job types to their respective adapters.
 */
const structuralAafWorker_1 = require("../workers/structuralAafWorker");
const svoAafWorker_1 = require("../workers/svoAafWorker");
const manifestAafWorker_1 = require("../workers/manifestAafWorker");
const digibookDraftAafWorker_1 = require("../workers/digibookDraftAafWorker");
const encodingAafWorker_1 = require("../workers/encodingAafWorker");
const repairAafWorker_1 = require("../workers/repairAafWorker");
// 1. structural -> Pass 1
exports.aafJobRegistry.register('structural', structuralAafWorker_1.structuralAafWorker);
// 2. svo -> Pass 2
exports.aafJobRegistry.register('svo', svoAafWorker_1.svoAafWorker);
// 3. manifest -> Pass 3
exports.aafJobRegistry.register('manifest', manifestAafWorker_1.manifestAafWorker);
// 4. digibookDraft -> Pass 3 (Mapped to manifestation logic)
exports.aafJobRegistry.register('digibookDraft', digibookDraftAafWorker_1.digibookDraftAafWorker);
// 5. encoding -> Normalization
exports.aafJobRegistry.register('encoding', encodingAafWorker_1.encodingAafWorker);
// 6. repair -> Canonical Repair
exports.aafJobRegistry.register('repair', repairAafWorker_1.repairAafWorker);
/**
 * 🛡️ BLOCKED_MISSING_WORKER_CAPABILITY
 * The following job types currently have no dedicated governed worker in Functions.
 * mcqDraft, mcqValidation, revisionDraft, revisionValidation,
 * digibookValidation, digibookProReview, digibookAssembly.
 */
//# sourceMappingURL=aafJobRegistry.js.map