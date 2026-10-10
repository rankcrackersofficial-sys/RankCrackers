const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

function canonicalSerializeLedger(data) {
  const cleanPayload = {
    schema_version: data.schema_version,
    ledger_revision: data.ledger_revision,
    previous_ledger_hash: data.previous_ledger_hash,
    domains: data.domains,
    capabilities: data.capabilities,
    features: data.features,
    items: data.items
  };

  return JSON.stringify(cleanPayload, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted, k) => {
          sorted[k] = value[k];
          return sorted;
        }, {});
    }
    return value;
  });
}

function computeLedgerHash(data) {
  const jsonStr = canonicalSerializeLedger(data);
  return crypto.createHash('sha256').update(jsonStr).digest('hex');
}

const targetDir = 'C:/RankCrackers/RankCrackers-55.worktrees/governance-living-checklist';

const logOutput = execSync('git log --format=format:"%H|%cd|%s" docs/governance/rankcrackers_living_master_checklist.json', {
  cwd: targetDir,
  encoding: 'utf8',
});

const commits = logOutput.trim().split('\n').filter(Boolean);
console.log('Found commits touching master checklist:', commits.length);

const results = [];

for (const line of commits) {
  const parts = line.replace(/^"/, '').replace(/"$/, '').split('|');
  const sha = parts[0];
  const date = parts[1];
  const msg = parts.slice(2).join('|');

  try {
    const content = execSync(`git show ${sha}:docs/governance/rankcrackers_living_master_checklist.json`, {
      cwd: targetDir,
      encoding: 'utf8',
      maxBuffer: 25 * 1024 * 1024,
    });
    const json = JSON.parse(content);
    const recomputed = computeLedgerHash(json);
    const rawFileHash = crypto.createHash('sha256').update(content).digest('hex');
    const matches = json.current_ledger_hash === recomputed;

    results.push({
      sha,
      date,
      msg,
      revision: json.ledger_revision,
      storedHash: json.current_ledger_hash,
      prevHash: json.previous_ledger_hash,
      recomputedHash: recomputed,
      rawFileHash,
      matches,
      itemCount: json.items ? json.items.length : 0,
    });

    console.log(`Commit: ${sha.substring(0, 10)} | Rev: ${json.ledger_revision} | Items: ${json.items ? json.items.length : 0} | Stored: ${json.current_ledger_hash ? json.current_ledger_hash.substring(0, 12) : 'NONE'} | Recomp: ${recomputed.substring(0, 12)} | RawFile: ${rawFileHash.substring(0, 12)} | Matches: ${matches} | ${msg}`);
  } catch (e) {
    console.error(`Error inspecting commit ${sha}:`, e.message);
  }
}

// Write TSV audit artifact to both repositories
const tsvHeader = 'commitSha\ttimestamp\tledgerRevision\tstoredLedgerHash\trecomputedLedgerHash\trawFileSha256\thashMatches\tpreviousLedgerHash\tmasterItemCount\tledgerFileChanged\treason\tcommandId\n';
const tsvRows = results.map(r => {
  return `${r.sha}\t${r.date}\t${r.revision}\t${r.storedHash}\t${r.recomputedHash}\t${r.rawFileHash}\t${r.matches ? 'YES' : 'NO'}\t${r.prevHash}\t${r.itemCount}\tYES\t${r.msg}\tRC_REVISION_7_LEDGER_HASH_IDENTITY_AUDIT`;
}).join('\n');

const outDirGov = path.join(targetDir, 'docs/governance/reviews/history');
fs.mkdirSync(outDirGov, { recursive: true });
fs.writeFileSync(path.join(outDirGov, 'RC_REVISION_7_LEDGER_HASH_IDENTITY_AUDIT.tsv'), tsvHeader + tsvRows + '\n');

const outDirMain = 'c:/RankCrackers/RankCrackers-55/docs/governance/reviews/history';
fs.mkdirSync(outDirMain, { recursive: true });
fs.writeFileSync(path.join(outDirMain, 'RC_REVISION_7_LEDGER_HASH_IDENTITY_AUDIT.tsv'), tsvHeader + tsvRows + '\n');

console.log('Saved TSV audit successfully.');
