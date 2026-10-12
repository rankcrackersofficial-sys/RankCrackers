import 'package:flutter/material.dart';
import 'package:rank_crackers/features/admin/presentation/widgets/dashboard/founder_activity_ledger.dart';
import '../../shared/unified_command_console.dart';

class RecentActivityWeb extends StatelessWidget {
  final ConsoleRoleMode roleMode;
  const RecentActivityWeb({super.key, this.roleMode = ConsoleRoleMode.founder});

  @override
  Widget build(BuildContext context) {
    return const FounderActivityLedger();
  }
}

