import 'package:flutter/material.dart';

class AdminInviteScreen extends StatelessWidget {
  final String token;
  const AdminInviteScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text('Admin invite: $token')));
  }
}
