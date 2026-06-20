import 'package:flutter/material.dart';

class QuickQuizScreen extends StatelessWidget {
  const QuickQuizScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Quiz"),
      ),

      body: const Center(
        child: Text(
          "Quiz Screen",
          style: TextStyle(fontSize: 24),
        ),
      ),
    );
  }
}
