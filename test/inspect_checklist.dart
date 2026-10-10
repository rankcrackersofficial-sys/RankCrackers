import 'dart:io';
import 'dart:convert';
import 'package:crypto/crypto.dart';

void main() {
  final path = 'C:/RankCrackers/RankCrackers-55.worktrees/governance-living-checklist/docs/governance/rankcrackers_living_master_checklist.json';
  final file = File(path);
  if (!file.existsSync()) {
    print('Checklist file not found: $path');
    return;
  }
  final bytes = file.readAsBytesSync();
  final hash = sha256.convert(bytes).toString();
  final json = jsonDecode(utf8.decode(bytes)) as Map<String, dynamic>;
  final revision = json['revision'] ?? json['version'] ?? json['ledger_revision'];
  final items = (json['items'] as List?) ?? (json['checkpoints'] as List?) ?? [];
  print('LEDGER_REVISION_BEFORE = $revision');
  print('LEDGER_HASH_BEFORE = $hash');
  print('MASTER_ITEM_COUNT_BEFORE = ${items.length}');
}
