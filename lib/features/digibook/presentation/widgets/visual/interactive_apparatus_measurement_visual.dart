import 'package:flutter/material.dart';
import 'digibook_visual_container.dart';

/// PHYSICS VISUAL CANARY
/// Interactive Precision Vernier Scale & Measurement Law Explorer.
/// Demonstrates dual coding for physical quantities $Q = n \cdot u$ and dimensional decomposition.
class InteractiveApparatusMeasurementVisual extends StatefulWidget {
  const InteractiveApparatusMeasurementVisual({super.key});

  @override
  State<InteractiveApparatusMeasurementVisual> createState() =>
      _InteractiveApparatusMeasurementVisualState();
}

class _InteractiveApparatusMeasurementVisualState
    extends State<InteractiveApparatusMeasurementVisual>
    with SingleTickerProviderStateMixin {
  double _measuredMm = 14.6; // Current measurement in mm
  bool _isAutoSweeping = false;
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..addListener(() {
        if (_isAutoSweeping) {
          setState(() {
            _measuredMm = 5.0 + _animController.value * 20.0;
          });
        }
      });
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _toggleAutoSweep() {
    setState(() {
      _isAutoSweeping = !_isAutoSweeping;
      if (_isAutoSweeping) {
        _animController.repeat(reverse: true);
      } else {
        _animController.stop();
      }
    });
  }

  void _reset() {
    setState(() {
      _isAutoSweeping = false;
      _animController.stop();
      _measuredMm = 14.6;
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;
    final msr = _measuredMm.floor();
    final vsd = (((_measuredMm - msr) * 10).round()).clamp(0, 9);
    final totalReading = msr + (vsd * 0.1);

    return DigiBookVisualContainer(
      title: 'Precision Vernier Scale & Measurement Law',
      visualType: 'PRECISION APPARATUS & SIMULATION',
      sourceCitation: 'NCERT Physics Class 11 • Chapter 2 (Units & Measurements), Section 2.2',
      accessibleDescription: 'Interactive Vernier caliper apparatus simulating main scale reading and vernier coincidence for physical measurement Q = n * u.',
      explanatoryCaption: 'Every physical measurement consists of a numerical magnitude (n) and unit (u): Q = n · u. Drag the slider to position the vernier jaw.',
      controlBar: Column(
        children: [
          Row(
            children: [
              IconButton(
                icon: Icon(
                  _isAutoSweeping ? Icons.pause_circle_filled_rounded : Icons.play_circle_filled_rounded,
                  color: scheme.primary,
                  size: 26,
                ),
                onPressed: _toggleAutoSweep,
                tooltip: _isAutoSweeping ? 'Pause animation' : 'Auto sweep measurement',
              ),
              IconButton(
                icon: Icon(Icons.restart_alt_rounded, color: scheme.onSurfaceVariant, size: 22),
                onPressed: _reset,
                tooltip: 'Reset to default',
              ),
              const SizedBox(width: 8),
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: scheme.primary,
                    inactiveTrackColor: scheme.outline,
                    thumbColor: scheme.primary,
                    trackHeight: 3,
                  ),
                  child: Slider(
                    value: _measuredMm,
                    min: 0.0,
                    max: 30.0,
                    divisions: 300,
                    onChanged: (val) {
                      if (_isAutoSweeping) {
                        setState(() {
                          _isAutoSweeping = false;
                          _animController.stop();
                        });
                      }
                      setState(() => _measuredMm = val);
                    },
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      child: Column(
        children: [
          // Scale Canvas
          SizedBox(
            height: 150,
            width: double.infinity,
            child: CustomPaint(
              painter: _VernierScalePainter(measuredMm: _measuredMm, isLight: isLight),
            ),
          ),
          const SizedBox(height: 12),

          // Live Vernier Readout
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: scheme.outline, width: 1),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildReadoutColumn('MSR (Main)', '$msr mm'),
                _buildReadoutColumn('Coincidence', '$vsd div'),
                _buildReadoutColumn('Least Count', '0.1 mm'),
                _buildReadoutColumn('Total Q = n · u', '${totalReading.toStringAsFixed(1)} mm', isHighlight: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReadoutColumn(String title, String value, {bool isHighlight = false}) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        Text(
          title,
          style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 11, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: isHighlight ? scheme.primary : scheme.onSurface,
            fontSize: 13.5,
            fontWeight: isHighlight ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _VernierScalePainter extends CustomPainter {
  final double measuredMm;
  final bool isLight;

  _VernierScalePainter({required this.measuredMm, required this.isLight});

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Background beam
    final beamRect = Rect.fromLTWH(0, 10, size.width, 60);
    final beamPaint = Paint()..color = isLight ? const Color(0xFFF1F5F9) : const Color(0xFF161B22);
    canvas.drawRRect(RRect.fromRectAndRadius(beamRect, const Radius.circular(4)), beamPaint);

    final linePaint = Paint()
      ..color = isLight ? const Color(0xFF64748B) : const Color(0xFF777F8B)
      ..strokeWidth = 1.0;

    final majorLinePaint = Paint()
      ..color = isLight ? const Color(0xFF334155) : const Color(0xFFC9D1D9)
      ..strokeWidth = 1.5;

    // Scale pixels per mm
    const pxPerMm = 9.0;
    final startX = size.width * 0.12;

    // Draw Main Scale (top)
    for (int mm = 0; mm <= 35; mm++) {
      final x = startX + mm * pxPerMm;
      if (x > size.width - 10) break;

      final isCm = mm % 10 == 0;
      final isHalfCm = mm % 5 == 0;
      final tickHeight = isCm ? 24.0 : (isHalfCm ? 16.0 : 10.0);

      canvas.drawLine(Offset(x, 10), Offset(x, 10 + tickHeight), isCm ? majorLinePaint : linePaint);

      if (isCm) {
        final tp = TextPainter(
          text: TextSpan(
            text: '${mm ~/ 10}',
            style: TextStyle(color: isLight ? const Color(0xFF475569) : const Color(0xFFA7ADB7), fontSize: 10, fontWeight: FontWeight.w600),
          ),
          textDirection: TextDirection.ltr,
        )..layout();
        tp.paint(canvas, Offset(x - tp.width / 2, 38));
      }
    }

    // Draw Vernier Slider (bottom jaw)
    final vernierStartX = startX + measuredMm * pxPerMm;
    final vernierRect = Rect.fromLTWH(vernierStartX - 8, 75, 10 * pxPerMm * 0.9 + 16, 55);

    final vernierPaint = Paint()..color = isLight ? const Color(0xFFE2E8F0) : const Color(0xFF21262D);
    canvas.drawRRect(RRect.fromRectAndRadius(vernierRect, const Radius.circular(6)), vernierPaint);

    final vernierBorder = Paint()
      ..color = const Color(0xFFC3A568)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    canvas.drawRRect(RRect.fromRectAndRadius(vernierRect, const Radius.circular(6)), vernierBorder);

    // Vernier ticks (10 divisions = 9 mm on main scale)
    const vScalePitch = (9.0 * pxPerMm) / 10.0;
    final vernierTickPaint = Paint()
      ..color = const Color(0xFFC3A568)
      ..strokeWidth = 1.2;

    for (int v = 0; v <= 10; v++) {
      final vx = vernierStartX + v * vScalePitch;
      final isMajor = v == 0 || v == 5 || v == 10;
      final tickH = isMajor ? 18.0 : 10.0;

      canvas.drawLine(Offset(vx, 75), Offset(vx, 75 + tickH), vernierTickPaint);

      if (isMajor) {
        final tp = TextPainter(
          text: TextSpan(
            text: '$v',
            style: const TextStyle(color: Color(0xFFC3A568), fontSize: 9, fontWeight: FontWeight.bold),
          ),
          textDirection: TextDirection.ltr,
        )..layout();
        tp.paint(canvas, Offset(vx - tp.width / 2, 98));
      }
    }
  }

  @override
  bool shouldRepaint(covariant _VernierScalePainter oldDelegate) {
    return oldDelegate.measuredMm != measuredMm || oldDelegate.isLight != isLight;
  }
}
