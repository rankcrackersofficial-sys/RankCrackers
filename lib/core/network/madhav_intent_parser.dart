// FILE: lib/core/network/madhav_intent_parser.dart

class MadhavIntentResult {
  final String action;
  final String targetId;
  final String feedbackSpeech;

  const MadhavIntentResult({
    required this.action,
    required this.targetId,
    required this.feedbackSpeech,
  });
}

class MadhavIntentParser {

  /// छात्र की आवाज़ के इनपुट का विश्लेषण करके उसे सीधा एक्शन रिस्पांस देना
  static MadhavIntentResult parseCommand(String voiceInput) {
    final String cleanInput = voiceInput.trim().toLowerCase();

    // कमांड: "माधव, आज राजस्थान का इतिहास पढ़ेंगे"
    if (cleanInput.contains("राजस्थान का इतिहास") ||
        cleanInput.contains("history") ||
        cleanInput.contains("इतिहास")) {
      return const MadhavIntentResult(
        action: "NAVIGATE_TO_PUSTAK",
        targetId: "SUB_RAJ_HIST",
        feedbackSpeech: "शेड्यूल के अनुसार, आपकी पुस्तक का राजस्थान इतिहास खंड खोल रहा हूँ, पार्थ।",
      );
    }

    // कमांड: "माधव, आज का बैटल मिशन क्या है" या "डैशबोर्ड दिखाओ"
    if (cleanInput.contains("मिशन") ||
        cleanInput.contains("target") ||
        cleanInput.contains("डैशबोर्ड")) {
      return const MadhavIntentResult(
        action: "JUMP_TO_MISSION_CONTROL",
        targetId: "DASHBOARD",
        feedbackSpeech: "आज के कुरुक्षेत्र के मुख्य लक्ष्य आपके सामने हैं, पार्थ।",
      );
    }

    // डिफ़ॉल्ट फॉलबैक (जब माधव दुविधा सुन रहे हों)
    return const MadhavIntentResult(
      action: "NONE",
      targetId: "",
      feedbackSpeech: "मैं सुन रहा हूँ, पार्थ। अपनी दुविधा या विषय का नाम कहें।",
    );
  }
}