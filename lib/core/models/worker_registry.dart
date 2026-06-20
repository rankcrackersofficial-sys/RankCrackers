import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum WorkerMode { auto, manual }
enum WorkerPriority { critical, high, normal, low }

/// 🔱 WORKER REGISTRY MODEL
/// Constitutional authority for autonomous system entities.
class WorkerRegistry extends Equatable {
  final String id;
  final String name;
  final bool enabled;
  final WorkerMode mode;
  final WorkerPriority priority;
  final String status; // ONLINE, IDLE, OFFLINE, DEAD
  final int queueSize;
  final int errorCount;
  final DateTime? lastHeartbeat;
  final DateTime? lastSuccessAt;
  final int monthlyTokenUsage;
  final double monthlyCost;
  final int monthlyTokenLimit;
  final double monthlyCostLimit;
  final DateTime updatedAt;

  const WorkerRegistry({
    required this.id,
    required this.name,
    required this.enabled,
    required this.mode,
    required this.priority,
    required this.status,
    this.queueSize = 0,
    this.errorCount = 0,
    this.lastHeartbeat,
    this.lastSuccessAt,
    this.monthlyTokenUsage = 0,
    this.monthlyCost = 0.0,
    this.monthlyTokenLimit = 500000,
    this.monthlyCostLimit = 1000.0,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'enabled': enabled,
      'mode': mode.name,
      'priority': priority.name,
      'status': status,
      'queueSize': queueSize,
      'errorCount': errorCount,
      'lastHeartbeat': lastHeartbeat != null ? Timestamp.fromDate(lastHeartbeat!) : null,
      'lastSuccessAt': lastSuccessAt != null ? Timestamp.fromDate(lastSuccessAt!) : null,
      'monthlyTokenUsage': monthlyTokenUsage,
      'monthlyCost': monthlyCost,
      'monthlyTokenLimit': monthlyTokenLimit,
      'monthlyCostLimit': monthlyCostLimit,
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  factory WorkerRegistry.fromMap(Map<String, dynamic> map) {
    return WorkerRegistry(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      enabled: map['enabled'] ?? true,
      mode: WorkerMode.values.firstWhere((e) => e.name == map['mode'], orElse: () => WorkerMode.manual),
      priority: WorkerPriority.values.firstWhere((e) => e.name == map['priority'], orElse: () => WorkerPriority.normal),
      status: map['status'] ?? 'OFFLINE',
      queueSize: map['queueSize'] ?? 0,
      errorCount: map['errorCount'] ?? 0,
      lastHeartbeat: (map['lastHeartbeat'] as Timestamp?)?.toDate(),
      lastSuccessAt: (map['lastSuccessAt'] as Timestamp?)?.toDate(),
      monthlyTokenUsage: map['monthlyTokenUsage'] ?? 0,
      monthlyCost: (map['monthlyCost'] ?? 0.0).toDouble(),
      monthlyTokenLimit: map['monthlyTokenLimit'] ?? 500000,
      monthlyCostLimit: (map['monthlyCostLimit'] ?? 1000.0).toDouble(),
      updatedAt: (map['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  @override
  List<Object?> get props => [id, enabled, mode, priority, status, queueSize, errorCount, lastHeartbeat];
}
