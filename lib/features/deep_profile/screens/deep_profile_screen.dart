import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/tactical_noir_background.dart';
import '../providers/warrior_profile_provider.dart';
import '../models/warrior_profile.dart';
import '../../../features/auth/presentation/providers/auth_provider.dart';
import '../widgets/dob_tile.dart';
import '../widgets/gender_tile.dart';
import '../widgets/category_tile.dart';
import '../widgets/sap_tile.dart';
import '../widgets/qualification_tile.dart';
import '../widgets/employment_tile.dart';
import '../widgets/subject_selector_tile.dart';
import '../widgets/professional_qualification_tile.dart';
import '../widgets/post_graduation_tile.dart';
import '../widgets/degree_selector_tile.dart';
import '../widgets/branch_selector_tile.dart';

class DeepProfileScreen extends ConsumerStatefulWidget {
  const DeepProfileScreen({super.key});

  @override
  ConsumerState<DeepProfileScreen> createState() => _DeepProfileScreenState();
}

class _DeepProfileScreenState extends ConsumerState<DeepProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(authNotifierProvider).user;
      if (user != null) {
        ref.read(warriorProfileProvider.notifier).loadProfile(user.uid);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(warriorProfileProvider);

    if (profile == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.gold)),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(profile.completionPercent),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  physics: const BouncingScrollPhysics(),
                  children: [
                    DobTile(
                      dob: profile.dateOfBirth,
                      onTap: () => _selectDate(context, profile),
                    ),
                    const SizedBox(height: 12),
                    GenderTile(
                      gender: profile.gender,
                      onSelect: (val) => _update(profile.copyWith(gender: val)),
                    ),
                    const SizedBox(height: 12),
                    CategoryTile(
                      category: profile.category,
                      onSelect: (val) => _update(profile.copyWith(category: val)),
                    ),
                    const SizedBox(height: 12),
                    SapTile(
                      isSap: profile.isSAP,
                      onToggle: (val) => _update(profile.copyWith(isSAP: val)),
                    ),
                    const SizedBox(height: 12),
                    QualificationTile(
                      qualification: profile.educationLevel,
                      onSelect: (val) => _update(profile.copyWith(educationLevel: val)),
                    ),
                    const SizedBox(height: 12),
                    if (profile.educationLevel == 'Graduate' || profile.educationLevel == 'Post Graduate' || profile.educationLevel == 'PhD') ...[
                      DegreeSelectorTile(
                        label: "Graduation Degree",
                        selectedDegree: profile.graduationDegree,
                        options: const ["BA", "BSc", "BCom", "BTech", "BBA", "BCA", "LLB", "BSc Nursing", "Other"],
                        onSelect: (val) => _update(profile.copyWith(graduationDegree: val)),
                      ),
                      const SizedBox(height: 12),
                    ],
                    SubjectSelectorTile(
                      selectedSubjects: profile.graduationSubjects,
                      stream: profile.graduationStream,
                      onChanged: (val) => _update(profile.copyWith(graduationSubjects: val)),
                    ),
                    const SizedBox(height: 12),
                    if (profile.graduationDegree == 'BTech' || profile.graduationDegree == 'Diploma') ...[
                      BranchSelectorTile(
                        label: "Engineering Branch",
                        selectedBranch: profile.engineeringBranch,
                        options: const ["Civil", "Mechanical", "Electrical", "Electronics", "Computer Science", "IT"],
                        onSelect: (val) => _update(profile.copyWith(engineeringBranch: val)),
                      ),
                      const SizedBox(height: 12),
                    ],
                    PostGraduationTile(
                      isCompleted: profile.isPostGraduationCompleted,
                      stream: profile.postGraduationStream,
                      subjects: profile.postGraduationSubjects,
                      onToggle: (val) => _update(profile.copyWith(isPostGraduationCompleted: val)),
                      onStreamChanged: (val) => _update(profile.copyWith(postGraduationStream: val)),
                      onSubjectsChanged: (val) => _update(profile.copyWith(postGraduationSubjects: val)),
                    ),
                    if (profile.isPostGraduationCompleted) ...[
                      const SizedBox(height: 12),
                      DegreeSelectorTile(
                        label: "Post Graduation Degree",
                        selectedDegree: profile.postGraduationDegree,
                        options: const ["MA", "MSc", "MCom", "MTech", "MBA", "MCA", "LLM", "MSc Nursing", "Other"],
                        onSelect: (val) => _update(profile.copyWith(postGraduationDegree: val)),
                      ),
                    ],
                    const SizedBox(height: 12),
                    if (profile.graduationDegree == 'BSc Nursing' || profile.postGraduationDegree == 'MSc Nursing') ...[
                      DegreeSelectorTile(
                        label: "Nursing Qualification",
                        selectedDegree: profile.nursingQualification,
                        options: const ["ANM", "GNM", "BSc Nursing", "Post Basic BSc Nursing", "MSc Nursing"],
                        onSelect: (val) => _update(profile.copyWith(nursingQualification: val)),
                      ),
                      const SizedBox(height: 12),
                    ],
                    ProfessionalQualificationTile(
                      selectedIds: profile.professionalCredentialIds,
                      onToggle: (id, val) {
                        final updatedIds = List<String>.from(profile.professionalCredentialIds);
                        if (val) {
                          updatedIds.add(id);
                        } else {
                          updatedIds.remove(id);
                        }
                        _update(profile.copyWith(professionalCredentialIds: updatedIds));
                      },
                    ),
                    const SizedBox(height: 12),
                    EmploymentTile(
                      status: profile.employmentStatus,
                      onSelect: (val) => _update(profile.copyWith(employmentStatus: val)),
                    ),
                    const SizedBox(height: 32),
                    Center(
                      child: Text(
                        "Changes are saved automatically",
                        style: AppTypography.label.copyWith(fontSize: 9, color: Colors.white12, letterSpacing: 1.2),
                      ),
                    ),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(double strength) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("CAREER PROFILE", style: AppTypography.hero.copyWith(fontSize: 22)),
          const SizedBox(height: 12),
          Row(
            children: [
              Text("Profile Strength", style: AppTypography.label.copyWith(color: Colors.white38)),
              const Spacer(),
              Text("${strength.toInt()}%", style: AppTypography.label.copyWith(color: AppColors.gold)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: strength / 100,
              backgroundColor: Colors.white10,
              color: AppColors.gold,
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }

  void _update(WarriorProfile updated) {
    ref.read(warriorProfileProvider.notifier).updateProfile(updated);
  }

  Future<void> _selectDate(BuildContext context, WarriorProfile profile) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: profile.dateOfBirth ?? DateTime(2000),
      firstDate: DateTime(1960),
      lastDate: DateTime.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(primary: AppColors.gold, onPrimary: Colors.black, surface: AppColors.surface, onSurface: Colors.white),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      _update(profile.copyWith(dateOfBirth: picked));
    }
  }
}
