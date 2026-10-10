import 'dart:io';

void main() {
  var files = [
    'lib/features/crucible/models/crucible_protocol_state.dart',
    'lib/features/crucible/models/student_crucible_ledger.dart',
    'lib/core/backend/crucible_repository.dart',
    'lib/features/crucible/presentation/providers/crucible_state_provider.dart',
    'lib/features/crucible/presentation/screens/crucible_screen.dart',
  ];

  for (var p in files) {
    var f = File(p);
    if (f.existsSync()) {
      print('=== $p ===');
      print(f.readAsStringSync());
    }
  }
}
