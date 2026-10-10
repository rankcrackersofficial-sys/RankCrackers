import 'dart:io';
import 'dart:convert';

void main() {
  // Search for canonical syllabus files
  List<String> searchPaths = [
    'assets',
    'lib',
    'docs',
    'tools',
  ];

  for (var p in searchPaths) {
    var dir = Directory(p);
    if (!dir.existsSync()) continue;
    for (var f in dir.listSync(recursive: true)) {
      if (f is File && f.path.endsWith('.json')) {
        try {
          var str = f.readAsStringSync();
          if (str.contains('JEE_MAIN_2026') || str.contains('JEE_MAIN_2027') || str.contains('canonicalNodeId')) {
            print('Candidate file: ${f.path} (size: ${f.lengthSync()})');
          }
        } catch (_) {}
      }
    }
  }
}
