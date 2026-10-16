import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'digibook_visual_container.dart';

/// CHEMISTRY VISUAL CANARY
/// Interactive Quantized Bohr Atomic Model & Hydrogen Spectral Line Simulation.
/// Demonstrates dual coding for atomic shell transitions ΔE = hν = hc/λ and Rydberg wavelength.
class InteractiveBohrAtomModelVisual extends StatefulWidget {
  const InteractiveBohrAtomModelVisual({super.key});

  @override
  State<InteractiveBohrAtomModelVisual> createState() => _InteractiveBohrAtomModelVisualState();
}

class _InteractiveBohrAtomModelVisualState extends State<InteractiveBohrAtomModelVisual>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  int _initialShell = 3; // n_i
  int _finalShell = 2; // n_f (Balmer series H-alpha)
  bool _isPlaying = true;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _togglePlay() {
    setState(() {
      _isPlaying = !_isPlaying;
      if (_isPlaying) {
        _controller.repeat();
      } else {
        _controller.stop();
      }
    });
  }

  // Calculate photon energy and wavelength via Rydberg formula
  // 1/λ = R_H * (1/n1^2 - 1/n2^2), R_H = 1.097e7 m^-1
  double get _wavelengthNm {
    if (_initialShell == _finalShell) return 0.0;
    final n1 = math.min(_initialShell, _finalShell);
    final n2 = math.max(_initialShell, _finalShell);
    final term = (1.0 / (n1 * n1)) - (1.0 / (n2 * n2));
    final rH = 1.097373e7;
    final waveM = 1.0 / (rH * term);
    return waveM * 1e9;
  }

  double get _energyEv {
    final n1 = math.min(_initialShell, _finalShell);
    final n2 = math.max(_initialShell, _finalShell);
    // E_n = -13.6 / n^2 eV
    final e1 = -13.6 / (n1 * n1);
    final e2 = -13.6 / (n2 * n2);
    return (e2 - e1).abs();
  }

  String get _spectralSeries {
    final lower = math.min(_initialShell, _finalShell);
    switch (lower) {
      case 1:
        return 'Lyman (UV)';
      case 2:
        return 'Balmer (Visible)';
      case 3:
        return 'Paschen (IR)';
      case 4:
        return 'Brackett (Far-IR)';
      default:
        return 'Quantized';
    }
  }

  Color get _photonColor {
    final lower = math.min(_initialShell, _finalShell);
    if (lower == 2) {
      if (_initialShell == 3) return const Color(0xFFFF4D4D); // 656 nm Red H-alpha
      if (_initialShell == 4) return const Color(0xFF00E5FF); // 486 nm Cyan H-beta
      return const Color(0xFF7C4DFF); // Violet
    }
    return const Color(0xFFC3A568);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;
    return DigiBookVisualContainer(
      title: 'Quantized Bohr Atom & Photon Emission',
      visualType: 'ATOMIC SCHEMATIC & SIMULATION',
      sourceCitation: 'NCERT Chemistry Class 11 • Chapter 2 (Structure of Atom), Section 2.4',
      accessibleDescription: 'Interactive Bohr atomic model showing concentric electron shells and photon emission during quantum transitions.',
      explanatoryCaption: 'According to Bohr postulation, electrons occupy discrete quantized orbits. An electron emitting radiation jumps from higher shell n_i to lower shell n_f.',
      controlBar: Row(
        children: [
          IconButton(
            icon: Icon(
              _isPlaying ? Icons.pause_circle_filled_rounded : Icons.play_circle_filled_rounded,
              color: scheme.primary,
              size: 26,
            ),
            onPressed: _togglePlay,
            tooltip: _isPlaying ? 'Pause orbit animation' : 'Resume orbit animation',
          ),
          const SizedBox(width: 8),
          Text('Transition:', style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12)),
          const SizedBox(width: 8),
          _buildShellPicker('n_i = 3 → n_f = 2', 3, 2),
          const SizedBox(width: 6),
          _buildShellPicker('n_i = 4 → n_f = 2', 4, 2),
          const SizedBox(width: 6),
          _buildShellPicker('n_i = 2 → n_f = 1', 2, 1),
        ],
      ),
      child: Column(
        children: [
          // Atom Canvas
          SizedBox(
            height: 220,
            width: double.infinity,
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                return CustomPaint(
                  painter: _BohrAtomPainter(
                    animationValue: _controller.value,
                    activeShell: _initialShell,
                    targetShell: _finalShell,
                    photonColor: _photonColor,
                    isLight: isLight,
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),

          // Quantum Readout
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
                _buildReadoutColumn('Initial n_i', 'Shell $_initialShell'),
                _buildReadoutColumn('Final n_f', 'Shell $_finalShell'),
                _buildReadoutColumn('ΔE = hν', '${_energyEv.toStringAsFixed(2)} eV'),
                _buildReadoutColumn('Wavelength λ', '${_wavelengthNm.toStringAsFixed(1)} nm', highlightColor: _photonColor),
                _buildReadoutColumn('Series', _spectralSeries),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShellPicker(String label, int ni, int nf) {
    final scheme = Theme.of(context).colorScheme;
    final isSelected = _initialShell == ni && _finalShell == nf;
    return InkWell(
      onTap: () => setState(() {
        _initialShell = ni;
        _finalShell = nf;
      }),
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
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
            fontSize: 11.5,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildReadoutColumn(String title, String value, {Color? highlightColor}) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        Text(
          title,
          style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 10.5, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: TextStyle(
            color: highlightColor ?? scheme.onSurface,
            fontSize: 12.5,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

class _BohrAtomPainter extends CustomPainter {
  final double animationValue;
  final int activeShell;
  final int targetShell;
  final Color photonColor;
  final bool isLight;

  _BohrAtomPainter({
    required this.animationValue,
    required this.activeShell,
    required this.targetShell,
    required this.photonColor,
    required this.isLight,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    // 1. Draw Concentric Quantized Orbits (n = 1, 2, 3, 4)
    final shellRadii = [28.0, 52.0, 78.0, 102.0];
    final orbitPaint = Paint()
      ..color = isLight ? const Color(0xFFCBD5E1) : const Color(0xFF30363D)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final activeOrbitPaint = Paint()
      ..color = const Color(0xFFC3A568).withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    for (int i = 0; i < shellRadii.length; i++) {
      final r = shellRadii[i];
      final isOccupied = (i + 1 == activeShell || i + 1 == targetShell);
      canvas.drawCircle(center, r, isOccupied ? activeOrbitPaint : orbitPaint);

      // Shell label (n = 1, 2, ...)
      final tp = TextPainter(
        text: TextSpan(
          text: 'n=${i + 1}',
          style: TextStyle(color: isLight ? const Color(0xFF2563EB) : const Color(0xFF58A6FF), fontSize: 9, fontWeight: FontWeight.bold),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(center.dx + r - tp.width / 2, center.dy + 3));
    }

    // 2. Draw Nucleus (+Ze)
    final nucleusPaint = Paint()..color = const Color(0xFFC3A568);
    canvas.drawCircle(center, 12, nucleusPaint);

    final nucText = TextPainter(
      text: const TextSpan(
        text: '+e',
        style: TextStyle(color: Color(0xFF090C10), fontSize: 9, fontWeight: FontWeight.bold),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    nucText.paint(canvas, Offset(center.dx - nucText.width / 2, center.dy - nucText.height / 2));

    // 3. Draw Orbiting Electron on active shell
    final currentR = shellRadii[activeShell - 1];
    final angle = animationValue * 2 * math.pi * (5 - activeShell);
    final electronPos = Offset(center.dx + currentR * math.cos(angle), center.dy + currentR * math.sin(angle));

    final electronGlow = Paint()
      ..color = const Color(0xFF58A6FF).withValues(alpha: 0.4)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(electronPos, 8, electronGlow);

    final electronPaint = Paint()..color = const Color(0xFF58A6FF);
    canvas.drawCircle(electronPos, 4.5, electronPaint);

    // 4. Draw Photon Emission Wavelet
    final r1 = shellRadii[targetShell - 1];
    final r2 = shellRadii[activeShell - 1];
    final wavePath = Path();
    wavePath.moveTo(center.dx - r2, center.dy);
    wavePath.quadraticBezierTo(center.dx - (r1 + r2) / 2, center.dy - 15, center.dx - r1, center.dy);

    final photonPaint = Paint()
      ..color = photonColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawPath(wavePath, photonPaint);
  }

  @override
  bool shouldRepaint(covariant _BohrAtomPainter oldDelegate) {
    return true;
  }
}
