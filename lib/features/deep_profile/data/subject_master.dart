/// 🔱 SUBJECT MASTER DATA (Document 50A Phase 8)
/// Categorized master lists for academic and professional subjects with canonical IDs.
class SubjectMaster {

  // 🔱 CLASS 10 CANONICAL CATALOG
  static const Map<String, String> class10Subjects = {
    'mathematics': 'Mathematics',
    'science': 'Science',
    'social_science': 'Social Science',
    'english': 'English',
    'hindi': 'Hindi',
    'sanskrit': 'Sanskrit',
    'computer_science': 'Computer Science / IT',
    'physical_education': 'Physical Education',
    'art': 'Art',
  };

  // 🔱 CLASS 11/12 STREAM-AWARE CATALOGS
  static const Map<String, String> medicalSubjects = {
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'english': 'English',
    'biotechnology': 'Biotechnology',
    'psychology': 'Psychology',
    'physical_education': 'Physical Education',
    'hindi': 'Hindi',
    'mathematics': 'Mathematics (Additional)',
  };

  static const Map<String, String> nonMedicalSubjects = {
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'mathematics': 'Mathematics',
    'english': 'English',
    'computer_science': 'Computer Science',
    'economics': 'Economics',
    'physical_education': 'Physical Education',
    'hindi': 'Hindi',
  };

  static const Map<String, String> commerceSubjects = {
    'accountancy': 'Accountancy',
    'business_studies': 'Business Studies',
    'economics': 'Economics',
    'mathematics': 'Mathematics',
    'english': 'English',
    'informatics_practices': 'Informatics Practices',
    'entrepreneurship': 'Entrepreneurship',
    'hindi': 'Hindi',
  };

  static const Map<String, String> humanitiesSubjects = {
    'history': 'History',
    'political_science': 'Political Science',
    'geography': 'Geography',
    'sociology': 'Sociology',
    'psychology': 'Psychology',
    'economics': 'Economics',
    'english': 'English',
    'hindi_literature': 'Hindi Literature',
    'english_literature': 'English Literature',
    'sanskrit': 'Sanskrit',
    'fine_arts': 'Fine Arts',
    'home_science': 'Home Science',
  };

  // 🔱 HIGHER ED / GENERAL CATALOG
  static final Map<String, String> generalSubjects = {
    ...class10Subjects,
    ...medicalSubjects,
    ...nonMedicalSubjects,
    ...commerceSubjects,
    ...humanitiesSubjects,
    'botany': 'Botany',
    'zoology': 'Zoology',
    'microbiology': 'Microbiology',
    'civil_engineering': 'Civil Engineering',
    'mechanical_engineering': 'Mechanical Engineering',
    'electrical_engineering': 'Electrical Engineering',
    'electronics_engineering': 'Electronics Engineering',
    'law': 'Law',
    'management': 'Management',
    'social_work': 'Social Work',
    'library_science': 'Library Science',
    'journalism': 'Journalism',
  };

  static List<String> getSuggestions({String? level, String? stream}) {
    if (level == 'Class 10') {
      return class10Subjects.values.toList();
    }

    if (level == 'Class 11' || level == 'Class 12') {
      switch (stream) {
        case 'Medical / PCB':
          return medicalSubjects.values.toList();
        case 'Non-Medical / PCM':
          return nonMedicalSubjects.values.toList();
        case 'Commerce':
          return commerceSubjects.values.toList();
        case 'Humanities':
          return humanitiesSubjects.values.toList();
      }
    }

    return generalSubjects.values.toList();
  }

  static String normalize(String subject) {
    final low = subject.toLowerCase().trim();
    if (low == 'math' || low == 'maths') return 'mathematics';
    if (low == 'bio') return 'biology';
    if (low == 'phy') return 'physics';
    if (low == 'chem') return 'chemistry';
    if (low == 'accounts') return 'accountancy';

    final entry = generalSubjects.entries.firstWhere(
      (e) => e.value.toLowerCase() == low || e.key == low,
      orElse: () => MapEntry(low.replaceAll(' ', '_'), subject),
    );
    return entry.key;
  }

  static String getLabel(String id) {
    return generalSubjects[id] ?? id.split('_').map((s) => s.isNotEmpty ? s[0].toUpperCase() + s.substring(1) : '').join(' ');
  }

  static List<String> getByStream(String stream) {
    switch (stream.toLowerCase()) {
      case 'medical':
      case 'pcb':
        return medicalSubjects.values.toList();
      case 'non-medical':
      case 'pcm':
        return nonMedicalSubjects.values.toList();
      case 'commerce':
        return commerceSubjects.values.toList();
      case 'humanities':
      case 'arts':
        return humanitiesSubjects.values.toList();
      default:
        return generalSubjects.values.toList();
    }
  }
}
