import '../../../core/models/micro_topic_node.dart';
import 'digibook_content.dart';

class DigiBookSession {
  final String title;
  final List<MicroTopicNode> nodes;
  final List<DigiBookContent> payloads; // 🔱 Decoupled content
  final int estimatedMinutes;

  const DigiBookSession({
    required this.title,
    required this.nodes,
    required this.payloads,
    required this.estimatedMinutes,
  });
}
