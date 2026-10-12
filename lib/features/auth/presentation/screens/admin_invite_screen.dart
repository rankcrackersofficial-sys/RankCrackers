import 'package:flutter/material.dart';

/// Fail-closed invitation entry.
///
/// The existing manageUserAccess callable implements role grants/revocations,
/// not invitation validation/acceptance. Until the backend has an authenticated,
/// one-time invitation contract, this screen must never reveal bearer tokens,
/// claim an invitation was accepted, or grant access on the client.
class AdminInviteScreen extends StatelessWidget {
  final String token;
  const AdminInviteScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    final hasInvite = token.trim().isNotEmpty;
    return Scaffold(
      backgroundColor: const Color(0xFF070A12),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.verified_user_outlined,
                    size: 42, color: Color(0xFFB39B5D)),
                const SizedBox(height: 16),
                const Text('Secure Admin Invitation',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 20)),
                const SizedBox(height: 12),
                Text(
                  hasInvite
                      ? 'Invitation acceptance is unavailable until secure server verification is enabled. Contact the Founder.'
                      : 'A valid invitation link is required. Contact the Founder.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(height: 12),
                const Text('No invitation has been accepted and no access has been granted.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white54, fontSize: 12)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
