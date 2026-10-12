import 'package:flutter/material.dart';
import '../../shared/rc_layout.dart';

class RevenueSubscriptionControlWeb extends StatelessWidget {
  const RevenueSubscriptionControlWeb({super.key});

  @override
  Widget build(BuildContext context) {
    return const RcDataStateMessage(
      icon: Icons.payments_outlined,
      title: 'REVENUE & SUBSCRIPTION CONTROL NOT READY',
      message: 'Payment gateway integrations and monetization contracts are disabled during Phase 0 governance. Financial mutations require Founder signature.',
    );
  }
}
