const { extractSyllabusTopics, isAcademicSyllabusPage } = require('./workers/mission_academic_materializer_worker');
const sample = 'codes/roll numbers, Small & Capital letters/numbers coding, decoding and classification, Embedded Figures, Critical thinking, Emotional Intelligence, Social Intelligence. General Awareness: Questions in this component will be aimed at testing the candidates general awareness. Mathematical Abilities: Statistics and probability, Use of Tables and Graphs.';
const topics = extractSyllabusTopics(sample);
if (!isAcademicSyllabusPage(sample) || topics.length < 2 || topics.some((topic) => /reservation|vacanc|ews|sc\s*\/\s*st/i.test(topic.title))) {
  throw new Error(`SYLLABUS_PARSER_REGRESSION: ${JSON.stringify(topics)}`);
}
console.log(JSON.stringify({ ok: true, topics }));
