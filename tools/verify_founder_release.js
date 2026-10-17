const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const policy = JSON.parse(fs.readFileSync(path.join(__dirname, 'founder_web_release_policy.json'), 'utf8'));
const buildDir = path.join(root, 'build', 'web');
const sourceFiles = [
  path.join(root, 'lib', 'main_web.dart'),
  path.join(root, 'lib', 'web', 'founder')
];

const failures = [];
const checks = [];

function check(condition, message) {
  checks.push({ condition, message });
  if (!condition) failures.push(message);
}

function readRequired(file) {
  if (!fs.existsSync(file)) {
    failures.push(`Missing required file: ${path.relative(root, file)}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

function collectFiles(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) =>
    collectFiles(path.join(target, entry.name))
  );
}

const manifestPath = path.join(buildDir, 'manifest.json');
const indexPath = path.join(buildDir, 'index.html');
const jsPath = path.join(buildDir, 'main.dart.js');
const manifestText = readRequired(manifestPath);
const indexText = readRequired(indexPath);
const jsText = readRequired(jsPath);

let manifest = {};
try {
  manifest = JSON.parse(manifestText);
} catch (_) {
  failures.push('build/web/manifest.json is not valid JSON');
}

check(fs.existsSync(buildDir), 'Missing build/web. Build with the canonical Founder entrypoint first.');
check(manifest.name === policy.appName, `Manifest name must be ${policy.appName}. Found: ${manifest.name || '<missing>'}`);
check(manifest.short_name === policy.shortName, `Manifest short_name must be ${policy.shortName}. Found: ${manifest.short_name || '<missing>'}`);
check(manifest.description === policy.description, 'Manifest description is not the canonical Founder description.');
check(/<title>\s*RankCrackers\s*<\/title>/i.test(indexText), 'Built index.html must have the RankCrackers title.');
check(new RegExp(`<meta\\s+name=["']description["']\\s+content=["']${policy.description.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}["']`, 'i').test(indexText), 'Built index.html must have the canonical description.');

for (const marker of policy.requiredBuildMarkers) {
  check(jsText.includes(marker), `Build artifact is not the canonical Founder build; missing marker: ${marker}`);
}

const sourceText = sourceFiles.flatMap(collectFiles).map(readRequired).join('\n');
const artifactText = [indexText, manifestText, jsText].join('\n');
for (const marker of policy.forbiddenMarkers) {
  check(!sourceText.includes(marker), `Founder source contains forbidden legacy marker: ${marker}`);
  check(!artifactText.includes(marker), `Built Founder artifact contains forbidden legacy marker: ${marker}`);
}

const entrypointText = readRequired(path.join(root, policy.entrypoint));
check(sourceText.includes('FounderLightTheme'), 'Founder web source must use FounderLightTheme.');
check(entrypointText.includes('Founder Console'), 'Founder entrypoint must identify the Founder Console.');

if (failures.length) {
  console.error('FOUNDER RELEASE GATE: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('FOUNDER RELEASE GATE: PASS');
console.log(`- Entrypoint: ${policy.entrypoint}`);
console.log('- Branding: canonical');
console.log('- Legacy identity and dark-theme markers: absent');
console.log('- Build artifact: verified');
