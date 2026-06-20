import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/tactical_noir_background.dart';
import 'founder_header.dart';

class FounderSovereignScaffold extends StatelessWidget {
  final Widget body;
  final bool showBackButton;
  final VoidCallback? onBack;

  const FounderSovereignScaffold({
    super.key,
    required this.body,
    this.showBackButton = true,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            children: [
              FounderHeader(showBackButton: showBackButton, onBack: onBack),
              Expanded(child: body),
            ],
          ),
        ),
      ),
    );
  }
}
