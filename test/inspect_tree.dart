import 'dart:io';
import 'dart:convert';

void main() {
  var file = File('assets/data/preview/jee_main_2027/syllabus_preview_tree.json');
  if (file.existsSync()) {
    var data = jsonDecode(file.readAsStringSync());
    print('Type of data: ${data.runtimeType}');
    if (data is Map) {
      print('Keys: ${data.keys.toList()}');
    }
  } else {
    print('File does not exist: ${file.path}');
  }
}
