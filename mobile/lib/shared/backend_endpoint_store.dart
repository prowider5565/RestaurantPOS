import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class BackendEndpointStore {
  BackendEndpointStore({FlutterSecureStorage? storage}) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _hostKey = 'backend_host';
  static const _portKey = 'backend_port';

  Future<({String host, int port})?> read() async {
    final host = (await _storage.read(key: _hostKey))?.trim() ?? '';
    final portRaw = (await _storage.read(key: _portKey))?.trim() ?? '';
    final port = int.tryParse(portRaw);
    if (host.isEmpty || port == null) return null;
    return (host: host, port: port);
  }

  Future<void> write({required String host, required int port}) async {
    await _storage.write(key: _hostKey, value: host.trim());
    await _storage.write(key: _portKey, value: '$port');
  }
}

