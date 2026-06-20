import 'package:flutter/material.dart';

class TacticalSecureLayer extends StatelessWidget {
  final Widget child;
  final bool isPremium;

  const TacticalSecureLayer({
    super.key,
    required this.child,
    this.isPremium = false,
  });

  @override
  Widget build(BuildContext context) {
    return child;
  }
}