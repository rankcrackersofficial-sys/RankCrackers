import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/app_routes.dart';
import '../../core/models/readiness_state.dart';
import '../../core/models/momentum_state.dart';
import '../../core/utils/responsive_helper.dart';

class CommandHeader extends StatelessWidget {
  final String userName;
  final String? userPhoto;
  final String examName;
  final ReadinessState? readiness;
  final MomentumState? momentum;

  const CommandHeader({
    super.key,
    required this.userName,
    this.userPhoto,
    required this.examName,
    this.readiness,
    this.momentum,
  });

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        ResponsiveHelper.wp(context, 0.05),
        ResponsiveHelper.hp(context, 0.02),
        ResponsiveHelper.wp(context, 0.05),
        ResponsiveHelper.hp(context, 0.012),
      ),
      child: Row(
        children: [
          Stack(
            children: [
              GestureDetector(
                onTap: () {
                  context.push(AppRoutes.profile);
                },
                child: CircleAvatar(
                  radius: ResponsiveHelper.sp(context, 24),
                  backgroundColor: AppColors.surface,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(30),
                    child: userPhoto != null 
                        ? Image.network(userPhoto!, fit: BoxFit.cover)
                        : Image.asset('assets/images/logo.png', fit: BoxFit.cover),
                  ),
                ),
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: ResponsiveHelper.sp(context, 14),
                  height: ResponsiveHelper.sp(context, 14),
                  decoration: const BoxDecoration(
                    color: AppColors.gold,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.edit,
                    size: ResponsiveHelper.sp(context, 8),
                    color: Colors.black,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(width: ResponsiveHelper.wp(context, 0.04)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _greeting().toUpperCase(), 
                  style: AppTypography.label.copyWith(
                    color: Colors.white54, 
                    fontSize: ResponsiveHelper.sp(context, 8), 
                    letterSpacing: 1.5
                  )
                ),
                const SizedBox(height: 2),
                Text(
                  userName.toUpperCase(), 
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.hero.copyWith(
                    fontSize: ResponsiveHelper.sp(context, 18), 
                    color: Colors.white
                  )
                ),
                const SizedBox(height: 2),
                Text(
                  examName.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.label.copyWith(
                    fontSize: ResponsiveHelper.sp(context, 10), 
                    color: Colors.white70
                  ),
                ),
                Text(
                  "READINESS ${(readiness?.score ?? 0).toInt()}% • STREAK ${momentum?.studyStreakDays ?? 0}D",
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.label.copyWith(
                    fontSize: ResponsiveHelper.sp(context, 9), 
                    color: AppColors.gold
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {
              context.push(AppRoutes.notificationCenter);
            },
            icon: Icon(
              Icons.notifications_none_rounded, 
              color: AppColors.gold, 
              size: ResponsiveHelper.sp(context, 24)
            ),
          ),
        ],
      ),
    );
  }
}
