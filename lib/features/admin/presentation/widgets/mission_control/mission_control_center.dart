import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/web/founder/theme/founder_light_theme.dart';
import 'mission_creation_center.dart';
import '../../../../../web/founder/mission_control/founder_mission_inventory.dart';

/// MISSION CONTROL CENTER (Founder Operations Console v6.0)
/// Compact Operational Stream for Mission Lifecycle & Discovery Management.
class MissionControlCenter extends StatefulWidget {
  const MissionControlCenter({super.key, this.onMissionSelected});

  final ValueChanged<String>? onMissionSelected;

  @override
  State<MissionControlCenter> createState() => _MissionControlCenterState();
}

class _MissionControlCenterState extends State<MissionControlCenter> {
  int _activeViewTab = 0; // 0: Mission Inventory, 1: Official Updates Placeholder
  bool _showCreateDraftPanel = false;

  JurisdictionFilter _selectedJurisdiction = JurisdictionFilter.all;
  String? _selectedStateCode;

  void _selectJurisdictionShortcut(JurisdictionFilter filter, [String? stateCode]) {
    setState(() {
      _selectedJurisdiction = filter;
      _selectedStateCode = stateCode;
      _activeViewTab = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: FounderLightTheme.bg,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 60),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // COMPACT OPERATIONAL HEADER & NAVIGATION TOOLBAR
            _buildTopHeaderAndNav(),

            // JURISDICTION QUICK SUMMARY CARDS
            if (_activeViewTab == 0) _buildJurisdictionSummarySection(),

            // COLLAPSIBLE MISSION CREATION CENTER (Secondary Governed Block)
            if (_showCreateDraftPanel) ...[
              _buildCollapsibleCreatePanel(),
              const SizedBox(height: 16),
            ],

            // TAB 0: MISSION INVENTORY VIEW
            if (_activeViewTab == 0) ...[
              // UNLINKED DISCOVERY ASSETS BAR (Secondary Queue - Read-Only Legacy Records)
              const _UnlinkedDiscoveryAssetsSection(),

              const SizedBox(height: 12),

              // CORE MISSION INVENTORY GRID VIEW
              FounderMissionInventory(
                onMissionSelected: widget.onMissionSelected,
                initialJurisdiction: _selectedJurisdiction,
                initialStateCode: _selectedStateCode,
              ),
            ],

            // TAB 1: OFFICIAL UPDATES PLACEHOLDER VIEW
            if (_activeViewTab == 1) _buildOfficialUpdatesPlaceholder(),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // COMPACT OPERATIONAL HEADER & NAVIGATION TOOLBAR
  // ===========================================================================
  Widget _buildTopHeaderAndNav() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
      decoration: const BoxDecoration(
        color: FounderLightTheme.surface,
        border: Border(bottom: BorderSide(color: FounderLightTheme.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'MISSION CONTROL',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: FounderLightTheme.primaryDark,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Strategic management of Exam Realms, Discovery Assets, and Official Sources.',
                    style: TextStyle(
                      fontSize: 12,
                      color: FounderLightTheme.textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),

              // Action Button: Toggle Collapsible Create Panel
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _showCreateDraftPanel = !_showCreateDraftPanel;
                  });
                },
                icon: Icon(
                  _showCreateDraftPanel
                      ? Icons.close_rounded
                      : Icons.add_rounded,
                  size: 16,
                ),
                label: Text(
                  _showCreateDraftPanel
                      ? 'CLOSE CREATION FORM'
                      : '+ CREATE MISSION DRAFT',
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _showCreateDraftPanel
                      ? FounderLightTheme.surfaceHover
                      : FounderLightTheme.primaryDark,
                  foregroundColor: _showCreateDraftPanel
                      ? FounderLightTheme.textPrimary
                      : Colors.white,
                  elevation: 0,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Primary View Tabs Bar
          Row(
            children: [
              _buildNavTab(
                index: 0,
                label: 'MISSION INVENTORY',
                icon: Icons.grid_view_rounded,
              ),
              const SizedBox(width: 8),
              _buildNavTab(
                index: 1,
                label: 'OFFICIAL UPDATES',
                icon: Icons.radar_rounded,
                badge: 'PENDING CONNECT',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNavTab({
    required int index,
    required String label,
    required IconData icon,
    String? badge,
  }) {
    final bool isSelected = _activeViewTab == index;
    return InkWell(
      onTap: () => setState(() => _activeViewTab = index),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? FounderLightTheme.surfaceAlt
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected
                ? FounderLightTheme.primaryBlue
                : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected
                  ? FounderLightTheme.primaryBlue
                  : FounderLightTheme.textMuted,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected
                    ? FounderLightTheme.primaryDark
                    : FounderLightTheme.textMuted,
              ),
            ),
            if (badge != null) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: FounderLightTheme.infoBg,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  badge,
                  style: const TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.w700,
                    color: FounderLightTheme.info,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // JURISDICTION QUICK SUMMARY CARDS
  // ===========================================================================
  Widget _buildJurisdictionSummarySection() {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _jurisdictionQuickChip('ALL MISSIONS', JurisdictionFilter.all, null),
              const SizedBox(width: 8),
              _jurisdictionQuickChip('CENTRAL AUTHORITIES', JurisdictionFilter.central, null),
              const SizedBox(width: 8),
              _jurisdictionQuickChip('RAJASTHAN (RJ)', JurisdictionFilter.state, 'RJ'),
              const SizedBox(width: 8),
              _jurisdictionQuickChip('DELHI (UT · DL)', JurisdictionFilter.ut, 'DL'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _jurisdictionQuickChip(
      String label, JurisdictionFilter filter, String? stateCode) {
    final bool isSelected = _selectedJurisdiction == filter &&
        _selectedStateCode == stateCode;

    return InkWell(
      onTap: () => _selectJurisdictionShortcut(filter, stateCode),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? FounderLightTheme.primaryDark
              : FounderLightTheme.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected
                ? FounderLightTheme.primaryDark
                : FounderLightTheme.border,
          ),
          boxShadow: isSelected ? FounderLightTheme.softShadow : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : FounderLightTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  // ===========================================================================
  // COLLAPSIBLE CREATION PANEL
  // ===========================================================================
  Widget _buildCollapsibleCreatePanel() {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 8, 24, 8),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: FounderLightTheme.gold.withValues(alpha: 0.4), width: 1.5),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: const BoxDecoration(
              color: FounderLightTheme.goldLight,
              borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: Row(
              children: [
                const Icon(Icons.add_circle_outline_rounded,
                    color: FounderLightTheme.gold, size: 18),
                const SizedBox(width: 10),
                const Text(
                  'CREATE NEW MISSION DRAFT',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: FounderLightTheme.gold,
                    letterSpacing: 1.0,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      size: 16, color: FounderLightTheme.gold),
                  onPressed: () =>
                      setState(() => _showCreateDraftPanel = false),
                  tooltip: 'Close creation form',
                ),
              ],
            ),
          ),
          const MissionCreationCenter(),
        ],
      ),
    );
  }

  // ===========================================================================
  // OFFICIAL UPDATES PLACEHOLDER VIEW
  // ===========================================================================
  Widget _buildOfficialUpdatesPlaceholder() {
    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: FounderLightTheme.border),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: FounderLightTheme.primaryBlueLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.radar_rounded,
              size: 40,
              color: FounderLightTheme.primaryBlue,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'OFFICIAL AUTHORITY INTELLIGENCE STREAM',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: FounderLightTheme.primaryDark,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            constraints: const BoxConstraints(maxWidth: 580),
            child: const Text(
              'Official Authority Intelligence connection pending backend contract.\n\nOnce activated, governed official sources from Central, State, and UT authorities will automatically surface verified candidate notices, syllabus revisions, and corrigenda here for Founder review before mission creation.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: FounderLightTheme.textSecondary,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: FounderLightTheme.surfaceAlt,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: FounderLightTheme.border),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock_clock_rounded,
                    size: 16, color: FounderLightTheme.textMuted),
                SizedBox(width: 8),
                Text(
                  'STATUS: DORMANT · AWAITING BACKEND B5 CONTRACT BINDING',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: FounderLightTheme.textMuted,
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// UNLINKED DISCOVERY ASSETS SECTION (READ-ONLY LEGACY RECORDS)
// =============================================================================
class _UnlinkedDiscoveryAssetsSection extends StatelessWidget {
  const _UnlinkedDiscoveryAssetsSection();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('recruitments')
          .where('status', isEqualTo: 'review')
          .snapshots(),
      builder: (context, snapshot) {
        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) return const SizedBox.shrink();

        return Container(
          margin: const EdgeInsets.fromLTRB(24, 12, 24, 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: FounderLightTheme.infoBg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: FounderLightTheme.info.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.auto_awesome_motion_rounded,
                      color: FounderLightTheme.info, size: 18),
                  const SizedBox(width: 10),
                  Text(
                    'LEGACY DISCOVERY ASSETS (${docs.length} READ-ONLY RECORDS)',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: FounderLightTheme.info,
                      letterSpacing: 1.0,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Column(
                children: docs.map((doc) {
                  final data = doc.data() as Map<String, dynamic>;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _MissionCandidateTile(data: data, id: doc.id),
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MissionCandidateTile extends StatelessWidget {
  final Map<String, dynamic> data;
  final String id;
  const _MissionCandidateTile({required this.data, required this.id});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: FounderLightTheme.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data['title'] ?? 'Unknown Discovery Asset',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: FounderLightTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  "ORG: ${data['org'] ?? '—'}  •  YEAR: ${data['year'] ?? '—'}  •  ID: $id",
                  style: const TextStyle(
                    fontSize: 10,
                    color: FounderLightTheme.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: FounderLightTheme.surfaceAlt,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: FounderLightTheme.border),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock_outline_rounded,
                    size: 12, color: FounderLightTheme.textMuted),
                SizedBox(width: 6),
                Text(
                  'LEGACY ASSET · READ-ONLY',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: FounderLightTheme.textMuted,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
