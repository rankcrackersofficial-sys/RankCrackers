import '../models/sentinel_draft.dart';
import '../models/audit_record.dart';

/// SENTINEL SEED ENGINE
/// Generates canonical seed data for the Draft Zone.
class SentinelSeedEngine {
  
  static List<SentinelDraft> generateCanonicalSeeds() {
    return [
      _punjabDraft(),
      _ugcNetDraft(),
    ];
  }

  static SentinelDraft _punjabDraft() {
    final now = DateTime.now();
    return SentinelDraft(
      id: 'draft_punjab_2024_01',
      type: 'recruitment',
      rawData: {
        'id': 'punjab_sl_math_24',
        'title': 'Punjab School Lecturer (Mathematics)',
        'state': 'Punjab',
        'examCategory': 'competitive',
        'year': 2024,
        'examBlueprintId': 'bp_punjab_150',
      },
      audit: AuditRecord(
        sourceUrl: 'https://educationrecruitmentboard.com/notifications/2024/sl_math.pdf',
        sourceHash: 'sha256:canonical_punjab_v1',
        documentHash: 'sha256:content_punjab_v1',
        createdAt: now,
        discoveredAt: now.subtract(const Duration(days: 2)),
        lastSeenAt: now,
        discoveryCount: 1,
        contentVersion: 1,
        workerVersion: '1.2.0',
        provider: 'seed',
        validationStatus: 'pending',
      ),
      status: 'draft',
    );
  }

  static SentinelDraft _ugcNetDraft() {
    final now = DateTime.now();
    return SentinelDraft(
      id: 'draft_ugc_net_2024_06',
      type: 'recruitment',
      rawData: {
        'id': 'ugc_net_june_24',
        'title': 'UGC NET June 2024',
        'state': 'central',
        'examCategory': 'qualifying',
        'year': 2024,
        'examBlueprintId': 'bp_ugc_paper1',
      },
      audit: AuditRecord(
        sourceUrl: 'https://nta.ac.in/ugcnet/notifications/june2024.pdf',
        sourceHash: 'sha256:canonical_ugc_v1',
        documentHash: 'sha256:content_ugc_v1',
        createdAt: now,
        discoveredAt: now.subtract(const Duration(days: 1)),
        lastSeenAt: now,
        discoveryCount: 1,
        contentVersion: 1,
        workerVersion: '1.2.0',
        provider: 'seed',
        validationStatus: 'pending',
      ),
      status: 'draft',
    );
  }
}
