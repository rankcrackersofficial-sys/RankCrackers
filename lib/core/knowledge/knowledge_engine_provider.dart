import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'knowledge_engine.dart';
import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import '../firebase/firestore_service.dart';
import '../../shared/providers/session_provider.dart';

final knowledgeEngineProvider = ChangeNotifierProvider<KnowledgeEngine>((ref) {
  return KnowledgeEngine.instance;
});

/// Keeps the singleton engine's cached graph from leaking across mission switches.
List<MicroTopicNode> missionScopedCachedNodes({
  required String selectedExamId,
  required String? engineExamId,
  required List<MicroTopicNode> cachedNodes,
}) {
  if (selectedExamId.isEmpty || engineExamId != selectedExamId) {
    return <MicroTopicNode>[];
  }
  return cachedNodes.where((node) => node.examId == selectedExamId).toList();
}

/// LIVE SYLLABUS PROVIDER (G2 Alignment)
/// Streams syllabus nodes directly from Firestore based on the active exam.
final liveNodesProvider = StreamProvider<List<MicroTopicNode>>((ref) {
  final sessionUser = ref.watch(sessionUserProvider).valueOrNull;
  final examId = sessionUser?.examId;
  
  if (examId == null || examId.isEmpty) {
    return Stream.value(<MicroTopicNode>[]);
  }
  
  return FirestoreService.streamNodesByExam(examId).map((nodes) {
    return nodes.where((node) {
      final status = node.status.toLowerCase();
      final isPublished = status == 'published' || status == 'active' || status == 'live' || status.isEmpty;
      // Strict Paper-1 Scope for JEE
      final isPaper1 = node.examId != 'jee_main_2026' || node.paperId == 'PAPER_1' || node.paperId.isEmpty;
      return isPublished && isPaper1;
    }).toList();
  });
});

final allNodesProvider = Provider<List<MicroTopicNode>>((ref) {
  // Optimization: Prefer live stream if available
  final liveNodes = ref.watch(liveNodesProvider).valueOrNull;
  if (liveNodes != null && liveNodes.isNotEmpty) return liveNodes;

  final selectedExamId = ref.watch(activeSessionUserProvider).examId;
  final engine = ref.watch(knowledgeEngineProvider);
  return missionScopedCachedNodes(
    selectedExamId: selectedExamId,
    engineExamId: engine.activeRecruitment?.examId,
    cachedNodes: engine.allNodes,
  );
});

final nodeStatesProvider = Provider<Map<String, NodeRuntimeState>>((ref) {
  final engine = ref.watch(knowledgeEngineProvider);
  return engine.nodeStates;
});

final recommendationsProvider = Provider<List<MicroTopicNode>>((ref) {
  final engine = ref.watch(knowledgeEngineProvider);
  return engine.getRecommendations();
});
