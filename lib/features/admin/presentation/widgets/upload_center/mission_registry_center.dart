import 'package:flutter/material.dart';
import '../shared/center_header.dart';
import 'widgets/mission_form.dart';
import 'widgets/mission_list.dart';

class MissionRegistryCenter extends StatelessWidget {
  const MissionRegistryCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(title: "MISSION REGISTRY GATE", subtitle: "Define examination realms and targets."),
        SizedBox(height: 24),
        MissionForm(),
        MissionList(),
      ],
    );
  }
}
