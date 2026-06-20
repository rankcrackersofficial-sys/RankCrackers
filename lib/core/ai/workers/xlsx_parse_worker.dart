import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:excel/excel.dart';
import '../../models/sentinel_draft.dart';
import '../../models/audit_record.dart';
import '../../backend/sentinel_repository.dart';

/// 🔱 XLSX PARSE WORKER (Hardened)
/// Implements Phase 9 Step 1: Schema Detection & Row Mapping.
class XlsxParseWorker {
  
  /// 🔱 EXTRACTION PROTOCOL
  static Future<void> processXlsx({
    required String recordId,
    required String fileHash,
    required String fileName,
    required String filePath,
  }) async {
    debugPrint("🔱 XLSX WORKER: Detecting schema for $fileName");

    final file = File(filePath);
    final bytes = await file.readAsBytes();
    final excel = Excel.decodeBytes(bytes);

    final List<Map<String, dynamic>> rows = [];
    final Map<String, String> schema = {};

    for (var table in excel.tables.keys) {
      final sheet = excel.tables[table]!;
      if (sheet.maxRows > 0) {
        // Assume first row is header
        final headerRow = sheet.rows.first;
        for (int i = 0; i < headerRow.length; i++) {
          schema['col_$i'] = headerRow[i]?.value.toString() ?? 'unknown';
        }

        for (int i = 1; i < sheet.maxRows; i++) {
          final rowData = <String, dynamic>{};
          for (int j = 0; j < sheet.rows[i].length; j++) {
            final colName = schema['col_$j'] ?? 'col_$j';
            rowData[colName] = sheet.rows[i][j]?.value;
          }
          rows.add(rowData);
        }
      }
      break; // Process first sheet only for now
    }

    // 2. Register in Draft Zone
    final draft = SentinelDraft(
      id: 'xlsx_draft_${DateTime.now().millisecondsSinceEpoch}_$recordId',
      type: 'xlsx_extraction',
      rawData: {
        'recordId': recordId,
        'schema': schema,
        'rowCount': rows.length,
        'rows': rows,
      },
      status: 'draft',
      audit: AuditRecord(
        sourceUrl: 'rc://ingest/$recordId',
        sourceHash: fileHash,
        documentHash: 'rows_${rows.length}',
        validationStatus: 'pending',
        workerVersion: '1.0.0',
        provider: 'local',
        discoveryCount: 1,
        createdAt: DateTime.now(),
        discoveredAt: DateTime.now(),
        lastSeenAt: DateTime.now(),
      ),
    );

    await SentinelRepository.injectDrafts([draft]);
    debugPrint("🔱 XLSX WORKER: Schema detection complete.");
  }
}
