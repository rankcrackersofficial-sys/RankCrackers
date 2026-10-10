/**
 * @file detect_placeholder_hashes.js
 * Automated tool to scan academic review JSON artifacts for synthetic, placeholder,
 * sequential, or suspicious SHA-256 patterns.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Suspicious patterns:
// 1. Sequential hex runs like 1a2b3c4d, 2b3c4d5e, 01234567, abcdef...
// 2. Reversed hex runs like fedcba98, 98765432...
// 3. Repeating nibble templates like e8b7c6a5d4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7
// 4. Repeated character runs of 4+ identical characters
// 5. Hardcoded fake strings like "hash_...", "000000...", "123456..."

function isSuspiciousSha256(str) {
  if (typeof str !== 'string') return false;
  const val = str.trim();
  
  // Must be 64 char hex string to be considered a SHA-256 candidate
  if (!/^[0-9a-fA-F]{64}$/.test(val)) {
    // Check if it's a known fake prefix
    if (/^hash_[0-9a-fA-F]{64}$/.test(val)) return true;
    return false;
  }
  
  const lower = val.toLowerCase();
  
  // Pattern 1: Sequential step runs (e.g. 1a2b3c4d, 2b3c4d5e, 3c4d5e6f)
  if (/(?:1a2b3c4d|2b3c4d5e|3c4d5e6f|4d5e6f7a|5e6f7a8b|6f7a8b9c|7a8b9c0d|8b9c0d1e|9c0d1e2f|0d1e2f3a)/.test(lower)) {
    return true;
  }
  
  // Pattern 2: Downward descending runs (e.g. f5e4d3c2b1a09876543210fedcba)
  if (/(?:f5e4d3c2|e4d3c2b1|d3c2b1a0|9876543210fedcba|fedcba98)/.test(lower)) {
    return true;
  }
  
  // Pattern 3: Arithmetic stepped sequence (e.g. e8b7c6a5d4f3e2d1)
  if (/e8b7c6a5d4f3e2d1/.test(lower)) {
    return true;
  }
  
  // Pattern 4: Repeated 4+ identical chars (e.g. aaaaa, 00000)
  if (/(.)\1{5,}/.test(lower)) {
    return true;
  }
  
  // Pattern 5: High entropy check (a genuine SHA256 has byte entropy between ~3.7 and ~4.0 per nibble)
  const charCounts = {};
  for (const c of lower) {
    charCounts[c] = (charCounts[c] || 0) + 1;
  }
  const uniqueChars = Object.keys(charCounts).length;
  // If unique hex characters in 64 chars is less than 10, likely synthetic
  if (uniqueChars < 10) {
    return true;
  }
  
  return false;
}

function scanObjectForHashes(obj, currentPath, findings) {
  if (!obj) return;
  if (typeof obj === 'string') {
    if (isSuspiciousSha256(obj)) {
      findings.push({
        path: currentPath,
        value: obj,
        issue: 'SUSPICIOUS_SYNTHETIC_OR_SEQUENTIAL_HASH'
      });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      scanObjectForHashes(item, `${currentPath}[${idx}]`, findings);
    });
  } else if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      scanObjectForHashes(val, `${currentPath}.${key}`, findings);
    }
  }
}

function scanFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    const findings = [];
    scanObjectForHashes(json, path.basename(filePath), findings);
    return findings;
  } catch (err) {
    return [{ path: filePath, value: null, issue: `PARSE_ERROR: ${err.message}` }];
  }
}

function runScanner() {
  const targetDir = path.join(__dirname, '../../docs/academic_review');
  const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.json'));
  
  const report = {
    scannedAt: new Date().toISOString(),
    totalJsonFilesScanned: files.length,
    resultsByFile: {},
    summary: {
      cleanFiles: [],
      flaggedFiles: []
    }
  };
  
  for (const f of files) {
    const fullPath = path.join(targetDir, f);
    const findings = scanFile(fullPath);
    report.resultsByFile[f] = {
      findingsCount: findings.length,
      findings
    };
    if (findings.length === 0) {
      report.summary.cleanFiles.push(f);
    } else {
      report.summary.flaggedFiles.push({ file: f, count: findings.length });
    }
  }
  
  return report;
}

if (require.main === module) {
  const report = runScanner();
  console.log(JSON.stringify(report, null, 2));
}

module.exports = { isSuspiciousSha256, scanFile, runScanner };
