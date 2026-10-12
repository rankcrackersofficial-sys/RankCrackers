import 'package:flutter/material.dart';
import '../../shared/unified_command_console.dart';

class IntelligenceRoomWeb extends StatelessWidget {
  final ConsoleRoleMode roleMode;
  const IntelligenceRoomWeb({super.key, this.roleMode = ConsoleRoleMode.founder});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Intelligence Room'));
  }
}
