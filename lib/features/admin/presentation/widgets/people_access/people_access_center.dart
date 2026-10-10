import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../shared/widgets/tactical_button.dart';
import '../../../data/repositories/access_repository.dart';
import '../shared/center_header.dart';
import 'widgets/access_role_card.dart';

class PeopleAccessCenter extends StatelessWidget {
  const PeopleAccessCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<Map<String, int>>(
      stream: AccessRepository.streamAccessMetrics(),
      builder: (context, snapshot) {
        final metrics = snapshot.data ??
            {
              'founders': 0,
              'admins': 0,
              'managers': 0,
              'reviewers': 0,
              'total': 0
            };

        return ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const CenterHeader(
                title: "PEOPLE & ACCESS",
                subtitle: "Manage command authority and warrior permissions."),
            const SizedBox(height: 24),
            AccessRoleCard(
                title: "FOUNDERS",
                count: metrics['founders'].toString(),
                icon: Icons.stars_rounded,
                color: AppColors.gold),
            const SizedBox(height: 12),
            AccessRoleCard(
                title: "ADMINISTRATORS",
                count: metrics['admins'].toString(),
                icon: Icons.admin_panel_settings_rounded,
                color: Colors.blueAccent),
            const SizedBox(height: 12),
            AccessRoleCard(
                title: "CONTENT MANAGERS",
                count: metrics['managers'].toString(),
                icon: Icons.edit_attributes_rounded,
                color: Colors.greenAccent),
            const SizedBox(height: 12),
            AccessRoleCard(
                title: "REVIEWERS",
                count: metrics['reviewers'].toString(),
                icon: Icons.fact_check_rounded,
                color: Colors.orangeAccent),
            const SizedBox(height: 32),
            if (FirebaseAuth.instance.currentUser != null)
              FutureBuilder<IdTokenResult>(
                future: FirebaseAuth.instance.currentUser!.getIdTokenResult(),
                builder: (context, tokenSnap) {
                  final isFounder = tokenSnap.data?.claims?['founder'] == true;
                  if (!isFounder) return const SizedBox.shrink();

                  return TacticalButton(
                    title: "GRANT ACCESS",
                    onTap: () => _showGrantAccessDialog(context),
                  );
                },
              ),
            const SizedBox(height: 12),
            Text(
              "TOTAL AUTHENTICATED SOULS: ${metrics['total']}",
              style: AppTypography.label
                  .copyWith(fontSize: 8, color: Colors.white12),
              textAlign: TextAlign.center,
            ),
          ],
        );
      },
    );
  }

  void _showGrantAccessDialog(BuildContext context) {
    final uidController = TextEditingController();
    String selectedRole = 'admin';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0C121D),
        title: Text("GRANT AUTHORITY", style: AppTypography.cardTitle),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: uidController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: "Target UID",
                labelStyle: TextStyle(color: Colors.white38),
                enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: Colors.white10)),
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: selectedRole,
              dropdownColor: const Color(0xFF0C121D),
              style: const TextStyle(color: Colors.white),
              items: ['founder', 'admin', 'manager', 'reviewer']
                  .map((r) =>
                      DropdownMenuItem(value: r, child: Text(r.toUpperCase())))
                  .toList(),
              onChanged: (v) => selectedRole = v ?? 'admin',
              decoration: const InputDecoration(labelText: "Role"),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("CANCEL")),
          TextButton(
            onPressed: () async {
              if (uidController.text.isEmpty) return;
              try {
                await AccessRepository.manageUserAccess(
                  targetUid: uidController.text.trim(),
                  role: selectedRole,
                  action: 'grant',
                );
                if (context.mounted) Navigator.pop(context);
              } catch (e) {
                // Show error
              }
            },
            child: const Text("GRANT", style: TextStyle(color: AppColors.gold)),
          ),
        ],
      ),
    );
  }
}
