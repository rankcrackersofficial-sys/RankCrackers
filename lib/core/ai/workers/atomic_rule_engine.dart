import 'package:flutter/foundation.dart';
import '../../models/notification_canonical.dart';

/// 🔱 ATOMIC RULE EXTRACTION ENGINE (Sprint F.1)
class AtomicRuleEngine {
  static Future<List<AtomicNotificationRule>> extractRules(String text) async {
    debugPrint("🔱 ATOMIC RULE ENGINE: Scanning for constitutional rules...");
    
    final List<AtomicNotificationRule> rules = [];

    // 1. Age Rule Extraction
    final ageMatch = RegExp(r'Age\s?Limit\s?[:\-]?\s?(\d+)\s?(to|-)\s?(\d+)', caseSensitive: false).firstMatch(text);
    if (ageMatch != null) {
      rules.add(AtomicNotificationRule(
        ruleId: "age_rule_${DateTime.now().millisecondsSinceEpoch}",
        type: "AGE",
        statement: "Candidates must be between ${ageMatch.group(1)} and ${ageMatch.group(3)} years of age.",
        page: 1, // Future: Use CoordinateRecovery
        confidence: 0.95,
      ));
    }

    // 2. Fee Rule Extraction
    final feeMatch = RegExp(r'(Fee|Application Fee)\s?[:\-]?\s?(Rs\.?|INR)?\s?(\d+)', caseSensitive: false).firstMatch(text);
    if (feeMatch != null) {
      rules.add(AtomicNotificationRule(
        ruleId: "fee_rule_${DateTime.now().millisecondsSinceEpoch}",
        type: "FEE",
        statement: "Application Fee: Rs. ${feeMatch.group(3)}",
        page: 1,
        confidence: 0.90,
      ));
    }

    // 3. Education Rule Extraction
    if (text.contains(RegExp(r'Educational Qualification', caseSensitive: false))) {
      rules.add(AtomicNotificationRule(
        ruleId: "edu_rule_${DateTime.now().millisecondsSinceEpoch}",
        type: "EDUCATION",
        statement: "Specific educational qualifications required as per section X.",
        page: 1,
        confidence: 0.85,
      ));
    }

    return rules;
  }
}
