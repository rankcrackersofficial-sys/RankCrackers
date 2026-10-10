/// Counters for the Founder mission inventory.
///
/// The inventory is intentionally derived from one iterable of canonical
/// `mission_realms` records.  No legacy projection, student catalog, or
/// independent count query may contribute to these values.
enum MissionJurisdictionBucket { central, state, ut, unclassified }

class MissionInventorySummary {
  const MissionInventorySummary({
    required this.total,
    required this.central,
    required this.state,
    required this.ut,
    required this.unclassified,
  });

  final int total;
  final int central;
  final int state;
  final int ut;
  final int unclassified;

  int get classified => central + state + ut;

  /// The four scope buckets are exhaustive, so this must always be true.
  bool get isConsistent => total == classified + unclassified;

  factory MissionInventorySummary.fromRealms(
    Iterable<Map<String, dynamic>> realms,
  ) {
    var central = 0;
    var state = 0;
    var ut = 0;
    var unclassified = 0;

    for (final realm in realms) {
      switch (missionJurisdictionBucket(realm)) {
        case MissionJurisdictionBucket.central:
          central++;
        case MissionJurisdictionBucket.state:
          state++;
        case MissionJurisdictionBucket.ut:
          ut++;
        case MissionJurisdictionBucket.unclassified:
          unclassified++;
      }
    }

    final summary = MissionInventorySummary(
      total: central + state + ut + unclassified,
      central: central,
      state: state,
      ut: ut,
      unclassified: unclassified,
    );
    if (!summary.isConsistent) {
      throw StateError('MISSION_INVENTORY_SCOPE_COUNT_MISMATCH');
    }
    return summary;
  }
}

MissionJurisdictionBucket missionJurisdictionBucket(
  Map<String, dynamic> realm,
) {
  final hierarchy = realm['hierarchyPlacement'];
  final hierarchyMap = hierarchy is Map
      ? Map<String, dynamic>.from(hierarchy)
      : const <String, dynamic>{};
  final rawJurisdiction =
      (realm['jurisdictionLevel'] ??
              realm['jurisdictionType'] ??
              realm['jurisdiction'] ??
              hierarchyMap['jurisdiction'])
          ?.toString()
          .trim()
          .toUpperCase();

  if (rawJurisdiction == 'CENTRAL' ||
      rawJurisdiction == 'NATIONAL' ||
      rawJurisdiction == 'UNION') {
    return MissionJurisdictionBucket.central;
  }
  if (rawJurisdiction == 'UT' ||
      rawJurisdiction == 'UNION_TERRITORY' ||
      rawJurisdiction == 'UNION TERRITORY') {
    return MissionJurisdictionBucket.ut;
  }
  if (rawJurisdiction == 'STATE') return MissionJurisdictionBucket.state;

  final stateCode =
      (realm['stateCode'] ?? realm['regionCode'] ?? hierarchyMap['stateCode'])
          ?.toString()
          .trim()
          .toUpperCase();
  const utCodes = {'AN', 'CH', 'DN', 'DL', 'JK', 'LA', 'LD', 'PY'};
  if (stateCode != null && stateCode.isNotEmpty) {
    return utCodes.contains(stateCode)
        ? MissionJurisdictionBucket.ut
        : MissionJurisdictionBucket.state;
  }

  return MissionJurisdictionBucket.unclassified;
}
