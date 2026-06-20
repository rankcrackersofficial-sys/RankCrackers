import 'package:dio/dio.dart';

import 'dio_client.dart';

class ApiClient {

  static Dio get client =>
      DioClient().dio;

}
