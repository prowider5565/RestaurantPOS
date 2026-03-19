import 'dart:convert';

import 'package:http/http.dart' as http;

class AuthApi {
  AuthApi({required String baseUrl, http.Client? client})
      : _baseUrl = baseUrl.trim().replaceAll(RegExp(r'/+$'), ''),
        _client = client ?? http.Client();

  final String _baseUrl;
  final http.Client _client;

  Future<String?> login({required String username, required String password}) async {
    final payload = {'username': username, 'password': password};
    final res = await _client.post(
      Uri.parse('$_baseUrl/users/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    if (res.statusCode < 200 || res.statusCode >= 300) return null;

    final raw = jsonDecode(res.body);
    if (raw is! Map) return null;
    final json = Map<String, dynamic>.from(raw);
    final token = json['access_token'];
    if (token is! String) return null;
    return token;
  }
}

