import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/dashboard/presentation/widgets/navigation/dashboard_bottom_nav.dart';

class MainShell extends StatelessWidget {

  final Widget child;

  const MainShell({
    super.key,
    required this.child,
  });

  int _calculateIndex(
      BuildContext context,
      ) {

    final String location =
    GoRouterState.of(context)
        .uri
        .toString();

    if (location == '/dashboard') {
      return 0;
    }

    if (location == '/crucible') {
      return 1;
    }

    if (location == '/digibook') {
      return 2;
    }

    if (location == '/syllabus') {
      return 3;
    }

    if (location == '/profile') {
      return 4;
    }

    return 0;
  }

  @override
  Widget build(
      BuildContext context,
      ) {

    return Scaffold(

      body: child,

      bottomNavigationBar:
      DashboardBottomNav(

        currentIndex:
        _calculateIndex(
          context,
        ),

        onTap: (_) {},
      ),
    );
  }
}