import 'package:flutter/material.dart';
import '../../../../core/models/micro_topic_node.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/session/session_manager.dart';
import '../../domain/models/digibook_launch_args.dart';
import '../../domain/services/digibook_canonical_resolver.dart';
import 'digi_book_reader_screen.dart';

/// DIGIBOOK NODE ADAPTER SCREEN
/// Converts an academic Syllabus MicroTopicNode into a canonical DigiBookLaunchArgs
/// before launching the lesson reader.
/// Fulfills Section 8 of Canonical Law: Adapter resolves before reader opens.
class DigiBookNodeAdapterScreen extends StatefulWidget {
  final MicroTopicNode node;

  const DigiBookNodeAdapterScreen({
    super.key,
    required this.node,
  });

  @override
  State<DigiBookNodeAdapterScreen> createState() =>
      _DigiBookNodeAdapterScreenState();
}

class _DigiBookNodeAdapterScreenState extends State<DigiBookNodeAdapterScreen> {
  Future<DigiBookLaunchArgs?>? _resolveFuture;

  @override
  void initState() {
    super.initState();
    final missionScope = widget.node.examId.isNotEmpty
        ? widget.node.examId
        : (SessionManager.getExamIdSync() ?? '');
    _resolveFuture = DigiBookCanonicalResolver.resolveFromNodeId(
      widget.node.id,
      expectedMissionScopeId: missionScope,
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<DigiBookLaunchArgs?>(
      future: _resolveFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: AppColors.background,
            body: Center(
              child: CircularProgressIndicator(color: AppColors.gold),
            ),
          );
        }

        final args = snapshot.data;
        if (args != null) {
          return DigiBookReaderScreen(args: args);
        }

        return const DigiBookUnavailableScreen(
          message: 'Learning content is not available yet.',
        );
      },
    );
  }
}
