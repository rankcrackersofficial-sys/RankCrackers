import 'dart:async';

class TestTimerEngine {
  static Timer? _timer;

  // ===================================================
  // START TIMER 
  // ===================================================
  static void start({
    required int seconds,
    required Function(int remaining) onTick,
    required Function() onComplete,
  }) {
    int remaining = seconds;
    _timer?.cancel();
    _timer = Timer.periodic(
      const Duration(seconds: 1),
      (timer) {
        remaining--;
        onTick(remaining);
        if (remaining <= 0) {
          timer.cancel();
          onComplete();
        }
      },
    );
  }

  static void dispose() {
    _timer?.cancel();
  }
}
