import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import 'notification_upload_center.dart';
import 'syllabus_upload_center.dart';
import 'pyq_upload_center.dart';
import 'study_material_center.dart';
import 'recruitment_center.dart';
import 'update_notice_center.dart';

import 'recruitment_intelligence_center.dart';

class MissionFactory extends StatelessWidget {
  final int initialTabIndex;
  const MissionFactory({super.key, this.initialTabIndex = 0});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 7, 
      initialIndex: initialTabIndex,
      child: Column(
        children: [
          TabBar(
            isScrollable: true,
            dividerColor: Colors.transparent,
            indicatorColor: AppColors.gold,
            labelColor: AppColors.gold,
            unselectedLabelColor: Colors.white30,
            labelStyle: AppTypography.label.copyWith(fontSize: 10, fontWeight: FontWeight.bold),
            tabs: const [
              Tab(text: "INTELLIGENCE"),
              Tab(text: "REGISTRY"),
              Tab(text: "NOTIFICATIONS"),
              Tab(text: "SYLLABUS"),
              Tab(text: "PYQS"),
              Tab(text: "KNOWLEDGE"),
              Tab(text: "NOTICES"),
            ],
          ),
          const Expanded(
            child: TabBarView(
              children: [
                RecruitmentIntelligenceCenter(),
                RecruitmentCenter(),
                NotificationUploadCenter(),
                SyllabusUploadCenter(),
                PyqUploadCenter(),
                StudyMaterialCenter(),
                UpdateNoticeCenter(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
