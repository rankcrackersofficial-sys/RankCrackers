import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/syllabus/data/structured_syllabus_mapper.dart';

void main() {
  test('maps activated mission hierarchy into topics under their true subject and unit', () {
    final nodes = StructuredSyllabusMapper.toStudentNodes(
      missionId: 'exam_alpha',
      documents: [
        {
          'id': 'paper-1',
          'nodeType': 'paper',
          'canonicalTitle': 'Paper I',
          'sourceOrder': 0,
        },
        {
          'id': 'subject-physics',
          'nodeType': 'subject',
          'canonicalTitle': 'Physics',
          'parentId': 'paper-1',
          'sourceOrder': 1,
        },
        {
          'id': 'unit-motion',
          'nodeType': 'unit',
          'canonicalTitle': 'Motion',
          'parentId': 'subject-physics',
          'sourceOrder': 2,
        },
        {
          'id': 'topic-speed',
          'nodeType': 'topic',
          'canonicalTitle': 'Speed and Velocity',
          'subjectId': 'subject-physics',
          'parentId': 'unit-motion',
          'paperId': 'paper-1',
          'sourceOrder': 3,
        },
      ],
    );

    expect(nodes, hasLength(1));
    expect(nodes.single.examId, 'exam_alpha');
    expect(nodes.single.subjectId, 'Physics');
    expect(nodes.single.canonicalSubjectId, 'subject-physics');
    expect(nodes.single.chapterId, 'Motion');
    expect(nodes.single.title, 'Speed and Velocity');
    expect(nodes.single.paperId, 'paper-1');
  });

  test('fails closed for missing mission and unresolved subject authority', () {
    expect(
      StructuredSyllabusMapper.toStudentNodes(
        missionId: '',
        documents: [
          {'id': 'topic-1', 'nodeType': 'topic'},
        ],
      ),
      isEmpty,
    );

    expect(
      StructuredSyllabusMapper.toStudentNodes(
        missionId: 'exam_alpha',
        documents: [
          {
            'id': 'topic-1',
            'nodeType': 'topic',
            'canonicalTitle': 'Unbound Topic',
            'subjectId': 'missing-subject',
            'sourceOrder': 1,
          },
        ],
      ),
      isEmpty,
    );
  });
}
