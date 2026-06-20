import 'package:dio/dio.dart';

import '../../../../../core/network/dio_client.dart';
import '../../../../../core/network/api_constants.dart';

class AuthService {

  final Dio _dio =
      DioClient().dio;

  Future<Response> login({
    required String mobile,
    required String email,
  }) async {

    return await _dio.post(
      ApiConstants.login,

      data: {
        "mobile": mobile,
        "email": email,
      },
    );
  }

  Future<Response> signup({
    required String mobile,
    required String email,
  }) async {

    return await _dio.post(
      ApiConstants.signup,

      data: {
        "mobile": mobile,
        "email": email,
      },
    );
  }

  Future<Response> profile() async {

    return await _dio.get(
      ApiConstants.profile,
    );
  }

}
