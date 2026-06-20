/**
 * 🔱 TOKEN ESTIMATION LAW
 */
function calculateTokenEstimate(prompt, response) {
  const respStr = typeof response === 'string' ? response : JSON.stringify(response);
  const promptLen = typeof prompt === 'string' ? prompt.length : 0;
  return Math.ceil(promptLen / 4) + Math.ceil(respStr.length / 4);
}

module.exports = calculateTokenEstimate;
