import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import '../../../data/command_center_repository.dart';
import '../../../data/repositories/health_repository.dart';

class FounderHeader extends StatelessWidget {
  final bool showBackButton;
  final VoidCallback? onBack;

  const FounderHeader({
    super.key,
    this.showBackButton = false,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final String uid = user?.uid ?? '';

    return Container(
      height: 64, // Tactical Height
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.1), width: 0.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (showBackButton)
                IconButton(
                  onPressed: onBack ?? () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 14),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              if (showBackButton) const SizedBox(width: 8),
              Container(
                height: 32,
                width: 32,
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Image.asset('assets/images/logo.png'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StreamBuilder<DocumentSnapshot>(
                  stream: FirebaseFirestore.instance.collection('users').doc(uid).snapshots(),
                  builder: (context, snap) {
                    final String founderName = (snap.data?.data() as Map?)?['name'] ?? user?.displayName ?? 'FOUNDER';
                    
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          founderName.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.hero.copyWith(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            height: 1.1,
                          ),
                        ),
                        Text(
                          'Founder & Chief Architect',
                          style: AppTypography.label.copyWith(
                            color: AppColors.gold.withValues(alpha: 0.5),
                            fontSize: 7,
                            letterSpacing: 0.1,
                          ),
                        ),
                        const SizedBox(height: 2),
                        _buildCompactMetricsRow(),
                      ],
                    );
                  }
                ),
              ),
              const _SystemStatusBadge(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCompactMetricsRow() {
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance.collection('system_metrics').doc('content_summary').snapshots(),
      builder: (context, contentSnap) {
        final contentData = contentSnap.data?.data() as Map?;
        final reviews = (contentData?['pendingDigibooks'] ?? 0) + (contentData?['pendingQuestions'] ?? 0);
        
        return StreamBuilder<Map<String, int>>(
          stream: CommandCenterRepository.streamWorkerMetrics(),
          builder: (context, workerSnap) {
            final metrics = workerSnap.data ?? {'online': 0, 'total': 0};
            final workersOnline = metrics['online']!;
            final workersTotal = metrics['total']!;
            
            return StreamBuilder<bool>(
              stream: HealthRepository.streamAiSystemStatus(),
              builder: (context, healthSnap) {
                final isOperational = healthSnap.data ?? true;
                
                return Text(
                  'Health ${isOperational ? "NOMINAL" : "OFFLINE"}  •  Workers $workersOnline/$workersTotal  •  Reviews $reviews',
                  style: AppTypography.label.copyWith(
                    color: Colors.white12,
                    fontSize: 6.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                );
              }
            );
          }
        );
      }
    );
  }
}

class _SystemStatusBadge extends StatefulWidget {
  const _SystemStatusBadge();

  @override
  State<_SystemStatusBadge> createState() => _SystemStatusBadgeState();
}

class _SystemStatusBadgeState extends State<_SystemStatusBadge> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FadeTransition(
            opacity: _animation,
            child: Container(
              width: 4,
              height: 4,
              decoration: const BoxDecoration(
                color: Colors.greenAccent,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(color: Colors.greenAccent, blurRadius: 4, spreadRadius: 1),
                ],
              ),
            ),
          ),
          const SizedBox(width: 4),
          Text(
            'LIVE',
            style: AppTypography.label.copyWith(
              fontSize: 8, 
              color: Colors.greenAccent, 
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
