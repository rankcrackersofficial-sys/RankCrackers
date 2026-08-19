import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import '../models/recruitment.dart';
import '../models/atomic_mastery_state.dart';
import '../models/atomic_coverage_state.dart';
import '../models/atomic_risk_state.dart';
import '../backend/backend_provider.dart';
import '../../features/progress/data/models/user_progress.dart';
import 'knowledge_graph.dart';
import 'coverage_engine.dart';
import 'risk_engine.dart';
import '../models/coverage_state.dart';
import '../models/risk_state.dart';
import 'momentum_engine.dart';
import '../models/momentum_state.dart';
import '../models/readiness_state.dart';
import '../engines/readiness_engine.dart';
import '../engines/forecasting_engine.dart';
import 'completion_engine.dart';
import 'mastery_engine.dart';
import 'mastery_decay_engine.dart';
import 'hierarchical_aggregation_engine.dart';
import 'knowledge_cache.dart';
import '../firebase/firestore_service.dart';
import '../utils/benchmark_util.dart';
import '../telemetry/telemetry_engine.dart';

class KnowledgeEngine extends ChangeNotifier {
  static final KnowledgeEngine _instance = KnowledgeEngine._internal();
  factory KnowledgeEngine() => _instance;
  KnowledgeEngine._internal();

  static KnowledgeEngine get instance => _instance;

  KnowledgeGraph? _graph;
  bool _isLoading = false;
  bool _isInitialized = false;
  bool _isHydrating = false; // 🔱 Mutex: Prevents parallel hydration

  Recruitment? _activeRecruitment;

  StreamSubscription? _progressSubscription;
  StreamSubscription? _nodeSubscription;
  final Map<String, UserProgress> _userProgressMap = {}; // 🔱 HyperScale Fix: Indexed lookup
  final Map<String, NodeRuntimeState> _nodeStates = {};
  final Map<String, AtomicMasteryState> _atomicMasteryStates = {}; 
  final Map<String, AtomicCoverageState> _atomicCoverageStates = {};
  final Map<String, AtomicRiskState> _atomicRiskStates = {}; 

  CoverageState? _coverageState;
  RiskState? _riskState;
  MomentumState? _momentumState;
  ReadinessState? _readinessState;

  // 🔱 Hierarchical Cache
  final Map<String, double> _subjectMastery = {};
  final Map<String, double> _subjectCoverage = {};
  double _successProbability = 0.0;

  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  bool get isHydrating => _isHydrating;
  Recruitment? get activeRecruitment => _activeRecruitment;

  KnowledgeGraph? get graph => _graph;
  List<UserProgress> get userProgress => _userProgressMap.values.toList();
  Map<String, NodeRuntimeState> get nodeStates => _nodeStates;
  Map<String, AtomicMasteryState> get atomicMasteryStates => _atomicMasteryStates;
  Map<String, AtomicCoverageState> get atomicCoverageStates => _atomicCoverageStates;
  Map<String, AtomicRiskState> get atomicRiskStates => _atomicRiskStates;

  CoverageState? get coverageState => _coverageState;
  RiskState? get riskState => _riskState;
  MomentumState? get momentumState => _momentumState;
  ReadinessState? get readinessState => _readinessState;
  double get successProbability => _successProbability;

  // ===================================================
  // INITIALIZATION 🔱
  // ===================================================

  Future<void> initialize({Recruitment? recruitment, bool force = false}) async {
    // 🔱 Hard Mutex
    if (_isHydrating) {
      debugPrint("🔱 KNOWLEDGE HYDRATION LOCK ACTIVE");
      return;
    }

    final bool missionChanged = _activeRecruitment?.id != recruitment?.id;
    if ((_isInitialized || _isHydrating) && !force && !missionChanged) return;

    _isHydrating = true;
    _isLoading = true;
    _activeRecruitment = recruitment;
    
    // 🔱 Debounced notification to prevent rebuild-during-build
    Future.microtask(() => notifyListeners());

    debugPrint("🔱 KNOWLEDGE INIT START");

    // 🔱 Patch 1: 3-second fail-safe release
    Future.delayed(const Duration(seconds: 3), () {
      if (!_isInitialized && _isHydrating) {
        debugPrint("🔱 KNOWLEDGE FAILSAFE RELEASE");
        _isLoading = false;
        _isHydrating = false;
        notifyListeners();
      }
    });

    BenchmarkUtil.start('MissionHydration');
    try {
      // 🔱 Telemetry capture start
      final start = DateTime.now().millisecondsSinceEpoch;

      if (force || missionChanged) {
        await _nodeSubscription?.cancel();
        await _progressSubscription?.cancel();
        _graph = null;
        _nodeStates.clear();
        _atomicMasteryStates.clear();
        _atomicCoverageStates.clear();
        _atomicRiskStates.clear();
        _userProgressMap.clear();
        _coverageState = null;
        _riskState = null;
        _momentumState = null;
        _readinessState = null;
        _subjectMastery.clear();
        _subjectCoverage.clear();
      }

      // 🔱 Priority B: Load from Knowledge Cache first
      if (recruitment != null) {
        final cachedNodes = await KnowledgeCache.loadGraph(recruitment.examId);
        if (cachedNodes != null && _graph == null) {
          _graph = KnowledgeGraph(cachedNodes);
          debugPrint("🔱 CACHE HIT: Graph hydrated from local storage.");
          BenchmarkUtil.stop('MissionHydration');
          _isLoading = false;
          notifyListeners();
        }
      }

      // 🔱 1. Subscribe to Live Node Matrix (Syllabus)
      final nodesStream = _activeRecruitment != null 
          ? FirestoreService.streamNodesByExam(_activeRecruitment!.examId) 
          : BackendProvider.adapter.streamNodes();

      _nodeSubscription = nodesStream
        .handleError((e) {
          debugPrint("🔱 NODE STREAM ERROR: $e");
        })
        .timeout(
          const Duration(seconds: 3),
          onTimeout: (sink) {
            debugPrint("🔱 NODE STREAM TIMEOUT");
            sink.add([]);
          },
        )
        .listen((nodesData) {
        // 🔱 Guard against stale async updates
        if (recruitment?.id != _activeRecruitment?.id) {
          debugPrint("🔱 KNOWLEDGE: Ignoring stale node stream response.");
          return;
        }

        // 🔱 Type-Safety Debugging
        debugPrint('🔱 NODE STREAM RECEIVED: Type = ${nodesData.runtimeType}');
        if (nodesData.isNotEmpty) {
          debugPrint('🔱 FIRST NODE ELEMENT: Type = ${nodesData.first.runtimeType}');
        }

        // 🔱 Type-Safety Hardening: Ensuring nodes are correctly typed
        final List<MicroTopicNode> nodes = nodesData;

        final filteredNodes = _activeRecruitment != null
            ? nodes.where((n) => n.examId == _activeRecruitment!.examId).toList()
            : nodes;

        _graph = KnowledgeGraph(filteredNodes);
        
        // Save to cache for next load
        if (_activeRecruitment != null && filteredNodes.isNotEmpty) {
          KnowledgeCache.saveGraph(_activeRecruitment!.examId, filteredNodes);
        }

        _isInitialized = true;
        _isLoading = false; 
        _isHydrating = false;
        
        _tryRefresh();
        
        final duration = DateTime.now().millisecondsSinceEpoch - start;
        unawaited(TelemetryEngine.instance.capture(
          eventName: 'mission_hydration', 
          durationMs: duration,
          recruitmentId: _activeRecruitment?.id,
        ));

        debugPrint("🔱 KNOWLEDGE INIT COMPLETE");
        if (filteredNodes.isEmpty) {
          debugPrint("🔱 KNOWLEDGE: NO NODES FOUND");
        }
        notifyListeners();
      });

      // 🔱 2. Subscribe to Progress Stream for real-time reactivity
      _progressSubscription = BackendProvider.adapter.progressStream()
        .handleError((e) {
          debugPrint("🔱 PROGRESS STREAM ERROR: $e");
        })
        .timeout(
          const Duration(seconds: 3),
          onTimeout: (sink) {
            debugPrint("🔱 PROGRESS STREAM TIMEOUT");
            sink.add([]);
          },
        )
        .listen((progressData) {
        // 🔱 Guard against stale async updates
        if (recruitment?.id != _activeRecruitment?.id) {
          debugPrint("🔱 KNOWLEDGE: Ignoring stale progress stream response.");
          return;
        }

        // 🔱 Type-Safety Debugging
        debugPrint('🔱 PROGRESS STREAM RECEIVED: Type = ${progressData.runtimeType}');

        final List<Map<String, dynamic>> progressMaps = 
            progressData.map((e) => Map<String, dynamic>.from(e as Map)).toList();

        final Map<String, UserProgress> newProgressMap = {
          for (var m in progressMaps) 
            m['nodeId']: UserProgress.fromMap(m)
        };
        
        // 🔱 Priority A: Identify Changed Nodes for Delta Update (O(K) lookup)
        final List<String> changedNodeIds = _identifyChanges(_userProgressMap, newProgressMap);
        
        _userProgressMap.clear();
        _userProgressMap.addAll(newProgressMap);

        if (changedNodeIds.isNotEmpty) {
          BenchmarkUtil.start('DeltaAggregation');
          _applyDeltaProgress(changedNodeIds);
          _refreshAnalytics(changedNodeIds: changedNodeIds);
          BenchmarkUtil.stop('DeltaAggregation');
          notifyListeners();
        } else if (!_isInitialized) {
          _tryRefresh();
        }
      });

      debugPrint("KnowledgeEngine: Live streams initiated.");
    } catch (e) {
      _isLoading = false;
      _isInitialized = false;
      debugPrint("KnowledgeEngine: Initialization Error - $e");
      notifyListeners();
    } finally {
      _isHydrating = false;
    }
  }

  /// 🔱 DELTA TRACKER
  List<String> _identifyChanges(Map<String, UserProgress> oldMap, Map<String, UserProgress> newMap) {
    final List<String> changed = [];

    newMap.forEach((nodeId, progress) {
      if (!oldMap.containsKey(nodeId) || oldMap[nodeId] != progress) {
        changed.add(nodeId);
      }
    });
    return changed;
  }

  void _tryRefresh() {
    if (_graph == null) return;
    BenchmarkUtil.start('FullAggregation');
    _applyProgressToStates();
    _refreshAnalytics(); // Global recompute on first load
    BenchmarkUtil.stop('FullAggregation');
    notifyListeners();
  }

  /// 🔱 DELTA AGGREGATION ENGINE (Priority A)
  /// O(K) complexity where K is the number of changed topics.
  void _applyDeltaProgress(List<String> changedNodeIds) {
    if (_graph == null) return;

    for (var nodeId in changedNodeIds) {
      final node = _graph!.getNode(nodeId);
      if (node == null) continue;

      final progress = _userProgressMap[nodeId] ?? UserProgress.empty(nodeId);

      // --- Delta Atomic Update ---
      for (final atomicId in node.atomicTopicIds) {
        final existingMastery = _atomicMasteryStates[atomicId];
        final accuracy = progress.battlesWon / (max(1, progress.battlesWon + progress.battlesLost));
        final retention = MasteryDecayEngine.calculateRetention(lastEvidenceAt: progress.lastReviewed);
        
        final double mastScore = MasteryEngine.calculateScore(
          assessmentEvidence: progress.assessmentEvidence > 0 ? progress.assessmentEvidence : accuracy,
          readingEvidence: progress.readingEvidence,
          revisionEvidence: progress.revisionEvidence,
          retention: retention,
          difficulty: node.difficulty / 5.0, // 🔱 Audit Fix: Dynamic node difficulty
        );

        _atomicMasteryStates[atomicId] = AtomicMasteryState(
          atomicTopicId: atomicId,
          score: mastScore * 100,
          confidence: MasteryEngine.calculateConfidence(
            evidenceCount: progress.battlesWon + progress.battlesLost, 
            lastEvidenceAt: progress.lastReviewed,
          ),
          status: MasteryEngine.determineState(mastScore * 100),
          trend: MasteryEngine.determineTrend(mastScore, (existingMastery?.score ?? 0) / 100),
          lastEvidenceAt: progress.lastReviewed,
          evidenceCount: progress.battlesWon + progress.battlesLost,
        );

        final existingCoverage = _atomicCoverageStates[atomicId];
        _atomicCoverageStates[atomicId] = CoverageEngine.calculateAtomic(
          atomicTopicId: atomicId,
          readingEvidence: progress.readingEvidence,
          assessmentEvidence: progress.assessmentEvidence > 0 ? progress.assessmentEvidence : accuracy,
          revisionEvidence: progress.revisionEvidence,
          previousState: existingCoverage,
        );
      }

      // --- Node Refresh ---
      final effectiveMastery = HierarchicalAggregationEngine.calculateMicroMastery(node.atomicTopicIds, _atomicMasteryStates);
      final existingState = _nodeStates[node.id];

      _nodeStates[node.id] = NodeRuntimeState(
        nodeId: node.id,
        mastery: effectiveMastery,
        completed: CompletionEngine.isCompleted(
          mastery: effectiveMastery, 
          factMastery: progress.factMastery, 
          revisionLevel: progress.revisionLevel,
          factCount: node.factCount, 
        ),
        activeBattle: existingState?.activeBattle ?? false,
        revisionLevel: progress.revisionLevel,
        battlesWon: progress.battlesWon,
        battlesLost: progress.battlesLost,
        totalStudyMinutes: existingState?.totalStudyMinutes ?? 0,
        lastStudiedAt: existingState?.lastStudiedAt,
        lastReviewed: progress.lastReviewed,
        assessmentEvidence: progress.assessmentEvidence,
        readingEvidence: progress.readingEvidence,
        revisionEvidence: progress.revisionEvidence,
        evidenceScore: progress.evidenceScore,
      );
    }
    debugPrint('🔱 DELTA AGGREGATION: ${changedNodeIds.length} nodes refreshed.');

    // 🔱 Update Hierarchical Maps (O(K))
    final nodes = changedNodeIds.map((id) => _graph!.getNode(id)).whereType<MicroTopicNode>().toList();
    final Map<String, double> microMastery = {for (var n in nodes) n.id: _nodeStates[n.id]?.mastery ?? 0.0};
    final Map<String, double> microCoverage = {
      for (var n in nodes) n.id: HierarchicalAggregationEngine.calculateMicroCoverage(n.atomicTopicIds, _atomicCoverageStates)
    };

    // Update global subject maps for the affected subjects
    _subjectMastery.addAll(HierarchicalAggregationEngine.aggregateToSubjectMastery(nodes, microMastery));
    _subjectCoverage.addAll(HierarchicalAggregationEngine.aggregateToSubjectCoverage(nodes, microCoverage));
  }

  void _applyProgressToStates() {
    if (_graph == null) return;
    final nodeIds = _graph!.allNodes.map((n) => n.id).toList();
    _applyDeltaProgress(nodeIds);
  }

  /// 🔱 DELTA ANALYTICS REFRESH
  /// Implements Priority A: Recalculates mission metrics only for affected topics.
  void _refreshAnalytics({List<String>? changedNodeIds}) {
    if (_graph == null) return;

    final nodes = _graph!.allNodes;

    // 🔱 1. Coverage Analytics (Document 34)
    _coverageState = CoverageEngine.calculate(
      examId: _activeRecruitment?.examId ?? 'UNSPECIFIED',
      nodes: nodes,
      states: _nodeStates,
      atomicStates: _atomicCoverageStates,
    );

    // 🔱 2. Risk Analytics (Document 35)
    // Only update atomic risks for changed nodes to maintain O(K)
    final targetNodes = changedNodeIds != null 
        ? changedNodeIds.map((id) => _graph!.getNode(id)).whereType<MicroTopicNode>().toList()
        : nodes;

    for (final node in targetNodes) {
      for (final atomicId in node.atomicTopicIds) {
        final mastery = _atomicMasteryStates[atomicId];
        final coverage = _atomicCoverageStates[atomicId];
        final progress = _userProgressMap[node.id] ?? UserProgress.empty(node.id);
        
        if (mastery == null || coverage == null) continue;

        _atomicRiskStates[atomicId] = RiskEngine.calculateAtomic(
          atomicTopicId: atomicId,
          coverage: coverage,
          mastery: mastery,
          assessmentWeakness: 1.0 - (progress.assessmentEvidence > 0 ? progress.assessmentEvidence : (progress.battlesWon / max(1, progress.battlesWon + progress.battlesLost))),
          recencyWeakness: MasteryDecayEngine.calculateRetention(lastEvidenceAt: mastery.lastEvidenceAt) < 0.5 ? 1.0 : 0.0,
          previousState: _atomicRiskStates[atomicId],
        );
      }
    }

    final globalCascadeRisk = _graph!.getGlobalCascadeRisk(_nodeStates);
    final avgAtomicRisk = _atomicRiskStates.isEmpty 
        ? 0.0 
        : _atomicRiskStates.values.fold(0.0, (sum, r) => sum + (r.score / 100)) / _atomicRiskStates.length;

    _riskState = RiskEngine.calculate(
      coverage: _coverageState!,
      atomicWeaknessRisk: avgAtomicRisk,
      cascadeRisk: globalCascadeRisk,
    );

    // 🔱 3. Momentum & Readiness
    _momentumState = MomentumEngine.calculate(
      nodes: nodes,
      states: _nodeStates,
    );

    final avgMastery = HierarchicalAggregationEngine.aggregateToMissionMastery(_subjectMastery);

    _readinessState = ReadinessEngine.calculate(
      coverage: _coverageState!,
      masteryPercent: avgMastery,
      assessmentPerformance: _calculateAvgAssessmentPerformance(),
      risk: _riskState!,
      previousState: _readinessState,
    );

    // 🔱 4. Forecasting (Document 32)
    _successProbability = ForecastingEngine.calculateSuccessProbability(
      readiness: _readinessState!, 
      risk: _riskState!, 
      examDifficulty: _activeRecruitment?.examDifficulty ?? 0.6,
    );
  }

  double _calculateAvgAssessmentPerformance() {
    double totalWins = 0;
    double totalBattles = 0;
    _userProgressMap.forEach((nodeId, p) {
      totalWins += p.battlesWon;
      totalBattles += (p.battlesWon + p.battlesLost);
    });
    return totalBattles == 0 ? 0.0 : totalWins / totalBattles;
  }

  @override
  void dispose() {
    _progressSubscription?.cancel();
    _nodeSubscription?.cancel();
    super.dispose();
  }

  // ===================================================
  // DATA ACCESS 🔱
  // ===================================================

  List<MicroTopicNode> get allNodes => _graph?.allNodes ?? [];

  /// 🔱 READING FEEDBACK LOOP (Audit Fix Hardened)
  /// Implements "Reading -> Mastery" constitutional feedback with physical evidence.
  Future<void> recordReadingCompletion({
    required String nodeId,
    double dwellTimeMinutes = 0.0,
    double scrollDepthPercent = 0.0,
  }) async {
    if (!_isInitialized) return;
    
    // 🔱 EVIDENCE LAW (Article 7)
    // Evidence is only valid if it meets the physical ingestion thresholds.
    // Minimum 2 minutes of dwell time and 70% scroll depth for full evidence.
    double physicalEvidence = 0.0;
    if (dwellTimeMinutes >= 2.0 && scrollDepthPercent >= 0.70) {
      physicalEvidence = 1.0;
    } else if (dwellTimeMinutes >= 0.5) {
      physicalEvidence = 0.4; // Partial ingestion
    }

    if (physicalEvidence == 0.0) {
      debugPrint('🔱 KNOWLEDGE: Ingestion failed. Evidence below physical threshold.');
      return;
    }

    await BackendProvider.adapter.updateProgress(
      nodeId: nodeId,
      data: {
        'readingEvidence': physicalEvidence,
        'revisionLevel': 1,
        'lastReviewed': DateTime.now().toIso8601String(),
        'totalStudyMinutes': dwellTimeMinutes, // 🔱 Audit Fix: Precision restored
      },
    );
    
    debugPrint('🔱 KNOWLEDGE: Reading evidence ($physicalEvidence) recorded for $nodeId.');
  }

  MicroTopicNode? getNode(String id) => _graph?.getNode(id);
  NodeRuntimeState? getState(String nodeId) => _nodeStates[nodeId];
  AtomicMasteryState? getAtomicMastery(String atomicId) => _atomicMasteryStates[atomicId];
  AtomicCoverageState? getAtomicCoverage(String atomicId) => _atomicCoverageStates[atomicId];
  AtomicRiskState? getAtomicRisk(String atomicId) => _atomicRiskStates[atomicId];
  
  double getSubjectMastery(String subjectId) => _subjectMastery[subjectId] ?? 0.0;
  double getSubjectCoverage(String subjectId) => _subjectCoverage[subjectId] ?? 0.0;

  List<MicroTopicNode> getRecommendations({int limit = 5}) {
    return _graph?.getAdaptiveRecommendations(_nodeStates, limit: limit) ?? [];
  }

  // ===================================================
  // STRESS TEST HOOKS 🔱
  // ===================================================

  /// Manually injects a massive dataset for benchmarking.
  Future<void> loadStressData({
    required Recruitment recruitment,
    required List<MicroTopicNode> nodes,
    required List<UserProgress> progress,
  }) async {
    _isLoading = true;
    _activeRecruitment = recruitment;
    _graph = KnowledgeGraph(nodes);
    
    _userProgressMap.clear();
    for (var p in progress) {
      _userProgressMap[p.nodeId] = p;
    }

    _isInitialized = true;
    
    _tryRefresh();
    _isLoading = false;
    notifyListeners();
  }

  /// Manually triggers a delta refresh for specific nodes.
  /// Physically exposes O(K) path for benchmarking.
  void applyDeltaProgressForBenchmark(List<String> changedNodeIds) {
    if (!_isInitialized || _graph == null) return;
    _applyDeltaProgress(changedNodeIds);
    _refreshAnalytics();
    notifyListeners();
  }

  /// Resets the engine state completely to prevent singleton pollution.
  Future<void> clearForTest() async {
    await _progressSubscription?.cancel();
    await _nodeSubscription?.cancel();

    _progressSubscription = null;
    _nodeSubscription = null;

    _graph = null;
    _isLoading = false;
    _isHydrating = false;
    _isInitialized = false;
    
    _activeRecruitment = null;
    _userProgressMap.clear();
    _nodeStates.clear();
    _atomicMasteryStates.clear();
    _atomicCoverageStates.clear();
    _atomicRiskStates.clear();
    
    _coverageState = null;
    _riskState = null;
    _momentumState = null;
    _readinessState = null;

    _subjectMastery.clear();
    _subjectCoverage.clear();
    
    notifyListeners();
  }
}
