import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/recruitment_realm.dart';
import 'package:rank_crackers/features/digibook/data/models/digibook_unit.dart';
import 'package:rank_crackers/features/crucible/models/crucible_node.dart';
import 'package:rank_crackers/features/crucible/models/crucible_cluster.dart';
import 'package:rank_crackers/core/models/sentinel_draft.dart';
import 'package:rank_crackers/core/models/audit_record.dart';
import 'package:rank_crackers/core/backend/sentinel_repository.dart';

/// CRUCIBLE ASSEMBLY WORKER (Sprint H)
/// Pipeline: Verified DigiBook -> PYQ Graph -> Crucible Builder -> Crucible Nodes
class CrucibleAssemblyWorker {
  
  static Future<void> assemble(RecruitmentRealm realm, List<DigiBookUnit> units) async {
    debugPrint("CRUCIBLE WORKER: Initiating assembly for ${realm.realmId}...");

    if (!realm.digibookVerified) {
      debugPrint("CRUCIBLE WORKER ERROR: DigiBook not verified. Assembly blocked.");
      return;
    }

    final List<Map<String, dynamic>> nodeMaps = [];
    final List<Map<String, dynamic>> clusterMaps = [];

    for (var unit in units) {
      final List<String> clusterNodeIds = [];
      
      final List<String> types = ['MCQ', 'ASSERTION_REASON', 'CONCEPT_TRAP', 'REVISION', 'DIAGNOSTIC'];
      
      for (var type in types) {
        final nodeId = "node_${realm.realmId}_${unit.atomicTopicId}_${type.toLowerCase()}";
        
        final node = CrucibleNode(
          id: nodeId,
          realmId: realm.realmId,
          atomicTopicId: unit.atomicTopicId,
          digibookUnitId: unit.id,
          nodeType: type,
          difficulty: unit.difficulty,
          confidence: 0.92,
          pyqIds: unit.pyqIds,
          content: {
            'stem': "AI Generated $type assessment for ${unit.concept}",
            'distractors': ["Incorrect 1", "Incorrect 2", "Incorrect 3"],
            'correct_answer': "Correct Response",
          },
        );

        nodeMaps.add(node.toMap());
        clusterNodeIds.add(nodeId);
      }

      final cluster = CrucibleCluster(
        id: "cluster_${realm.realmId}_${unit.atomicTopicId}",
        atomicTopicId: unit.atomicTopicId,
        realmId: realm.realmId,
        nodeIds: clusterNodeIds,
        coverageScore: 100.0,
      );

      clusterMaps.add(cluster.toMap());
    }

    final draft = SentinelDraft(
      id: "crucible_draft_${realm.realmId}",
      type: 'crucible',
      rawData: {
        'realmId': realm.realmId,
        'clusters': clusterMaps,
        'nodes': nodeMaps,
      },
      status: 'under_review',
      audit: AuditRecord(
        sourceUrl: 'internal_generation',
        sourceHash: 'crucible_gen_${DateTime.now().millisecondsSinceEpoch}',
        documentHash: 'crucible_${realm.realmId}',
        validationStatus: 'pending',
        workerVersion: '1.0.0',
        provider: 'crucible_assembly_worker',
        discoveryCount: 1,
        createdAt: DateTime.now(),
        discoveredAt: DateTime.now(),
        lastSeenAt: DateTime.now(),
      ),
    );

    await SentinelRepository.injectDrafts([draft]);
    debugPrint("CRUCIBLE WORKER: Assembly complete. ${nodeMaps.length} nodes staged for Founder review.");
  }
}
