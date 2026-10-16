import 'package:flutter/material.dart';
import 'digibook_visual_container.dart';

enum VennSetOperation {
  setA,
  setB,
  intersection,
  union,
  differenceAB,
  complementA,
}

/// MATHEMATICS VISUAL CANARY
/// Interactive Venn Diagram & Set Operation Explorer for Sets and their representations.
/// Demonstrates dual coding, visual-verbal pairing, and interactive mathematical exploration.
class InteractiveVennSetDiagram extends StatefulWidget {
  const InteractiveVennSetDiagram({super.key});

  @override
  State<InteractiveVennSetDiagram> createState() => _InteractiveVennSetDiagramState();
}

class _InteractiveVennSetDiagramState extends State<InteractiveVennSetDiagram> {
  VennSetOperation _currentOp = VennSetOperation.intersection;

  String get _operationSymbol {
    switch (_currentOp) {
      case VennSetOperation.setA:
        return 'A';
      case VennSetOperation.setB:
        return 'B';
      case VennSetOperation.intersection:
        return 'A ∩ B';
      case VennSetOperation.union:
        return 'A ∪ B';
      case VennSetOperation.differenceAB:
        return 'A \\ B  (A − B)';
      case VennSetOperation.complementA:
        return "A′  (U \\ A)";
    }
  }

  String get _setBuilderDefinition {
    switch (_currentOp) {
      case VennSetOperation.setA:
        return '{x : x ∈ A}';
      case VennSetOperation.setB:
        return '{x : x ∈ B}';
      case VennSetOperation.intersection:
        return '{x : x ∈ A ∧ x ∈ B}';
      case VennSetOperation.union:
        return '{x : x ∈ A ∨ x ∈ B}';
      case VennSetOperation.differenceAB:
        return '{x : x ∈ A ∧ x ∉ B}';
      case VennSetOperation.complementA:
        return '{x : x ∈ U ∧ x ∉ A}';
    }
  }

  String get _description {
    switch (_currentOp) {
      case VennSetOperation.setA:
        return 'All elements belonging to set A within universal set U.';
      case VennSetOperation.setB:
        return 'All elements belonging to set B within universal set U.';
      case VennSetOperation.intersection:
        return 'Elements belonging simultaneously to both set A AND set B.';
      case VennSetOperation.union:
        return 'Elements belonging to set A, OR set B, or both.';
      case VennSetOperation.differenceAB:
        return 'Elements that belong to A but do NOT belong to B.';
      case VennSetOperation.complementA:
        return 'All elements in the universal set U that are NOT in set A.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return DigiBookVisualContainer(
      title: 'Venn Diagram & Set Algebra Explorer',
      visualType: 'INTERACTIVE VENN DIAGRAM',
      sourceCitation: 'NCERT Mathematics Class 11 • Chapter 1 (Sets), Section 1.4',
      accessibleDescription: 'Interactive Venn diagram depicting set operations between Universal set U and subsets A and B.',
      explanatoryCaption: 'Visualizes fundamental set operations in Roster and Set-Builder notation. Tap an operation below to highlight the corresponding region.',
      controlBar: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildOpPill('A', VennSetOperation.setA),
            const SizedBox(width: 8),
            _buildOpPill('B', VennSetOperation.setB),
            const SizedBox(width: 8),
            _buildOpPill('A ∩ B', VennSetOperation.intersection),
            const SizedBox(width: 8),
            _buildOpPill('A ∪ B', VennSetOperation.union),
            const SizedBox(width: 8),
            _buildOpPill('A \\ B', VennSetOperation.differenceAB),
            const SizedBox(width: 8),
            _buildOpPill('A′', VennSetOperation.complementA),
          ],
        ),
      ),
      child: Column(
        children: [
          // Diagram Canvas
          SizedBox(
            height: 210,
            width: double.infinity,
            child: CustomPaint(
              painter: _VennDiagramPainter(operation: _currentOp),
            ),
          ),
          const SizedBox(height: 14),

          // Mathematical Live Readout
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: scheme.outline, width: 1),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      _operationSymbol,
                      style: TextStyle(
                        color: scheme.primary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      '=',
                      style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 16),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _setBuilderDefinition,
                        style: TextStyle(
                          color: scheme.secondary,
                          fontSize: 14.5,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  _description,
                  style: TextStyle(
                    color: scheme.onSurfaceVariant,
                    fontSize: 12.5,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOpPill(String label, VennSetOperation op) {
    final scheme = Theme.of(context).colorScheme;
    final isSelected = _currentOp == op;
    return InkWell(
      onTap: () => setState(() => _currentOp = op),
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? scheme.primary : scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isSelected ? scheme.primary : scheme.outline,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? scheme.onPrimary : scheme.onSurface,
            fontSize: 12.5,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class _VennDiagramPainter extends CustomPainter {
  final VennSetOperation operation;

  _VennDiagramPainter({required this.operation});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);

    // 1. Draw Universal Set U background
    final uPaint = Paint()
      ..color = const Color(0xFF0D1117)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(8)), uPaint);

    final uBorderPaint = Paint()
      ..color = const Color(0xFF30363D)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(8)), uBorderPaint);

    // Label U
    final uTextPainter = TextPainter(
      text: const TextSpan(
        text: 'U',
        style: TextStyle(
          color: Color(0xFF777F8B),
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    uTextPainter.paint(canvas, const Offset(12, 10));

    // Circles Geometry
    final centerY = size.height * 0.52;
    final radius = size.height * 0.36;
    final centerA = Offset(size.width * 0.38, centerY);
    final centerB = Offset(size.width * 0.62, centerY);

    final pathA = Path()..addOval(Rect.fromCircle(center: centerA, radius: radius));
    final pathB = Path()..addOval(Rect.fromCircle(center: centerB, radius: radius));
    final pathU = Path()..addRRect(RRect.fromRectAndRadius(rect, const Radius.circular(8)));

    // Highlight Paint
    final highlightPaint = Paint()
      ..color = const Color(0xFFC3A568).withValues(alpha: 0.35)
      ..style = PaintingStyle.fill;

    // 2. Draw Highlighted Region based on operation
    switch (operation) {
      case VennSetOperation.setA:
        canvas.drawPath(pathA, highlightPaint);
        break;
      case VennSetOperation.setB:
        canvas.drawPath(pathB, highlightPaint);
        break;
      case VennSetOperation.intersection:
        final intersectionPath = Path.combine(PathOperation.intersect, pathA, pathB);
        canvas.drawPath(intersectionPath, highlightPaint);
        break;
      case VennSetOperation.union:
        final unionPath = Path.combine(PathOperation.union, pathA, pathB);
        canvas.drawPath(unionPath, highlightPaint);
        break;
      case VennSetOperation.differenceAB:
        final diffPath = Path.combine(PathOperation.difference, pathA, pathB);
        canvas.drawPath(diffPath, highlightPaint);
        break;
      case VennSetOperation.complementA:
        final compPath = Path.combine(PathOperation.difference, pathU, pathA);
        canvas.drawPath(compPath, highlightPaint);
        break;
    }

    // 3. Draw Circle Borders
    final circleBorderPaintA = Paint()
      ..color = (operation == VennSetOperation.setA ||
              operation == VennSetOperation.intersection ||
              operation == VennSetOperation.union ||
              operation == VennSetOperation.differenceAB)
          ? const Color(0xFFC3A568)
          : const Color(0xFF58A6FF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final circleBorderPaintB = Paint()
      ..color = (operation == VennSetOperation.setB ||
              operation == VennSetOperation.intersection ||
              operation == VennSetOperation.union)
          ? const Color(0xFFC3A568)
          : const Color(0xFF3FB950)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    canvas.drawCircle(centerA, radius, circleBorderPaintA);
    canvas.drawCircle(centerB, radius, circleBorderPaintB);

    // 4. Circle Labels
    final labelAPainter = TextPainter(
      text: const TextSpan(
        text: 'A',
        style: TextStyle(
          color: Color(0xFF58A6FF),
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    labelAPainter.paint(canvas, Offset(centerA.dx - radius * 0.65, centerY - radius * 0.85));

    final labelBPainter = TextPainter(
      text: const TextSpan(
        text: 'B',
        style: TextStyle(
          color: Color(0xFF3FB950),
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    labelBPainter.paint(canvas, Offset(centerB.dx + radius * 0.45, centerY - radius * 0.85));
  }

  @override
  bool shouldRepaint(covariant _VennDiagramPainter oldDelegate) {
    return oldDelegate.operation != operation;
  }
}
