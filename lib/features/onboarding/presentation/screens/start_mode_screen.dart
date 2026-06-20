import 'package:flutter/material.dart';

class StartModeScreen extends StatelessWidget {
  const StartModeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Choose Mode"),
      ),

      body: Padding(
        padding: const EdgeInsets.all(20),

        child: Column(
          children: [

            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, "/home");
              },

              child: const Text("Practice Mode"),
            ),

            const SizedBox(height: 20),

            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, "/quiz");
              },

              child: const Text("Mock Test"),
            ),
          ],
        ),
      ),
    );
  }
}
