import 'package:flutter/material.dart';
import '../../../domain/models/digibook_launch_args.dart';
import 'interactive_venn_set_diagram.dart';
import 'interactive_apparatus_measurement_visual.dart';
import 'interactive_bohr_atom_model_visual.dart';

/// DIGIBOOK VISUAL REGISTRY
/// Canonical dispatcher mapping Generation Units and Canonical Nodes to their
/// governed educational visual & interactive components.
class DigiBookVisualRegistry {
  /// Resolves the governed visual for a lesson.
  /// Returns null if VISUAL_NOT_APPLICABLE.
  static Widget? resolveVisual(DigiBookLaunchArgs args) {
    final guId = args.generationUnitId.toUpperCase();
    final canonicalNodeId = args.canonicalNodeId.toUpperCase();
    final topic = args.topicTitle.toLowerCase();
    final subject = args.subject.toLowerCase();

    // 1. Mathematics Canary: Sets and their representations
    if (guId == 'GU_JEEMAIN2027_MAT_9BB8FB46' ||
        canonicalNodeId.contains('MAT_U01') ||
        topic.contains('set')) {
      return const InteractiveVennSetDiagram();
    }

    // 2. Physics Canary: Units and Measurements / SI Units
    if (guId == 'GU_JEEMAIN2027_PHY_54665F87' ||
        canonicalNodeId.contains('PHY_U01') ||
        topic.contains('unit') ||
        topic.contains('measurement') ||
        topic.contains('dimension')) {
      return const InteractiveApparatusMeasurementVisual();
    }

    // 3. Chemistry Canary: Structure of Atom / Atomic Theory
    if (guId.contains('CHE_910B0B49') ||
        guId.contains('CHE_1DF8039E') ||
        canonicalNodeId.contains('CHE_U01') ||
        canonicalNodeId.contains('CHE_U02') ||
        topic.contains('atom') ||
        topic.contains('concept') ||
        topic.contains('matter')) {
      return const InteractiveBohrAtomModelVisual();
    }

    // Fallback for other Physics lessons: Apparatus Measurement Visual
    if (subject == 'physics') {
      return const InteractiveApparatusMeasurementVisual();
    }

    // Fallback for other Chemistry lessons: Bohr Atom Model Visual
    if (subject == 'chemistry') {
      return const InteractiveBohrAtomModelVisual();
    }

    // Fallback for other Mathematics lessons: Venn Set Diagram
    if (subject == 'mathematics') {
      return const InteractiveVennSetDiagram();
    }

    return null;
  }
}
