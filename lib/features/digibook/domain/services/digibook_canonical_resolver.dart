import 'package:flutter/foundation.dart';
import '../models/digibook_launch_args.dart';
import 'digibook_canonical_bridge_service.dart';

/// DIGIBOOK RESOLUTION STATUS
/// Internal typed resolution states for deterministic launch authority.
enum DigiBookResolutionStatus {
  exact,
  notFound,
  ambiguous,
}

/// DIGIBOOK RESOLUTION RESULT
/// Detailed typed resolution outcome with fail-closed ambiguity protection.
class DigiBookResolutionResult {
  final DigiBookResolutionStatus status;
  final DigiBookLaunchArgs? args;
  final String? diagnosticMessage;

  const DigiBookResolutionResult({
    required this.status,
    this.args,
    this.diagnosticMessage,
  });

  bool get isExact => status == DigiBookResolutionStatus.exact && args != null;
  bool get isAmbiguous => status == DigiBookResolutionStatus.ambiguous;
  bool get isNotFound => status == DigiBookResolutionStatus.notFound;
}

/// DIGIBOOK CANONICAL RESOLVER
/// Single deterministic resolver boundary for typed lesson launch.
/// Validates identity, binds canonical node and generation unit,
/// and enforces fail-closed protection against multi-lesson ambiguity.
class DigiBookCanonicalResolver {
  const DigiBookCanonicalResolver._();

  /// Resolve canonical launch arguments from a Generation Unit ID.
  /// Requires explicit canonicalNodeId and missionScopeId authority context.
  static Future<DigiBookLaunchArgs?> resolveFromGuId(
    String guId, {
    required String expectedCanonicalNodeId,
    required String expectedMissionScopeId,
  }) async {
    final cleanId = guId.trim();
    if (cleanId.isEmpty) return null;

    final bridge = DigiBookCanonicalBridgeService.instance;
    if (!bridge.isInitialized) await bridge.initialize();

    final entry = bridge.getEntryByGuId(cleanId);
    if (entry == null) {
      debugPrint('DIGIBOOK RESOLVER: Unknown GU ID $cleanId - fail closed');
      return null;
    }

    return bridge.buildLaunchArgs(
      entry.guId,
    );
  }

  /// Detailed typed resolution from a Canonical Node ID.
  /// Strictly prevents entries.first fallback when multiple lessons match.
  static Future<DigiBookResolutionResult> resolveNodeDetailed(
    String nodeId, {
    required String expectedMissionScopeId,
  }) async {
    final cleanId = nodeId.trim();
    if (cleanId.isEmpty) {
      return const DigiBookResolutionResult(
        status: DigiBookResolutionStatus.notFound,
        diagnosticMessage: 'Node ID is empty',
      );
    }

    final bridge = DigiBookCanonicalBridgeService.instance;
    if (!bridge.isInitialized) await bridge.initialize();

    final result = bridge.resolveCanonicalNode(cleanId);
    if (!result.isMapped || result.entries.isEmpty) {
      debugPrint('DIGIBOOK RESOLVER: Unmapped node ID $cleanId - fail closed');
      return DigiBookResolutionResult(
        status: DigiBookResolutionStatus.notFound,
        diagnosticMessage: 'Unmapped node ID: $cleanId',
      );
    }

    // Strict Ambiguity Law: multiple lessons without an explicit governed selector FAIL CLOSED
    if (result.entries.length > 1) {
      debugPrint(
          'DIGIBOOK RESOLVER: Ambiguous canonical node $cleanId maps to ${result.entries.length} lessons without explicit selector - fail closed');
      return DigiBookResolutionResult(
        status: DigiBookResolutionStatus.ambiguous,
        diagnosticMessage:
            'Canonical node $cleanId maps to ${result.entries.length} lessons without explicit selector',
      );
    }

    // Exactly one lesson mapped: resolve deterministically
    final entry = result.entries.first;
    final args = await bridge.buildLaunchArgs(
      entry.guId,
    );
    if (args == null) {
      return DigiBookResolutionResult(
        status: DigiBookResolutionStatus.notFound,
        diagnosticMessage: 'Could not build launch args for ${entry.guId}',
      );
    }

    return DigiBookResolutionResult(
      status: DigiBookResolutionStatus.exact,
      args: args,
    );
  }

  /// Resolve canonical launch arguments from a Canonical Node ID.
  /// Returns null if not found or if ambiguous (fail-closed).
  static Future<DigiBookLaunchArgs?> resolveFromNodeId(
    String nodeId, {
    required String expectedMissionScopeId,
  }) async {
    final detailed = await resolveNodeDetailed(
      nodeId,
      expectedMissionScopeId: expectedMissionScopeId,
    );
    return detailed.args;
  }

  /// Validates a typed DigiBookLaunchArgs instance
  static bool validateLaunchArgs(DigiBookLaunchArgs args) {
    if (args.generationUnitId.trim().isEmpty) return false;
    if (args.canonicalNodeId.trim().isEmpty) return false;
    if (args.revisionId.trim().isEmpty) return false;

    final bridge = DigiBookCanonicalBridgeService.instance;
    final entry = bridge.getEntryByGuId(args.generationUnitId);
    if (entry == null) return false;

    return entry.canonicalNodeId == args.canonicalNodeId;
  }
}
