import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../shared/unified_command_console.dart';

class PyqVerificationTab extends StatelessWidget {
  final String missionId;
  final List<QueryDocumentSnapshot<Map<String, dynamic>>> variables;
  final String? initialDocumentId;
  final ConsoleRoleMode roleMode;

  const PyqVerificationTab({
    super.key,
    required this.missionId,
    required this.variables,
    this.initialDocumentId,
    this.roleMode = ConsoleRoleMode.founder,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text('PYQ Verification for $missionId'),
    );
  }
}
