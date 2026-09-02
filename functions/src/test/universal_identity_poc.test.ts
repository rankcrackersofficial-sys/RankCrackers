import { KnowledgeIdentityService } from '../services/knowledgeIdentityService';

describe('🔱 UNIVERSAL KNOWLEDGE IDENTITY POC (P1-F)', () => {

  test('Same Physics concept in JEE and NEET gets same Universal ID', () => {
    const topicTitle = "Kinematics - Motion in a Straight Line";
    const conceptText = "Uniformly Accelerated Motion";

    // JEE Mission mapping
    const jeeTopicId = KnowledgeIdentityService.generateUniversalTopicId("Physics", topicTitle);
    const jeeNodeId = KnowledgeIdentityService.generateUniversalNodeId(jeeTopicId, conceptText);

    // NEET Mission mapping (Same subject and title, different context/exam)
    const neetTopicId = KnowledgeIdentityService.generateUniversalTopicId("Physics", topicTitle);
    const neetNodeId = KnowledgeIdentityService.generateUniversalNodeId(neetTopicId, conceptText);

    // Assert Canonical Identity Equivalence
    expect(jeeTopicId).toBe(neetTopicId);
    expect(jeeNodeId).toBe(neetNodeId);
  });

  test('Different concepts get distinct Universal IDs', () => {
    const topic1 = KnowledgeIdentityService.generateUniversalTopicId("Physics", "Optics");
    const topic2 = KnowledgeIdentityService.generateUniversalTopicId("Physics", "Thermodynamics");

    expect(topic1).not.toBe(topic2);
  });
});
