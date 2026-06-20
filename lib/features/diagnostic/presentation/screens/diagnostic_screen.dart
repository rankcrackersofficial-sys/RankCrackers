import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/models/micro_topic_node.dart';
import '../../../../core/models/question_model.dart';
import '../../../../core/diagnostic/diagnostic_engine.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';

class DiagnosticScreen extends StatefulWidget {
  final List<MicroTopicNode> targetNodes;
  final String examName;
  final String variant;
  final String state;

  const DiagnosticScreen({
    super.key,
    this.targetNodes = const [],
    this.examName = 'Universal Diagnostic',
    this.variant = '',
    this.state = 'Central',
  });

  @override
  State<DiagnosticScreen> createState() => _DiagnosticScreenState();
}

class _DiagnosticScreenState extends State<DiagnosticScreen> {
  List<QuestionModel> _questions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    final questions = await DiagnosticEngine.generateDiagnostic(
      targetNodes: widget.targetNodes,
    );
    if (mounted) {
      setState(() {
        _questions = questions;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: _isLoading 
            ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
            : Column(
                children: [
                  _buildHeader(),
                  Expanded(child: _buildCombatArea()),
                ],
              ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(Icons.close_rounded, color: Colors.white38),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("DIAGNOSTIC COMBAT", style: AppTypography.label),
              Text(widget.examName, style: AppTypography.hero.copyWith(fontSize: 18)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCombatArea() {
    if (_questions.isEmpty) {
      return Center(child: Text("NO COMBAT DATA AVAILABLE", style: AppTypography.label));
    }
    
    return Center(
      child: Text("COMBAT READY: ${_questions.length} QUESTIONS", style: AppTypography.hero),
    );
  }
}
