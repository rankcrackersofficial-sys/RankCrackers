/// Client-side placeholder boundary for PYQ analysis.
///
/// Official PYQ acquisition and extraction are backend responsibilities. This
/// method deliberately returns no inferred exam metadata or question content.
class PyqDetectionWorker {
  static Future<Map<String, dynamic>> analyze(String text) async {
    if (text.trim().isEmpty) {
      return {
        'status': 'rejected',
        'reason': 'empty_input',
      };
    }

    return {
      'status': 'not_processed',
      'reason': 'server_official_pyq_pipeline_required',
    };
  }
}
