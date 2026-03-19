import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStore {
  TokenStore({FlutterSecureStorage? storage}) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _tokenKey = 'access_token';

  Future<String?> readAccessToken() {
    return _storage.read(key: _tokenKey);
  }

  Future<void> writeAccessToken(String token) {
    return _storage.write(key: _tokenKey, value: token.trim());
  }

  Future<void> deleteAccessToken() {
    return _storage.delete(key: _tokenKey);
  }
}
