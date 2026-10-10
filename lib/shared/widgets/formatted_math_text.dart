import 'package:flutter/material.dart';

/// Clean, human-readable mathematical text renderer that formats LaTeX
/// expressions into crisp unicode symbols for mobile display.
class FormattedMathText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final int? maxLines;
  final TextOverflow? overflow;
  final bool selectable;
  final TextAlign? textAlign;

  const FormattedMathText(
    this.text, {
    super.key,
    this.style,
    this.maxLines,
    this.overflow,
    this.selectable = false,
    this.textAlign,
  });

  /// Formats raw LaTeX string into crisp unicode math representation
  static String formatMathString(String input) {
    if (input.isEmpty) return '';

    String s = input;

    // 1. Remove internal technical IDs and authority strings from student view
    s = s.replaceAll(RegExp(r'NCERT_[A-Z0-9_]+'), 'canonical NCERT standard');
    s = s.replaceAll(RegExp(r'AF_[A-Z0-9_]+'), '');
    s = s.replaceAll(RegExp(r'GU_[A-Z0-9_]+'), '');
    s = s.replaceAll(RegExp(r'REV_[A-Z0-9_]+'), '');
    s = s.replaceAll(RegExp(r'COMP_[A-Z0-9_]+'), '');
    s = s.replaceAll(RegExp(r'BLK_[A-Z0-9_]+'), '');

    // 2. Normalize double backslashes
    s = s.replaceAll(r'\\', r'\');

    // 3. Balanced brace fraction parsing
    s = _parseBalancedBraces(s, r'\frac');

    // 4. Remove math mode delimiters $...$
    s = s.replaceAllMapped(RegExp(r'\$\$([^$]+)\$\$'), (m) => m.group(1) ?? '');
    s = s.replaceAllMapped(RegExp(r'\$([^$]+)\$'), (m) => m.group(1) ?? '');
    s = s.replaceAll(r'$', '');

    // 5. Symbol & Greek replacements (using non-alphabetic lookahead)
    final symbols = <List<dynamic>>[
      [RegExp(r'\\in(?![a-zA-Z])'), '∈'],
      [RegExp(r'\\notin(?![a-zA-Z])'), '∉'],
      [RegExp(r'\\subset(?![a-zA-Z])'), '⊂'],
      [RegExp(r'\\subseteq(?![a-zA-Z])'), '⊆'],
      [RegExp(r'\\supset(?![a-zA-Z])'), '⊃'],
      [RegExp(r'\\supseteq(?![a-zA-Z])'), '⊇'],
      [RegExp(r'\\cup(?![a-zA-Z])'), '∪'],
      [RegExp(r'\\cap(?![a-zA-Z])'), '∩'],
      [RegExp(r'\\emptyset(?![a-zA-Z])'), '∅'],
      [RegExp(r'\\phi(?![a-zA-Z])'), 'ϕ'],
      [RegExp(r'\\Phi(?![a-zA-Z])'), 'Φ'],
      [RegExp(r'\\mathbb\{R\}'), 'ℝ'],
      [RegExp(r'\\mathbb\{N\}'), 'ℕ'],
      [RegExp(r'\\mathbb\{Z\}'), 'ℤ'],
      [RegExp(r'\\mathbb\{Q\}'), 'ℚ'],
      [RegExp(r'\\theta(?![a-zA-Z])'), 'θ'],
      [RegExp(r'\\Omega(?![a-zA-Z])'), 'Ω'],
      [RegExp(r'\\omega(?![a-zA-Z])'), 'ω'],
      [RegExp(r'\\alpha(?![a-zA-Z])'), 'α'],
      [RegExp(r'\\beta(?![a-zA-Z])'), 'β'],
      [RegExp(r'\\gamma(?![a-zA-Z])'), 'γ'],
      [RegExp(r'\\delta(?![a-zA-Z])'), 'δ'],
      [RegExp(r'\\Delta(?![a-zA-Z])'), 'Δ'],
      [RegExp(r'\\lambda(?![a-zA-Z])'), 'λ'],
      [RegExp(r'\\mu(?![a-zA-Z])'), 'μ'],
      [RegExp(r'\\nu(?![a-zA-Z])'), 'ν'],
      [RegExp(r'\\rho(?![a-zA-Z])'), 'ρ'],
      [RegExp(r'\\sigma(?![a-zA-Z])'), 'σ'],
      [RegExp(r'\\tau(?![a-zA-Z])'), 'τ'],
      [RegExp(r'\\pi(?![a-zA-Z])'), 'π'],
      [RegExp(r'\\approx(?![a-zA-Z])'), '≈'],
      [RegExp(r'\\neq(?![a-zA-Z])'), '≠'],
      [RegExp(r'\\le(?![a-zA-Z])'), '≤'],
      [RegExp(r'\\ge(?![a-zA-Z])'), '≥'],
      [RegExp(r'\\times(?![a-zA-Z])'), '×'],
      [RegExp(r'\\cdot(?![a-zA-Z])'), '·'],
      [RegExp(r'\\pm(?![a-zA-Z])'), '±'],
      [RegExp(r'\\mp(?![a-zA-Z])'), '∓'],
      [RegExp(r'\\infty(?![a-zA-Z])'), '∞'],
      [RegExp(r'\\propto(?![a-zA-Z])'), '∝'],
      [RegExp(r'\\land(?![a-zA-Z])'), '∧'],
      [RegExp(r'\\lor(?![a-zA-Z])'), '∨'],
      [RegExp(r'\\iff(?![a-zA-Z])'), '⟺'],
      [RegExp(r'\\implies(?![a-zA-Z])'), '⟹'],
      [RegExp(r'\\leftrightarrow(?![a-zA-Z])'), '⟺'],
      [RegExp(r'\\Leftrightarrow(?![a-zA-Z])'), '⟺'],
      [RegExp(r'\\Rightarrow(?![a-zA-Z])'), '⟹'],
      [RegExp(r'\\Leftarrow(?![a-zA-Z])'), '⟸'],
      [RegExp(r'\\rightarrow(?![a-zA-Z])'), '→'],
      [RegExp(r'\\to(?![a-zA-Z])'), '→'],
      [RegExp(r'\\leftarrow(?![a-zA-Z])'), '←'],
      [RegExp(r'\\quad(?![a-zA-Z])'), '  '],
      [RegExp(r'\\qquad(?![a-zA-Z])'), '    '],
      [RegExp(r'\\circ(?![a-zA-Z])'), '°'],
      [RegExp(r'\\sin(?![a-zA-Z])'), 'sin'],
      [RegExp(r'\\cos(?![a-zA-Z])'), 'cos'],
      [RegExp(r'\\tan(?![a-zA-Z])'), 'tan'],
      [RegExp(r'\\arctan(?![a-zA-Z])'), 'arctan'],
    ];

    for (final pair in symbols) {
      s = s.replaceAll(pair[0] as RegExp, pair[1] as String);
    }

    // Delimiters
    s = s.replaceAll(r'\left(', '(').replaceAll(r'\right)', ')');
    s = s.replaceAll(r'\left[', '[').replaceAll(r'\right]', ']');
    s = s.replaceAll(r'\left\{', '{').replaceAll(r'\right\}', '}');
    s = s.replaceAll(r'\{', '{').replaceAll(r'\}', '}');
    s = s.replaceAll(r'\_', '_');

    // Clean formatting tags
    s = s.replaceAllMapped(RegExp(r'\\text\{([^}]+)\}'), (m) => m.group(1) ?? '');
    s = s.replaceAllMapped(RegExp(r'\\mathbf\{([^}]+)\}'), (m) => m.group(1) ?? '');
    s = s.replaceAllMapped(RegExp(r'\\boldsymbol\{([^}]+)\}'), (m) => m.group(1) ?? '');
    s = s.replaceAllMapped(RegExp(r'\\vec\{([^}]+)\}'), (m) => '${m.group(1) ?? ''}⃗');
    s = s.replaceAll(r'\hat{i}', 'î').replaceAll(r'\hat{j}', 'ĵ').replaceAll(r'\hat{k}', 'k̂');
    s = s.replaceAllMapped(RegExp(r'\\hat\{([^}]+)\}'), (m) => '${m.group(1) ?? ''}̂');
    s = s.replaceAllMapped(RegExp(r'\\bar\{([^}]+)\}'), (m) => '${m.group(1) ?? ''}̄');
    s = s.replaceAll(RegExp(r'\\bar\b'), '̄');
    s = s.replaceAllMapped(RegExp(r'\\sqrt\{([^}]+)\}'), (m) => '√(${m.group(1) ?? ''})');

    // Common words or symbols written as LaTeX tags
    s = s.replaceAll(RegExp(r'\\bullet\b'), '•');
    s = s.replaceAll(RegExp(r'\\max\b'), 'max');
    s = s.replaceAll(RegExp(r'\\min\b'), 'min');
    s = s.replaceAll(RegExp(r'\\avg\b'), 'avg');
    s = s.replaceAll(RegExp(r'\\const\b'), 'const');
    s = s.replaceAll(RegExp(r'\\Constant\b'), 'Constant');
    s = s.replaceAll(RegExp(r'\\Empirical\b'), 'Empirical');
    s = s.replaceAll(RegExp(r'\\Molar\b'), 'Molar');
    s = s.replaceAll(RegExp(r'\\Molecular\b'), 'Molecular');
    s = s.replaceAll(RegExp(r'\\Atomic\b'), 'Atomic');
    s = s.replaceAll(RegExp(r'\\Fixed\b'), 'Fixed');
    s = s.replaceAll(RegExp(r'\\Load\b'), 'Load');
    s = s.replaceAll(RegExp(r'\\Effort\b'), 'Effort');
    s = s.replaceAll(RegExp(r'\\load\b'), 'load');
    s = s.replaceAll(RegExp(r'\\effort\b'), 'effort');
    s = s.replaceAll(RegExp(r'\\conservative\b'), 'conservative');
    s = s.replaceAll(RegExp(r'\\recoil\b'), 'recoil');
    s = s.replaceAll(RegExp(r'\\gun\b'), 'gun');
    s = s.replaceAll(RegExp(r'\\final\b'), 'final');
    s = s.replaceAll(RegExp(r'\\initial\b'), 'initial');
    s = s.replaceAll(RegExp(r'\\rot\b'), 'rot');
    s = s.replaceAll(RegExp(r'\\cm\b'), 'cm');
    s = s.replaceAll(RegExp(r'\\total\b'), 'total');
    s = s.replaceAll(RegExp(r'\\ext\b'), 'ext');

    // Single-letter physics vectors/quantities written with backslash
    s = s.replaceAll(RegExp(r'\\v\b'), 'v');
    s = s.replaceAll(RegExp(r'\\p\b'), 'p');
    s = s.replaceAll(RegExp(r'\\F\b'), 'F');
    s = s.replaceAll(RegExp(r'\\a\b'), 'a');
    s = s.replaceAll(RegExp(r'\\J\b'), 'J');
    s = s.replaceAll(RegExp(r'\\A\b'), 'A');
    s = s.replaceAll(RegExp(r'\\s\b'), 's');

    // Integrals & Summations
    s = s.replaceAllMapped(RegExp(r'\\sum_\{([^}]+)\}\^\{([^}]+)\}'), (m) => '∑_{${m.group(1)}}^{${m.group(2)}}');
    s = s.replaceAllMapped(RegExp(r'\\sum_\{([^}]+)\}\^([0-9a-zA-Z])'), (m) => '∑_{${m.group(1)}}^${m.group(2)}');
    s = s.replaceAll(RegExp(r'\\sum(?![a-zA-Z])'), '∑');
    s = s.replaceAllMapped(RegExp(r'\\int_\{([^}]+)\}\^\{([^}]+)\}'), (m) => '∫_{${m.group(1)}}^{${m.group(2)}}');
    s = s.replaceAll(RegExp(r'\\int(?![a-zA-Z])'), '∫');

    // 6. Superscripts conversion
    const superMap = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶',
      '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽',
      ')': '⁾', 'n': 'ⁿ', 'm': 'ᵐ', 'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'i': 'ⁱ',
      'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
    };
    s = s.replaceAllMapped(RegExp(r'\^\{([^}]+)\}'), (m) {
      final g = m.group(1) ?? '';
      return g.split('').map((c) => superMap[c] ?? c).join('');
    });
    s = s.replaceAllMapped(RegExp(r'\^([0-9a-zA-Z+-])'), (m) {
      final c = m.group(1) ?? '';
      return superMap[c] ?? '^$c';
    });

    // 7. Subscripts conversion
    const subWordMap = {
      'cm': '𝒸ₘ',
      'total': 'ₜₒₜₐₗ',
      'net': 'ₙₑₜ',
      'ext': 'ₑₓₜ',
      'max': 'ₘₐₓ',
      'min': 'ₘᵢₙ',
      'final': '𝒻ᵢₙₐₗ',
      'initial': 'ᵢₙᵢₜ',
      'perp': '⟂',
      'mean': 'ₘₑₐₙ',
      'sphere': 'ₛₚₕₑᵣₑ',
      'cylinder': '𝒸ᵧₗ',
      'hat': '̂',
    };
    const subCharMap = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆',
      '7': '₇', '8': '₈', '9': '₉', 'a': 'ₐ', 'e': 'ₑ', 'i': 'ᵢ', 'j': 'ⱼ',
      'n': 'ₙ', 'm': 'ₘ', 'x': 'ₓ', 'y': 'ᵧ', 'z': '₂', 's': 'ₛ', 'k': 'ₖ',
      'o': 'ₒ', 'g': '𝓰', 'r': 'ᵣ', 't': 'ₜ'
    };

    s = s.replaceAllMapped(RegExp(r'_\{([^}]+)\}'), (m) {
      final g = (m.group(1) ?? '').toLowerCase();
      if (subWordMap.containsKey(g)) return subWordMap[g]!;
      final chars = g.split('');
      if (chars.every((c) => subCharMap.containsKey(c))) {
        return chars.map((c) => subCharMap[c]!).join('');
      }
      return ' ($g)';
    });

    s = s.replaceAllMapped(RegExp(r'_([a-zA-Z0-9]+)'), (m) {
      final g = (m.group(1) ?? '').toLowerCase();
      if (subWordMap.containsKey(g)) return subWordMap[g]!;
      if (g.length == 1 && subCharMap.containsKey(g)) return subCharMap[g]!;
      return ' ($g)';
    });

    return s.trim();
  }

  static String _parseBalancedBraces(String str, String command) {
    var result = str;
    int idx = 0;
    while ((idx = result.indexOf(command)) != -1) {
      int cursor = idx + command.length;
      while (cursor < result.length && (result[cursor] == ' ' || result[cursor] == '\n')) {
        cursor++;
      }
      if (cursor >= result.length || result[cursor] != '{') break;

      int depth = 1;
      int numStart = cursor + 1;
      int numEnd = -1;
      for (int i = numStart; i < result.length; i++) {
        if (result[i] == '{') {
          depth++;
        } else if (result[i] == '}') {
          depth--;
          if (depth == 0) {
            numEnd = i;
            cursor = i + 1;
            break;
          }
        }
      }
      if (numEnd == -1) break;

      while (cursor < result.length && (result[cursor] == ' ' || result[cursor] == '\n')) {
        cursor++;
      }
      if (cursor >= result.length || result[cursor] != '{') break;

      depth = 1;
      int denStart = cursor + 1;
      int denEnd = -1;
      for (int i = denStart; i < result.length; i++) {
        if (result[i] == '{') {
          depth++;
        } else if (result[i] == '}') {
          depth--;
          if (depth == 0) {
            denEnd = i;
            cursor = i + 1;
            break;
          }
        }
      }
      if (denEnd == -1) break;

      final num = _parseBalancedBraces(result.substring(numStart, numEnd), command);
      final den = _parseBalancedBraces(result.substring(denStart, denEnd), command);
      result = '${result.substring(0, idx)}($num / $den)${result.substring(denEnd + 1)}';
    }
    return result;
  }

  TextAlign _resolveTextAlign(String formatted) {
    if (textAlign == null) return TextAlign.start;
    if (textAlign == TextAlign.justify) {
      final trimmed = formatted.trim();
      final words = trimmed.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
      // Safe paragraph-aware justification:
      // If paragraph is under 80 chars or fewer than 14 words, fall back to natural start alignment
      // to avoid awkward word gaps, clipped spacing, or stretched one-liners.
      if (trimmed.length < 80 || words.length < 14) {
        return TextAlign.start;
      }
      return TextAlign.justify;
    }
    return textAlign!;
  }

  @override
  Widget build(BuildContext context) {
    final formatted = formatMathString(text);
    final resolvedAlign = _resolveTextAlign(formatted);

    if (selectable) {
      return SelectableText(
        formatted,
        style: style,
        maxLines: maxLines,
        textAlign: resolvedAlign,
      );
    }

    return Text(
      formatted,
      style: style,
      maxLines: maxLines,
      overflow: overflow,
      textAlign: resolvedAlign,
    );
  }
}
