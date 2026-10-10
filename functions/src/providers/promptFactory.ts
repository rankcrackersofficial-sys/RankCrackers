export function buildPrompt(type: string, payload: any) {
  switch (type) {
    case 'mcq': {
      const count = payload.questionsCount || payload.count;
      const countText = count 
        ? `Generate exactly ${count} MCQ(s) matching the requested difficulty.`
        : `Generate: 15 easy, 20 medium, 15 hard`;
      return `
Generate competitive exam MCQs.
Topic: ${payload.topic}
Rules:
- Exam-oriented
- Avoid repetition
- Include conceptual traps
- Include tactical distractors
- Include explanation
- Include difficulty level
- Avoid vague wording
- Human-style framing
${countText}
Output JSON format:
{ "mcqs": [ { "question": "", "options": [], "correctIndex": 0, "explanation": "", "difficulty": 1 } ] }
`;
    }

    case 'digibook':
      return `
You are generating tactical study material for competitive exam aspirants.
Topic: ${payload.topic}
Rules:
- Human teaching tone
- Exam-oriented explanation
- No robotic wording
- Include conceptual clarity
- Include memory hooks
- Include tactical exam insights
- Include one-liners
- Include revision bullets
- Avoid fluff
- Avoid AI-like wording
Output JSON format:
{ "explanation": "", "oneLiners": [], "revisionPoints": [] }
`;

    case 'revision':
      return `
Generate tactical revision material.
Topic: ${payload.topic}
Rules:
- Memory reinforcement focused
- Extremely concise
- High-retention phrasing
- Exam-oriented recall
- Include tactical memory hooks
- Include rapid revision bullets
- No fluff
- No robotic tone
Output JSON:
{ "oneLiners": [], "revisionPoints": [], "memoryHooks": [] }
`;

    default:
      return 'Unknown Task';
  }
}
