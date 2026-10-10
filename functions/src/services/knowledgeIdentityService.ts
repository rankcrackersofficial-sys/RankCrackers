import * as crypto from 'crypto';

export type EquivalenceDecision =
  | 'CANONICAL_REUSE_CONFIRMED'
  | 'CANONICAL_NEW_ENTITY'
  | 'CANONICAL_MATCH_REVIEW_REQUIRED';

export interface SemanticFingerprint {
  subject: string;
  normalizedTitle: string;
  conceptScope?: string;
  constituentConcepts?: string[];
  parentContext?: string;
}

/**
 * 🔱 GOVERNED UNIVERSAL KNOWLEDGE IDENTITY SERVICE (P1)
 * Decouples Canonical Knowledge Identity from Mission Syllabus Membership.
 * Enforces Two-Stage Resolution and prohibits title-only merging.
 */
export class KnowledgeIdentityService {

  /**
   * STAGE A: Candidate Fingerprint Generation (Provisional)
   * Produces a candidate hash based on normalized title and subject.
   */
  static generateCandidateCanonicalTopicId(subject: string, title: string): string {
    const normSubject = subject.toLowerCase().trim();
    const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const key = `candidate:topic:${normSubject}:${normTitle}`;
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  }

  /**
   * Governed Semantic Fingerprint Generator (Stage A + B input)
   */
  static generateSemanticFingerprintHash(fp: SemanticFingerprint): string {
    const normSubj = fp.subject.toLowerCase().trim();
    const normTitle = fp.normalizedTitle.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const scope = (fp.conceptScope || '').toLowerCase().trim();
    const parent = (fp.parentContext || '').toLowerCase().trim();
    const concepts = (fp.constituentConcepts || []).map(c => c.toLowerCase().trim()).sort().join('|');

    const rawKey = `semantic:${normSubj}:${normTitle}:${scope}:${parent}:${concepts}`;
    return crypto.createHash('sha256').update(rawKey).digest('hex').slice(0, 16);
  }

  /**
   * STAGE B: Governed Equivalence Decision Engine
   * Prevents title-only auto-merging for topics with different scope or context.
   */
  static evaluateEquivalence(
    sourceA: SemanticFingerprint,
    sourceB: SemanticFingerprint
  ): { decision: EquivalenceDecision; canonicalId: string; reason: string } {
    const hashA = this.generateSemanticFingerprintHash(sourceA);
    const hashB = this.generateSemanticFingerprintHash(sourceB);

    // Exact semantic fingerprint match -> Confirmed Reuse
    if (hashA === hashB) {
      return {
        decision: 'CANONICAL_REUSE_CONFIRMED',
        canonicalId: `canon_${hashA}`,
        reason: 'Identical subject, title, scope, and constituent concepts.'
      };
    }

    // Same title & subject, but different scope/context -> Review Required or Distinct
    const sameTitle = sourceA.normalizedTitle.toLowerCase().replace(/[^a-z0-9]/g, '') ===
                      sourceB.normalizedTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    const sameSubject = sourceA.subject.toLowerCase() === sourceB.subject.toLowerCase();

    if (sameSubject && sameTitle) {
      return {
        decision: 'CANONICAL_MATCH_REVIEW_REQUIRED',
        canonicalId: `canon_pending_${hashA}`,
        reason: 'Same title and subject, but divergent academic scope or parent context detected. Auto-merge prohibited.'
      };
    }

    // Distinct entities
    return {
      decision: 'CANONICAL_NEW_ENTITY',
      canonicalId: `canon_${hashA}`,
      reason: 'Distinct academic concepts.'
    };
  }

  /**
   * Deterministic Universal Knowledge Node ID
   */
  static generateUniversalNodeId(canonicalTopicId: string, conceptText: string): string {
    const normText = conceptText.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const key = `universal:node:${canonicalTopicId}:${normText}`;
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  }
}
