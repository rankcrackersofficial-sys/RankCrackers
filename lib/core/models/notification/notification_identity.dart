import 'package:cloud_firestore/cloud_firestore.dart';

/// 🔱 NOTIFICATION IDENTITY (v1.0)
class NotificationIdentity {
  final String notificationId;
  final String notificationNumber; // Advertisement Number
  final String notificationTitle;
  final String organization;
  final String recruitmentName;
  final String recruitmentCode;
  final DateTime? publicationDate;
  final String documentVersion;
  final String documentLanguage;
  final String documentStatus;
  final String sourceUrl;
  final String sourceHash;
  final String? linkedRealmId; // 🔱 For Sprint E.1 Resolution

  NotificationIdentity({
    required this.notificationId,
    required this.notificationNumber,
    required this.notificationTitle,
    required this.organization,
    required this.recruitmentName,
    required this.recruitmentCode,
    this.publicationDate,
    required this.documentVersion,
    required this.documentLanguage,
    required this.documentStatus,
    required this.sourceUrl,
    required this.sourceHash,
    this.linkedRealmId,
  });

  Map<String, dynamic> toMap() => {
    'notification_id': notificationId,
    'notification_number': notificationNumber,
    'notification_title': notificationTitle,
    'organization': organization,
    'recruitment_name': recruitmentName,
    'recruitment_code': recruitmentCode,
    'publication_date': publicationDate != null ? Timestamp.fromDate(publicationDate!) : null,
    'document_version': documentVersion,
    'document_language': documentLanguage,
    'document_status': documentStatus,
    'source_url': sourceUrl,
    'source_hash': sourceHash,
    'linked_realm_id': linkedRealmId,
  };

  factory NotificationIdentity.fromMap(Map<String, dynamic> map) => NotificationIdentity(
    notificationId: map['notification_id'] ?? '',
    notificationNumber: map['notification_number'] ?? '',
    notificationTitle: map['notification_title'] ?? '',
    organization: map['organization'] ?? '',
    recruitmentName: map['recruitment_name'] ?? '',
    recruitmentCode: map['recruitment_code'] ?? '',
    publicationDate: map['publication_date'] != null ? (map['publication_date'] as Timestamp).toDate() : null,
    documentVersion: map['document_version'] ?? '',
    documentLanguage: map['document_language'] ?? '',
    documentStatus: map['document_status'] ?? '',
    sourceUrl: map['source_url'] ?? '',
    sourceHash: map['source_hash'] ?? '',
    linkedRealmId: map['linked_realm_id'],
  );
}
