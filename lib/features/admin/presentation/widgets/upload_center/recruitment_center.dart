import 'package:flutter/material.dart';
import '../shared/center_header.dart';
import 'widgets/mission_form.dart';
import 'widgets/mission_list.dart';

class RecruitmentCenter extends StatelessWidget {
  const RecruitmentCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(
          title: "RECRUITMENT COMMAND",
          subtitle: "Define examination realms and strategic mission targets.",
        ),
        SizedBox(height: 24),
        MissionForm(),
        SizedBox(height: 32),
        MissionList(),
      ],
    );
  }
}
