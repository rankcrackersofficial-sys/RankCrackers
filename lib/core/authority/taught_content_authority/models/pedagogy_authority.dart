import 'package:equatable/equatable.dart';

/// Pedagogy Authority pure model.
class PedagogyAuthority extends Equatable {
  final String pedagogyAuthorityId;
  final String version;
  final List<String> supportedSubjects;
  final List<String> supportedTeacherAuthorityIds;
  final String authorityHash;
  final bool isActive;
  final String status; // 'active', 'revoked'

  const PedagogyAuthority({
    required this.pedagogyAuthorityId,
    required this.version,
    required this.supportedSubjects,
    required this.supportedTeacherAuthorityIds,
    required this.authorityHash,
    required this.isActive,
    required this.status,
  });

  Map<String, dynamic> toMap() => {
        'pedagogyAuthorityId': pedagogyAuthorityId,
        'version': version,
        'supportedSubjects': supportedSubjects,
        'supportedTeacherAuthorityIds': supportedTeacherAuthorityIds,
        'authorityHash': authorityHash,
        'isActive': isActive,
        'status': status,
      };

  String canonicalString() {
    final sortedSubjects = List<String>.from(supportedSubjects)..sort();
    final sortedTeachers = List<String>.from(supportedTeacherAuthorityIds)..sort();
    return 'pedagogyAuthorityId:$pedagogyAuthorityId|version:$version|subjects:${sortedSubjects.join(",")}|teachers:${sortedTeachers.join(",")}|hash:$authorityHash|isActive:$isActive|status:$status';
  }

  @override
  List<Object?> get props => [
        pedagogyAuthorityId,
        version,
        supportedSubjects,
        supportedTeacherAuthorityIds,
        authorityHash,
        isActive,
        status,
      ];
}
