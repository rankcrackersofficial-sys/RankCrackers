import 'package:flutter/material.dart';

class AdminTasksList extends StatelessWidget {
  final void Function(String taskId, String taskType, String? missionId)? onOpenTask;
  const AdminTasksList({super.key, this.onOpenTask});

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Admin tasks list'));
  }
}
