import 'package:equatable/equatable.dart';

/// 🔱 DIGIBOOK CHAPTER (Blueprint v1.0)
class DigiBookChapter extends Equatable {
  final String id;
  final String realmId;
  final String title;
  final String subject;
  final List<String> unitIds; // List of DigiBookUnit IDs
  final int order;

  const DigiBookChapter({
    required this.id,
    required this.realmId,
    required this.title,
    required this.subject,
    required this.unitIds,
    this.order = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'realm_id': realmId,
      'title': title,
      'subject': subject,
      'unit_ids': unitIds,
      'order': order,
    };
  }

  factory DigiBookChapter.fromMap(Map<String, dynamic> map) {
    return DigiBookChapter(
      id: map['id'] ?? '',
      realmId: map['realm_id'] ?? '',
      title: map['title'] ?? '',
      subject: map['subject'] ?? '',
      unitIds: List<String>.from(map['unit_ids'] ?? []),
      order: map['order'] ?? 0,
    );
  }

  @override
  List<Object?> get props => [id, realmId, title, unitIds];
}
