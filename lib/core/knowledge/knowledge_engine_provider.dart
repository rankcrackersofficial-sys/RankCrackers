import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'knowledge_engine.dart';
import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import '../firebase/firestore_service.dart';
import '../../shared/providers/session_provider.dart';

final knowledgeEngineProvider = ChangeNotifierProvider<KnowledgeEngine>((ref) {
  return KnowledgeEngine.instance;
});

/// LIVE SYLLABUS PROVIDER (G2 Alignment)
/// Streams syllabus nodes directly from Firestore based on the active exam.
final liveNodesProvider = StreamProvider<List<MicroTopicNode>>((ref) {
  final sessionUser = ref.watch(activeSessionUserProvider);
  final examId = sessionUser?.examId;

  if (examId == null || examId.isEmpty) {
    return Stream.value(<MicroTopicNode>[]);
  }

  return FirestoreService.streamNodesByExam(examId).map((nodes) {
    return nodes.where((node) {
      final status = node.status.toLowerCase();
      final isPublished = status == 'published' ||
          status == 'active' ||
          status == 'live' ||
          status.isEmpty;
      // Strict Paper-1 Scope for JEE
      final isPaper1 = node.examId != 'jee_main_2026' ||
          node.paperId == 'PAPER_1' ||
          node.paperId.isEmpty;
      return isPublished && isPaper1;
    }).toList();
  });
});

final allNodesProvider = Provider<List<MicroTopicNode>>((ref) {
  final sessionUser = ref.watch(activeSessionUserProvider);
  // Never fall back to another mission's cached graph while the live stream is
  // loading. That was the source of the JEE curriculum leaking into SSC.
  final liveState = ref.watch(liveNodesProvider);
  if (liveState.hasValue) return liveState.value ?? const <MicroTopicNode>[];

  final engine = ref.watch(knowledgeEngineProvider);
  return engine.allNodes
      .where((node) => node.examId == sessionUser.examId)
      .toList();
});

final nodeStatesProvider = Provider<Map<String, NodeRuntimeState>>((ref) {
  final engine = ref.watch(knowledgeEngineProvider);
  return engine.nodeStates;
});

final recommendationsProvider = Provider<List<MicroTopicNode>>((ref) {
  final engine = ref.watch(knowledgeEngineProvider);
  return engine.getRecommendations();
});
