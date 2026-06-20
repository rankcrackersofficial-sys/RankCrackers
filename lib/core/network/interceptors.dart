import 'package:dio/dio.dart';

import '../../config/app_config.dart';

class AppInterceptors extends Interceptor {
  @override
  void onRequest(
      RequestOptions options,
      RequestInterceptorHandler handler,
      ) {
    if (AppConfig.enableLogs) {
      // ignore: avoid_print
      print(
        '''
╔═══════════════════════════════
║ REQUEST
╠═══════════════════════════════
║ METHOD: ${options.method}
║ URL: ${options.uri}
║ DATA: ${options.data}
╚═══════════════════════════════
''',
      );
    }

    super.onRequest(options, handler);
  }

  @override
  void onResponse(
      Response response,
      ResponseInterceptorHandler handler,
      ) {
    if (AppConfig.enableLogs) {
      // ignore: avoid_print
      print(
        '''
╔═══════════════════════════════
║ RESPONSE
╠═══════════════════════════════
║ STATUS: ${response.statusCode}
║ DATA: ${response.data}
╚═══════════════════════════════
''',
      );
    }

    super.onResponse(response, handler);
  }

  @override
  void onError(
      DioException err,
      ErrorInterceptorHandler handler,
      ) {
    if (AppConfig.enableLogs) {
      // ignore: avoid_print
      print(
        '''
╔═══════════════════════════════
║ ERROR
╠═══════════════════════════════
║ STATUS: ${err.response?.statusCode}
║ MESSAGE: ${err.message}
╚═══════════════════════════════
''',
      );
    }

    super.onError(err, handler);
  }
}
