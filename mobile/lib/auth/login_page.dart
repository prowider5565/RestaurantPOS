import 'package:flutter/material.dart';

import '../api/api_config.dart';
import '../api/auth_api.dart';
import '../auth/token_store.dart';
import '../pos/pos_home_page.dart';
import '../shared/backend_endpoint_store.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _tokenStore = TokenStore();
  final _endpointStore = BackendEndpointStore();

  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  final _hostController = TextEditingController();
  final _portController = TextEditingController();

  bool _isLoggingIn = false;
  String _error = '';

  String _baseUrl = ApiConfig.defaultBaseUrl;

  @override
  void initState() {
    super.initState();
    _loadEndpoint();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _hostController.dispose();
    _portController.dispose();
    super.dispose();
  }

  Future<void> _loadEndpoint() async {
    final endpoint = await _endpointStore.read();
    if (endpoint != null) {
      _baseUrl = 'http://${endpoint.host}:${endpoint.port}';
      _hostController.text = endpoint.host;
      _portController.text = '${endpoint.port}';
    } else {
      final parsed = Uri.tryParse(ApiConfig.defaultBaseUrl);
      _hostController.text = parsed?.host ?? '';
      _portController.text = (parsed?.hasPort ?? false) ? '${parsed?.port}' : '';
      _baseUrl = ApiConfig.defaultBaseUrl;
    }
    if (!mounted) return;
    setState(() {});
  }

  Future<void> _saveEndpoint() async {
    final host = _hostController.text.trim();
    final port = int.tryParse(_portController.text.trim());
    if (host.isEmpty || port == null || port <= 0 || port > 65535) {
      setState(() => _error = 'IP manzil va portni to‘g‘ri kiriting.');
      return;
    }
    await _endpointStore.write(host: host, port: port);
    setState(() {
      _baseUrl = 'http://$host:$port';
      _error = '';
    });
  }

  Future<void> _login() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text;
    if (username.isEmpty || password.isEmpty) {
      setState(() => _error = 'Foydalanuvchi nomi va parolni kiriting.');
      return;
    }

    setState(() {
      _isLoggingIn = true;
      _error = '';
    });

    try {
      final token = await AuthApi(baseUrl: _baseUrl).login(username: username, password: password);
      if (!mounted) return;
      if (token == null) {
        setState(() => _error = 'Foydalanuvchi nomi yoki parol noto‘g‘ri (yoki backendga ulanib bo‘lmadi).');
        return;
      }

      await _tokenStore.writeAccessToken(token);
      if (!mounted) return;

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const PosHomePage()),
        (_) => false,
      );
    } finally {
      if (!mounted) return;
      setState(() => _isLoggingIn = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kirish', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
        children: [
          const Text('Backend manzili', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: TextField(
                  controller: _hostController,
                  decoration: const InputDecoration(labelText: 'IP manzil', border: OutlineInputBorder()),
                  keyboardType: TextInputType.url,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _portController,
                  decoration: const InputDecoration(labelText: 'Port', border: OutlineInputBorder()),
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          FilledButton(
            onPressed: _isLoggingIn ? null : _saveEndpoint,
            child: const Text('Backendni saqlash', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
          const SizedBox(height: 10),
          Text('Joriy URL: $_baseUrl', style: TextStyle(color: Colors.grey.shade700)),
          const Divider(height: 32),
          const Text('Hisobga kirish', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
          const SizedBox(height: 10),
          TextField(
            controller: _usernameController,
            decoration: const InputDecoration(labelText: 'Foydalanuvchi nomi', border: OutlineInputBorder()),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _passwordController,
            decoration: const InputDecoration(labelText: 'Parol', border: OutlineInputBorder()),
            obscureText: true,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _login(),
          ),
          if (_error.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(_error, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w700)),
          ],
          const SizedBox(height: 14),
          FilledButton(
            onPressed: _isLoggingIn ? null : _login,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Text(_isLoggingIn ? 'Kutilmoqda...' : 'Kirish', style: const TextStyle(fontWeight: FontWeight.w900)),
            ),
          ),
        ],
      ),
    );
  }
}
