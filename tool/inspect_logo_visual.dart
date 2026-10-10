import 'dart:io';
import 'package:image/image.dart' as img;

void main() {
  final bytes = File('assets/images/logo.png').readAsBytesSync();
  final logo = img.decodeImage(bytes)!;
  print('Logo image: ${logo.width}x${logo.height}');

  // Find non-transparent bounds
  int minX = logo.width, maxX = 0, minY = logo.height, maxY = 0;
  for (int y = 0; y < logo.height; y++) {
    for (int x = 0; x < logo.width; x++) {
      final p = logo.getPixel(x, y);
      if (p.a > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  print('Non-transparent area: minX=$minX, maxX=$maxX, minY=$minY, maxY=$maxY');
  print('Emblem width=${maxX - minX + 1}, height=${maxY - minY + 1}');
}
