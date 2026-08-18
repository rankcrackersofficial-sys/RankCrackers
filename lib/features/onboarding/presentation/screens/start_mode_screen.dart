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
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Practice Mode is currently updating.")),
                );
              },

              child: const Text("Practice Mode (Unavailable)"),
            ),

            const SizedBox(height: 20),

            ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Mock Test is currently updating.")),
                );
              },

              child: const Text("Mock Test (Unavailable)"),
            ),
          ],
        ),
      ),
    );
  }
}
