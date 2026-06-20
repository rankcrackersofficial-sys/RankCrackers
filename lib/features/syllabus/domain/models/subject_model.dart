import 'package:flutter/material.dart';

class SubjectModel {

  final String id;

  final String name;

  final int totalTopics;

  final int completedTopics;

  final int totalQuestions;

  final int completedQuestions;

  final double accuracy;

  final String icon;

  final List<String> topics;

  final bool isWeak;

  final bool isCompleted;

  const SubjectModel({

    required this.id,

    required this.name,

    required this.totalTopics,

    required this.completedTopics,

    required this.totalQuestions,

    required this.completedQuestions,

    required this.accuracy,

    required this.icon,

    required this.topics,

    this.isWeak = false,

    this.isCompleted = false,
  });

  double get progress {

    if (totalTopics == 0) {
      return 0;
    }

    return completedTopics /
        totalTopics;
  }

  IconData get iconData {

    switch (icon) {

      case "history":
        return Icons.account_balance_rounded;

      case "polity":
        return Icons.gavel_rounded;

      case "geography":
        return Icons.public_rounded;

      case "science":
        return Icons.science_rounded;

      case "reasoning":
        return Icons.psychology_rounded;

      case "current_affairs":
        return Icons.newspaper_rounded;

      default:
        return Icons.menu_book_rounded;
    }
  }

  SubjectModel copyWith({

    String? id,

    String? name,

    int? totalTopics,

    int? completedTopics,

    int? totalQuestions,

    int? completedQuestions,

    double? accuracy,

    String? icon,

    List<String>? topics,

    bool? isWeak,

    bool? isCompleted,
  }) {

    return SubjectModel(

      id: id ?? this.id,

      name: name ?? this.name,

      totalTopics:
      totalTopics ??
          this.totalTopics,

      completedTopics:
      completedTopics ??
          this.completedTopics,

      totalQuestions:
      totalQuestions ??
          this.totalQuestions,

      completedQuestions:
      completedQuestions ??
          this.completedQuestions,

      accuracy:
      accuracy ?? this.accuracy,

      icon:
      icon ?? this.icon,

      topics:
      topics ?? this.topics,

      isWeak:
      isWeak ?? this.isWeak,

      isCompleted:
      isCompleted ??
          this.isCompleted,
    );
  }
}