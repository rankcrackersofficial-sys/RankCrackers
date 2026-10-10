import 'dart:io';

void main() {
  var dirs = [
    Directory('lib/features/crucible'),
    Directory('lib/core'),
  ];

  print('=== SCANNING FOR TEMPORAL / TIMESTAMP PARSING IN CRUCIBLE & CORE ===');
  for (var dir in dirs) {
    if (!dir.existsSync()) continue;
    for (var f in dir.listSync(recursive: true)) {
      if (f is File && f.path.endsWith('.dart')) {
        var lines = f.readAsLinesSync();
        for (int i = 0; i < lines.length; i++) {
          var l = lines[i];
          if (l.contains('fromMillisecondsSinceEpoch') ||
              l.contains('as int') ||
              l.contains('Timestamp') ||
              l.contains('toDate(') ||
              l.contains('millisecondsSinceEpoch') ||
              l.contains('scheduleStartTime') ||
              l.contains('protocolStartTime') ||
              l.contains('startedAt') ||
              l.contains('expiresAt') ||
              l.contains('createdAt') ||
              l.contains('updatedAt') ||
              l.contains('lastSavedAt') ||
              l.contains('submittedAt') ||
              l.contains('finalizedAt') ||
              l.contains('serverNow')) {
            if (l.contains('DateTime') || l.contains('int') || l.contains('Timestamp') || l.contains('fromMap') || l.contains('toMap') || l.contains('json')) {
              print('${f.path}:${i+1} -> ${l.trim()}');
            }
          }
        }
      }
    }
  }
}
