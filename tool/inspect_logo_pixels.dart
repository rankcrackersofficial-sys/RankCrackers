import 'dart:io';
import 'package:image/image.dart' as img;

void main() {
  final bytes = File('assets/images/logo.png').readAsBytesSync();
  final logo = img.decodeImage(bytes)!;
  print('Dimensions: ${logo.width}x${logo.height}');

  int minX = logo.width, maxX = 0, minY = logo.height, maxY = 0;
  for (int y = 0; y < logo.height; y++) {
    for (int x = 0; x < logo.width; x++) {
      final p = logo.getPixel(x, y);
      if (p.a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  print('Non-transparent bbox: ($minX, $minY) to ($maxX, $maxY), size: ${maxX - minX + 1}x${maxY - minY + 1}');

  final scaled = img.copyResize(logo, width: 40, height: 40);
  for (int y = 0; y < 40; y++) {
    final row = StringBuffer();
    for (int x = 0; x < 40; x++) {
      final p = scaled.getPixel(x, y);
      if (p.a < 20) {
        row.write(' ');
      } else {
        row.write('#');
      }
    }
    print(row.toString());
  }
}

