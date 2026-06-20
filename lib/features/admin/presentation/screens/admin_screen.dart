import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/tactical_noir_background.dart';
import '../widgets/upload_factory/upload_factory_center.dart';
import '../widgets/upload_center/recruitment_intelligence_center.dart';
import '../widgets/review_queue/review_queue.dart';
import '../widgets/mission_control/mission_control_center.dart';
import '../widgets/settings/founder_settings_center.dart';
import '../widgets/shared/founder_bottom_navigation.dart';
import '../widgets/shared/founder_header.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  int _activeTab = 0; // Default: UPLOADS (Phase 5 Landing Rule)
  bool _isAdmin = false;
  final List<int> _tabHistory = [0];

  @override
  void initState() {
    super.initState();
    _checkAdmin();
  }

  Future<void> _checkAdmin() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    
    final idToken = await user.getIdTokenResult();
    if (mounted) {
      setState(() {
        _isAdmin = idToken.claims?['admin'] == true || idToken.claims?['founder'] == true;
      });
    }
  }

  void _switchTab(int index) {
    if (_activeTab == index) return;
    setState(() {
      _activeTab = index;
      _tabHistory.add(index);
    });
  }

  Future<void> _onBack() async {
    if (_tabHistory.length > 1) {
      setState(() {
        _tabHistory.removeLast();
        _activeTab = _tabHistory.last;
      });
    } else {
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAdmin && !kDebugMode) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: Text("ACCESS DENIED: VERIFIED COMMANDERS ONLY", style: TextStyle(color: Colors.red))),
      );
    }

    return PopScope(
      canPop: _tabHistory.length <= 1,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _onBack();
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        bottomNavigationBar: FounderBottomNavigation(
          activeIndex: _activeTab,
          onTabSwitch: _switchTab,
        ),
        body: TacticalNoirBackground(
          child: SafeArea(
            child: Column(
              children: [
                const FounderHeader(),
                Expanded(
                  child: IndexedStack(
                    index: _activeTab,
                    children: [
                      const UploadFactoryCenter(),
                      const RecruitmentIntelligenceCenter(),
                      const ReviewQueue(),
                      const MissionControlCenter(),
                      const FounderSettingsCenter(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
