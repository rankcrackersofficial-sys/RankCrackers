import { AafWorker } from '../workers/aafWorkerTypes';

/**
 * 🔱 AAF JOB REGISTRY
 * Maps task types to specialized AAF worker adapters.
 * Implements AAF-004D Real Governed Worker Bindings.
 */
class AafJobRegistry {
  private handlers: Map<string, AafWorker> = new Map();

  register(type: string, handler: AafWorker) {
    this.handlers.set(type, handler);
  }

  getHandler(type: string): AafWorker | undefined {
    return this.handlers.get(type);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const aafJobRegistry = new AafJobRegistry();

/**
 * 🛡️ WORKER BINDINGS (FIXED CONTRACT)
 * Binding AAF job types to their respective adapters.
 */
import { structuralAafWorker } from '../workers/structuralAafWorker';
import { svoAafWorker } from '../workers/svoAafWorker';
import { manifestAafWorker } from '../workers/manifestAafWorker';
import { digibookDraftAafWorker } from '../workers/digibookDraftAafWorker';
import { encodingAafWorker } from '../workers/encodingAafWorker';
import { repairAafWorker } from '../workers/repairAafWorker';

// 1. structural -> Pass 1
aafJobRegistry.register('structural', structuralAafWorker);

// 2. svo -> Pass 2
aafJobRegistry.register('svo', svoAafWorker);

// 3. manifest -> Pass 3
aafJobRegistry.register('manifest', manifestAafWorker);

// 4. digibookDraft -> Pass 3 (Mapped to manifestation logic)
aafJobRegistry.register('digibookDraft', digibookDraftAafWorker);

// 5. encoding -> Normalization
aafJobRegistry.register('encoding', encodingAafWorker);

// 6. repair -> Canonical Repair
aafJobRegistry.register('repair', repairAafWorker);

/**
 * 🛡️ BLOCKED_MISSING_WORKER_CAPABILITY
 * The following job types currently have no dedicated governed worker in Functions.
 * mcqDraft, mcqValidation, revisionDraft, revisionValidation,
 * digibookValidation, digibookProReview, digibookAssembly.
 */
