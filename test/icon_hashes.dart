import 'dart:io';
import 'dart:convert';
import 'package:crypto/crypto.dart';

void main() {
  var dir = Directory('android/app/src/main/res');
  if (!dir.existsSync()) {
    print('res dir does not exist');
    return;
  }
  for (var f in dir.listSync(recursive: true)) {
    if (f is File && f.path.contains('ic_launcher')) {
      var bytes = f.readAsBytesSync();
      var hash = sha256.convert(bytes).toString();
      print('$hash  ${f.path}');
    }
  }
}
