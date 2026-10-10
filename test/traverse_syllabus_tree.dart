import 'dart:io';
import 'dart:convert';

void main() {
  var file = File('assets/data/preview/jee_main_2027/syllabus_preview_tree.json');
  var data = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  var subjects = data['subjects'] as List<dynamic>;

  int totalNodes = 0;
  Map<String, int> subjectNodes = {};
  List<Map<String, dynamic>> allNodes = [];

  for (var sub in subjects) {
    String subName = sub['name'] ?? sub['title'] ?? sub['id'] ?? 'Unknown';
    String subId = sub['id'] ?? '';
    int count = 0;
    var units = sub['units'] as List<dynamic>? ?? [];
    for (var u in units) {
      String unitId = u['id'] ?? u['unitId'] ?? '';
      String unitName = u['name'] ?? u['title'] ?? '';
      var chapters = u['chapters'] as List<dynamic>? ?? u['topics'] as List<dynamic>? ?? [];
      for (var ch in chapters) {
        String topicId = ch['id'] ?? ch['topicId'] ?? '';
        String topicName = ch['name'] ?? ch['title'] ?? '';
        var nodes = ch['nodes'] as List<dynamic>? ?? ch['canonicalNodes'] as List<dynamic>? ?? [];
        if (nodes.isNotEmpty) {
          for (var n in nodes) {
            count++;
            totalNodes++;
            allNodes.add({
              'canonicalNodeId': n['id'] ?? n['canonicalNodeId'] ?? '',
              'subject': subName,
              'unitId': unitId,
              'unitName': unitName,
              'topicId': topicId,
              'topicName': topicName,
            });
          }
        } else {
          // Check if chapter itself is a node
          count++;
          totalNodes++;
          allNodes.add({
            'canonicalNodeId': topicId,
            'subject': subName,
            'unitId': unitId,
            'unitName': unitName,
            'topicId': topicId,
            'topicName': topicName,
          });
        }
      }
    }
    subjectNodes[subName] = count;
  }

  print('Total nodes in tree: $totalNodes');
  print('Subject nodes: $subjectNodes');
}
