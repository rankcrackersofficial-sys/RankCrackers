import 'package:flutter/material.dart';

import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_spacing.dart';

class DashboardHeader extends StatelessWidget {
  final String studentName;
  final String selectedExam;
  final int notificationCount;
  final String greeting;

  const DashboardHeader({
    super.key,
    required this.studentName,
    required this.selectedExam,
    required this.notificationCount,
    required this.greeting,
  });

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      pinned: true,
      elevation: 0,
      backgroundColor: Colors.transparent,
      expandedHeight: 118,
      toolbarHeight: 118,
      automaticallyImplyLeading: false,

      flexibleSpace: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.background,
              AppColors.background
                  .withValues(alpha: 0.96),
            ],
          ),

          border: Border(
            bottom: BorderSide(
              color: AppColors.gold
                  .withValues(alpha: 0.12),
            ),
          ),

          boxShadow: [
            BoxShadow(
              color: AppColors.gold
                  .withValues(alpha: 0.05),
              blurRadius: 24,
              spreadRadius: 1,
              offset: const Offset(0, 10),
            ),
          ],
        ),

        child: SafeArea(
          bottom: false,

          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.screenPadding,
              vertical: 12,
            ),

            child: Row(
              children: [

                // 🔥 APP LOGO

                Container(
                  width: 58,
                  height: 58,

                  decoration: BoxDecoration(
                    shape: BoxShape.circle,

                    border: Border.all(
                      color: AppColors.gold
                          .withValues(alpha: 0.30),
                      width: 1.5,
                    ),

                    boxShadow: [
                      BoxShadow(
                        color: AppColors.gold
                            .withValues(alpha: 0.14),
                        blurRadius: 24,
                        spreadRadius: 1,
                      ),
                    ],
                  ),

                  child: Padding(
                    padding: const EdgeInsets.all(7),

                    child: ClipOval(
                      child: Image.asset(
                        "assets/images/logo.png",
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),

                const SizedBox(width: 14),

                // 🔥 CENTER CONTENT

                Expanded(
                  child: Column(
                    mainAxisAlignment:
                    MainAxisAlignment.center,

                    crossAxisAlignment:
                    CrossAxisAlignment.start,

                    mainAxisSize: MainAxisSize.min,

                    children: [

                      Text(
                        greeting,

                        overflow:
                        TextOverflow.ellipsis,

                        style: AppTypography.label.copyWith(
                           color: AppColors.secondaryText,
                        ),
                      ),

                      const SizedBox(height: 4),

                      Text(
                        studentName,

                        maxLines: 1,

                        overflow:
                        TextOverflow.ellipsis,

                        style: AppTypography.cardTitle.copyWith(
                          fontSize: 22,
                        ),
                      ),

                      const SizedBox(height: 5),

                      Container(
                        padding:
                        const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),

                        decoration: BoxDecoration(
                          borderRadius:
                          BorderRadius.circular(
                            999,
                          ),

                          color: AppColors.gold
                              .withValues(alpha: 0.10),

                          border: Border.all(
                            color: AppColors.gold
                                .withValues(
                              alpha: 0.22,
                            ),
                          ),
                        ),

                        child: Text(
                          "$selectedExam ASPIRANT",

                          overflow:
                          TextOverflow.ellipsis,

                          style: AppTypography.label.copyWith(
                            letterSpacing: 1.2,
                            fontWeight: FontWeight.w700,
                            color: AppColors.gold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 12),

                // 🔥 NOTIFICATION BUTTON

                Stack(
                  clipBehavior: Clip.none,

                  children: [

                    Container(
                      width: 50,
                      height: 50,

                      decoration: BoxDecoration(
                        borderRadius:
                        BorderRadius.circular(16),

                        color: Colors.white
                            .withValues(alpha: 0.04),

                        border: Border.all(
                          color: Colors.white
                              .withValues(alpha: 0.06),
                        ),
                      ),

                      child: const Icon(
                        Icons.notifications_none_rounded,
                        color: AppColors.gold,
                        size: 24,
                      ),
                    ),

                    if (notificationCount > 0)
                      Positioned(
                        top: -4,
                        right: -2,

                        child: Container(
                          padding:
                          const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 3,
                          ),

                          decoration: BoxDecoration(
                            color: AppColors.error,

                            borderRadius:
                            BorderRadius.circular(
                              999,
                            ),

                            border: Border.all(
                              color: Colors.white,
                              width: 1,
                            ),
                          ),

                          child: Text(
                            "$notificationCount",

                            style: AppTypography.label.copyWith(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
