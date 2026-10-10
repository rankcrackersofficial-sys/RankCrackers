const crypto = require('crypto');

/**
 * SOURCE INTELLIGENCE REGISTRY
 * Canonical registry maintaining all mission knowledge sources across Tiers 0 to 5.
 * Enforces authority tier precedence, cryptographic integrity, and rights traceability.
 */
class SourceIntelligenceRegistry {
  constructor() {
    this.sources = new Map();
    this._initializeOfficialSources();
  }

  _initializeOfficialSources() {
    // Tier 0: Official Exam Authority
    this.registerSource({
      sourceId: 'NTA_JEE_MAIN_2026_OFFICIAL_SYLLABUS',
      missionId: 'jee_main_2027',
      sourceType: 'OFFICIAL_EXAM_SYLLABUS',
      publisher: 'National Testing Agency (NTA)',
      title: 'JEE (Main) Information Bulletin & Official Syllabus',
      rightsStatus: 'PUBLIC_DOMAIN',
      authorityTier: 0,
      subject: 'All',
      syllabusScope: 'COMPLETE_JEE_MAIN',
      canonicalNodeMappings: ['JEE_MAIN_2026_*'],
      version: '2026.1',
      content: 'Official NTA syllabus covering Physics, Chemistry, and Mathematics.',
    });

    // Tier 1: Official Educational Authority
    this.registerSource({
      sourceId: 'NCERT_MATHEMATICS_CLASS_11_OFFICIAL',
      missionId: 'jee_main_2027',
      sourceType: 'OFFICIAL_TEXTBOOK',
      publisher: 'NCERT (National Council of Educational Research and Training)',
      title: 'Mathematics Textbook for Class XI',
      rightsStatus: 'PUBLIC_FACTUAL_REFERENCE_ONLY',
      authorityTier: 1,
      subject: 'Mathematics',
      syllabusScope: 'CLASS_11_UNITS_01_TO_16',
      canonicalNodeMappings: ['JEE_MAIN_2026_MAT_*'],
      version: '2024-25_EDITION',
      content: 'Official Class 11 Mathematics standard definitions, theorems, and exercise boundaries.',
    });

    this.registerSource({
      sourceId: 'NCERT_PHYSICS_CLASS_11_OFFICIAL',
      missionId: 'jee_main_2027',
      sourceType: 'OFFICIAL_TEXTBOOK',
      publisher: 'NCERT',
      title: 'Physics Textbook for Class XI (Part I & II)',
      rightsStatus: 'PUBLIC_FACTUAL_REFERENCE_ONLY',
      authorityTier: 1,
      subject: 'Physics',
      syllabusScope: 'CLASS_11_PHYSICS_COMPLETE',
      canonicalNodeMappings: ['JEE_MAIN_2026_PHY_*'],
      version: '2024-25_EDITION',
      content: 'Official SI units, physical quantities, mechanics, and dimensional analysis standard.',
    });

    this.registerSource({
      sourceId: 'NCERT_CHEMISTRY_CLASS_11_OFFICIAL',
      missionId: 'jee_main_2027',
      sourceType: 'OFFICIAL_TEXTBOOK',
      publisher: 'NCERT',
      title: 'Chemistry Textbook for Class XI (Part I & II)',
      rightsStatus: 'PUBLIC_FACTUAL_REFERENCE_ONLY',
      authorityTier: 1,
      subject: 'Chemistry',
      syllabusScope: 'CLASS_11_CHEMISTRY_COMPLETE',
      canonicalNodeMappings: ['JEE_MAIN_2026_CHE_*'],
      version: '2024-25_EDITION',
      content: 'Official atomic structure, Bohr model, periodic classification standard.',
    });
  }

  registerSource(data) {
    const content = data.content || '';
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const record = {
      sourceId: data.sourceId,
      missionId: data.missionId || 'jee_main_2027',
      sourceType: data.sourceType,
      publisher: data.publisher,
      title: data.title,
      rightsStatus: data.rightsStatus,
      authorityTier: data.authorityTier, // 0 to 5
      subject: data.subject,
      syllabusScope: data.syllabusScope,
      canonicalNodeMappings: data.canonicalNodeMappings || [],
      retrievedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      contentHash,
      version: data.version || '1.0',
      extractionStatus: 'READY',
      trustStatus: 'VERIFIED',
      conflictState: 'RESOLVED',
      rawContent: content,
    };
    this.sources.set(record.sourceId, record);
    return record;
  }

  getSource(sourceId) {
    return this.sources.get(sourceId);
  }

  getAllSources() {
    return Array.from(this.sources.values());
  }

  /**
   * Evaluates authority conflict between two sources.
   * Lower tier number wins (Tier 0 > Tier 1 > Tier 2 > Tier 3 > Tier 4 > Tier 5).
   * If tiers are equal and claims conflict: emits NEEDS_VERIFICATION.
   */
  resolveSourcePrecedence(sourceIdA, sourceIdB) {
    const sA = this.getSource(sourceIdA);
    const sB = this.getSource(sourceIdB);
    if (!sA || !sB) throw new Error('Source not found in registry');

    if (sA.authorityTier < sB.authorityTier) {
      return { winner: sA, loser: sB, status: 'RESOLVED_BY_TIER' };
    }
    if (sB.authorityTier < sA.authorityTier) {
      return { winner: sB, loser: sA, status: 'RESOLVED_BY_TIER' };
    }
    // Equal authority tier conflict
    return { winner: null, loser: null, status: 'NEEDS_VERIFICATION' };
  }
}

module.exports = { SourceIntelligenceRegistry };
