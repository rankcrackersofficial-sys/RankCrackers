import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../models/digibook_launch_args.dart';
import 'digibook_revision_service.dart';

/// DIGIBOOK AUTHORITY ENTRY
/// Holds the bridge metadata for a single Generation Unit in the authority manifest.
class DigiBookAuthorityEntry {
  final String guId;
  final String subject;
  final String canonicalNodeId;
  final String topic;
  final String lessonRevision;
  final String lessonSha256;
  final List<String> atomicFactIds;
  final List<String> sourceAuthorityRefs;
  final List<dynamic> formulaRefs;
  final List<dynamic> misconceptionRefs;
  final List<dynamic> workedExampleRefs;
  final List<dynamic> selfCheckRefs;
  final String privateLessonAuthorityPath;
  final String digiBookAuthorityCommit;
  final String factSemantics;
  final String assemblyStatus;

  const DigiBookAuthorityEntry({
    required this.guId,
    required this.subject,
    required this.canonicalNodeId,
    required this.topic,
    required this.lessonRevision,
    required this.lessonSha256,
    required this.atomicFactIds,
    required this.sourceAuthorityRefs,
    required this.formulaRefs,
    required this.misconceptionRefs,
    required this.workedExampleRefs,
    required this.selfCheckRefs,
    required this.privateLessonAuthorityPath,
    required this.digiBookAuthorityCommit,
    required this.factSemantics,
    required this.assemblyStatus,
  });

  bool get isFactComplete => factSemantics == 'SOURCE_FACT_COMPLETE';

  factory DigiBookAuthorityEntry.fromMap(Map<String, dynamic> map) {
    return DigiBookAuthorityEntry(
      guId: map['guId'] ?? '',
      subject: map['subject'] ?? '',
      canonicalNodeId: map['canonicalNodeId'] ?? '',
      topic: map['topic'] ?? '',
      lessonRevision: map['lessonRevision'] ?? '',
      lessonSha256: map['lessonSha256'] ?? '',
      atomicFactIds: List<String>.from(map['atomicFactIds'] ?? []),
      sourceAuthorityRefs: List<String>.from(map['sourceAuthorityRefs'] ?? []),
      formulaRefs: map['formulaRefs'] as List<dynamic>? ?? [],
      misconceptionRefs: map['misconceptionRefs'] as List<dynamic>? ?? [],
      workedExampleRefs: map['workedExampleRefs'] as List<dynamic>? ?? [],
      selfCheckRefs: map['selfCheckRefs'] as List<dynamic>? ?? [],
      privateLessonAuthorityPath: map['privateLessonAuthorityPath'] ?? '',
      digiBookAuthorityCommit: map['DigiBookAuthorityCommit'] ?? map['digiBookAuthorityCommit'] ?? '',
      factSemantics: map['factSemantics'] ?? 'CANARY/PARTIAL',
      assemblyStatus: map['assemblyStatus'] ?? '',
    );
  }
}

enum DigiBookBridgeResolveStatus {
  unmapped,
  singleGu,
  multiGu,
}

class DigiBookBridgeResolveResult {
  final DigiBookBridgeResolveStatus status;
  final String canonicalNodeId;
  final List<DigiBookAuthorityEntry> entries;

  const DigiBookBridgeResolveResult({
    required this.status,
    required this.canonicalNodeId,
    required this.entries,
  });

  bool get isMapped => status != DigiBookBridgeResolveStatus.unmapped;
  bool get isMultiGu => status == DigiBookBridgeResolveStatus.multiGu;
  DigiBookAuthorityEntry? get primaryEntry =>
      entries.isNotEmpty ? entries.first : null;
}

/// DIGIBOOK CANONICAL BRIDGE SERVICE
/// Sovereign runtime service that enforces the hard identity law:
/// Syllabus -> Canonical Node ID -> Generation Unit ID -> Current Revision -> AtomicFact Set
class DigiBookCanonicalBridgeService {
  static DigiBookCanonicalBridgeService? _instance;
  static DigiBookCanonicalBridgeService get instance =>
      _instance ??= DigiBookCanonicalBridgeService._();

  DigiBookCanonicalBridgeService._();

  List<DigiBookAuthorityEntry> _allEntries = [];
  List<DigiBookAuthorityEntry> _sourceEntries = [];
  final Map<String, List<DigiBookAuthorityEntry>> _canonicalMap = {};
  final Map<String, DigiBookAuthorityEntry> _guMap = {};
  bool _isInitialized = false;

  bool get isInitialized => _isInitialized;
  List<DigiBookAuthorityEntry> get allEntries => List.unmodifiable(_allEntries);

  /// Load and parse the authority manifest.
  Future<void> initialize() async {
    if (_isInitialized) return;

    String? jsonString;

    // 1. Try Flutter rootBundle Asset
    try {
      jsonString = await rootBundle.loadString(
          'docs/academic_review/digibook_authority_bridge_manifest.json');
    } catch (_) {
      // 2. Fallback to Direct File System (Desktop / Unit Test)
      final manifestFile = File(
          'docs/academic_review/digibook_authority_bridge_manifest.json');
      if (manifestFile.existsSync()) {
        jsonString = await manifestFile.readAsString();
      }
    }

    if (jsonString == null || jsonString.isEmpty) {
      debugPrint('DIGIBOOK BRIDGE WARNING: Could not load authority manifest.');
      return;
    }

    final Map<String, dynamic> data = jsonDecode(jsonString);
    final List<dynamic> lessonsList = data['lessons'] as List<dynamic>? ?? [];

    _sourceEntries = lessonsList
        .map((e) => DigiBookAuthorityEntry.fromMap(Map<String, dynamic>.from(e)))
        .toList();

    _allEntries = List.of(_sourceEntries);

    _canonicalMap.clear();
    _guMap.clear();

    for (final entry in _allEntries) {
      _guMap[entry.guId] = entry;
      _canonicalMap.putIfAbsent(entry.canonicalNodeId, () => []).add(entry);
    }

    _isInitialized = true;
    debugPrint(
        'DIGIBOOK BRIDGE INITIALIZED: ${_allEntries.length} GUs mapped across ${_canonicalMap.length} canonical node IDs.');
  }

  /// Restrict the authority bridge to the selected mission. A manifest for
  /// another exam must never be presented as content for the active mission.
  /// SSC currently has no bundled bridge entries, so it correctly resolves to
  /// zero lessons until verified SSC lesson artifacts are published.
  void activateMission(String missionId) {
    final id = missionId.trim().toLowerCase();
    final isJee = id == 'jee_main_2026' || id == 'jee_main_2027';
    final filtered = isJee
        ? _sourceEntries
            .where((e) => e.canonicalNodeId.toLowerCase().startsWith('jee_main_'))
            .toList()
        : <DigiBookAuthorityEntry>[];
    _allEntries = filtered;
    _canonicalMap.clear();
    _guMap.clear();
    for (final entry in _allEntries) {
      _guMap[entry.guId] = entry;
      _canonicalMap.putIfAbsent(entry.canonicalNodeId, () => []).add(entry);
    }
  }

  /// Initialize synchronously if raw json map is supplied (for unit tests / mock setup)
  void initializeFromMap(Map<String, dynamic> data) {
    final List<dynamic> lessonsList = data['lessons'] as List<dynamic>? ?? [];

    _sourceEntries = lessonsList
        .map((e) => DigiBookAuthorityEntry.fromMap(Map<String, dynamic>.from(e)))
        .toList();
    _allEntries = List.of(_sourceEntries);

    _canonicalMap.clear();
    _guMap.clear();

    for (final entry in _allEntries) {
      _guMap[entry.guId] = entry;
      _canonicalMap.putIfAbsent(entry.canonicalNodeId, () => []).add(entry);
    }

    _isInitialized = true;
  }

  /// HARD IDENTITY LAW RESOLUTION
  /// Resolves a Syllabus canonicalNodeId to its mapped Generation Unit(s).
  ///
  /// Never routes by title/string/fuzzy matching.
  /// Unmapped nodes FAIL CLOSED.
  DigiBookBridgeResolveResult resolveCanonicalNode(String canonicalNodeId) {
    final entries = _canonicalMap[canonicalNodeId] ?? [];

    if (entries.isEmpty) {
      return DigiBookBridgeResolveResult(
        status: DigiBookBridgeResolveStatus.unmapped,
        canonicalNodeId: canonicalNodeId,
        entries: const [],
      );
    }

    if (entries.length == 1) {
      return DigiBookBridgeResolveResult(
        status: DigiBookBridgeResolveStatus.singleGu,
        canonicalNodeId: canonicalNodeId,
        entries: entries,
      );
    }

    return DigiBookBridgeResolveResult(
      status: DigiBookBridgeResolveStatus.multiGu,
      canonicalNodeId: canonicalNodeId,
      entries: entries,
    );
  }

  /// Fetch entry by Generation Unit ID directly
  DigiBookAuthorityEntry? getEntryByGuId(String guId) {
    return _guMap[guId];
  }

  /// Load private lesson raw content JSON for a given GU
  Future<Map<String, dynamic>?> loadRawLessonContent(String guId, [String? explicitRevisionId]) async {
    final entry = getEntryByGuId(guId);
    if (entry == null) return null;

    final revId = explicitRevisionId ?? entry.lessonRevision;

    // 1. Try Mobile-Runtime Revision Service (Firestore / Controlled Memory)
    final revPayload = await DigiBookRevisionService.instance
        .fetchRevisionPayload(guId, revId);
    if (revPayload != null) return revPayload;

    // 2. Mobile Bundled Offline Asset Fallback
    try {
      final jsonStr = await rootBundle.loadString('assets/data/digibook_lessons/$guId.json');
      return jsonDecode(jsonStr) as Map<String, dynamic>;
    } catch (_) {}

    // 3. Desktop / Unit-Test Fixture Support (if file exists on local host)
    final localAsset = File('assets/data/digibook_lessons/$guId.json');
    if (localAsset.existsSync()) {
      try {
        final content = await localAsset.readAsString();
        return jsonDecode(content) as Map<String, dynamic>;
      } catch (e) {
        debugPrint('DIGIBOOK BRIDGE ERROR loading local asset: $e');
      }
    }

    final path = entry.privateLessonAuthorityPath;
    if (path.isNotEmpty) {
      final file = File(path);
      if (file.existsSync()) {
        try {
          final content = await file.readAsString();
          return jsonDecode(content) as Map<String, dynamic>;
        } catch (e) {
          debugPrint('DIGIBOOK BRIDGE ERROR loading file $path: $e');
        }
      }
    }

    return null;
  }

  /// Build complete launch arguments for a resolved Generation Unit
  Future<DigiBookLaunchArgs?> buildLaunchArgs(String guId) async {
    if (!_isInitialized) await initialize();

    final entry = getEntryByGuId(guId);
    if (entry == null) return null;

    // Resolve current revision pointer dynamically
    final currentRevId = await DigiBookRevisionService.instance
            .resolveCurrentRevisionId(guId) ??
        entry.lessonRevision;

    final rawLesson = await loadRawLessonContent(guId, currentRevId);

    final String revisionId =
        rawLesson?['revisionId'] as String? ?? currentRevId;
    final String atomicFactSetHash =
        rawLesson?['atomicFactSetHash'] as String? ?? '';

    return DigiBookLaunchArgs(
      generationUnitId: entry.guId,
      canonicalNodeId: entry.canonicalNodeId,
      revisionId: revisionId,
      subject: entry.subject,
      topicTitle: entry.topic,
      factSemantics: entry.factSemantics,
      atomicFactSetHash: atomicFactSetHash,
      atomicFactIds: entry.atomicFactIds,
      rawLessonData: rawLesson,
    );
  }
}
