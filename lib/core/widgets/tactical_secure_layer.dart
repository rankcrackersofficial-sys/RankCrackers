import 'package:flutter/material.dart';
import 'paywall/premium_paywall_widget.dart';

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
    if (!isPremium) return child;

    return Stack(
      fit: StackFit.expand,
      children: [
        child,
        const PremiumPaywallWidget(),
      ],
    );
  }
}
