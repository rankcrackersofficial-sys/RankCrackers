import 'package:equatable/equatable.dart';
import 'recruitment.dart';
import 'exam_blueprint.dart';
import 'node_runtime_state.dart';
import '../knowledge/knowledge_graph.dart';
import 'coverage_state.dart';
import 'risk_state.dart';
import 'momentum_state.dart';

/// MISSION CONTEXT
/// Represents the total strategic situation of a warrior's mission.
/// Combines identity, technical rules, knowledge structure, and performance metrics.
class MissionContext extends Equatable {
  final Recruitment recruitment;
  final ExamBlueprint blueprint;
  final KnowledgeGraph graph;
  final Map<String, NodeRuntimeState> states;
  final CoverageState coverage;
  final RiskState risk;
  final MomentumState momentum;

  const MissionContext({
    required this.recruitment,
    required this.blueprint,
    required this.graph,
    required this.states,
    required this.coverage,
    required this.risk,
    required this.momentum,
  });

  @override
  List<Object?> get props => [
    recruitment,
    blueprint,
    // OPTIMIZATION: Exclude heavy KnowledgeGraph from value-equality 
    // to prevent unnecessary rebuilds. Identity and state are enough.
    states,
    coverage,
    risk,
    momentum,
  ];
}
