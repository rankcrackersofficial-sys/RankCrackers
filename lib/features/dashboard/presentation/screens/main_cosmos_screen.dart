import 'package:flutter/material.dart';

import 'dashboard_screen.dart';

import '../../../archive/presentation/screens/archive_screen.dart';

import '../../../syllabus/presentation/screens/syllabus_screen.dart';

import '../../../profile/presentation/screens/profile_screen.dart';

import '../widgets/navigation/dashboard_bottom_nav.dart';


class MainCosmosScreen extends StatefulWidget {

  const MainCosmosScreen({
    super.key,
  });

  @override
  State<MainCosmosScreen>
  createState() =>
      _MainCosmosScreenState();
}

class _MainCosmosScreenState
    extends State<MainCosmosScreen> {

  int currentIndex = 0;

  final PageController
  _pageController =
  PageController();

  // =====================================================
  // ALL SCREENS
  // =====================================================

  final List<Widget> screens = [

    const DashboardScreen(),

    const DashboardScreen(),

    const ArchiveScreen(),

    const SyllabusScreen(),

    const ProfileScreen(),
  ];

  // =====================================================
  // DISPOSE
  // =====================================================

  @override
  void dispose() {

    _pageController.dispose();

    super.dispose();
  }

  // =====================================================
  // BUILD
  // =====================================================

  @override
  Widget build(
      BuildContext context,
      ) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(

      backgroundColor:
      scheme.surface,

      body: PageView(

        controller:
        _pageController,

        physics:
        const NeverScrollableScrollPhysics(),

        children: screens,
      ),

      bottomNavigationBar:
      DashboardBottomNav(

        currentIndex:
        currentIndex,

        onTap: (index) {

          setState(() {

            currentIndex = index;
          });

          _pageController
              .jumpToPage(
            index,
          );
        },
      ),
    );
  }
}
