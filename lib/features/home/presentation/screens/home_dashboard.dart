import 'package:flutter/material.dart';

class HomeDashboard extends StatelessWidget {
  const HomeDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Home Dashboard"),
      ),

      body: Center(
        child: ElevatedButton(
          onPressed: () {
            Navigator.pushNamed(context, "/quiz");
          },

          child: const Text("Start Quiz"),
        ),
      ),
    );
  }
}
