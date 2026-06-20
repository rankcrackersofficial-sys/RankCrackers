import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'knowledge_engine.dart';
import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import '../firebase/firestore_service.dart';
import '../../shared/providers/session_provider.dart';

final knowledgeEngineProvider = ChangeNotifierProvider<KnowledgeEngine>((ref) {
  return KnowledgeEngine();
});

/// 🔱 LIVE SYLLABUS PROVIDER (G2 Alignment)
/// Streams syllabus nodes directly from Firestore based on the active exam.
final liveNodesProvider = StreamProvider<List<MicroTopicNode>>((ref) {
  final sessionUser = ref.watch(sessionUserProvider).valueOrNull;
  final examId = sessionUser?.examId ?? 'ras';
  
  return FirestoreService.streamNodesByExam(examId);
});

final allNodesProvider = Provider<List<MicroTopicNode>>((ref) {
  // 🔱 Optimization: Prefer live stream if available
  final liveNodes = ref.watch(liveNodesProvider).valueOrNull;
  if (liveNodes != null && liveNodes.isNotEmpty) return liveNodes;

  final engine = ref.watch(knowledgeEngineProvider);
  return engine.allNodes;
});

final nodeStatesProvider = Provider<Map<String, NodeRuntimeState>>((ref) {
  final engine = ref.watch(knowledgeEngineProvider);
  return engine.nodeStates;
});

final recommendationsProvider = Provider<List<MicroTopicNode>>((ref) {
  final engine = ref.watch(knowledgeEngineProvider);
  return engine.getRecommendations();
});
