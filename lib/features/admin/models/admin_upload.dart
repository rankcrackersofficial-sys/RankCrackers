class AdminUpload {
  final String id;
  final String type;
  final String exam;
  final String fileUrl;
  final int createdAt;

  const AdminUpload({
    required this.id,
    required this.type,
    required this.exam,
    required this.fileUrl,
    required this.createdAt,
  });
}
