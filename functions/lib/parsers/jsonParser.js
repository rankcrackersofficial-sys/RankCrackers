"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJSON = void 0;
function parseJSON(text) {
    try {
        return JSON.parse(text);
    }
    catch (e) {
        console.log('JSON PARSE ERROR');
        return null;
    }
}
exports.parseJSON = parseJSON;
//# sourceMappingURL=jsonParser.js.map