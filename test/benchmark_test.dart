import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine.dart';
import 'package:rank_crackers/core/models/recruitment.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';
import 'package:rank_crackers/features/progress/data/models/user_progress.dart';
import 'package:rank_crackers/core/engines/stress_test_engine.dart';
import 'package:rank_crackers/core/utils/benchmark_util.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  group('🔱 PHASE 6.2: PRODUCTION STRESS BENCHMARKS', () {
    final engine = KnowledgeEngine.instance;

    setUp(() {
      engine.clearForTest();
    });

    Future<void> runStage({required int nodeCount, required int atomsPerNode}) async {
      final label = '${nodeCount}Nodes_${atomsPerNode}Atoms';
      print('\n--- $label ---');

      final dataset = StressTestEngine.generateDataset(
        nodeCount: nodeCount, 
        atomsPerNode: atomsPerNode,
      );
      final nodes = dataset['nodes'] as List<MicroTopicNode>;
      final recruitment = dataset['recruitment'] as Recruitment;
      
      final progress = nodes.map((n) => UserProgress.empty(n.id).copyWith(
        mastery: 0.5,
        battlesWon: 5,
        battlesLost: 5,
        lastReviewed: DateTime.now(),
      )).toList();

      // 🔱 1. Hydration Benchmark
      BenchmarkUtil.start('Hydration_$label');
      await engine.loadStressData(
        recruitment: recruitment, 
        nodes: nodes, 
        progress: progress,
      );
      BenchmarkUtil.stop('Hydration_$label');

      // 🔱 2. Verify Atomic Integrity (Triad Verification)
      final totalAtoms = nodeCount * atomsPerNode;
      expect(engine.allNodes.length, nodeCount);
      expect(engine.atomicMasteryStates.length, totalAtoms);
      expect(engine.atomicCoverageStates.length, totalAtoms);
      expect(engine.atomicRiskStates.length, totalAtoms);
      expect(engine.readinessState, isNotNull);

      // 🔱 3. Delta Aggregation Benchmark O(K)
      final targetNodeId = nodes[nodeCount ~/ 2].id;
      final updatedProgress = progress[nodeCount ~/ 2].copyWith(
        battlesWon: 10,
        mastery: 0.9,
      );
      
      // Update local progress list for the engine
      engine.userProgress[nodeCount ~/ 2] = updatedProgress;

      BenchmarkUtil.start('DeltaAgg_1Node_$label');
      engine.applyDeltaProgressForBenchmark([targetNodeId]);
      BenchmarkUtil.stop('DeltaAgg_1Node_$label');

      print('✅ $label: Verified.');
      print('Nodes: ${engine.allNodes.length}');
      print('Atomic States: ${engine.atomicMasteryStates.length}');
      print('Readiness Score: ${engine.readinessState?.score.toStringAsFixed(2)}%');
    }

    test('Stage A: 100 Nodes (1000 Atoms)', () async {
      await runStage(nodeCount: 100, atomsPerNode: 10);
    });

    test('Stage B: 500 Nodes (5000 Atoms)', () async {
      await runStage(nodeCount: 500, atomsPerNode: 10);
    });

    test('Stage C: 1000 Nodes (10000 Atoms)', () async {
      await runStage(nodeCount: 1000, atomsPerNode: 10);
    });
  });
}
