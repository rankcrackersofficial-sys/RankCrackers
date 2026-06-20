import 'package:dio/dio.dart';

class NetworkExceptions implements Exception {
  final String message;

  NetworkExceptions(this.message);

  factory NetworkExceptions.fromDioException(
      DioException error,
      ) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
        return NetworkExceptions(
          'Connection timeout',
        );

      case DioExceptionType.sendTimeout:
        return NetworkExceptions(
          'Send timeout',
        );

      case DioExceptionType.receiveTimeout:
        return NetworkExceptions(
          'Receive timeout',
        );

      case DioExceptionType.badCertificate:
        return NetworkExceptions(
          'Bad certificate',
        );

      case DioExceptionType.cancel:
        return NetworkExceptions(
          'Request cancelled',
        );

      case DioExceptionType.connectionError:
        return NetworkExceptions(
          'No internet connection',
        );

      case DioExceptionType.badResponse:
        return NetworkExceptions(
          _handleStatusCode(
            error.response?.statusCode,
          ),
        );

      case DioExceptionType.unknown:
        return NetworkExceptions(
          'Unexpected network error',
        );
    }
  }

  static String _handleStatusCode(
      int? statusCode,
      ) {
    switch (statusCode) {
      case 400:
        return 'Bad request';

      case 401:
        return 'Unauthorized';

      case 403:
        return 'Forbidden';

      case 404:
        return 'Resource not found';

      case 422:
        return 'Validation failed';

      case 500:
        return 'Internal server error';

      default:
        return 'Something went wrong';
    }
  }

  @override
  String toString() => message;
}
