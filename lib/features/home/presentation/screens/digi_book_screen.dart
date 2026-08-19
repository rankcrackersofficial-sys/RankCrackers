import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/dark_card.dart';
import '../../../../shared/widgets/tactical_button.dart';
import '../../../../core/models/micro_topic_node.dart';
import '../../../../core/models/node_runtime_state.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../features/mcq/presentation/widgets/mcq_card.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/tactical_secure_layer.dart';
import '../../../../features/profile/data/models/user_profile_model.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../core/services/knowledge_content_service.dart';
import '../../../../core/utils/responsive_helper.dart';
import '../../../digibook/models/digibook_content.dart';
import '../../../../core/knowledge/knowledge_engine_provider.dart';

/// DIGIBOOK SCREEN
/// The primary immersive reading interface. State-aware and adaptive.
class DigiBookScreen extends ConsumerStatefulWidget {
  final MicroTopicNode node;

  const DigiBookScreen({
    super.key,
    required this.node,
  });

  @override
  ConsumerState<DigiBookScreen> createState() => _DigiBookScreenState();
}

class _DigiBookScreenState extends ConsumerState<DigiBookScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final DateTime _startTime = DateTime.now(); 
  final ScrollController _scrollController = ScrollController();
  double _maxScrollPercent = 0.0;
  
  // Content Summoning State
  Future<DigiBookContent?>? _contentFuture;
  late MicroTopicNode _currentNode;

  @override
  void initState() {
    super.initState();
    _currentNode = widget.node;
    _tabController = TabController(length: 5, vsync: this); 
    _contentFuture = KnowledgeContentService.fetchContent(_currentNode.contentRegistryId);
    
    _scrollController.addListener(() {
      if (_scrollController.hasClients) {
        final current = _scrollController.position.pixels;
        final max = _scrollController.position.maxScrollExtent;
        if (max > 0) {
          final percent = current / max;
          if (percent > _maxScrollPercent) _maxScrollPercent = percent;
        }
      }
    });
  }

  @override
  void didUpdateWidget(covariant DigiBookScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.node.id != widget.node.id) {
      setState(() {
        _currentNode = widget.node;
        _contentFuture = KnowledgeContentService.fetchContent(_currentNode.contentRegistryId);
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final knowledge = KnowledgeEngine.instance;
    final state = knowledge.getState(_currentNode.id) ?? NodeRuntimeState(nodeId: _currentNode.id);
    final authState = ref.watch(authNotifierProvider);

    ref.listen<List<MicroTopicNode>>(allNodesProvider, (previous, next) {
      if (next.isNotEmpty && !next.any((n) => n.id == _currentNode.id)) {
        setState(() {
          _currentNode = next.first;
          _contentFuture = KnowledgeContentService.fetchContent(_currentNode.contentRegistryId);
        });
      }
    });
    
    final user = UserProfile(
      uid: authState.user?.uid ?? 'unknown',
      name: authState.user?.displayName ?? 'Warrior',
      email: authState.user?.email ?? '',
      tier: SubscriptionTier.warrior,
    );

    return FutureBuilder<DigiBookContent?>(
      future: _contentFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: AppColors.background,
            body: Center(child: CircularProgressIndicator(color: AppColors.gold)),
          );
        }

        final content = snapshot.data;
        if (content == null) {
          return Scaffold(
            backgroundColor: AppColors.background,
            body: Center(child: Text("SUMMONING FAILED: Content unreachable.", style: AppTypography.label)),
          );
        }

        return TacticalSecureLayer(
          isPremium: !user.isElite, 
          child: Scaffold(
            backgroundColor: AppColors.background,
            body: TacticalNoirBackground(
              child: SafeArea(
                child: Column(
                  children: [
                    _buildTopBar(state),
                    _buildSubtleTabBar(),
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildImmersiveReader(state, content),
                          _buildAtomicFactsTab(content),
                          _buildMcqTab(state, content),
                          _buildOneLinersTab(content),
                          _buildMissionTab(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildMissionTab() {
    final recruitment = KnowledgeEngine.instance.activeRecruitment;
    if (recruitment == null) return _buildEmptyState("NO ACTIVE MISSION");

    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance.collection('mission_realms').doc(recruitment.id).snapshots(),
      builder: (context, realmSnap) {
        if (!realmSnap.hasData) return const Center(child: CircularProgressIndicator(color: AppColors.gold));
        
        return SingleChildScrollView(
          padding: EdgeInsets.all(ResponsiveHelper.wp(context, 0.06)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _sectionLabel("MISSION ROADMAP"),
              SizedBox(height: ResponsiveHelper.hp(context, 0.025)),
              _buildTimeline(recruitment.id),
              SizedBox(height: ResponsiveHelper.hp(context, 0.04)),
              _sectionLabel("LATEST UPDATES"),
              SizedBox(height: ResponsiveHelper.hp(context, 0.02)),
              _buildUpdatesList(recruitment.id),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTimeline(String realmId) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('mission_realms')
          .doc(realmId)
          .collection('timeline')
          .orderBy('index')
          .snapshots(),
      builder: (context, snapshot) {
        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) return Text("Roadmap not initialized", style: AppTypography.label.copyWith(color: Colors.white24, fontSize: ResponsiveHelper.sp(context, 10)));

        return Column(
          children: docs.map((doc) {
            final data = doc.data() as Map<String, dynamic>;
            final String status = data['status'] ?? 'FUTURE';

            return GestureDetector(
              onTap: () => _showAttemptDeclaration(realmId, data['type'], data['title']),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Icon(
                        status == 'COMPLETED' ? Icons.check_circle_rounded : (status == 'CURRENT' ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded),
                        size: ResponsiveHelper.sp(context, 18),
                        color: status == 'COMPLETED' ? Colors.greenAccent : (status == 'CURRENT' ? AppColors.gold : Colors.white10),
                      ),
                      if (docs.last != doc)
                        Container(width: 1, height: ResponsiveHelper.hp(context, 0.05), color: Colors.white10),
                    ],
                  ),
                  SizedBox(width: ResponsiveHelper.wp(context, 0.04)),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(data['title'] ?? 'Milestone', 
                          style: AppTypography.body.copyWith(
                            fontSize: ResponsiveHelper.sp(context, 13), 
                            fontWeight: status == 'CURRENT' ? FontWeight.bold : FontWeight.normal,
                            color: status == 'COMPLETED' || status == 'CURRENT' ? Colors.white70 : Colors.white24
                          )),
                        if (status == 'COMPLETED')
                          Text("COMPLETED", style: AppTypography.label.copyWith(fontSize: ResponsiveHelper.sp(context, 7), color: Colors.greenAccent.withValues(alpha: 0.5), letterSpacing: 0.5))
                        else if (status == 'CURRENT')
                          Text("CURRENT STAGE", style: AppTypography.label.copyWith(fontSize: ResponsiveHelper.sp(context, 7), color: AppColors.gold.withValues(alpha: 0.5), letterSpacing: 0.5)),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildUpdatesList(String realmId) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('mission_realms')
          .doc(realmId)
          .collection('updates')
          .orderBy('timestamp', descending: true)
          .limit(5)
          .snapshots(),
      builder: (context, snapshot) {
        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) return Text("No recent updates", style: AppTypography.label.copyWith(color: Colors.white24, fontSize: ResponsiveHelper.sp(context, 10)));

        return Column(
          children: docs.map((doc) {
            final data = doc.data() as Map<String, dynamic>;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: DarkCard(
                padding: EdgeInsets.all(ResponsiveHelper.sp(context, 16)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                          child: Text(data['type'] ?? 'UPDATE', style: TextStyle(color: AppColors.gold, fontSize: ResponsiveHelper.sp(context, 8), fontWeight: FontWeight.bold)),
                        ),
                        const Spacer(),
                        Icon(Icons.history_rounded, size: ResponsiveHelper.sp(context, 10), color: Colors.white24),
                      ],
                    ),
                    SizedBox(height: ResponsiveHelper.hp(context, 0.015)),
                    Text(data['title'] ?? 'Update', style: AppTypography.cardTitle.copyWith(fontSize: ResponsiveHelper.sp(context, 13))),
                    SizedBox(height: ResponsiveHelper.hp(context, 0.005)),
                    Text(data['content'] ?? '', style: AppTypography.body.copyWith(fontSize: ResponsiveHelper.sp(context, 11), color: Colors.white38)),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildTopBar(NodeRuntimeState state) {
    return Container(
      padding: EdgeInsets.fromLTRB(16, ResponsiveHelper.hp(context, 0.012), 24, ResponsiveHelper.hp(context, 0.012)),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.borderSoft))),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.pop(), 
            icon: Icon(
              Icons.arrow_back_ios_new_rounded, 
              color: AppColors.secondaryText, 
              size: ResponsiveHelper.sp(context, 18)
            )
          ),
          SizedBox(width: ResponsiveHelper.wp(context, 0.01)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "${_currentNode.subjectId} • ${_currentNode.chapterId}".toUpperCase(), 
                  style: AppTypography.label.copyWith(fontSize: ResponsiveHelper.sp(context, 9), letterSpacing: 1.2)
                ),
                SizedBox(height: ResponsiveHelper.hp(context, 0.005)),
                Text(
                  _currentNode.title, 
                  maxLines: 1, 
                  overflow: TextOverflow.ellipsis, 
                  style: AppTypography.cardTitle.copyWith(fontSize: ResponsiveHelper.sp(context, 14))
                ),
              ],
            ),
          ),
          Container(
            width: ResponsiveHelper.sp(context, 32), 
            height: ResponsiveHelper.sp(context, 32),
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.gold.withValues(alpha: 0.2))),
            child: Center(
              child: Text(
                "${(state.mastery * 100).toInt()}%", 
                style: AppTypography.label.copyWith(fontSize: ResponsiveHelper.sp(context, 8), letterSpacing: 0)
              )
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showAttemptDeclaration(String realmId, String? type, String? title) async {
    if (type == null) return;
    
    await showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Container(
        padding: EdgeInsets.all(ResponsiveHelper.wp(context, 0.06)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title?.toUpperCase() ?? "MILESTONE", style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: ResponsiveHelper.sp(context, 10))),
            SizedBox(height: ResponsiveHelper.hp(context, 0.01)),
            Text("Declare your participation status for this stage.", style: TextStyle(color: Colors.white38, fontSize: ResponsiveHelper.sp(context, 11))),
            SizedBox(height: ResponsiveHelper.hp(context, 0.03)),
            _attemptOption("I HAVE ATTEMPTED", Icons.check_circle_outline_rounded, Colors.greenAccent, () => _submitAttempt(realmId, type, 'ATTEMPTED')),
            SizedBox(height: ResponsiveHelper.hp(context, 0.015)),
            _attemptOption("CLAIM QUALIFICATION", Icons.verified_user_rounded, Colors.cyanAccent, () => _showQualificationDialog(realmId, type)),
            SizedBox(height: ResponsiveHelper.hp(context, 0.015)),
            _attemptOption("DID NOT APPEAR", Icons.cancel_outlined, Colors.redAccent, () => _submitAttempt(realmId, type, 'NOT_APPEARED')),
          ],
        ),
      ),
    );
  }

  Future<void> _showQualificationDialog(String realmId, String type) async {
    Navigator.pop(context);
    final proofController = TextEditingController();
    final scoreController = TextEditingController();

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text("CLAIM QUALIFICATION", style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: ResponsiveHelper.sp(context, 10))),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: proofController, style: TextStyle(color: Colors.white, fontSize: ResponsiveHelper.sp(context, 12)), decoration: const InputDecoration(labelText: "Result Proof (Roll No / Link)")),
            TextField(controller: scoreController, style: TextStyle(color: Colors.white, fontSize: ResponsiveHelper.sp(context, 12)), decoration: const InputDecoration(labelText: "Score (Optional)")),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("CANCEL")),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                final callable = FirebaseFunctions.instanceFor(region: 'us-central1').httpsCallable('handleMissionAction');
                await callable.call({
                  'action': 'claim_qualification',
                  'realmId': realmId,
                  'payload': {
                    'milestoneType': type,
                    'resultProof': proofController.text,
                    'score': scoreController.text,
                  }
                });
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("QUALIFICATION CLAIM SUBMITTED")));
              } catch (e) {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
              }
            },
            child: const Text("SUBMIT CLAIM"),
          ),
        ],
      ),
    );
  }

  Widget _attemptOption(String label, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: color.withValues(alpha: 0.1)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: ResponsiveHelper.sp(context, 18), color: color),
            SizedBox(width: ResponsiveHelper.wp(context, 0.04)),
            Text(label, style: AppTypography.body.copyWith(fontSize: ResponsiveHelper.sp(context, 12), fontWeight: FontWeight.bold, color: color.withValues(alpha: 0.8))),
          ],
        ),
      ),
    );
  }

  Future<void> _submitAttempt(String realmId, String type, String status) async {
    Navigator.pop(context);
    try {
      final callable = FirebaseFunctions.instanceFor(region: 'us-central1').httpsCallable('handleMissionAction');
      final result = await callable.call({
        'action': 'declare_milestone_attempt',
        'realmId': realmId,
        'payload': {
          'milestoneType': type,
          'status': status,
        }
      });
      
      if (mounted) {
        final confidence = result.data['confidence'];
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text("ATTEMPT RECORDED (Confidence: $confidence)"),
          backgroundColor: confidence == 'HIGH' ? Colors.green.withValues(alpha: 0.8) : Colors.orange.withValues(alpha: 0.8),
        ));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
    }
  }

  Widget _buildSubtleTabBar() {
    return Container(
      width: double.infinity,
      alignment: Alignment.centerLeft,
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        dividerColor: Colors.transparent,
        indicatorColor: AppColors.gold,
        labelColor: AppColors.gold,
        unselectedLabelColor: Colors.white30,
        labelPadding: EdgeInsets.symmetric(horizontal: ResponsiveHelper.wp(context, 0.06)),
        labelStyle: AppTypography.label.copyWith(fontWeight: FontWeight.w600, fontSize: ResponsiveHelper.sp(context, 12), letterSpacing: 1.0),
        tabs: const [Tab(text: "DIGIBOOK"), Tab(text: "FACTS"), Tab(text: "MCQS"), Tab(text: "ONE LINERS"), Tab(text: "MISSION")],
      ),
    );
  }

  Widget _buildImmersiveReader(NodeRuntimeState state, DigiBookContent payload) {
    final String immersiveText = _getRenderedText(state, payload);

    return SingleChildScrollView(
      controller: _scrollController,
      physics: const BouncingScrollPhysics(),
      padding: EdgeInsets.symmetric(horizontal: ResponsiveHelper.wp(context, 0.05), vertical: ResponsiveHelper.hp(context, 0.035)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_currentNode.title, style: AppTypography.hero.copyWith(height: 1.3, fontSize: ResponsiveHelper.sp(context, 28))),
          SizedBox(height: ResponsiveHelper.hp(context, 0.035)),
          DarkCard(
            padding: EdgeInsets.symmetric(horizontal: ResponsiveHelper.wp(context, 0.06), vertical: ResponsiveHelper.hp(context, 0.03)),
            child: SelectableText(immersiveText, style: AppTypography.readingContent.copyWith(fontSize: ResponsiveHelper.sp(context, 17))),
          ),
          SizedBox(height: ResponsiveHelper.hp(context, 0.035)),
          TacticalButton(
            title: "VERIFY READING", 
            onTap: () async {
              final dwellTime = DateTime.now().difference(_startTime).inSeconds / 60.0;
              await KnowledgeEngine.instance.recordReadingCompletion(
                nodeId: _currentNode.id,
                dwellTimeMinutes: dwellTime,
                scrollDepthPercent: _maxScrollPercent,
              );
              if (mounted) {
                final evidence = dwellTime >= 2.0 && _maxScrollPercent >= 0.70;
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(evidence ? 'MISSION PROGRESS RECORDED' : '⚠️ INSUFFICIENT READING EVIDENCE')));
              }
            },
          ),
          SizedBox(height: ResponsiveHelper.hp(context, 0.035)),
          if (payload.revisionPoints.isNotEmpty) ...[
            _sectionLabel("STRATEGIC REVISION"),
            SizedBox(height: ResponsiveHelper.hp(context, 0.02)),
            DarkCard(
              padding: const EdgeInsets.all(22),
              backgroundColor: AppColors.surface2,
              child: Column(
                children: payload.revisionPoints.map((point) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(padding: EdgeInsets.only(top: ResponsiveHelper.hp(context, 0.008)), child: const Icon(Icons.circle, size: 4, color: AppColors.gold)),
                      const SizedBox(width: 12),
                      Expanded(child: Text(point, style: AppTypography.body.copyWith(fontSize: ResponsiveHelper.sp(context, 15), height: 1.6))),
                    ],
                  ),
                )).toList(),
              ),
            ),
          ],
          SizedBox(height: ResponsiveHelper.hp(context, 0.1)), 
        ],
      ),
    );
  }

  String _getRenderedText(NodeRuntimeState state, DigiBookContent payload) {
    if (state.mastery < 0.4) return payload.beginnerContent;
    if (state.mastery < 0.8) return payload.intermediateContent;
    return payload.proContent;
  }

  Widget _buildMcqTab(NodeRuntimeState state, DigiBookContent payload) {
    final mcqs = state.mastery < 0.5 ? payload.easyMcqs : payload.hardMcqs;
    if (mcqs.isEmpty) return _buildEmptyState("Combat Data Missing");
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: mcqs.length,
      itemBuilder: (context, index) => Padding(
        padding: const EdgeInsets.only(bottom: 18),
        child: McqCard(nodeId: _currentNode.id, mcq: mcqs[index], currentMastery: state.mastery),
      ),
    );
  }

  Widget _buildAtomicFactsTab(DigiBookContent payload) {
    if (payload.facts.isEmpty) return _buildEmptyState("No Atomic Facts found.");
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: payload.facts.length,
      itemBuilder: (context, index) {
        final fact = payload.facts[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: DarkCard(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.hub_rounded, size: ResponsiveHelper.sp(context, 14), color: AppColors.gold),
                    const SizedBox(width: 10),
                    Text(fact.subject.toUpperCase(), style: AppTypography.label.copyWith(fontSize: ResponsiveHelper.sp(context, 10))),
                  ],
                ),
                SizedBox(height: ResponsiveHelper.hp(context, 0.015)),
                Text(fact.statement, style: AppTypography.body.copyWith(fontSize: ResponsiveHelper.sp(context, 15), height: 1.5)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildOneLinersTab(DigiBookContent payload) {
    if (payload.oneLiners.isEmpty) return _buildEmptyState("Axioms Missing");
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: payload.oneLiners.length,
      itemBuilder: (context, index) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: DarkCard(padding: EdgeInsets.symmetric(horizontal: ResponsiveHelper.wp(context, 0.06), vertical: ResponsiveHelper.hp(context, 0.03)), child: SelectableText(payload.oneLiners[index], style: AppTypography.readingContent.copyWith(fontSize: ResponsiveHelper.sp(context, 16)))),
      ),
    );
  }

  Widget _sectionLabel(String text) => Text(text.toUpperCase(), style: AppTypography.label.copyWith(color: AppColors.secondaryText, fontSize: ResponsiveHelper.sp(context, 10)));

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.auto_stories_rounded, color: Colors.white.withValues(alpha: 0.05), size: ResponsiveHelper.sp(context, 64)), const SizedBox(height: 20), Text(message, style: AppTypography.section.copyWith(color: Colors.white10, fontSize: ResponsiveHelper.sp(context, 20)))]),
    );
  }
}
