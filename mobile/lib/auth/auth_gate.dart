import 'package:flutter/material.dart';

import 'login_page.dart';
import 'token_store.dart';
import '../pos/pos_home_page.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String?>(
      future: TokenStore().readAccessToken(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }

        final token = snapshot.data?.trim() ?? '';
        if (token.isEmpty) return const LoginPage();
        return const PosHomePage();
      },
    );
  }
}

