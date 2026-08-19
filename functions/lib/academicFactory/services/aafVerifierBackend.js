"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceBoundIndependentVerifierBackend = exports.RealProviderExecutionDisabledAdapter = void 0;
/**
 * Compatibility export for AAF-006B.
 *
 * The authoritative verifier backend is independentFactVerifierBackend. This
 * wrapper exists so older local tests/imports cannot drift into a second
 * lifecycle authority or silent provider implementation.
 */
var independentFactVerifierBackend_1 = require("./independentFactVerifierBackend");
Object.defineProperty(exports, "RealProviderExecutionDisabledAdapter", { enumerable: true, get: function () { return independentFactVerifierBackend_1.RealProviderExecutionDisabledAdapter; } });
Object.defineProperty(exports, "SourceBoundIndependentVerifierBackend", { enumerable: true, get: function () { return independentFactVerifierBackend_1.SourceBoundIndependentVerifierBackend; } });
//# sourceMappingURL=aafVerifierBackend.js.map