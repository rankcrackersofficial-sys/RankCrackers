"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJSON = parseJSON;
function parseJSON(text) {
    try {
        return JSON.parse(text);
    }
    catch (e) {
        console.log('JSON PARSE ERROR');
        return null;
    }
}
//# sourceMappingURL=jsonParser.js.map