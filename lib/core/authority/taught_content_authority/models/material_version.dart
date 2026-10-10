import 'package:equatable/equatable.dart';

/// Material Version identity model.
class MaterialVersion extends Equatable {
  final String materialId;
  final String version; // revision/version
  final String contentHash;

  const MaterialVersion({
    required this.materialId,
    required this.version,
    required this.contentHash,
  });

  Map<String, dynamic> toMap() => {
        'materialId': materialId,
        'version': version,
        'contentHash': contentHash,
      };

  String canonicalString() {
    return 'materialId:$materialId|version:$version|contentHash:$contentHash';
  }

  @override
  List<Object?> get props => [materialId, version, contentHash];
}
