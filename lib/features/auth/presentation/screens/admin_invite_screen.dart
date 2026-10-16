import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

/// Secure Admin invitation acceptance screen.
///
/// Plaintext bearer tokens are never disclosed in the UI or written to logs.
/// Acceptance is cryptographically verified by the server-side callable.
class AdminInviteScreen extends StatefulWidget {
  final String token;
  const AdminInviteScreen({super.key, required this.token});

  @override
  State<AdminInviteScreen> createState() => _AdminInviteScreenState();
}

class _AdminInviteScreenState extends State<AdminInviteScreen> {
  bool _loading = false;
  bool _accepted = false;
  String? _errorMessage;
  List<String> _grantedScopes = const [];

  Future<void> _handleAccept() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      setState(() {
        _errorMessage = 'Authentication required. Sign in with your authorized email first.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final callable = FirebaseFunctions.instance.httpsCallable('acceptAdminInvite');
      final result = await callable.call<Map<String, dynamic>>({
        'token': widget.token.trim(),
      });
      // Force refresh user ID token so newly granted admin claims are available immediately
      await FirebaseAuth.instance.currentUser?.getIdToken(true);
      final data = result.data;
      final scopes = (data['scopes'] as List? ?? []).cast<String>();

      if (mounted) {
        setState(() {
          _accepted = true;
          _grantedScopes = scopes;
        });
      }
    } on FirebaseFunctionsException catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.message ?? e.code;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
        });
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasInvite = widget.token.trim().isNotEmpty;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _accepted ? Icons.check_circle_outline : Icons.verified_user_outlined,
                  size: 42,
                  color: _accepted ? Colors.green : scheme.primary,
                ),
                const SizedBox(height: 16),
                Text(
                  'Secure Admin Invitation',
                  style: TextStyle(
                    color: scheme.onSurface,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
                const SizedBox(height: 12),
                if (!_accepted) ...[
                  Text(
                    hasInvite
                        ? 'Single-use invitation token detected. Secure server verification is required to activate Admin privileges.'
                        : 'A valid invitation link is required. Contact the Founder.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'No invitation has been accepted and no access has been granted.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12),
                  ),
                  if (hasInvite) ...[
                    const SizedBox(height: 24),
                    if (_loading)
                      CircularProgressIndicator(color: scheme.primary)
                    else
                      ElevatedButton(
                        onPressed: _handleAccept,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: scheme.primary,
                          foregroundColor: scheme.onPrimary,
                          minimumSize: const Size(double.infinity, 44),
                        ),
                        child: const Text('ACCEPT INVITATION',
                            style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                  ],
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.redAccent, fontSize: 12),
                    ),
                  ],
                ] else ...[
                  const Text(
                    'Invitation Accepted: Admin privileges activated.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.greenAccent, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Explicit scopes assigned: ${_grantedScopes.join(", ")}',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
