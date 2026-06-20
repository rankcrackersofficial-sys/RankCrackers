import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/utils/app_routes.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';

class SyllabusConstellationCard extends StatelessWidget {
  const SyllabusConstellationCard({super.key});

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 🔱 PREMIUM CARD DNA
                Text(
                  'BATTLE CONSTELLATION',
                  style: AppTypography.cardTitle.copyWith(color: AppColors.gold, letterSpacing: 2.2, fontSize: 11),
                ),
                const SizedBox(height: 8),
                Text(
                  'Syllabus nodes by mastery, weakness, and active missions.',
                  style: AppTypography.subtitle,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          AspectRatio(
            aspectRatio: 1.7,
            child: GestureDetector(
              onTap: () => context.go(AppRoutes.syllabus),
              child: CustomPaint(
                painter: _ConstellationPainter(),
                child: const SizedBox.expand(),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
            child: Wrap(
              spacing: 12,
              runSpacing: 8,
              children: const [
                _LegendDot(color: Color(0xFF4D7CFE), label: 'Mastered'),
                _LegendDot(color: AppColors.gold, label: 'Active'),
                _LegendDot(color: AppColors.error, label: 'Weak'),
                _LegendDot(color: Colors.white24, label: 'Untouched'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendDot({
    required this.color,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: AppTypography.label.copyWith(fontSize: 10, color: AppColors.secondaryText),
        ),
      ],
    );
  }
}

class _ConstellationPainter extends CustomPainter {
  const _ConstellationPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final nodes = [
      _Node(0.16, 0.36, const Color(0xFF4D7CFE), 8),
      _Node(0.30, 0.22, AppColors.gold, 10),
      _Node(0.45, 0.48, AppColors.error, 9),
      _Node(0.62, 0.30, const Color(0xFF4D7CFE), 8),
      _Node(0.78, 0.42, AppColors.gold, 11),
      _Node(0.28, 0.70, Colors.white10, 7),
      _Node(0.52, 0.78, const Color(0xFF4D7CFE), 8),
      _Node(0.72, 0.70, AppColors.error, 9),
    ];

    final linePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.05)
      ..strokeWidth = 1;

    for (var i = 0; i < nodes.length - 1; i++) {
      canvas.drawLine(
        nodes[i].offset(size),
        nodes[i + 1].offset(size),
        linePaint,
      );
    }

    for (final node in nodes) {
      final offset = node.offset(size);
      final dot = Paint()..color = node.color.withValues(alpha: 0.8);
      canvas.drawCircle(offset, node.radius, dot);

      final ring = Paint()
        ..color = node.color.withValues(alpha: 0.2)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1;
      canvas.drawCircle(offset, node.radius + 4, ring);
    }

    final orbitPaint = Paint()
      ..color = AppColors.gold.withValues(alpha: 0.03)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final center = Offset(size.width * 0.50, size.height * 0.52);
    for (var i = 0; i < 3; i++) {
      final rect = Rect.fromCenter(
        center: center,
        width: 150 + (i * 42),
        height: 54 + (i * 20),
      );
      canvas.save();
      canvas.translate(center.dx, center.dy);
      canvas.rotate(-math.pi / 9);
      canvas.translate(-center.dx, -center.dy);
      canvas.drawOval(rect, orbitPaint);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _Node {
  final double x;
  final double y;
  final Color color;
  final double radius;

  const _Node(this.x, this.y, this.color, this.radius);

  Offset offset(Size size) => Offset(size.width * x, size.height * y);
}
