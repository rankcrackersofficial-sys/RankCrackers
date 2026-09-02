import * as crypto from 'crypto';

/**
 * 🔱 KNOWLEDGE IDENTITY SERVICE
 * Responsibility: Generate and manage stable, mission-independent academic identities.
 */
export class KnowledgeIdentityService {

  /**
   * Generates a deterministic universal ID for a topic.
   * COMBINATION: subject + normalized_title
   */
  static generateUniversalTopicId(subject: string, title: string): string {
    const normSubject = subject.toLowerCase().trim();
    const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const key = `universal:topic:${normSubject}:${normTitle}`;
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  }

  /**
   * Generates a deterministic universal ID for a knowledge node (atom).
   * COMBINATION: universalTopicId + normalized_concept_text
   */
  static generateUniversalNodeId(universalTopicId: string, conceptText: string): string {
    const normText = conceptText.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const key = `universal:node:${universalTopicId}:${normText}`;
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  }
}
