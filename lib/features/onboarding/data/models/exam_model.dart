import 'package:flutter/material.dart';

class Exam {
  final String title;
  final IconData icon;
  final List<String> subjects;

  Exam({required this.title, required this.icon, this.subjects = const []});
}

final List<Exam> examData = [
  Exam(title: "RAS", icon: Icons.workspace_premium_rounded),
  Exam(title: "Assistant Professor", icon: Icons.school_rounded, subjects: ["History", "Hindi", "Physics", "Maths"]),
  Exam(title: "REET", icon: Icons.auto_stories_rounded, subjects: ["Level 1", "Level 2"]),
  Exam(title: "SI (Sub Inspector)", icon: Icons.gpp_good_rounded),
  Exam(title: "Patwari", icon: Icons.map_rounded),
  Exam(title: "LDC", icon: Icons.laptop_mac_rounded),
];
