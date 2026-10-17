/**
 * Bounded, deterministic SSC CGL study taxonomy.
 *
 * The official SSC PDF is authoritative for the subject/topic scope.  The
 * micro/atomic expansion below is an expert-derived learning map, not a claim
 * that SSC printed every child label in the PDF.  The verifier publishes it
 * only with this provenance and never mixes notification-only material.
 */

const SUBJECTS = {
  'Quantitative Aptitude': {
    defaultMicro: ['Core definitions and notation', 'Standard methods', 'Exam application'],
    atomic: ['Definitions and symbols', 'Recognition of the question type', 'Direct method', 'Mixed practice'],
  },
  'Reasoning': {
    defaultMicro: ['Concept and pattern recognition', 'Standard solving method', 'Exam application'],
    atomic: ['Terminology and rules', 'Pattern identification', 'Stepwise solving', 'Mixed practice'],
  },
  'General Intelligence': {
    defaultMicro: ['Concept and pattern recognition', 'Standard solving method', 'Exam application'],
    atomic: ['Terminology and rules', 'Pattern identification', 'Stepwise solving', 'Mixed practice'],
  },
  'English': {
    defaultMicro: ['Core rules and meaning', 'Usage in context', 'Exam application'],
    atomic: ['Definitions and rules', 'Recognition in context', 'Error identification', 'Mixed practice'],
  },
  'English Comprehension': {
    defaultMicro: ['Core rules and meaning', 'Usage in context', 'Exam application'],
    atomic: ['Definitions and rules', 'Recognition in context', 'Error identification', 'Mixed practice'],
  },
  'General Awareness': {
    defaultMicro: ['Core facts and concepts', 'Context and relationships', 'Exam application'],
    atomic: ['Key terms and facts', 'Classification and comparison', 'Cause or consequence', 'Mixed revision'],
  },
  'GA': {
    defaultMicro: ['Core facts and concepts', 'Context and relationships', 'Exam application'],
    atomic: ['Key terms and facts', 'Classification and comparison', 'Cause or consequence', 'Mixed revision'],
  },
};

const SPECIAL = {
  'Quantitative Aptitude|Algebra': {
    micro: ['Algebraic identities', 'Linear equations', 'Surds and indices'],
    atomic: ['Basic identities', 'Factorisation', 'Linear equation in one variable', 'Surds', 'Indices'],
  },
  'Quantitative Aptitude|Arithmetic': {
    micro: ['Number relationships', 'Commercial arithmetic', 'Rates and work', 'Data interpretation'],
    atomic: ['Ratio and proportion', 'Percentage', 'Profit and loss', 'Simple and compound interest', 'Time and work', 'Time distance and speed', 'Average', 'Mixture and allegation'],
  },
  'Quantitative Aptitude|Geometry': {
    micro: ['Lines and angles', 'Triangles', 'Circles and polygons'],
    atomic: ['Lines and angles', 'Triangle properties', 'Congruence and similarity', 'Circle theorems', 'Polygon properties'],
  },
  'Quantitative Aptitude|Mensuration': {
    micro: ['Plane figures', 'Solids', 'Composite figures'],
    atomic: ['Perimeter and area', 'Triangle and quadrilateral area', 'Circle area', 'Cuboid and cube', 'Cylinder and cone', 'Sphere and hemisphere'],
  },
  'Quantitative Aptitude|Number System': {
    micro: ['Numbers and operations', 'Divisibility', 'HCF and LCM'],
    atomic: ['Place value and types of numbers', 'Divisibility rules', 'HCF', 'LCM', 'Remainders'],
  },
  'Quantitative Aptitude|Statistics and Probability': {
    micro: ['Data representation', 'Central tendency', 'Probability basics'],
    atomic: ['Tables and graphs', 'Mean', 'Median', 'Mode', 'Basic probability'],
  },
  'Quantitative Aptitude|Trigonometry': {
    micro: ['Ratios and identities', 'Heights and distances', 'Applications'],
    atomic: ['Trigonometric ratios', 'Standard values', 'Identities', 'Heights and distances', 'Simple trigonometric equations'],
  },
  'Reasoning|Analogy and Classification': { micro: ['Word analogy', 'Number analogy', 'Classification'], atomic: ['Semantic analogy', 'Numerical analogy', 'Alphabet analogy', 'Odd one out'] },
  'Reasoning|Coding and Decoding': { micro: ['Letter coding', 'Number coding', 'Mixed coding'], atomic: ['Letter substitution', 'Number/symbol coding', 'Position coding', 'Mixed coding'] },
  'Reasoning|Series': { micro: ['Number series', 'Alphabet series', 'Mixed series'], atomic: ['Difference pattern', 'Multiplication pattern', 'Alphabet position pattern', 'Alternating pattern'] },
  'Reasoning|Venn Diagrams and Syllogism': { micro: ['Set representation', 'Syllogism rules', 'Conclusion testing'], atomic: ['Two-set diagram', 'Three-set diagram', 'Statement conversion', 'Valid conclusion'] },
  'Reasoning|Critical Thinking': { micro: ['Statement analysis', 'Decision making', 'Inference'], atomic: ['Assumption', 'Conclusion', 'Course of action', 'Inference'] },
  'Reasoning|Logical Relations': { micro: ['Blood relations', 'Direction sense', 'Order and ranking'], atomic: ['Family tree', 'Coded relations', 'Direction turns', 'Ranking positions'] },
  'Reasoning|Non-Verbal Reasoning': { micro: ['Figure patterns', 'Visual classification', 'Paper folding'], atomic: ['Figure series', 'Embedded figure', 'Mirror and water image', 'Paper folding'] },
  'English|Vocabulary': { micro: ['Word meaning', 'Synonyms and antonyms', 'Spelling'], atomic: ['Synonyms', 'Antonyms', 'One-word meaning', 'Correct spelling'] },
  'English|Grammar': { micro: ['Parts of speech', 'Agreement and tense', 'Sentence structure'], atomic: ['Noun and pronoun', 'Subject-verb agreement', 'Tenses', 'Prepositions and conjunctions'] },
  'English|Reading Comprehension': { micro: ['Passage reading', 'Inference', 'Vocabulary in context'], atomic: ['Main idea', 'Factual detail', 'Inference', 'Contextual meaning'] },
  'English|Sentence Usage': { micro: ['Sentence correction', 'Fill in the blanks', 'Active usage'], atomic: ['Error spotting', 'Cloze usage', 'Sentence improvement', 'Active/passive and narration'] },
  'English|Idioms and One-word Substitution': { micro: ['Idiomatic meaning', 'One-word vocabulary', 'Contextual use'], atomic: ['Common idioms', 'Meaning matching', 'One-word substitution', 'Usage in sentence'] },
  'General Awareness|Current Events': { micro: ['National events', 'International events', 'Government schemes'], atomic: ['Appointments and awards', 'Reports and indices', 'Schemes and initiatives', 'Sports and culture'] },
  'General Awareness|Economic Scene': { micro: ['Indian economy basics', 'Banking and finance', 'Public finance'], atomic: ['GDP and national income', 'Inflation', 'Banking terms', 'Budget and taxation'] },
  'General Awareness|General Policy': { micro: ['Constitution', 'Governance', 'Public institutions'], atomic: ['Fundamental rights', 'Parliament and executive', 'Judiciary', 'Constitutional bodies'] },
  'General Awareness|Geography': { micro: ['Physical geography', 'Indian geography', 'Resources'], atomic: ['Earth structure', 'Rivers and climate', 'Soils and agriculture', 'Minerals and industries'] },
  'General Awareness|History and Culture': { micro: ['Ancient and medieval India', 'Modern India', 'Culture'], atomic: ['Indus and Vedic age', 'Medieval kingdoms', 'Freedom movement', 'Art and architecture'] },
  'General Awareness|Scientific Research': { micro: ['Physics and chemistry basics', 'Biology and environment', 'Science applications'], atomic: ['Everyday physics', 'Basic chemistry', 'Human biology', 'Environment and technology'] },
};

function normalizeSubject(subject) {
  if (subject === 'General Intelligence') return 'Reasoning';
  if (subject === 'English Comprehension') return 'English';
  if (subject === 'GA') return 'General Awareness';
  return subject;
}

function buildTaxonomy(subject, unit, topic) {
  const canonicalSubject = normalizeSubject(subject);
  const special = SPECIAL[`${canonicalSubject}|${unit}`];
  const base = SUBJECTS[canonicalSubject] || SUBJECTS['General Awareness'];
  const microTitles = special?.micro || base.defaultMicro;
  const atomicTitles = special?.atomic || base.atomic;
  return { canonicalSubject, microTitles, atomicTitles };
}

module.exports = { buildTaxonomy, normalizeSubject };
