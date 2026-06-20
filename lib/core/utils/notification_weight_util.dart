/// 🔱 NOTIFICATION WEIGHT UTILITY
/// Normalizes board marks into a standard signal range.

library;

class NotificationWeightUtil {
  static double normalize(double rawMarks, double maxMarks) {
    if (maxMarks == 0) return 0.0;
    return (rawMarks / maxMarks).clamp(0.0, 1.0);
  }
}
