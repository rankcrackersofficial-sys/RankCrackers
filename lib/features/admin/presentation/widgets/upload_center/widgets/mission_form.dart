import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';
import '../../../../../../shared/widgets/tactical_button.dart';
import '../../../../../../core/models/recruitment.dart';
import '../../../../data/admin_upload_engine.dart';
import '../../shared/admin_input.dart';
import 'mission_category_selector.dart';

class MissionForm extends StatefulWidget {
  const MissionForm({super.key});

  @override
  State<MissionForm> createState() => _MissionFormState();
}

class _MissionFormState extends State<MissionForm> {
  final idController = TextEditingController();
  final titleController = TextEditingController();
  final examIdController = TextEditingController();
  final blueprintIdController = TextEditingController();
  final stateController = TextEditingController();
  final departmentController = TextEditingController();
  final yearController = TextEditingController();
  
  String selectedCategory = 'competitive'; 

  @override
  void dispose() {
    idController.dispose();
    titleController.dispose();
    examIdController.dispose();
    blueprintIdController.dispose();
    stateController.dispose();
    departmentController.dispose();
    yearController.dispose();
    super.dispose();
  }

  void _createRecruitment() async {
    if (idController.text.isEmpty || titleController.text.isEmpty) return;
    
    final recruitment = Recruitment(
      id: idController.text,
      recruitmentGroupId: 'group_${idController.text}',
      boardId: departmentController.text.isNotEmpty ? departmentController.text : 'board_${idController.text}',
      examId: examIdController.text,
      examBlueprintId: blueprintIdController.text,
      title: titleController.text,
      titleHindi: titleController.text,
      year: int.tryParse(yearController.text) ?? 2026,
      state: stateController.text,
      examCategory: selectedCategory,
      status: 'draft', 
    );

    await AdminUploadEngine.uploadRecruitment(recruitment);
    
    if (mounted) {
      idController.clear();
      titleController.clear();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('RECRUITMENT ESTABLISHED')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("DEPLOY NEW MISSION", style: AppTypography.label.copyWith(color: AppColors.gold)),
          const SizedBox(height: 20),
          AdminInput(controller: idController, hint: "Recruitment ID (e.g. ssc_cgl_2026)"),
          const SizedBox(height: 12),
          AdminInput(controller: titleController, hint: "Mission Title"),
          const SizedBox(height: 20),
          
          MissionCategorySelector(
            selectedCategory: selectedCategory, 
            onCategoryChanged: (val) => setState(() => selectedCategory = val),
          ),
          
          const SizedBox(height: 20),
          AdminInput(controller: examIdController, hint: "Exam ID (Canonical)"),
          const SizedBox(height: 12),
          AdminInput(controller: departmentController, hint: "Department / Board (e.g. RSSB, SSC)"),
          const SizedBox(height: 12),
          AdminInput(controller: blueprintIdController, hint: "Exam Blueprint ID"),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: AdminInput(controller: stateController, hint: "State")),
              const SizedBox(width: 12),
              Expanded(child: AdminInput(controller: yearController, hint: "Year")),
            ],
          ),
          const SizedBox(height: 24),
          TacticalButton(title: "ESTABLISH REGISTRY", onTap: _createRecruitment),
        ],
      ),
    );
  }
}
