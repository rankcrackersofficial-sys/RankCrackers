import 'package:dio/dio.dart';

import 'api_constants.dart';

class DioClient {

  static final DioClient _instance =
  DioClient._internal();

  factory DioClient() => _instance;

  DioClient._internal();

  final Dio dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,

      connectTimeout:
      const Duration(seconds: 30),

      receiveTimeout:
      const Duration(seconds: 30),

      headers: {
        'Content-Type':
        'application/json',
      },
    ),
  );

}
