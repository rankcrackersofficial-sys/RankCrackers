String mimeForExtension(String ext) {
  final normalized = ext.trim().toLowerCase();
  switch (normalized) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.txt':
      return 'text/plain';
    case '.csv':
      return 'text/csv';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.ppt':
      return 'application/vnd.ms-powerpoint';
    case '.pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case '.xls':
      return 'application/vnd.ms-excel';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

String formatBytes(int bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  double value = bytes.toDouble();
  int unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  if (unitIndex == 0) return '${bytes.toInt()} ${units[unitIndex]}';
  return '${value.toStringAsFixed(1)} ${units[unitIndex]}';
}
