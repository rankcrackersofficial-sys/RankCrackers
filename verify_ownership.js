const { isLegacyGenericTask, SPECIALIZED_TASK_TYPES } = require(\u0027./functions/lib/workers/queueWorker\u0027);

const tests = [
  { input: { type: \u0027mcq\u0027 }, expected: true, label: \u0027Legacy mcq\u0027 },
  { input: { type: \u0027digibook\u0027 }, expected: true, label: \u0027Legacy digibook\u0027 },
  { input: { type: \u0027revision\u0027 }, expected: true, label: \u0027Legacy revision\u0027 },
  { input: { type: \u0027mcq\u0027, queueContract: \u0027academic_factory_v1\u0027 }, expected: false, label: \u0027AAF mcq\u0027 },
  { input: { type: \u0027STRUCTURAL\u0027 }, expected: false, label: \u0027Specialized STRUCTURAL\u0027 },
  { input: { type: \u0027MANIFEST_KNOWLEDGE\u0027 }, expected: false, label: \u0027Specialized MANIFEST\u0027 },
  { input: {}, expected: false, label: \u0027Missing type\u0027 }
];

let allPassed = true;
tests.forEach(t \u003d\u003e {
  const actual \u003d isLegacyGenericTask(t.input);
  if (actual \u003d\u003d\u003d t.expected) {
    console.log(\u0027PASS: \u0027 + t.label);
  } else {
    console.log(\u0027FAIL: \u0027 + t.label + \u0027 (Expected \u0027 + t.expected + \u0027, got \u0027 + actual + \u0027)\u0027);
    allPassed \u003d false;
  }
});

process.exit(allPassed ? 0 : 1);