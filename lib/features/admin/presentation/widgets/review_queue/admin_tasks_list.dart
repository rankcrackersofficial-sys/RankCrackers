import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../../../../core/admin/admin_permission_resolver.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';

/// Governed Admin Work Queue.
/// Displays assigned tasks for the authenticated Admin user, with fail-closed
/// permission enforcement and live Firestore synchronization.
class AdminTasksList extends StatelessWidget {
  final void Function(String taskId, String taskType, String? missionId)? onOpenTask;

  const AdminTasksList({super.key, this.onOpenTask});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Center(
        child: Text(
          'Authentication required to inspect work queue.',
          style: TextStyle(color: Colors.white38, fontSize: 13),
        ),
      );
    }

    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance.collection('users').doc(user.uid).snapshots(),
      builder: (context, userSnapshot) {
        final userData = userSnapshot.data?.data() ?? {};
        final permissions = (userData['permissions'] as Map<String, dynamic>?) ??
            (userData['scopes'] is List ? {'scopes': userData['scopes']} : <String, dynamic>{});

        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('admin_tasks')
              .where('assignedToUid', isEqualTo: user.uid)
              .orderBy('createdAt', descending: true)
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 36),
                      const SizedBox(height: 12),
                      Text(
                        'Unable to load assigned tasks:\n${snapshot.error}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              );
            }

            if (!snapshot.hasData) {
              return const Center(
                child: SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 2.5),
                ),
              );
            }

            final docs = snapshot.data!.docs;
            if (docs.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.assignment_turned_in_outlined,
                          color: Colors.white24, size: 48),
                      const SizedBox(height: 16),
                      const Text(
                        'NO ASSIGNED WORK',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Founder-assigned review items and verification workflows will appear here.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white38, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: docs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final doc = docs[index];
                final data = doc.data();
                return _buildTaskCard(context, doc.id, data, permissions);
              },
            );
          },
        );
      },
    );
  }

  Widget _buildTaskCard(
    BuildContext context,
    String taskId,
    Map<String, dynamic> data,
    Map<String, dynamic> permissions,
  ) {
    final title = data['title']?.toString() ?? 'Untitled Task';
    final taskType = data['taskType']?.toString() ?? 'GENERAL';
    final status = data['status']?.toString() ?? 'OPEN';
    final missionId = data['missionId']?.toString();
    final requiredScope = data['requiredScope']?.toString() ?? data['requiredPermission']?.toString();

    final hasPermission = requiredScope == null || AdminPermissionResolver.allows(permissions, requiredScope);

    Color statusColor;
    switch (status) {
      case 'IN_PROGRESS':
        statusColor = Colors.blueAccent;
        break;
      case 'DONE':
        statusColor = Colors.green;
        break;
      case 'BLOCKED':
        statusColor = Colors.redAccent;
        break;
      default:
        statusColor = AppColors.gold;
    }

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111422),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: hasPermission ? Colors.white12 : Colors.red.withValues(alpha: 0.3),
        ),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: statusColor, width: 0.8),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white10,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  taskType,
                  style: const TextStyle(color: Colors.white70, fontSize: 10),
                ),
              ),
              const Spacer(),
              if (requiredScope != null)
                Text(
                  'Scope: $requiredScope',
                  style: TextStyle(
                    color: hasPermission ? Colors.white38 : Colors.redAccent,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (data['description'] != null) ...[
            const SizedBox(height: 6),
            Text(
              data['description'].toString(),
              style: const TextStyle(color: Colors.white60, fontSize: 12),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              if (missionId != null && missionId.isNotEmpty)
                Text(
                  'Mission: $missionId',
                  style: const TextStyle(color: AppColors.gold, fontSize: 11),
                ),
              const Spacer(),
              OutlinedButton(
                onPressed: () => _showTaskStatusDialog(context, taskId, data, hasPermission),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white70,
                  side: const BorderSide(color: Colors.white24),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  minimumSize: Size.zero,
                ),
                child: const Text('UPDATE STATUS', style: TextStyle(fontSize: 11)),
              ),
              if (onOpenTask != null) ...[
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: hasPermission
                      ? () => onOpenTask!(taskId, taskType, missionId)
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gold,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                  child: const Text('OPEN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  void _showTaskStatusDialog(
    BuildContext context,
    String taskId,
    Map<String, dynamic> data,
    bool hasPermission,
  ) {
    final noteCtrl = TextEditingController(text: data['adminNote']?.toString() ?? '');
    final currentStatus = data['status']?.toString() ?? 'OPEN';

    showDialog(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          backgroundColor: const Color(0xFF141829),
          title: Text(
            data['title']?.toString() ?? 'Task Actions',
            style: const TextStyle(color: AppColors.gold, fontSize: 15),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!hasPermission)
                Container(
                  padding: const EdgeInsets.all(8),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.redAccent),
                  ),
                  child: const Text(
                    'ACCESS RESTRICTED: You lack the authorized scope required to modify this task.',
                    style: TextStyle(color: Colors.redAccent, fontSize: 11),
                  ),
                ),
              TextField(
                controller: noteCtrl,
                enabled: hasPermission,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: const InputDecoration(
                  labelText: 'Admin Note / Progress Report',
                  labelStyle: TextStyle(color: Colors.white54),
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('CANCEL', style: TextStyle(color: Colors.white54)),
            ),
            if (hasPermission) ...[
              if (currentStatus == 'OPEN')
                FilledButton(
                  onPressed: () async {
                    await _updateTask(taskId, 'IN_PROGRESS', noteCtrl.text);
                    if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                  },
                  style: FilledButton.styleFrom(backgroundColor: Colors.blueAccent),
                  child: const Text('START'),
                ),
              if (currentStatus == 'IN_PROGRESS' || currentStatus == 'BLOCKED')
                FilledButton(
                  onPressed: () async {
                    await _updateTask(taskId, 'DONE', noteCtrl.text);
                    if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                  },
                  style: FilledButton.styleFrom(backgroundColor: Colors.green),
                  child: const Text('MARK DONE'),
                ),
              if (currentStatus == 'IN_PROGRESS')
                FilledButton(
                  onPressed: () async {
                    await _updateTask(taskId, 'BLOCKED', noteCtrl.text);
                    if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                  },
                  style: FilledButton.styleFrom(backgroundColor: Colors.redAccent),
                  child: const Text('BLOCK'),
                ),
            ],
          ],
        );
      },
    );
  }

  Future<void> _updateTask(String taskId, String status, String note) async {
    await FirebaseFirestore.instance.collection('admin_tasks').doc(taskId).set({
      'status': status,
      'adminNote': note,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}
