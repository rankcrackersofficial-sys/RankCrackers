import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import 'package:rank_crackers/shared/widgets/tactical_button.dart';

/// MISSION CREATION CENTER (Founder-Centric v3.0 - Triple Validation)
/// Law: (Name + Org + Year) match = Valid Mission Identity
class MissionCreationCenter extends StatefulWidget {
  const MissionCreationCenter({super.key});

  @override
  State<MissionCreationCenter> createState() => _MissionCreationCenterState();
}

class _MissionCreationCenterState extends State<MissionCreationCenter> {
  String? selectedNotificationId;
  String? selectedSyllabusId;
  String nature = 'PASSIVE';
  bool isLaunching = false;

  Map<String, dynamic>? selectedNotificationData;
  Map<String, dynamic>? selectedSyllabusData;

  @override
  Widget build(BuildContext context) {
    final notifMeta = _getMetadata(selectedNotificationData);
    final syllabusMeta = _getMetadata(selectedSyllabusData);

    final bool examMatch = notifMeta['name']?.isNotEmpty == true && 
                          notifMeta['name']?.toLowerCase() == syllabusMeta['name']?.toLowerCase();
    final bool orgMatch = notifMeta['org']?.isNotEmpty == true && 
                         notifMeta['org']?.toLowerCase() == syllabusMeta['org']?.toLowerCase();
    final bool yearMatch = notifMeta['year']?.isNotEmpty == true && 
                          notifMeta['year'] == syllabusMeta['year'];
    final bool categoryMatch = notifMeta['category']?.isNotEmpty == true && 
                               notifMeta['category'] == syllabusMeta['category'];

    final bool isMatch = examMatch && orgMatch && yearMatch && categoryMatch;
    final bool canLaunch = isMatch && selectedNotificationId != null && selectedSyllabusId != null;

    final String missionDisplayName = "${notifMeta['name']} ${notifMeta['year']}".trim();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // SECTION 1: VERIFIED NOTIFICATIONS
          _buildHeader("SECTION 1: SELECT UNLINKED NOTIFICATION"),
          _buildSourceList('recruitment_notification', (id, data) {
            setState(() {
              selectedNotificationId = id;
              selectedNotificationData = data;
              nature = 'ACTIVE'; 
            });
          }, selectedNotificationId),
          
          const SizedBox(height: 32),
          
          // SECTION 2: VERIFIED SYLLABUS
          _buildHeader("SECTION 2: SELECT UNLINKED SYLLABUS"),
          _buildSourceList('syllabus', (id, data) {
            setState(() {
              selectedSyllabusId = id;
              selectedSyllabusData = data;
            });
          }, selectedSyllabusId),

          const SizedBox(height: 32),
          
          if (selectedNotificationData != null && selectedSyllabusData != null) ...[
            // SECTION 3: MISSION NATURE
            _buildHeader("SECTION 3: MISSION NATURE"),
            _buildNatureSelector(),
            
            const SizedBox(height: 32),

            // SECTION 4: QUAD IDENTITY VALIDATION
            _buildHeader("SECTION 4: QUAD IDENTITY VALIDATION"),
            _buildValidationPanel(
              examMatch: examMatch, 
              orgMatch: orgMatch, 
              yearMatch: yearMatch,
              categoryMatch: categoryMatch,
              notifMeta: notifMeta,
              syllabusMeta: syllabusMeta,
            ),

            const SizedBox(height: 40),

            // SECTION 5: CREATE MISSION
            if (isLaunching)
              const Center(child: CircularProgressIndicator(color: AppColors.gold))
            else
              _buildLaunchButton(canLaunch, missionDisplayName),
        ],
      ],
    ),
    );
  }

  Widget _buildHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title, style: AppTypography.label.copyWith(fontSize: 9, color: AppColors.gold, letterSpacing: 1.5)),
    );
  }

  Widget _buildSourceList(String type, Function(String, Map<String, dynamic>) onSelect, String? currentId) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('sentinel_drafts')
          .where('type', isEqualTo: type)
          .where('status', whereIn: ['verified', 'ready_for_manifest', 'published'])
          .where('linkedRealmId', isNull: true)
          .snapshots(),
      builder: (context, snapshot) {
        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) {
          return Text("NO UNUSED ${type.toUpperCase()} FOUND", 
            style: AppTypography.label.copyWith(color: Colors.redAccent.withValues(alpha: 0.5), fontSize: 8));
        }

        return SizedBox(
          height: 70,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final data = docs[index].data() as Map<String, dynamic>;
              final id = docs[index].id;
              final bool isSelected = id == currentId;
              final meta = _getMetadata(data);
              final String label = "${meta['name']} ${meta['year']}".trim();

              return GestureDetector(
                onTap: () => onSelect(id, data),
                child: Container(
                  width: 220,
                  margin: const EdgeInsets.only(right: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.gold.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.02),
                    border: Border.all(color: isSelected ? AppColors.gold : Colors.white10),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(label.isEmpty ? "Unknown Discovery" : label, 
                      style: AppTypography.body.copyWith(fontSize: 10, color: isSelected ? AppColors.gold : Colors.white70, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
                      maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildNatureSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _natureOption("PASSIVE", Icons.hourglass_empty_rounded),
            const SizedBox(width: 16),
            _natureOption("ACTIVE", Icons.rocket_launch_rounded),
          ],
        ),
        const SizedBox(height: 12),
        Text("SYSTEM RECOMMENDATION: ${nature == 'ACTIVE' ? 'ACTIVE (Notice Verified)' : 'PASSIVE'}", 
          style: AppTypography.label.copyWith(fontSize: 7, color: AppColors.gold.withValues(alpha: 0.5))),
      ],
    );
  }

  Widget _natureOption(String val, IconData icon) {
    final bool isSelected = nature == val;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => nature = val),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.gold.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.02),
            border: Border.all(color: isSelected ? AppColors.gold : Colors.white10),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 14, color: isSelected ? AppColors.gold : Colors.white24),
              const SizedBox(width: 8),
              Text(val, style: TextStyle(color: isSelected ? AppColors.gold : Colors.white24, fontSize: 10, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildValidationPanel({
    required bool examMatch,
    required bool orgMatch,
    required bool yearMatch,
    bool categoryMatch = true,
    required Map<String, String> notifMeta,
    required Map<String, String> syllabusMeta,
  }) {
    final bool allMatch = examMatch && orgMatch && yearMatch && categoryMatch;
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _tripleValidationRow("Exam Name", notifMeta['name'], syllabusMeta['name'], examMatch),
          _tripleValidationRow("Organization", notifMeta['org'], syllabusMeta['org'], orgMatch),
          _tripleValidationRow("Target Year", notifMeta['year'], syllabusMeta['year'], yearMatch),
          _tripleValidationRow("Category Code", notifMeta['category'], syllabusMeta['category'], categoryMatch),
          const Divider(color: Colors.white10, height: 24),
          Row(
            children: [
              Icon(allMatch ? Icons.verified_user_rounded : Icons.warning_amber_rounded, 
                color: allMatch ? Colors.greenAccent : Colors.redAccent, size: 16),
              const SizedBox(width: 12),
              Text(allMatch ? "IDENTITY QUAD-MATCH VERIFIED" : "IDENTITY MISMATCH - MISSION LOCKED", 
                style: AppTypography.label.copyWith(color: allMatch ? Colors.greenAccent : Colors.redAccent, fontSize: 9)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tripleValidationRow(String label, String? v1, String? v2, bool isMatch) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
              Icon(isMatch ? Icons.check_circle_outline_rounded : Icons.cancel_outlined, 
                   size: 12, color: isMatch ? Colors.greenAccent.withValues(alpha: 0.5) : Colors.redAccent),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(v1 ?? "EMPTY", style: AppTypography.body.copyWith(fontSize: 9, color: Colors.white38)),
              const Icon(Icons.arrow_forward_rounded, size: 8, color: Colors.white10),
              Text(v2 ?? "EMPTY", style: AppTypography.body.copyWith(fontSize: 9, color: Colors.white38)),
            ],
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildLaunchButton(bool canLaunch, String missionName) {
    return TacticalButton(
      title: canLaunch ? "LAUNCH MISSION: $missionName" : "MISSION LAUNCH LOCKED",
      onTap: canLaunch ? () => _launchMission() : null,
      color: canLaunch ? (nature == 'ACTIVE' ? Colors.greenAccent : AppColors.gold) : Colors.white10,
    );
  }

  Map<String, String> _getMetadata(Map<String, dynamic>? data) {
    if (data == null) return {'name': '', 'org': '', 'year': '', 'category': ''};
    final rawData = data['rawData'] ?? {};
    
    return {
      'name': (rawData['exam_name'] ?? rawData['examName'] ?? '').toString(),
      'org': (rawData['organization'] ?? rawData['org'] ?? '').toString(),
      'year': (rawData['year'] ?? rawData['exam_year'] ?? '').toString(),
      'category': (rawData['exam_category'] ?? '').toString(),
      'authorityKey': (rawData['authorityKey'] ?? rawData['authority_key'] ?? '').toString(),
      'jurisdictionLevel': (rawData['jurisdictionLevel'] ?? rawData['jurisdiction_level'] ?? 'CENTRAL').toString(),
      'stateCode': (rawData['stateCode'] ?? rawData['state_code'] ?? '').toString(),
      'syllabusBindingMode': (rawData['syllabusBindingMode'] ?? rawData['syllabus_binding_mode'] ?? 'SEPARATE').toString(),
    };
  }

  Future<void> _launchMission() async {
    setState(() => isLaunching = true);
    try {
      final meta = _getMetadata(selectedNotificationData);
      final cycleKey = (meta['year'] ?? '').trim();
      if (cycleKey.isEmpty || int.tryParse(cycleKey) == null ||
          (meta['authorityKey'] ?? '').isEmpty) {
        throw StateError('Canonical authority and cycle fields are required.');
      }
      final callable = FirebaseFunctions.instanceFor(region: 'us-central1').httpsCallable('handleSentinelAction');
      await callable.call({
        'action': 'launch_exam_mission',
        'payload': {
          'notificationId': selectedNotificationId,
          'syllabusId': selectedSyllabusId,
          'nature': nature,
          'examName': meta['name'],
          'organization': meta['org'],
          'year': int.parse(cycleKey),
          'cycleKey': cycleKey,
          'authorityKey': meta['authorityKey'],
          'jurisdictionLevel': meta['jurisdictionLevel'],
          if ((meta['stateCode'] ?? '').isNotEmpty) 'stateCode': meta['stateCode'],
          'syllabusBindingMode': meta['syllabusBindingMode'],
          'examCategory': meta['category'],
        }
      });
      if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("MISSION REALM LAUNCHED SUCCESSFULLY")));
         setState(() {
           selectedNotificationId = null;
           selectedSyllabusId = null;
           selectedNotificationData = null;
           selectedSyllabusData = null;
         });
      }
    } catch (e) {
      String errorMsg = e.toString();
      if (errorMsg.contains('MISSION_ALREADY_EXISTS')) {
        errorMsg = "IDENTITY CLASH: This mission already exists in the realm.";
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errorMsg)));
    } finally {
      if (mounted) setState(() => isLaunching = false);
    }
  }
}
