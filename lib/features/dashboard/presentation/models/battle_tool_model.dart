import 'package:flutter/material.dart';

class BattleToolModel {
  final String title;
  final String subtitle;
  final IconData icon;
  final IconData glowIcon;
  final Color glowColor;
  final String route;

  const BattleToolModel({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.glowIcon,
    required this.glowColor,
    required this.route,
  });
}