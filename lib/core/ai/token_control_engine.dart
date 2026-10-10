import 'models/token_usage.dart';

/// TOKEN CONTROL ENGINE
/// Monitors and limits AI token consumption per provider.
class TokenControlEngine {
  static final Map<String, TokenUsage> _usage = {
    'geminiFlash': TokenUsage(provider: 'geminiFlash', dailyLimit: 1000000),
    'claudeHaiku': TokenUsage(provider: 'claudeHaiku', dailyLimit: 200000),
    'openAI': TokenUsage(provider: 'openAI', dailyLimit: 100000),
    'gemini': TokenUsage(provider: 'gemini', dailyLimit: 2000000),
  };

  static bool canExecute(String provider) {
    return _usage[provider]?.canUse ?? true; // Default to true if not tracked
  }

  static void consume(String provider, int tokens) {
    if (_usage.containsKey(provider)) {
      _usage[provider]!.used += tokens;
    }
  }
}
