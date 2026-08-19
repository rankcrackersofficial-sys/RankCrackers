function sanitizeBackslashes(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      const next = str[i + 1];
      if (next === '"' || next === '\\' || next === '/' || next === 'b' || next === 'f' || next === 'n' || next === 'r' || next === 't') {
        result += '\\' + next;
        i++;
      } else if (next === 'u') {
        const hex = str.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          result += '\\u' + hex;
          i += 5;
        } else {
          result += '\\\\';
        }
      } else {
        result += '\\\\';
      }
    } else {
      result += str[i];
    }
  }
  return result;
}

const text = 'E_x = E_0 \\\\sin(\\\\omega t - kz)';
console.log("Original text:", text);
console.log("Sanitized text:", sanitizeBackslashes(text));
try {
  JSON.parse('"' + sanitizeBackslashes(text) + '"');
  console.log("Parsed successfully!");
} catch (e) {
  console.log("Failed to parse:", e.message);
}
