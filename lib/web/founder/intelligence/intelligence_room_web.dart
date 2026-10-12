import 'package:flutter/material.dart';
import '../../shared/rc_layout.dart';
import '../../shared/unified_command_console.dart';

class IntelligenceRoomWeb extends StatelessWidget {
  final ConsoleRoleMode roleMode;
  const IntelligenceRoomWeb({super.key, this.roleMode = ConsoleRoleMode.founder});

  @override
  Widget build(BuildContext context) {
    return const RcDataStateMessage(
      icon: Icons.biotech_outlined,
      title: 'INTELLIGENCE ROOM NOT READY',
      message: 'Autonomous Intelligence feeds and sentiment telemetry contracts are pending official deployment. Live pipeline telemetry is governed from Mission Control.',
    );
  }
}
