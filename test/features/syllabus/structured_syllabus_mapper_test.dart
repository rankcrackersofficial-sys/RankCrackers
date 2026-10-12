import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/syllabus/data/structured_syllabus_mapper.dart';

void main() {
  test('maps activated mission hierarchy into topics under their true subject and unit', () {
    final nodes = StructuredSyllabusMapper.toStudentNodes(
      missionId: 'exam_alpha',
      documents: [
        {
          'id': 'paper-1',
          'activationEpoch': 8,
          'nodeType': 'paper',
          'canonicalTitle': 'Paper I',
          'sourceOrder': 0,
        },
        {
          'id': 'subject-physics',
          'activationEpoch': 8,
          'nodeType': 'subject',
          'canonicalTitle': 'Physics',
          'parentId': 'paper-1',
          'sourceOrder': 1,
        },
        {
          'id': 'unit-motion',
          'activationEpoch': 8,
          'nodeType': 'unit',
          'canonicalTitle': 'Motion',
          'parentId': 'subject-physics',
          'sourceOrder': 2,
        },
        {
          'id': 'topic-speed',
          'activationEpoch': 8,
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
          {'id': 'topic-1', 'activationEpoch': 8,
          'nodeType': 'topic'},
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
            'activationEpoch': 8,
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

  test('ignores prior and unactivated projection nodes', () {
    final nodes = StructuredSyllabusMapper.toStudentNodes(
      missionId: 'exam_alpha',
      documents: [
        {
          'id': 'subject',
          'nodeType': 'subject',
          'canonicalTitle': 'Math',
          'activationEpoch': 9,
        },
        {
          'id': 'old-unit',
          'nodeType': 'unit',
          'canonicalTitle': 'Old Unit',
          'parentId': 'subject',
          'activationEpoch': 9,
        },
        {
          'id': 'old-topic',
          'nodeType': 'topic',
          'canonicalTitle': 'Old Topic',
          'subjectId': 'subject',
          'parentId': 'old-unit',
          'activationEpoch': 9,
        },
        {
          'id': 'subject',
          'nodeType': 'subject',
          'canonicalTitle': 'Math',
          'activationEpoch': 10,
        },
        {
          'id': 'unit',
          'nodeType': 'unit',
          'canonicalTitle': 'Current Unit',
          'parentId': 'subject',
          'activationEpoch': 10,
        },
        {
          'id': 'current-topic',
          'nodeType': 'topic',
          'canonicalTitle': 'Current Topic',
          'subjectId': 'subject',
          'parentId': 'unit',
          'activationEpoch': 10,
        },
        {
          'id': 'raw-b3-topic',
          'nodeType': 'topic',
          'canonicalTitle': 'Not Activated',
          'subjectId': 'subject',
        },
      ],
    );

    expect(nodes.map((node) => node.title), ['Current Topic']);
  });
}
