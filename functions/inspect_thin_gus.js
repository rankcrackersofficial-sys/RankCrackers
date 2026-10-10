const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base\\docs\\patch_safety\\rc_digibook_automated_private_scale_25_to_51_20260902';
const tsv = fs.readFileSync(path.join(baseDir, '02_ACCEPTED_51_DENOMINATOR.tsv'), 'utf8');
const lines = tsv.trim().split('\n').slice(1);

const factCountBuckets = {
  FACT_COUNT_1: 0,
  FACT_COUNT_2: 0,
  FACT_COUNT_3: 0,
  FACT_COUNT_4: 0,
  FACT_COUNT_GT4: 0
};

const lowFactGUs = [];

lines.forEach(line => {
  const parts = line.split('\t');
  const index = parts[0];
  const subj = parts[1];
  const guId = parts[2];
  const nodeId = parts[3];
  const title = parts[4];
  const count = parseInt(parts[5], 10);
  const source = parts[6];

  if (count === 1) factCountBuckets.FACT_COUNT_1++;
  else if (count === 2) factCountBuckets.FACT_COUNT_2++;
  else if (count === 3) factCountBuckets.FACT_COUNT_3++;
  else if (count === 4) factCountBuckets.FACT_COUNT_4++;
  else factCountBuckets.FACT_COUNT_GT4++;

  if (count <= 4) {
    lowFactGUs.push({
      index,
      guId,
      subject: subj,
      nodeId,
      title,
      verifiedFactCount: count,
      source
    });
  }
});

console.log('Fact Count Distribution:', factCountBuckets);
console.log(`GUs with <= 4 facts (${lowFactGUs.length} Total):`);
lowFactGUs.forEach(g => {
  console.log(`- [${g.subject}] ${g.guId} (${g.title}): ${g.verifiedFactCount} facts [Source: ${g.source}]`);
});
