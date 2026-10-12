import 'package:flutter/material.dart';

/// Read-only self-service view of the persisted Admin access record.
/// This is a presentation surface; backend claims/rules remain authoritative.
class AdminMyAccessPanel extends StatelessWidget {
  final Map<String, dynamic> permissions;
  final Map<String, dynamic> userDoc;

  const AdminMyAccessPanel({
    super.key,
    required this.permissions,
    required this.userDoc,
  });

  @override
  Widget build(BuildContext context) {
    final role = userDoc['role']?.toString() ?? 'Not assigned';
    final active = userDoc['status'] == 'ACTIVE';

    // Only display explicit scopes; never infer role grants or silently
    // represent missing data as permission.
    final scopes = <String>{
      for (final entry in permissions.entries)
        if (entry.value == true) entry.key,
      if (permissions['scopes'] is List)
        for (final value in permissions['scopes'] as List)
          if (value is String && value.isNotEmpty) value,
      if (permissions['grants'] is List)
        for (final value in permissions['grants'] as List)
          if (value is String && value.isNotEmpty) value,
    }.toList()
      ..sort();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('MY ACCESS', style: TextStyle(
              color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text('Account role: $role',
              style: const TextStyle(color: Colors.white70)),
          Text('Account status: ${active ? 'ACTIVE' : 'NOT ACTIVE'}',
              style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 16),
          const Text('Explicit Admin permissions',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          if (scopes.isEmpty)
            const Text('No explicit Admin module permissions are recorded.',
                style: TextStyle(color: Colors.white70)),
          for (final scope in scopes)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text(scope, style: const TextStyle(color: Colors.white70)),
            ),
          const SizedBox(height: 16),
          const Text('Changes to access require Founder authorization. '
              'This display does not grant permissions.',
              style: TextStyle(color: Colors.white54, fontSize: 12)),
        ],
      ),
    );
  }
}
