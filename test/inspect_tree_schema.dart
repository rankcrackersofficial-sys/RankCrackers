import 'dart:io';
import 'dart:convert';

void main() {
  var file = File('assets/data/preview/jee_main_2027/syllabus_preview_tree.json');
  var data = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  var subjects = data['subjects'] as List<dynamic>;
  print('Number of subjects: ${subjects.length}');
  for (var s in subjects) {
    if (s is Map) {
      print('Subject keys: ${s.keys.toList()}');
      print('Subject id: ${s['id']}, name: ${s['name']}');
      var chapters = s['chapters'] ?? s['units'] ?? s['topics'] ?? [];
      print('Chapters count: ${(chapters as List).length}');
      if (chapters.isNotEmpty) {
        print('First chapter keys: ${(chapters.first as Map).keys.toList()}');
        print('First chapter: ${chapters.first}');
      }
    }
  }
}
