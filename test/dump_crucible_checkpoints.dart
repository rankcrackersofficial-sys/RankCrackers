import 'dart:io';
import 'dart:convert';

void main() {
  final path = 'C:/RankCrackers/RankCrackers-55.worktrees/governance-living-checklist/docs/governance/rankcrackers_living_master_checklist.json';
  final file = File(path);
  final json = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  final items = (json['items'] as List?) ?? (json['checkpoints'] as List?) ?? [];
  
  print('=== CRUCIBLE & RELATED CHECKPOINTS ===');
  for (final item in items) {
    final id = item['id'] ?? item['checkpoint_id'] ?? '';
    final title = item['title'] ?? item['name'] ?? item['description'] ?? '';
    final status = item['status'] ?? item['state'] ?? '';
    final category = item['category'] ?? item['module'] ?? '';
    if (id.toString().contains('CRU') || 
        id.toString().contains('NAV') || 
        id.toString().contains('SYL') || 
        id.toString().contains('DIGI') ||
        title.toString().toLowerCase().contains('crucible') ||
        title.toString().toLowerCase().contains('training plan')) {
      print('$id | $status | $category | $title');
    }
  }
}
