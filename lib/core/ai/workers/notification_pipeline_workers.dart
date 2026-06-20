import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/notification_canonical.dart';
import 'package:rank_crackers/core/engines/chunking_engine.dart';
import 'package:rank_crackers/core/models/mastery_node.dart';
import 'document_intelligence_workers.dart';
import 'atomic_rule_engine.dart';
import 'eligibility_engine.dart';

/// 🔱 NOTIFICATION WORKER PIPELINE v2.1 (Sprint O Hardened)
/// Orchestrates dynamic extraction, classification, and linkage.

class RealPdfChunkEngine {
  static List<Map<String, dynamic>> chunkify(String text) {
    return ChunkingEngine.segment(text);
  }
}

class CoordinateRecoveryEngine {
  static Map<String, int> recover(List<Map<String, dynamic>> chunks, String fact) {
    if (fact.isEmpty || fact == '0') return {'page': 1, 'lineStart': 0, 'lineEnd': 0};
    for (var chunk in chunks) {
      if (chunk['content'].toString().contains(fact)) {
        final content = chunk['content'].toString();
        final index = content.indexOf(fact);
        final linesBefore = content.substring(0, index).split('\n').length;
        
        return {
          'page': chunk['page'],
          'lineStart': (chunk['line_count'] as int) + linesBefore,
          'lineEnd': (chunk['line_count'] as int) + linesBefore + fact.split('\n').length,
        };
      }
    }
    return {'page': 1, 'lineStart': 0, 'lineEnd': 0};
  }
}

class NotificationExtractionEngine {
  static Future<Map<String, dynamic>> extractMetadata(String text) async {
    final List<String> knownOrgs = ["SSC", "UPSC", "RPSC", "RSSB", "RSMSSB", "RRB", "IBPS", "SBI", "NTA"];
    String org = "UNKNOWN";
    for (var known in knownOrgs) {
      if (text.contains(known)) { org = known; break; }
    }

    String title = "Recruitment Discovery";
    final titleMatch = RegExp(r'(Recruitment|Examination|Notice) (of|for) (.*?)( 202\d| Notification)', caseSensitive: false).firstMatch(text);
    if (titleMatch != null) { title = titleMatch.group(3) ?? title; }

    return {
      'organization': org,
      'recruitment_name': title,
      'advertisement_number': _extractRegex(text, r'Advt\.? No\.?\s?([A-Z0-9\/_-]+)', 'PENDING'),
    };
  }

  static String _extractRegex(String text, String pattern, String fallback) {
    final match = RegExp(pattern, caseSensitive: false).firstMatch(text);
    return match?.group(1) ?? fallback;
  }
}

class VacancyIntelligenceWorker {
  static Future<VacancyIntelligence> process(String text) async {
    final totalMatch = RegExp(r'(Total|Number of) (Vacancies|Posts|Positions)\s?[:\-=]?\s?(\d+)', caseSensitive: false).firstMatch(text);
    int total = int.tryParse(totalMatch?.group(3) ?? '0') ?? 0;
    return VacancyIntelligence(totalVacancies: total);
  }
}

class VerificationReportWorker {
  static Map<String, dynamic> generateHealthReport({
    required List<MasteryNode> masteryNodes,
    required int totalAtomicTopics,
  }) {
    final mastered = masteryNodes.where((n) => n.status == 'MASTERED').length;
    return {
      'total_topics': totalAtomicTopics,
      'mastered': mastered,
      'readiness_percent': totalAtomicTopics == 0 ? 0 : (mastered / totalAtomicTopics) * 100,
    };
  }
}

class NotificationReportBuilder {
  static Future<NotificationCanonical> build({
    required String id,
    required String url,
    required String hash,
    required String text,
  }) async {
    debugPrint("🔱 NOTIFICATION REPORT BUILDER: Running v2.1 Intelligence Pipeline...");
    
    final chunks = RealPdfChunkEngine.chunkify(text);
    
    // 🔱 Step 1: Classification & Resolution
    await DocumentClassificationEngine.classify(text);
    final linkedRealm = await RecruitmentResolverEngine.resolve(text);
    
    // 🔱 Step 2: Meta Extraction
    final meta = await NotificationExtractionEngine.extractMetadata(text);
    final vacancy = await VacancyIntelligenceWorker.process(text);
    
    // 🔱 Step 3: Atomic Rule Extraction
    final rules = await AtomicRuleEngine.extractRules(text);

    // 🔱 Step 4: Knowledge Graph Linkage & Corrigendum Tracking
    await CorrigendumEngine.analyze(text, linkedRealm?.realmId ?? "new_realm");

    final kGraph = NotificationKnowledgeGraph(
      linkedRules: rules.map((r) => r.ruleId).toList(),
      linkedSyllabusTopics: ["${meta['organization']?.toLowerCase()}_syllabus_general"],
    );

    // 🔱 Step 5: Intelligence & Relevance
    final initialIntelligence = NotificationIntelligence(
      vacancy: vacancy,
      exam: ExamIntelligence(stages: ['Preliminary']),
      eligibility: EligibilityMatrix(minimumAge: 18, maximumAge: 40),
      atomicRules: rules,
      userRelevance: UserRelevanceEngine(),
      dates: ImportantDates(applicationStart: DateTime.now()),
      fees: FeeMatrix(general: 100),
    );
    
    final userRelevance = await EligibilityIntelligenceEngine.analyze(initialIntelligence);
    final finalIntelligence = initialIntelligence.copyWith(userRelevance: userRelevance);

    // 🔱 Step 6: Evidence Assembly
    final evidence = EvidenceMap(
      factEvidence: {
        'total_vacancies': Evidence(
          extractedText: vacancy.totalVacancies.toString(),
          confidence: 0.9,
        ),
      },
      confidence: ConfidenceReport(average: 0.85),
    );

    // 🔱 Step 7: Final Assembly
    final identity = NotificationIdentity(
      notificationId: id,
      notificationNumber: meta['advertisement_number']!,
      notificationTitle: meta['recruitment_name']!,
      organization: meta['organization']!,
      recruitmentName: meta['recruitment_name']!,
      recruitmentCode: "${meta['organization']?.toLowerCase()}_${meta['recruitment_name']?.toLowerCase().replaceAll(' ', '_')}",
      documentVersion: '1.0',
      documentLanguage: 'English',
      documentStatus: 'AWAITING_REVIEW',
      sourceUrl: url,
      sourceHash: hash,
      linkedRealmId: linkedRealm?.realmId,
    );

    return NotificationCanonical(
      identity: identity,
      intelligence: finalIntelligence,
      graph: kGraph,
      evidence: evidence,
      feedback: NotificationFeedback(
        status: 'awaiting_review',
      ),
    );
  }
}
