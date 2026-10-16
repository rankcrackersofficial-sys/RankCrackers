import 'package:flutter/material.dart';

/// DIGIBOOK VISUAL CONTAINER
/// Governed container framing educational diagrams and interactive simulations.
/// Enforces academic governance, source attribution, and accessibility semantics.
class DigiBookVisualContainer extends StatelessWidget {
  final String title;
  final String visualType; // e.g. "INTERACTIVE VENN DIAGRAM", "PRECISION APPARATUS", "ATOMIC SCHEMATIC"
  final String sourceCitation; // e.g. "NCERT Official Standard • Section 1.4"
  final String? accessibleDescription;
  final Widget child;
  final Widget? controlBar;
  final String? explanatoryCaption;

  const DigiBookVisualContainer({
    super.key,
    required this.title,
    required this.visualType,
    required this.sourceCitation,
    required this.child,
    this.accessibleDescription,
    this.controlBar,
    this.explanatoryCaption,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      label: accessibleDescription ?? '$title ($visualType)',
      container: true,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: scheme.outline, width: 1.2),
          boxShadow: [
            BoxShadow(
            color: scheme.shadow.withValues(alpha: 0.35),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Top metadata bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(13),
                  topRight: Radius.circular(13),
                ),
                border: Border(
                  bottom: BorderSide(color: scheme.outline, width: 1),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: scheme.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: scheme.primary.withValues(alpha: 0.4), width: 0.8),
                    ),
                    child: Text(
                      visualType.toUpperCase(),
                      style: TextStyle(
                        color: scheme.primary,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        color: scheme.onSurface,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            // Main Graphic/Interactive Surface
            Padding(
              padding: const EdgeInsets.all(16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: child,
              ),
            ),

            // Optional Interactive Control Bar
            if (controlBar != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: scheme.surface,
                  border: Border(
                    top: BorderSide(color: scheme.outline, width: 1),
                  ),
                ),
                child: controlBar!,
              ),
            ],

            // Governed Provenance & Educational Footnote
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(13),
                  bottomRight: Radius.circular(13),
                ),
                border: Border(
                  top: BorderSide(color: scheme.outline, width: 1),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (explanatoryCaption != null && explanatoryCaption!.isNotEmpty) ...[
                    Text(
                      explanatoryCaption!,
                      style: TextStyle(
                        color: scheme.onSurface,
                        fontSize: 12.5,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 6),
                  ],
                  Row(
                    children: [
                      Icon(Icons.verified_outlined, size: 12, color: scheme.onSurfaceVariant),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          sourceCitation,
                          style: TextStyle(
                            color: scheme.onSurfaceVariant,
                            fontSize: 10.5,
                            fontStyle: FontStyle.italic,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
