import '../domain/models/subject_model.dart';

class LocalSyllabusDatabase {

  static List<SubjectModel> getSubjects() {

    return const [

      SubjectModel(

        id: "1",

        name: "History",

        totalTopics: 120,

        completedTopics: 48,

        totalQuestions: 2400,

        completedQuestions: 920,

        accuracy: 42,

        icon: "history",

        isWeak: true,

        isCompleted: false,

        topics: [

          "Ancient History",

          "Medieval History",

          "Modern History",

          "World History",
        ],
      ),

      SubjectModel(

        id: "2",

        name: "Polity",

        totalTopics: 90,

        completedTopics: 62,

        totalQuestions: 1800,

        completedQuestions: 1260,

        accuracy: 68,

        icon: "polity",

        isWeak: false,

        isCompleted: false,

        topics: [

          "Constitution",

          "Fundamental Rights",

          "Parliament",

          "Judiciary",
        ],
      ),

      SubjectModel(

        id: "3",

        name: "Geography",

        totalTopics: 110,

        completedTopics: 30,

        totalQuestions: 2100,

        completedQuestions: 700,

        accuracy: 38,

        icon: "geography",

        isWeak: true,

        isCompleted: false,

        topics: [

          "Indian Geography",

          "World Geography",

          "Climate",

          "Rivers",
        ],
      ),

      SubjectModel(

        id: "4",

        name: "Science",

        totalTopics: 140,

        completedTopics: 95,

        totalQuestions: 2800,

        completedQuestions: 1940,

        accuracy: 74,

        icon: "science",

        isWeak: false,

        isCompleted: false,

        topics: [

          "Physics",

          "Chemistry",

          "Biology",

          "Environment",
        ],
      ),

      SubjectModel(

        id: "5",

        name: "Reasoning",

        totalTopics: 80,

        completedTopics: 70,

        totalQuestions: 1600,

        completedQuestions: 1420,

        accuracy: 82,

        icon: "reasoning",

        isWeak: false,

        isCompleted: true,

        topics: [

          "Analogy",

          "Coding-Decoding",

          "Series",

          "Blood Relation",
        ],
      ),

      SubjectModel(

        id: "6",

        name: "Current Affairs",

        totalTopics: 150,

        completedTopics: 52,

        totalQuestions: 3000,

        completedQuestions: 1210,

        accuracy: 55,

        icon: "current_affairs",

        isWeak: false,

        isCompleted: false,

        topics: [

          "National News",

          "International News",

          "Sports",

          "Economy",
        ],
      ),
    ];
  }

  // =========================
  // GET SYLLABUS BY EXAM ID
  // =========================

  static SubjectModel getExamSyllabus(
      String examId,
      ) {

    return getSubjects().firstWhere(
          (subject) => subject.id == examId,
      orElse: () => getSubjects().first,
    );
  }
}