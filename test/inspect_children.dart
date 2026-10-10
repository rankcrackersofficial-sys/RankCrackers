import 'dart:io';
import 'dart:convert';

void main() {
  var file = File('assets/data/preview/jee_main_2027/syllabus_preview_tree.json');
  var data = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  var subjects = data['subjects'] as List<dynamic>;
  for (var s in subjects) {
    print('Subject: ${s['name']}, atomCount: ${s['atomCount']}');
    var children = s['children'] as List<dynamic>? ?? [];
    print('Children count: ${children.length}');
    if (children.isNotEmpty) {
      print('First child keys: ${(children.first as Map).keys.toList()}');
      print('First child: ${children.first}');
    }
  }
}
