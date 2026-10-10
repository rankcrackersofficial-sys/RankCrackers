import 'dart:io';

void main() {
  var file = File('lib/features/crucible/core/crucible_canonical_schedules.dart');
  var lines = file.readAsLinesSync();

  int phyAssigned = 0;
  int chemAssigned = 0;
  int mathAssigned = 0;
  String currentSubject = '';
  List<String> assignedNodes = [];
  Map<String, String> nodeSubject = {};
  Map<String, String> nodeSchedule = {};
  String currentSchedule = '';

  for (var line in lines) {
    if (line.contains('scheduleId:')) {
      var match = RegExp(r'sch_jee_main_2027_(\d+)').firstMatch(line);
      if (match != null) {
        int num = int.parse(match.group(1)!);
        currentSchedule = 'S${num.toString().padLeft(2, '0')}';
      }
    }
    if (line.contains('subject:')) {
      if (line.contains('Physics')) currentSubject = 'Physics';
      if (line.contains('Chemistry')) currentSubject = 'Chemistry';
      if (line.contains('Mathematics')) currentSubject = 'Mathematics';
    }
    if (line.trim().startsWith("'JEE_MAIN_") || line.trim().startsWith("'JEE_")) {
      var node = line.trim().replaceAll("'", "").replaceAll(",", "");
      assignedNodes.add(node);
      nodeSubject[node] = currentSubject;
      nodeSchedule[node] = currentSchedule;
      if (currentSubject == 'Physics') phyAssigned++;
      if (currentSubject == 'Chemistry') chemAssigned++;
      if (currentSubject == 'Mathematics') mathAssigned++;
    }
  }

  print('PHYSICS_ASSIGNED: $phyAssigned');
  print('CHEMISTRY_ASSIGNED: $chemAssigned');
  print('MATHEMATICS_ASSIGNED: $mathAssigned');
  print('TOTAL_ASSIGNED: ${assignedNodes.length}');
  print('UNIQUE_ASSIGNED: ${assignedNodes.toSet().length}');
}
