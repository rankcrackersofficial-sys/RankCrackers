import 'dart:io';
import 'package:image/image.dart' as img;

void main() {
  final logoFile = File('assets/images/logo.png');
  if (!logoFile.existsSync()) {
    print('ERROR: assets/images/logo.png not found');
    return;
  }

  final logoBytes = logoFile.readAsBytesSync();
  final logoImg = img.decodeImage(logoBytes)!;

  // Crop logo to its non-transparent bounding box
  int minX = logoImg.width, maxX = 0, minY = logoImg.height, maxY = 0;
  for (int y = 0; y < logoImg.height; y++) {
    for (int x = 0; x < logoImg.width; x++) {
      final p = logoImg.getPixel(x, y);
      if (p.a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  final croppedEmblem = img.copyCrop(
    logoImg,
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  );

  print('Cropped emblem size: ${croppedEmblem.width}x${croppedEmblem.height}');

  // Density maps for Android
  final densities = {
    'mdpi': {'splash': 240, 'foreground': 108, 'launcher': 48},
    'hdpi': {'splash': 360, 'foreground': 162, 'launcher': 72},
    'xhdpi': {'splash': 480, 'foreground': 216, 'launcher': 96},
    'xxhdpi': {'splash': 720, 'foreground': 324, 'launcher': 144},
    'xxxhdpi': {'splash': 960, 'foreground': 432, 'launcher': 192},
  };

  // Target folders to write splash drawables to
  final splashFolders = ['drawable', 'drawable-night'];

  // 1. Generate android12splash.png and splash.png (Ratio: 20% of canvas so it easily fits inside the 160dp circular mask of a 288dp canvas without ANY clipping!)
  for (final entry in densities.entries) {
    final density = entry.key;
    final canvasSize = entry.value['splash']!;
    final emblemSize = (canvasSize * 0.20).round(); // 20% ratio = generous margin inside circular mask

    final canvas = img.Image(width: canvasSize, height: canvasSize, numChannels: 4);
    // Fill with transparent
    img.fill(canvas, color: img.ColorRgba8(0, 0, 0, 0));

    final resizedEmblem = img.copyResize(
      croppedEmblem,
      width: emblemSize,
      height: emblemSize,
      interpolation: img.Interpolation.cubic,
    );

    final offsetX = (canvasSize - emblemSize) ~/ 2;
    final offsetY = (canvasSize - emblemSize) ~/ 2;

    img.compositeImage(
      canvas,
      resizedEmblem,
      dstX: offsetX,
      dstY: offsetY,
    );

    final encodedPng = img.encodePng(canvas);

    for (final folderPrefix in splashFolders) {
      final folder = '$folderPrefix-$density';
      final dir = Directory('android/app/src/main/res/$folder');
      if (!dir.existsSync()) {
        dir.createSync(recursive: true);
      }

      final a12Path = 'android/app/src/main/res/$folder/android12splash.png';
      File(a12Path).writeAsBytesSync(encodedPng);
      print('Generated $a12Path ($canvasSize x $canvasSize, emblem: $emblemSize x $emblemSize)');

      final splashPath = 'android/app/src/main/res/$folder/splash.png';
      File(splashPath).writeAsBytesSync(encodedPng);
      print('Generated $splashPath');
    }
  }

  // Also write fallback to android/app/src/main/res/drawable/
  final defaultCanvasSize = 480;
  final defaultEmblemSize = (defaultCanvasSize * 0.20).round();
  final defaultCanvas = img.Image(width: defaultCanvasSize, height: defaultCanvasSize, numChannels: 4);
  img.fill(defaultCanvas, color: img.ColorRgba8(0, 0, 0, 0));
  final defaultResized = img.copyResize(
    croppedEmblem,
    width: defaultEmblemSize,
    height: defaultEmblemSize,
    interpolation: img.Interpolation.cubic,
  );
  img.compositeImage(
    defaultCanvas,
    defaultResized,
    dstX: (defaultCanvasSize - defaultEmblemSize) ~/ 2,
    dstY: (defaultCanvasSize - defaultEmblemSize) ~/ 2,
  );
  final defaultPng = img.encodePng(defaultCanvas);
  File('android/app/src/main/res/drawable/android12splash.png').writeAsBytesSync(defaultPng);
  File('android/app/src/main/res/drawable/splash.png').writeAsBytesSync(defaultPng);
  print('Generated default drawable/android12splash.png and splash.png');

  // 2. Generate ic_launcher_foreground.png (Ratio: 44% of 108dp canvas = 47.5dp safe zone inside 66dp viewport)
  for (final entry in densities.entries) {
    final density = entry.key;
    final canvasSize = entry.value['foreground']!;
    final emblemSize = (canvasSize * 0.44).round();

    final canvas = img.Image(width: canvasSize, height: canvasSize, numChannels: 4);
    img.fill(canvas, color: img.ColorRgba8(0, 0, 0, 0));

    final resizedEmblem = img.copyResize(
      croppedEmblem,
      width: emblemSize,
      height: emblemSize,
      interpolation: img.Interpolation.cubic,
    );

    final offsetX = (canvasSize - emblemSize) ~/ 2;
    final offsetY = (canvasSize - emblemSize) ~/ 2;

    img.compositeImage(
      canvas,
      resizedEmblem,
      dstX: offsetX,
      dstY: offsetY,
    );

    final encodedFg = img.encodePng(canvas);

    for (final folderPrefix in splashFolders) {
      final folder = '$folderPrefix-$density';
      final dir = Directory('android/app/src/main/res/$folder');
      if (!dir.existsSync()) {
        dir.createSync(recursive: true);
      }
      final fgPath = 'android/app/src/main/res/$folder/ic_launcher_foreground.png';
      File(fgPath).writeAsBytesSync(encodedFg);
      print('Generated $fgPath');
    }
  }

  // 3. Generate legacy launcher icons in mipmap folders (Ratio: 52% of canvas)
  for (final entry in densities.entries) {
    final density = entry.key;
    final canvasSize = entry.value['launcher']!;
    final emblemSize = (canvasSize * 0.52).round();

    final canvas = img.Image(width: canvasSize, height: canvasSize, numChannels: 4);
    // Background color #060B16
    img.fill(canvas, color: img.ColorRgba8(6, 11, 22, 255));

    final resizedEmblem = img.copyResize(
      croppedEmblem,
      width: emblemSize,
      height: emblemSize,
      interpolation: img.Interpolation.cubic,
    );

    final offsetX = (canvasSize - emblemSize) ~/ 2;
    final offsetY = (canvasSize - emblemSize) ~/ 2;

    img.compositeImage(
      canvas,
      resizedEmblem,
      dstX: offsetX,
      dstY: offsetY,
    );

    final launcherDir = Directory('android/app/src/main/res/mipmap-$density');
    if (!launcherDir.existsSync()) {
      launcherDir.createSync(recursive: true);
    }
    final launcherPath = 'android/app/src/main/res/mipmap-$density/ic_launcher.png';
    File(launcherPath).writeAsBytesSync(img.encodePng(canvas));
    final roundPath = 'android/app/src/main/res/mipmap-$density/ic_launcher_round.png';
    File(roundPath).writeAsBytesSync(img.encodePng(canvas));
    print('Generated $launcherPath & $roundPath');
  }

  print('ALL ASSETS SUCCESSFULLY GENERATED!');
}
