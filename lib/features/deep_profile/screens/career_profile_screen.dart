import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/tactical_noir_background.dart';
import '../providers/warrior_profile_provider.dart';
import '../models/warrior_profile.dart';
import '../models/education_record.dart';
import '../widgets/searchable_subject_picker.dart';
import '../data/subject_master.dart';
import '../../../features/auth/presentation/providers/auth_provider.dart';

class CareerProfileScreen extends ConsumerStatefulWidget {
  const CareerProfileScreen({super.key});

  @override
  ConsumerState<CareerProfileScreen> createState() => _CareerProfileScreenState();
}

class _CareerProfileScreenState extends ConsumerState<CareerProfileScreen> {
  WarriorProfile? _localProfile;
  bool _isSaving = false;
  String? _saveErrorMessage;

  @override
  void initState() {
    super.initState();
    _initProfileLoad();
  }

  void _initProfileLoad() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authState = ref.read(authNotifierProvider);
      if (authState.user != null) {
        ref.read(warriorProfileProvider.notifier).loadProfile(authState.user!.uid);
      }
    });
  }

  void _saveProfile() async {
    if (_localProfile == null) return;
    setState(() {
      _isSaving = true;
      _saveErrorMessage = null;
    });

    try {
      // 🔱 Sync legacy fields and derive highest qualification before saving
      final updated = _localProfile!.syncLegacyFields();

      await ref.read(warriorProfileProvider.notifier).updateProfile(updated);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Career Profile saved successfully"), backgroundColor: AppColors.success),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _saveErrorMessage = e.toString();
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Save failed: $e"), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final serverProfile = ref.watch(warriorProfileProvider);

    if (serverProfile == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.gold)),
      );
    }

    if (_localProfile == null) {
      _localProfile = serverProfile;
    }

    final addedCount = _localProfile!.careerProfileAddedCount;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context, addedCount),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  physics: const BouncingScrollPhysics(),
                  children: [
                    _buildSectionHeader("Current Academic Status"),
                    _buildCurrentEducationSection(),
                    const SizedBox(height: 32),
                    _buildSectionHeader("Education History & Qualifications"),
                    _buildQualificationsSection(),
                    const SizedBox(height: 32),
                    _buildSectionHeader("Career Interests"),
                    _buildInterestsSelect(
                      selectedItems: _localProfile!.careerInterests,
                      onChanged: (updated) {
                        setState(() {
                          _localProfile = _localProfile!.copyWith(careerInterests: updated);
                        });
                      },
                    ),
                    const SizedBox(height: 24),
                    _buildSectionHeader("Career Preferences"),
                    _buildDropdown(
                      label: "Preferred Sector",
                      value: _localProfile!.preferredSector.isEmpty ? null : _localProfile!.preferredSector,
                      options: const ["Government", "Private", "Research / Academic", "Entrepreneurship", "No preference"],
                      onChanged: (val) {
                        if (val != null) setState(() => _localProfile = _localProfile!.copyWith(preferredSector: val));
                      },
                    ),
                    const SizedBox(height: 40),
                    _buildSaveButton(),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentEducationSection() {
    final stage = _localProfile!.currentEducationStage;
    final showStream = stage == 'Class 11' || stage == 'Class 12';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDropdown(
          label: "Current Education Stage",
          value: stage.isEmpty ? null : stage,
          options: const [
            "Class 10", "Class 11", "Class 12", "Diploma", "Undergraduate", "Graduate", "Postgraduate", "Working", "Other"
          ],
          onChanged: (val) {
            if (val != null) {
              setState(() {
                _localProfile = _localProfile!.copyWith(currentEducationStage: val);
              });
            }
          },
        ),
        if (showStream) ...[
          const SizedBox(height: 20),
          _buildDropdown(
            label: "Academic Stream",
            value: _localProfile!.academicStream.isEmpty ? null : _localProfile!.academicStream,
            options: const ["Medical / PCB", "Non-Medical / PCM", "Commerce", "Humanities", "Vocational", "Other"],
            onChanged: (val) {
              if (val != null) setState(() => _localProfile = _localProfile!.copyWith(academicStream: val));
            },
          ),
        ],
        const SizedBox(height: 20),
        SearchableSubjectPicker(
          label: "Subjects Studied",
          selectedSubjectIds: _localProfile!.subjectsStudied,
          suggestions: SubjectMaster.getSuggestions(
            level: stage,
            stream: _localProfile!.academicStream,
          ),
          onChanged: (ids) {
            setState(() => _localProfile = _localProfile!.copyWith(subjectsStudied: ids));
          },
        ),
      ],
    );
  }

  Widget _buildQualificationsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_localProfile!.educationRecords.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.03), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
            child: const Center(child: Text("No extra qualifications added yet.", style: TextStyle(color: Colors.white38, fontSize: 12))),
          )
        else
          ..._localProfile!.educationRecords.map((record) => _buildRecordCard(record)),
        const SizedBox(height: 16),
        _addQualificationButton(),
      ],
    );
  }

  Widget _buildRecordCard(EducationRecord record) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Row(
        children: [
          const Icon(Icons.school_outlined, color: AppColors.gold, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(record.level, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                if (record.degreeId != null) Text(record.degreeId!, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                Text("${record.status}${record.completionYear != null ? ' - ${record.completionYear}' : ''}", style: const TextStyle(color: Colors.white38, fontSize: 11)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
            onPressed: () {
              setState(() {
                final updated = List<EducationRecord>.from(_localProfile!.educationRecords)..remove(record);
                _localProfile = _localProfile!.copyWith(educationRecords: updated);
              });
            },
          )
        ],
      ),
    );
  }

  Widget _addQualificationButton() {
    return InkWell(
      onTap: _showAddQualificationSheet,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.gold.withOpacity(0.3), style: BorderStyle.solid),
          borderRadius: BorderRadius.circular(12),
          color: AppColors.gold.withOpacity(0.05),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_circle_outline, color: AppColors.gold, size: 20),
            SizedBox(width: 8),
            Text("Add Qualification", style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  void _showAddQualificationSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => const AddQualificationSheet(),
    ).then((newRecord) {
      if (newRecord != null && newRecord is EducationRecord) {
        setState(() {
          final updated = List<EducationRecord>.from(_localProfile!.educationRecords)..add(newRecord);
          _localProfile = _localProfile!.copyWith(educationRecords: updated);
        });
      }
    });
  }

  Widget _buildSaveButton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_saveErrorMessage != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.error.withOpacity(0.5)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.error_outline, color: AppColors.error, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Failed to Save Career Profile",
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _saveErrorMessage!,
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: _saveProfile,
                        icon: const Icon(Icons.refresh, size: 16, color: Colors.black),
                        label: const Text("Retry Save", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        ElevatedButton(
          onPressed: _isSaving ? null : _saveProfile,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.gold,
            foregroundColor: Colors.black,
            minimumSize: const Size(double.infinity, 54),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: _isSaving
              ? const CircularProgressIndicator(color: Colors.black)
              : Text(
                  _saveErrorMessage != null ? "Retry Save Profile" : "Save Career Profile",
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
        ),
      ],
    );
  }

  Widget _buildHeader(BuildContext context, int addedCount) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.border, width: 1))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
              const SizedBox(width: 8),
              Text("Career Profile", style: AppTypography.section.copyWith(color: Colors.white, fontSize: 22)),
            ],
          ),
          const SizedBox(height: 16),
          _buildProgressCard(addedCount),
        ],
      ),
    );
  }

  Widget _buildProgressCard(int count) {
      return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
          child: Column(
              children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text("Profile Completeness", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
                      Text("$count of 7 details", style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 12)),
                  ]),
                  const SizedBox(height: 12),
                  LinearProgressIndicator(value: count / 7.0, backgroundColor: Colors.white10, color: AppColors.gold, minHeight: 6),
              ],
          ),
      );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(title, style: AppTypography.body.copyWith(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 15)),
    );
  }

  Widget _buildDropdown({required String label, required String? value, required List<String> options, required ValueChanged<String?> onChanged}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              dropdownColor: AppColors.surface,
              value: value,
              isExpanded: true,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              icon: const Icon(Icons.keyboard_arrow_down, color: AppColors.gold),
              items: options.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInterestsSelect({required List<String> selectedItems, required ValueChanged<List<String>> onChanged}) {
    final options = const ["Healthcare", "Engineering", "Research", "Public Admin", "Teaching", "Law", "Defence", "Finance", "Entrepreneurship", "Design", "Agriculture", "Data Science"];
    return Wrap(
      spacing: 8, runSpacing: 8,
      children: options.map((opt) {
        final isSelected = selectedItems.contains(opt);
        return FilterChip(
          label: Text(opt, style: TextStyle(color: isSelected ? Colors.black : Colors.white70, fontSize: 12)),
          selected: isSelected,
          onSelected: (val) {
            final updated = List<String>.from(selectedItems);
            val ? updated.add(opt) : updated.remove(opt);
            onChanged(updated);
          },
          selectedColor: AppColors.gold,
          checkmarkColor: Colors.black,
          backgroundColor: Colors.white.withOpacity(0.05),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: const BorderSide(color: Colors.white10)),
        );
      }).toList(),
    );
  }
}

class AddQualificationSheet extends StatefulWidget {
  const AddQualificationSheet({super.key});
  @override
  State<AddQualificationSheet> createState() => _AddQualificationSheetState();
}

class _AddQualificationSheetState extends State<AddQualificationSheet> {
  String? _level;
  String? _status = "Completed";
  String? _degree;
  List<String> _subjects = [];
  final _yearController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Add Qualification", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          _dropdown("Type", _level, ["Diploma", "Bachelor's Degree", "Master's Degree", "Doctorate / PhD", "Professional Degree", "Teaching Qualification", "Technical / Vocational"], (v) => setState(() => _level = v)),
          const SizedBox(height: 16),
          if (_level != null) ...[
              _textField("Degree Name", (v) => _degree = v),
              const SizedBox(height: 16),
              _dropdown("Status", _status, ["Completed", "Pursuing"], (v) => setState(() => _status = v)),
              const SizedBox(height: 16),
              SearchableSubjectPicker(
                  label: "Major Subjects",
                  selectedSubjectIds: _subjects,
                  suggestions: const [],
                  onChanged: (ids) => setState(() => _subjects = ids),
              ),
              const SizedBox(height: 16),
              _textField("Completion Year", (v) => {}, controller: _yearController, keyboard: TextInputType.number),
          ],
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: _level == null ? null : () {
                final record = EducationRecord(
                    id: DateTime.now().millisecondsSinceEpoch.toString(),
                    level: _level!,
                    status: _status!,
                    degreeId: _degree,
                    completionYear: _yearController.text,
                    subjectIds: _subjects,
                );
                Navigator.pop(context, record);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.gold, minimumSize: const Size(double.infinity, 50)),
            child: const Text("Save Qualification", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }

  Widget _dropdown(String label, String? val, List<String> opts, ValueChanged<String?> onChanged) {
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
          const SizedBox(height: 8),
          Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(10)),
              child: DropdownButtonHideUnderline(child: DropdownButton<String>(
                  value: val, isExpanded: true, dropdownColor: AppColors.background,
                  items: opts.map((o) => DropdownMenuItem(value: o, child: Text(o, style: const TextStyle(color: Colors.white, fontSize: 14)))).toList(),
                  onChanged: onChanged,
              )),
          )
      ]);
  }

  Widget _textField(String label, ValueChanged<String> onChanged, {TextEditingController? controller, TextInputType keyboard = TextInputType.text}) {
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
          const SizedBox(height: 8),
          TextField(
              controller: controller, keyboardType: keyboard,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                  filled: true, fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
              ),
              onChanged: onChanged,
          )
      ]);
  }
}
