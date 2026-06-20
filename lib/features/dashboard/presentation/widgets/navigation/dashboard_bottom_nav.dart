import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../../core/utils/app_routes.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../shared/dashboard_constants.dart';

class DashboardBottomNav extends StatelessWidget {

  final int currentIndex;

  final Function(int) onTap;

  const DashboardBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {

    return DarkCard(
      height: 84,
      padding: EdgeInsets.zero,
      borderRadius: BorderRadius.zero,
      border: Border(
        top: BorderSide(
          color:
          DashboardConstants
              .goldAccent
              .withValues(
            alpha: 0.08,
          ),
        ),
      ),
      boxShadow: [
        BoxShadow(
          color:
          DashboardConstants
              .goldAccent
              .withValues(
            alpha: 0.04,
          ),
          blurRadius: 24,
          spreadRadius: 1,
          offset:
          const Offset(0, -4),
        ),
      ],
      child: SafeArea(

        top: false,

        child: Row(

          mainAxisAlignment:
          MainAxisAlignment
              .spaceAround,

          children: [

            _navItem(
              context: context,
              index: 0,
              icon: Icons.public_rounded,
              label: "Cosmos",
              route: AppRoutes.dashboard,
            ),

            _navItem(
              context: context,
              index: 1,
              icon:
              Icons
                  .local_fire_department_rounded,
              label: "Crucible",
              route:
              AppRoutes.crucible,
            ),

            _navItem(
              context: context,
              index: 2,
              icon:
              Icons.auto_stories_rounded,
              label: "Archive",
              route:
              AppRoutes.digiBook,
            ),

            _navItem(
              context: context,
              index: 3,
              icon:
              Icons.account_tree_rounded,
              label: "Syllabus",
              route:
              AppRoutes.syllabus,
            ),

            _navItem(
              context: context,
              index: 4,
              icon:
              Icons.person_rounded,
              label: "Profile",
              route:
              AppRoutes.profile,
            ),
          ],
        ),
      ),
    );
  }

  Widget _navItem({

    required BuildContext context,

    required int index,

    required IconData icon,

    required String label,

    required String route,
  }) {

    final bool isActive =
        currentIndex == index;

    return GestureDetector(

      onTap: () {

        // ======================
        // UPDATE ACTIVE TAB
        // ======================

        onTap(index);

        // ======================
        // PREVENT DUPLICATE NAV
        // ======================

        final currentLocation =
        GoRouterState.of(context)
            .uri
            .toString();

        if (currentLocation ==
            route) {
          return;
        }

        // ======================
        // SAFE NAVIGATION
        // ======================

        context.push(route);
      },

      child: AnimatedContainer(

        duration:
        const Duration(
          milliseconds: 250,
        ),

        padding:
        const EdgeInsets.symmetric(
          horizontal: 10,
          vertical: 10,
        ),

        decoration: BoxDecoration(

          borderRadius:
          BorderRadius.circular(
            16,
          ),

          gradient: isActive

              ? LinearGradient(

            colors: [

              DashboardConstants
                  .goldAccent
                  .withValues(
                alpha: 0.22,
              ),

              DashboardConstants
                  .goldAccent
                  .withValues(
                alpha: 0.08,
              ),
            ],
          )

              : null,

          border: Border.all(

            color: isActive

                ? DashboardConstants
                .goldAccent
                .withValues(
              alpha: 0.35,
            )

                : Colors.transparent,
          ),

          boxShadow: isActive

              ? [

            BoxShadow(

              color:
              DashboardConstants
                  .goldAccent
                  .withValues(
                alpha: 0.12,
              ),

              blurRadius: 18,
              spreadRadius: 1,
            ),
          ]

              : [],
        ),

        child: Column(

          mainAxisSize:
          MainAxisSize.min,

          children: [

            Icon(

              icon,

              size: 24,

              color: isActive

                  ? index == 1

                  ? DashboardConstants
                  .goldSoft

                  : DashboardConstants
                  .goldAccent

                  : Colors.white54,
            ),

            const SizedBox(
              height: 4,
            ),

            Text(

              label,

              style:
              GoogleFonts.poppins(

                fontSize: 11,

                fontWeight:
                FontWeight.w600,

                color: isActive

                    ? DashboardConstants
                    .goldAccent

                    : Colors.white54,
              ),
            ),
          ],
        ),
      ),
    );
  }
}