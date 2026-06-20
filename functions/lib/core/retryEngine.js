"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = void 0;
async function retry(fn, attempts = 3, delayMs = 1000) {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        }
        catch (error) {
            console.warn(`Attempt ${i + 1} failed. Retrying...`, error);
            if (i < attempts - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
            }
        }
    }
    return null;
}
exports.retry = retry;
//# sourceMappingURL=retryEngine.js.map