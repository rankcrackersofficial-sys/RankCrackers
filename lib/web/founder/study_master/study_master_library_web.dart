import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:crypto/crypto.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';

import '../../shared/unified_command_console.dart';
import '../../shared/rc_colors.dart';
import '../../shared/rc_empty_states.dart';
import '../../shared/rc_field.dart';
import '../../shared/rc_file_helpers.dart';
import '../../shared/rc_layout.dart';
import 'subject_models.dart';

class StudyMasterLibraryWeb extends StatefulWidget {
  final ConsoleRoleMode roleMode;
  const StudyMasterLibraryWeb(
      {super.key, this.roleMode = ConsoleRoleMode.founder});

  @override
  State<StudyMasterLibraryWeb> createState() => _StudyMasterLibraryWebState();
}

class _StudyMasterLibraryWebState extends State<StudyMasterLibraryWeb> {
  String? _selectedSubjectId;
  String? _selectedSubjectName;
  bool _uploading = false;
  bool _starterHindiRepairQueued = false;
  String? _error;
  String? _info;

  final _subNameCtrl = TextEditingController();
  final _subHindiCtrl = TextEditingController();
  final _subCodeCtrl = TextEditingController();

  String _searchQuery = '';
  String? _filterCategory;
  String? _filterExamFamily;

  static const List<SubjectSuggestion> _suggestedSubjects = [
    SubjectSuggestion(
      name: 'General Knowledge',
      hindiName: 'सामान्य ज्ञान',
      code: 'GENERAL_KNOWLEDGE',
      category: 'GENERAL_GK',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'RAJASTHAN_COMPETITIVE_EXAMS',
        'COMMON_GK'
      ],
    ),
    SubjectSuggestion(
      name: 'Current Affairs',
      hindiName: 'समसमयिकि',
      code: 'CURRENT_AFFAIRS',
      category: 'GENERAL_GK',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'RAJASTHAN_COMPETITIVE_EXAMS',
        'COMMON_GK'
      ],
    ),
    SubjectSuggestion(
      name: 'Rajasthan GK',
      hindiName: 'राजस्थान सामान्य ज्ञान',
      code: 'RAJASTHAN_GK',
      category: 'GENERAL_GK',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'RAJASTHAN_COMPETITIVE_EXAMS',
        'COMMON_GK'
      ],
    ),
    SubjectSuggestion(
      name: 'Indian History',
      hindiName: 'भारतीय इतिहास',
      code: 'INDIAN_HISTORY',
      category: 'HUMANITIES',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Rajasthan History',
      hindiName: 'राजस्थान इतिहास',
      code: 'RAJASTHAN_HISTORY',
      category: 'HUMANITIES',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'World History',
      hindiName: 'विश्व इतिहास',
      code: 'WORLD_HISTORY',
      category: 'HUMANITIES',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Indian Geography',
      hindiName: 'भारतीय भूगोल',
      code: 'INDIAN_GEOGRAPHY',
      category: 'HUMANITIES',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Rajasthan Geography',
      hindiName: 'राजस्थान भूगोल',
      code: 'RAJASTHAN_GEOGRAPHY',
      category: 'HUMANITIES',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'World Geography',
      hindiName: 'विश्व भूगोल',
      code: 'WORLD_GEOGRAPHY',
      category: 'HUMANITIES',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'RAS_GK'
      ],
    ),
    SubjectSuggestion(
      name: 'Indian Polity',
      hindiName: 'भारतीय राजव्यवस्था',
      code: 'INDIAN_POLITY',
      category: 'HUMANITIES',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Rajasthan Polity & Administration',
      hindiName: 'राजस्थान शासन एवम प्रशासन',
      code: 'RAJASTHAN_POLITY_ADMIN',
      category: 'HUMANITIES',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Indian Economy',
      hindiName: 'भारतीय अर्थव्यवस्था',
      code: 'INDIAN_ECONOMY',
      category: 'SOCIAL_SCIENCE',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Rajasthan Economy',
      hindiName: 'राजस्थान अर्थव्यवस्था',
      code: 'RAJASTHAN_ECONOMY',
      category: 'SOCIAL_SCIENCE',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'General Science',
      hindiName: 'सामान्य विज्ञान',
      code: 'GENERAL_SCIENCE',
      category: 'SCIENCE',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Science & Technology',
      hindiName: 'विज्ञान एवम प्रौद्योगिकि',
      code: 'SCIENCE_TECHNOLOGY',
      category: 'SCIENCE',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Environment',
      hindiName: 'पर्यावरन',
      code: 'ENVIRONMENT',
      category: 'SCIENCE',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Reasoning',
      hindiName: 'तार्किक क्षमता',
      code: 'REASONING',
      category: 'SPECIAL_TOPICS',
      examFamilies: [
        'RAS_GK',
        'FIRST_GRADE_SCHOOL_LECTURER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Mathematics',
      hindiName: 'गनित',
      code: 'MATHEMATICS',
      category: 'SCIENCE',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Computer',
      hindiName: 'कंप्यूटर',
      code: 'COMPUTER',
      category: 'SPECIAL_TOPICS',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Hindi',
      hindiName: 'हिंदी',
      code: 'HINDI',
      category: 'LANGUAGE',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'ASSISTANT_PROFESSOR',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'English',
      hindiName: 'अंग्रेज़ी',
      code: 'ENGLISH',
      category: 'LANGUAGE',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'ASSISTANT_PROFESSOR',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Sanskrit',
      hindiName: 'संस्कृत',
      code: 'SANSKRIT',
      category: 'LANGUAGE',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'ASSISTANT_PROFESSOR',
        'RAJASTHAN_COMPETITIVE_EXAMS'
      ],
    ),
    SubjectSuggestion(
      name: 'Urdu',
      hindiName: 'उर्दू',
      code: 'URDU',
      category: 'LANGUAGE',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'ASSISTANT_PROFESSOR'
      ],
    ),
    SubjectSuggestion(
      name: 'Punjabi',
      hindiName: 'पंजाबी',
      code: 'PUNJABI',
      category: 'LANGUAGE',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'ASSISTANT_PROFESSOR'
      ],
    ),
    SubjectSuggestion(
      name: 'Sindhi',
      hindiName: 'सिंधी',
      code: 'SINDHI',
      category: 'LANGUAGE',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'ASSISTANT_PROFESSOR'
      ],
    ),
    SubjectSuggestion(
      name: 'Rajasthani',
      hindiName: 'राजस्थानी',
      code: 'RAJASTHANI',
      category: 'LANGUAGE',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'ASSISTANT_PROFESSOR',
        'RAS_GK'
      ],
    ),
    SubjectSuggestion(
      name: 'Hindi Literature',
      hindiName: 'हिंदी साहित्य',
      code: 'HINDI_LITERATURE',
      category: 'LITERATURE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'English Literature',
      hindiName: 'अंग्रेज़ी साहित्य',
      code: 'ENGLISH_LITERATURE',
      category: 'LITERATURE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Sanskrit Literature',
      hindiName: 'संस्कृत साहित्य',
      code: 'SANSKRIT_LITERATURE',
      category: 'LITERATURE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'History',
      hindiName: 'इतिहास',
      code: 'HISTORY',
      category: 'HUMANITIES',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Political Science',
      hindiName: 'राजनीति विज्ञान',
      code: 'POLITICAL_SCIENCE',
      category: 'HUMANITIES',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'ASSISTANT_PROFESSOR',
        'RAS_GK'
      ],
    ),
    SubjectSuggestion(
      name: 'Geography',
      hindiName: 'भूगोल',
      code: 'GEOGRAPHY',
      category: 'HUMANITIES',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Economics',
      hindiName: 'अर्थशास्त्र',
      code: 'ECONOMICS',
      category: 'SOCIAL_SCIENCE',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'ASSISTANT_PROFESSOR',
        'RAS_GK'
      ],
    ),
    SubjectSuggestion(
      name: 'Sociology',
      hindiName: 'समाजशास्त्र',
      code: 'SOCIOLOGY',
      category: 'SOCIAL_SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Public Administration',
      hindiName: 'लोक प्रशासन',
      code: 'PUBLIC_ADMINISTRATION',
      category: 'SOCIAL_SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Philosophy',
      hindiName: 'दर्शनशास्त्र',
      code: 'PHILOSOPHY',
      category: 'HUMANITIES',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Psychology',
      hindiName: 'मनोविज्ञान',
      code: 'PSYCHOLOGY',
      category: 'SOCIAL_SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Education',
      hindiName: 'शिक्षा',
      code: 'EDUCATION',
      category: 'EDUCATION_TEACHING',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'ASSISTANT_PROFESSOR',
        'TEACHER_RECRUITMENT'
      ],
    ),
    SubjectSuggestion(
      name: 'Educational Psychology',
      hindiName: 'शैक्षिक मनोविज्ञान',
      code: 'EDUCATIONAL_PSYCHOLOGY',
      category: 'EDUCATION_TEACHING',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'TEACHER_RECRUITMENT'
      ],
    ),
    SubjectSuggestion(
      name: 'Teaching Aptitude',
      hindiName: 'शिक्षन अभिरुचि',
      code: 'TEACHING_APTITUDE',
      category: 'EDUCATION_TEACHING',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'TEACHER_RECRUITMENT'
      ],
    ),
    SubjectSuggestion(
      name: 'Child Development & Pedagogy',
      hindiName: 'बाल विकास एवम शिक्षाशास्त्र',
      code: 'CHILD_DEVELOPMENT_PEDAGOGY',
      category: 'EDUCATION_TEACHING',
      examFamilies: ['REET_LEVEL_2', 'TEACHER_RECRUITMENT'],
    ),
    SubjectSuggestion(
      name: 'Physics',
      hindiName: 'भौतिक विज्ञान',
      code: 'PHYSICS',
      category: 'SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Chemistry',
      hindiName: 'रसायन विज्ञान',
      code: 'CHEMISTRY',
      category: 'SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Botany',
      hindiName: 'वनस्पति विज्ञान',
      code: 'BOTANY',
      category: 'SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Zoology',
      hindiName: 'प्रानी विज्ञान',
      code: 'ZOOLOGY',
      category: 'SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Biology',
      hindiName: 'जीव विज्ञान',
      code: 'BIOLOGY',
      category: 'SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Geology',
      hindiName: 'भूविज्ञान',
      code: 'GEOLOGY',
      category: 'SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Statistics',
      hindiName: 'सांख्यिकि',
      code: 'STATISTICS',
      category: 'SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Computer Science',
      hindiName: 'कंप्यूटर विज्ञान',
      code: 'COMPUTER_SCIENCE',
      category: 'SCIENCE',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Commerce',
      hindiName: 'वानिज्य',
      code: 'COMMERCE',
      category: 'COMMERCE_MANAGEMENT',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Accountancy',
      hindiName: 'लेखांकन',
      code: 'ACCOUNTANCY',
      category: 'COMMERCE_MANAGEMENT',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Business Studies',
      hindiName: 'व्यवसाय अध्ययन',
      code: 'BUSINESS_STUDIES',
      category: 'COMMERCE_MANAGEMENT',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Business Administration',
      hindiName: 'व्यवसाय प्रशासन',
      code: 'BUSINESS_ADMINISTRATION',
      category: 'COMMERCE_MANAGEMENT',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'EAFM',
      hindiName: 'आर्थिक प्रशासन एवम वित्तीय प्रबन्धन',
      code: 'EAFM',
      category: 'COMMERCE_MANAGEMENT',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'ABST',
      hindiName: 'लेखांकन एवम व्यावसायिक सांख्यिकि',
      code: 'ABST',
      category: 'COMMERCE_MANAGEMENT',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Law',
      hindiName: 'विधि',
      code: 'LAW',
      category: 'LAW',
      examFamilies: ['ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Agriculture',
      hindiName: 'कृशि',
      code: 'AGRICULTURE',
      category: 'SPECIAL_TOPICS',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Home Science',
      hindiName: 'गृह विज्ञान',
      code: 'HOME_SCIENCE',
      category: 'SPECIAL_TOPICS',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Physical Education',
      hindiName: 'शारीरिक शिक्षा',
      code: 'PHYSICAL_EDUCATION',
      category: 'PHYSICAL_EDUCATION',
      examFamilies: [
        'FIRST_GRADE_SCHOOL_LECTURER',
        'SECOND_GRADE_SENIOR_TEACHER',
        'TEACHER_RECRUITMENT'
      ],
    ),
    SubjectSuggestion(
      name: 'Music',
      hindiName: 'संगीत',
      code: 'MUSIC',
      category: 'ARTS',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Drawing & Painting',
      hindiName: 'चित्रकला एवम पेंटिंग',
      code: 'DRAWING_PAINTING',
      category: 'ARTS',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Dance',
      hindiName: 'नृत्य',
      code: 'DANCE',
      category: 'ARTS',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'ASSISTANT_PROFESSOR'],
    ),
    SubjectSuggestion(
      name: 'Library Science',
      hindiName: 'पुस्तकालय विज्ञान',
      code: 'LIBRARY_SCIENCE',
      category: 'SPECIAL_TOPICS',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER', 'TEACHER_RECRUITMENT'],
    ),
    SubjectSuggestion(
      name: 'Textile Dyeing & Printing',
      hindiName: 'वस्त्र रंगाइ एवम छपाइ',
      code: 'TEXTILE_DYEING_PRINTING',
      category: 'SPECIAL_TOPICS',
      examFamilies: ['FIRST_GRADE_SCHOOL_LECTURER'],
    ),
    SubjectSuggestion(
      name: 'Environmental Studies',
      hindiName: 'पर्यावरन अध्ययन',
      code: 'ENVIRONMENTAL_STUDIES',
      category: 'SCIENCE',
      examFamilies: ['REET_LEVEL_2', 'TEACHER_RECRUITMENT'],
    ),
    SubjectSuggestion(
      name: 'Social Studies',
      hindiName: 'सामाजिक अध्ययन',
      code: 'SOCIAL_STUDIES',
      category: 'SOCIAL_SCIENCE',
      examFamilies: [
        'SECOND_GRADE_SENIOR_TEACHER',
        'REET_LEVEL_2',
        'TEACHER_RECRUITMENT'
      ],
    ),
    SubjectSuggestion(
      name: 'Ethics, Integrity & Aptitude',
      hindiName: 'नीतिशास्त्र, सत्यनिश्था एवम अभिरुचि',
      code: 'ETHICS',
      category: 'HUMANITIES',
      examFamilies: ['RAS_GK'],
    ),
    SubjectSuggestion(
      name: 'Social Justice',
      hindiName: 'सामाजिक न्याय',
      code: 'SOCIAL_JUSTICE',
      category: 'SOCIAL_SCIENCE',
      examFamilies: ['RAS_GK'],
    ),
    SubjectSuggestion(
      name: 'Internal Security',
      hindiName: 'आंतरिक सुरक्षा',
      code: 'INTERNAL_SECURITY',
      category: 'SPECIAL_TOPICS',
      examFamilies: ['RAS_GK'],
    ),
    SubjectSuggestion(
      name: 'International Relations',
      hindiName: 'अंतरराश्ट्रीय संबंध',
      code: 'INTERNATIONAL_RELATIONS',
      category: 'SOCIAL_SCIENCE',
      examFamilies: ['RAS_GK'],
    ),
    SubjectSuggestion(
      name: 'Disaster Management',
      hindiName: 'आपदा प्रबंधन',
      code: 'DISASTER_MANAGEMENT',
      category: 'SPECIAL_TOPICS',
      examFamilies: ['RAS_GK'],
    ),
  ];

  final Map<String, String> _busyDocs = {};

  bool _hasMojibake(String value) {
    return value.contains('?') ||
        value.contains('?') ||
        value.contains('?') ||
        value.contains('??') ||
        value.contains('??');
  }

  Future<void> _repairStarterHindiNamesIfNeeded(
    List<QueryDocumentSnapshot> docs,
  ) async {
    if (_starterHindiRepairQueued) return;
    _starterHindiRepairQueued = true;
    final starterByCode = {
      for (final subject in _suggestedSubjects) subject.code: subject
    };
    for (final doc in docs) {
      final data = doc.data() as Map<String, dynamic>;
      final source = data['source']?.toString() ?? '';
      if (!source.startsWith('rankcrackers_starter_subject_master')) continue;
      final subject = starterByCode[doc.id];
      if (subject == null) continue;
      final hindiName = data['hindiName']?.toString() ?? '';
      final subjectHindiName = data['subjectHindiName']?.toString() ?? '';
      if (!_hasMojibake(hindiName) && !_hasMojibake(subjectHindiName)) continue;
      await FirebaseFirestore.instance
          .collection('study_library_subjects')
          .doc(doc.id)
          .set({
        'hindiName': subject.hindiName,
        'subjectHindiName': subject.hindiName,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    }
  }

  Future<void> _addSuggestedSubject(SubjectSuggestion subject) async {
    final now = FieldValue.serverTimestamp();
    await FirebaseFirestore.instance
        .collection('study_library_subjects')
        .doc(subject.code)
        .set({
      'code': subject.code,
      'name': subject.name,
      'hindiName': subject.hindiName,
      'category': subject.category,
      'subjectType': 'UNIVERSAL_SUBJECT',
      'examFamilies': subject.examFamilies,
      'active': true,
      'createdAt': now,
      'updatedAt': now,
      'createdBy': FirebaseAuth.instance.currentUser?.uid,
      'source': 'rankcrackers_starter_subject_master',
      // Maintain compatibility fields
      'subjectId': subject.code,
      'subjectName': subject.name,
      'subjectCode': subject.code,
      'status': 'ACTIVE',
    }, SetOptions(merge: true));
  }

  @override
  void dispose() {
    _subNameCtrl.dispose();
    _subHindiCtrl.dispose();
    _subCodeCtrl.dispose();
    super.dispose();
  }

  Future<void> _createSubjectDialog() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: rcSurface,
        title: const Text(
          'CREATE NEW MASTER SUBJECT (ADVANCED)',
          style: TextStyle(
            color: rcGold,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RcField(
              controller: _subNameCtrl,
              label: 'Subject Name (e.g. Science)',
            ),
            const SizedBox(height: 12),
            RcField(
              controller: _subHindiCtrl,
              label: 'Hindi Name (optional)',
            ),
            const SizedBox(height: 12),
            RcField(
              controller: _subCodeCtrl,
              label: 'Subject Code (e.g. SCIENCE)',
            ),
            const SizedBox(height: 12),
            const Text(
              'Use only if a required subject is missing from the Universal Subject Master.',
              style: TextStyle(fontSize: 11, color: Colors.white38),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          OutlinedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final name = _subNameCtrl.text.trim();
              final hindi = _subHindiCtrl.text.trim();
              final code = _subCodeCtrl.text.trim().toUpperCase().replaceAll(
                    ' ',
                    '_',
                  );
              if (name.isEmpty || code.isEmpty) return;
              final now = FieldValue.serverTimestamp();
              await FirebaseFirestore.instance
                  .collection('study_library_subjects')
                  .doc(code)
                  .set({
                'code': code,
                'name': name,
                'hindiName': hindi,
                'category': 'SPECIAL_TOPICS',
                'subjectType': 'UNIVERSAL_SUBJECT',
                'examFamilies': ['RAJASTHAN_COMPETITIVE_EXAMS'],
                'active': true,
                'createdAt': now,
                'updatedAt': now,
                'createdBy': FirebaseAuth.instance.currentUser?.uid,
                'source': 'rankcrackers_starter_subject_master_manual',
                // Maintain compatibility fields
                'subjectId': code,
                'subjectName': name,
                'subjectCode': code,
                'status': 'ACTIVE',
              }, SetOptions(merge: true));
              _subNameCtrl.clear();
              _subHindiCtrl.clear();
              _subCodeCtrl.clear();
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  Future<void> _uploadMaterial() async {
    if (_selectedSubjectId == null) return;
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: [
        'pdf',
        'docx',
        'xlsx',
        'json',
        'csv',
        'txt',
        'png',
        'jpg',
        'webp',
      ],
      withData: true,
    );
    final file = result?.files.single;
    final bytes = file?.bytes;
    if (file == null || bytes == null) return;

    setState(() {
      _uploading = true;
      _error = null;
      _info = 'Uploading ${file.name}...';
    });

    try {
      final hash = sha256.convert(bytes).toString();
      final materialId = 'hash_$hash';
      final ext = file.extension?.toLowerCase() ?? 'pdf';
      final storagePath =
          'study_library/subjects/$_selectedSubjectId/materials/$materialId.$ext';

      final ref = FirebaseStorage.instance.ref(storagePath);
      await ref.putData(
          bytes, SettableMetadata(contentType: mimeForExtension(ext)));
      final downloadUrl = await ref.getDownloadURL();

      final now = FieldValue.serverTimestamp();
      final materialData = {
        'materialId': materialId,
        'id': materialId,
        'subjectId': _selectedSubjectId,
        'subjectName': _selectedSubjectName,
        'fileName': file.name,
        'name': file.name,
        'storagePath': storagePath,
        'downloadUrl': downloadUrl,
        'uploadedBy': FirebaseAuth.instance.currentUser?.uid,
        'uploadedAt': now,
        'documentType': 'study_material',
        'extractionStatus': 'RECEIVED',
        'reviewStatus': 'PENDING',
        'publishStatus': 'draft',
        'aiClassificationStatus': 'pending',
        'source': 'web_founder_study_library',
        'optionalMissionIds': [],
        'optionalVariableIds': [],
        'tags': [],
        'detectedSubtopics': [],
        'detectedExamUses': [],
      };

      await FirebaseFirestore.instance
          .collection('study_library_subjects')
          .doc(_selectedSubjectId)
          .collection('materials')
          .doc(materialId)
          .set(materialData, SetOptions(merge: true));

      await FirebaseFirestore.instance
          .collection('ingestion_refinery')
          .doc(materialId)
          .set({
        ...materialData,
        'sourceId': materialId,
        'fileType': ext,
        'mimeType': mimeForExtension(ext),
        'fileSize': bytes.length,
        'fileHash': hash,
        'assetType': 'study_material',
        'status': 'uploaded',
        'documentStatus': 'LIVE',
        'sourceUrl': downloadUrl,
        'createdAt': now,
        'updatedAt': now,
        'uploadedFrom': 'web_founder_study_library',
      }, SetOptions(merge: true));

      await FirebaseFirestore.instance
          .collection('ai_queue')
          .doc(materialId)
          .set({
        'type': 'pdfParse',
        'provider': 'gemini',
        'payload': {
          'id': materialId,
          'fileName': file.name,
          'filePath': downloadUrl,
          'storagePath': storagePath,
          'fileType': ext,
          'mimeType': mimeForExtension(ext),
          'intent': 'study_material',
          'fileHash': hash,
          'subjectId': _selectedSubjectId,
          'subjectName': _selectedSubjectName,
        },
        'status': 'received',
        'manualTrigger': true,
        'createdAt': now,
        'triggeredFrom': 'web_founder_study_library',
      }, SetOptions(merge: true));

      await FirebaseFirestore.instance
          .collection('study_library_subjects')
          .doc(_selectedSubjectId)
          .update({'materialCount': FieldValue.increment(1), 'updatedAt': now});

      setState(() {
        _info = 'Uploaded successfully and queued in AI Refinery!';
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _uploading = false);
    }
  }

  Future<void> _callDocAction(
    String docId,
    String docAction,
    String loadingText,
  ) async {
    setState(() => _busyDocs[docId] = loadingText);
    try {
      await FirebaseFunctions.instance
          .httpsCallable('handleSentinelAction')
          .call({'action': docAction, 'sourceId': docId});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Action $docAction successfully completed.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _busyDocs.remove(docId));
      }
    }
  }

  Widget _buildUploadPanel() {
    final isSelected = _selectedSubjectId != null;
    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: rcSurface,
        border: Border.all(
            color: isSelected ? rcGold.withValues(alpha: 0.3) : rcLine),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isSelected
                          ? 'UPLOAD STUDY MATERIAL TO ${_selectedSubjectName?.toUpperCase()}'
                          : 'UPLOAD STUDY MATERIAL',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: rcGold,
                        letterSpacing: 1.1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isSelected
                          ? 'Subject: $_selectedSubjectName ($_selectedSubjectId)'
                          : 'Select a subject before uploading study material.',
                      style: TextStyle(
                        color: isSelected ? Colors.white70 : rcRed,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              FilledButton.icon(
                onPressed: (isSelected && !_uploading) ? _uploadMaterial : null,
                icon: const Icon(Icons.cloud_upload_rounded),
                label: Text(
                  _uploading ? 'UPLOADING...' : 'UPLOAD MATERIAL',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                style: FilledButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  backgroundColor: isSelected ? rcGold : Colors.white10,
                  foregroundColor: isSelected ? Colors.black : Colors.white30,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterRow() {
    final categories = [
      'ALL',
      'GENERAL_GK',
      'LANGUAGE',
      'LITERATURE',
      'HUMANITIES',
      'SOCIAL_SCIENCE',
      'SCIENCE',
      'COMMERCE_MANAGEMENT',
      'LAW',
      'EDUCATION_TEACHING',
      'ARTS',
      'PHYSICAL_EDUCATION',
      'SPECIAL_TOPICS',
    ];

    final examFamilies = [
      'ALL',
      'ASSISTANT_PROFESSOR',
      'FIRST_GRADE_SCHOOL_LECTURER',
      'SECOND_GRADE_SENIOR_TEACHER',
      'REET_LEVEL_2',
      'RAS_GK',
      'COMMON_GK',
      'RAJASTHAN_COMPETITIVE_EXAMS',
      'TEACHER_RECRUITMENT',
      'COLLEGE_EDUCATION',
    ];

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: rcSurface,
        border: Border.all(color: rcLine),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: TextField(
              decoration: const InputDecoration(
                labelText: 'Search (Name, Hindi, or Code)',
                prefixIcon: Icon(Icons.search_rounded, size: 20),
                border: OutlineInputBorder(),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              style: const TextStyle(fontSize: 13),
              onChanged: (val) {
                setState(() {
                  _searchQuery = val.trim();
                });
              },
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _filterCategory ?? 'ALL',
              decoration: const InputDecoration(
                labelText: 'Category',
                border: OutlineInputBorder(),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              style: const TextStyle(color: Colors.white, fontSize: 13),
              dropdownColor: rcSurface,
              items: categories.map((cat) {
                return DropdownMenuItem<String>(
                  value: cat,
                  child: Text(
                    cat.replaceAll('_', ' '),
                    style: const TextStyle(fontSize: 12),
                  ),
                );
              }).toList(),
              onChanged: (val) {
                setState(() {
                  _filterCategory = (val == 'ALL') ? null : val;
                });
              },
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _filterExamFamily ?? 'ALL',
              decoration: const InputDecoration(
                labelText: 'Exam Family',
                border: OutlineInputBorder(),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              style: const TextStyle(color: Colors.white, fontSize: 13),
              dropdownColor: rcSurface,
              items: examFamilies.map((fam) {
                return DropdownMenuItem<String>(
                  value: fam,
                  child: Text(
                    fam.replaceAll('_', ' '),
                    style: const TextStyle(fontSize: 12),
                  ),
                );
              }).toList(),
              onChanged: (val) {
                setState(() {
                  _filterExamFamily = (val == 'ALL') ? null : val;
                });
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStarterSubjectCard(SubjectSuggestion subject, bool exists) {
    Color categoryColor;
    switch (subject.category) {
      case 'GENERAL_GK':
        categoryColor = Colors.amber;
        break;
      case 'LANGUAGE':
      case 'LITERATURE':
        categoryColor = Colors.deepPurpleAccent;
        break;
      case 'HUMANITIES':
      case 'SOCIAL_SCIENCE':
        categoryColor = Colors.blueAccent;
        break;
      case 'SCIENCE':
        categoryColor = Colors.greenAccent;
        break;
      case 'COMMERCE_MANAGEMENT':
      case 'LAW':
        categoryColor = Colors.orangeAccent;
        break;
      case 'EDUCATION_TEACHING':
        categoryColor = Colors.pinkAccent;
        break;
      default:
        categoryColor = Colors.blueGrey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: rcSurface,
        border:
            Border.all(color: exists ? rcGreen.withValues(alpha: 0.2) : rcLine),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      subject.name,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      ' - ${subject.hindiName}',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white12,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        subject.code,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: rcGold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: categoryColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                            color: categoryColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        subject.category.replaceAll('_', ' '),
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: categoryColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: subject.examFamilies.map((fam) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.03),
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.08)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        fam.replaceAll('_', ' '),
                        style: const TextStyle(
                          fontSize: 8.5,
                          color: Colors.white38,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          exists
              ? Row(
                  children: const [
                    Icon(Icons.check_circle_rounded, color: rcGreen, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'Already Added',
                      style: TextStyle(
                        color: rcGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ],
                )
              : OutlinedButton.icon(
                  onPressed: () => _addSuggestedSubject(subject),
                  icon: const Icon(Icons.add_rounded, size: 16),
                  label: const Text('Add to Library'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: rcGold,
                    side: const BorderSide(color: rcGold),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildUniversalSubjectMasterSection(Set<String> existingCodes) {
    final filtered = _suggestedSubjects.where((sub) {
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final inName = sub.name.toLowerCase().contains(q);
        final inHindi = sub.hindiName.toLowerCase().contains(q);
        final inCode = sub.code.toLowerCase().contains(q);
        if (!inName && !inHindi && !inCode) return false;
      }
      if (_filterCategory != null && _filterCategory != 'ALL') {
        if (sub.category != _filterCategory) return false;
      }
      if (_filterExamFamily != null && _filterExamFamily != 'ALL') {
        if (!sub.examFamilies.contains(_filterExamFamily)) return false;
      }
      return true;
    }).toList();

    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'STARTER SUBJECT MASTER',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: rcGold,
                  letterSpacing: 1.2,
                ),
              ),
              Text(
                '${filtered.length} of ${_suggestedSubjects.length} available',
                style: const TextStyle(fontSize: 12, color: Colors.white30),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildFilterRow(),
          const SizedBox(height: 16),
          Expanded(
            child: filtered.isEmpty
                ? const Center(
                    child: Text(
                      'No universal subjects match the active filters.',
                      style: TextStyle(color: Colors.white24, fontSize: 13),
                    ),
                  )
                : ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final subject = filtered[index];
                      final exists = existingCodes.contains(subject.code);
                      return _buildStarterSubjectCard(subject, exists);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveSubjectMaterialsPane(
      Map<String, dynamic>? selectedSubjectDocData) {
    String englishName = _selectedSubjectName ?? '';
    String hindiName = '';
    String category = '';
    List<String> examFamilies = [];

    final match = _suggestedSubjects.cast<SubjectSuggestion?>().firstWhere(
          (s) => s?.code == _selectedSubjectId,
          orElse: () => null,
        );
    if (match != null) {
      englishName = match.name;
      hindiName = match.hindiName;
      category = match.category;
      examFamilies = match.examFamilies;
    } else if (selectedSubjectDocData != null) {
      englishName = selectedSubjectDocData['name'] ??
          selectedSubjectDocData['subjectName'] ??
          _selectedSubjectName ??
          '';
      hindiName = selectedSubjectDocData['hindiName'] ?? '';
      category = selectedSubjectDocData['category'] ?? '';
      if (selectedSubjectDocData['examFamilies'] is List) {
        examFamilies =
            List<String>.from(selectedSubjectDocData['examFamilies']);
      }
    }

    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: rcSurface,
              border: Border.all(color: rcLine),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          englishName,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: rcGold,
                          ),
                        ),
                        if (hindiName.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Text(
                            ' - $hindiName',
                            style: const TextStyle(
                              fontSize: 16,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white12,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            _selectedSubjectId!,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white70,
                            ),
                          ),
                        ),
                      ],
                    ),
                    OutlinedButton.icon(
                      onPressed: () {
                        setState(() {
                          _selectedSubjectId = null;
                          _selectedSubjectName = null;
                        });
                      },
                      icon: const Icon(Icons.arrow_back_rounded, size: 16),
                      label: const Text('Back to Subject Master'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white54,
                        side: const BorderSide(color: rcLine),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ],
                ),
                if (category.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Category: ${category.replaceAll('_', ' ')}',
                    style: const TextStyle(color: Colors.white30, fontSize: 12),
                  ),
                ],
                if (examFamilies.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: examFamilies.map((fam) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.03),
                          border: Border.all(
                              color: Colors.white.withValues(alpha: 0.08)),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          fam.replaceAll('_', ' '),
                          style: const TextStyle(
                            fontSize: 9,
                            color: Colors.white38,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'SUBJECT KNOWLEDGE BLOCKS',
            style: TextStyle(
              fontSize: 14,
              color: rcGold,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('study_library_subjects')
                  .doc(_selectedSubjectId)
                  .collection('materials')
                  .snapshots(),
              builder: (context, snapshot) {
                final docs = snapshot.data?.docs ?? [];
                if (docs.isEmpty) {
                  return const Center(
                    child: Text(
                      'No study materials uploaded for this subject yet.',
                      style: TextStyle(color: Colors.white24),
                    ),
                  );
                }
                return ListView.builder(
                  itemCount: docs.length,
                  itemBuilder: (context, index) {
                    final data = docs[index].data() as Map<String, dynamic>;
                    final matId = docs[index].id;
                    final name = data['name'] ?? data['fileName'] ?? matId;
                    final pubStatus = (data['publishStatus'] ?? 'draft')
                        .toString()
                        .toUpperCase();

                    Color statusColor = rcGold;
                    if (pubStatus == 'PUBLISHED') {
                      statusColor = rcGreen;
                    } else if (pubStatus == 'ARCHIVED') {
                      statusColor = Colors.grey;
                    }

                    return Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 14, horizontal: 16),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: rcSurface,
                        border: Border.all(color: rcLine),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  name,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color:
                                            statusColor.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        pubStatus,
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: statusColor,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      'ID: $matId',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.white24,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          _busyDocs.containsKey(matId)
                              ? Padding(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const SizedBox(
                                        width: 14,
                                        height: 14,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: rcGold,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _busyDocs[matId]!,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: rcGold,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : Wrap(
                                  spacing: 8,
                                  children: [
                                    if (pubStatus != 'PUBLISHED')
                                      OutlinedButton(
                                        onPressed: () => _callDocAction(
                                          matId,
                                          'publish',
                                          'Publishing...',
                                        ),
                                        child: const Text('Publish',
                                            style: TextStyle(fontSize: 13)),
                                      ),
                                    if (pubStatus == 'PUBLISHED')
                                      OutlinedButton(
                                        onPressed: () => _callDocAction(
                                          matId,
                                          'unpublish',
                                          'Unpublishing...',
                                        ),
                                        child: const Text('Unpublish',
                                            style: TextStyle(fontSize: 13)),
                                      ),
                                    OutlinedButton(
                                      onPressed: () => _callDocAction(
                                        matId,
                                        'reprocess',
                                        'Reprocessing...',
                                      ),
                                      child: const Text('Reprocess',
                                          style: TextStyle(fontSize: 13)),
                                    ),
                                    if (pubStatus != 'ARCHIVED')
                                      OutlinedButton(
                                        onPressed: () => _callDocAction(
                                          matId,
                                          'archive',
                                          'Archiving...',
                                        ),
                                        child: const Text('Archive',
                                            style: TextStyle(fontSize: 13)),
                                      ),
                                  ],
                                ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          Container(
            width: 320,
            decoration: const BoxDecoration(
              border: Border(right: BorderSide(color: rcLine)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Padding(
                  padding: EdgeInsets.fromLTRB(20, 20, 20, 4),
                  child: RcPageTitle(
                    title: 'STUDY MASTER LIBRARY',
                    subtitle:
                        'Maintain independent subject-wise study material library.',
                  ),
                ),
                if (widget.roleMode == ConsoleRoleMode.founder)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        OutlinedButton.icon(
                          onPressed: _createSubjectDialog,
                          icon: const Icon(Icons.add_rounded, size: 16),
                          label: const Text('Manual Create (Advanced)',
                              style: TextStyle(fontSize: 12)),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Use only if a required subject is missing from the Universal Subject Master.',
                          style: TextStyle(fontSize: 9, color: Colors.white38),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                const Divider(color: rcLine, height: 1),
                Expanded(
                  child: StreamBuilder<QuerySnapshot>(
                    stream: FirebaseFirestore.instance
                        .collection('study_library_subjects')
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (snapshot.hasError) {
                        return RcDataStateMessage(
                          icon: Icons.lock_outline_rounded,
                          title: 'Subjects unavailable',
                          message: snapshot.error.toString(),
                        );
                      }
                      final docs = snapshot.data?.docs ?? [];
                      _repairStarterHindiNamesIfNeeded(docs);
                      return ListView(
                        padding: EdgeInsets.zero,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 8),
                            child: Text(
                              'Active Library Subjects: ${docs.length}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: Colors.white70,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const Divider(color: rcLine),
                          ListTile(
                            selected: _selectedSubjectId == null,
                            selectedTileColor:
                                Colors.white.withValues(alpha: 0.04),
                            leading: Icon(
                              Icons.apps_rounded,
                              color: _selectedSubjectId == null
                                  ? rcGold
                                  : Colors.white54,
                            ),
                            title: Text(
                              'Browse Subject Master',
                              style: TextStyle(
                                color: _selectedSubjectId == null
                                    ? rcGold
                                    : Colors.white70,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            subtitle: const Text(
                              'View all 71 universal subjects',
                              style: TextStyle(
                                  fontSize: 11, color: Colors.white38),
                            ),
                            onTap: () {
                              setState(() {
                                _selectedSubjectId = null;
                                _selectedSubjectName = null;
                              });
                            },
                          ),
                          const Divider(color: rcLine),
                          if (docs.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 16),
                              child: Text(
                                'No subjects added to your active library yet. Select a starter subject on the right to add it.',
                                style: TextStyle(
                                    color: Colors.white30, fontSize: 12),
                              ),
                            )
                          else
                            ...docs.map((doc) {
                              final data = doc.data() as Map<String, dynamic>;
                              final id = doc.id;
                              final name =
                                  data['subjectName'] ?? data['name'] ?? id;
                              final count = data['materialCount'] ?? 0;
                              final active = _selectedSubjectId == id;
                              return ListTile(
                                selected: active,
                                selectedTileColor: Colors.white.withValues(
                                  alpha: 0.04,
                                ),
                                title: Text(
                                  name.toString().toUpperCase(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: active ? rcGold : Colors.white70,
                                    fontWeight: active
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                    fontSize: 14,
                                  ),
                                ),
                                subtitle: Text(
                                  '$count assets - ${data['subjectCode'] ?? data['code'] ?? id}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.white30,
                                  ),
                                ),
                                onTap: () {
                                  setState(() {
                                    _selectedSubjectId = id;
                                    _selectedSubjectName = name;
                                  });
                                },
                              );
                            }),
                        ],
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('study_library_subjects')
                    .snapshots(),
                builder: (context, snapshot) {
                  final docs = snapshot.data?.docs ?? [];
                  final existingCodes = docs.map((doc) => doc.id).toSet();

                  Map<String, dynamic>? selectedSubjectDocData;
                  if (_selectedSubjectId != null) {
                    final matchedDoc =
                        docs.cast<QueryDocumentSnapshot?>().firstWhere(
                              (d) => d?.id == _selectedSubjectId,
                              orElse: () => null,
                            );
                    if (matchedDoc != null) {
                      selectedSubjectDocData =
                          matchedDoc.data() as Map<String, dynamic>;
                    }
                  }

                  return Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (widget.roleMode == ConsoleRoleMode.founder)
                          _buildUploadPanel(),
                        if (_error != null) ...[
                          Text(_error!, style: const TextStyle(color: rcRed)),
                          const SizedBox(height: 12),
                        ],
                        if (_info != null) ...[
                          Text(_info!, style: const TextStyle(color: rcGreen)),
                          const SizedBox(height: 12),
                        ],
                        if (_selectedSubjectId == null)
                          _buildUniversalSubjectMasterSection(existingCodes)
                        else
                          _buildActiveSubjectMaterialsPane(
                              selectedSubjectDocData),
                      ],
                    ),
                  );
                }),
          ),
        ],
      ),
    );
  }
}
