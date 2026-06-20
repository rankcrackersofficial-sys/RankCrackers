/// 🔱 SUBJECT MASTER DATA
/// Categorized master lists for academic and professional subjects.
class SubjectMaster {
  static const List<String> artsSubjects = [
    'History',
    'Political Science',
    'Geography',
    'Hindi Literature',
    'English Literature',
    'Sociology',
    'Psychology',
    'Economics',
    'Public Administration',
    'Philosophy',
    'Sanskrit',
    'Urdu',
    'Drawing & Painting',
    'Music',
    'Home Science',
    'Fine Arts',
    'Physical Education',
    'Punjabi',
    'Gujarati',
    'Sindhi',
  ];

  static const List<String> scienceSubjects = [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Botany',
    'Zoology',
    'Biotechnology',
    'Computer Science',
    'Statistics',
    'Geology',
    'Environmental Science',
    'Agriculture',
    'Forestry',
    'Veterinary Science',
    'Microbiology',
    'Genetics',
  ];

  static const List<String> commerceSubjects = [
    'Accountancy',
    'Business Administration',
    'Economics',
    'Finance',
    'Taxation',
    'Costing',
    'Banking',
    'Insurance',
    'E-Commerce',
  ];

  static const List<String> professionalSubjects = [
    'Law',
    'Education',
    'Nursing',
    'Pharmacy',
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Electronics Engineering',
    'Management',
    'Social Work',
    'Library Science',
    'Journalism',
  ];

  static List<String> getAll() {
    return [
      ...artsSubjects,
      ...scienceSubjects,
      ...commerceSubjects,
      ...professionalSubjects
    ];
  }

  static List<String> getByStream(String stream) {
    switch (stream.toLowerCase()) {
      case 'arts':
        return artsSubjects;
      case 'science':
        return scienceSubjects;
      case 'commerce':
        return commerceSubjects;
      case 'law':
      case 'engineering':
      case 'professional':
        return professionalSubjects;
      default:
        return getAll();
    }
  }
}
