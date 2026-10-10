import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/course.dart';

class CourseRepository {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;
  static const String collection = 'courses';

  // ===================================================
  // CREATE COURSE 
  // ===================================================
  static Future<void> create(Course course) async {
    await _db.collection(collection).doc(course.id).set(course.toMap());
  }

  // ===================================================
  // STREAM COURSES 
  // ===================================================
  static Stream<List<Course>> stream() {
    return _db.collection(collection).snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Course.fromMap(doc.data())).toList();
    });
  }
}
