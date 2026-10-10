import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../data/repositories/health_repository.dart';
import '../shared/center_header.dart';
import 'analytics_center.dart';

class SystemVitals extends StatelessWidget {
  const SystemVitals({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(title: "SYSTEM VITALS", subtitle: "Real-time health of the Sovereign Infrastructure."),
        const SizedBox(height: 24),

        _killSwitchCard(),
        const SizedBox(height: 24),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("LIVE TELEMETRY", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
            GestureDetector(
              onTap: () => HealthRepository.getLiveSystemHealth(),
              child: Text("RE-SCAN INFRASTRUCTURE", style: AppTypography.label.copyWith(fontSize: 8, color: AppColors.gold)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        
        Row(
          children: [
            Expanded(child: _liveVitalsCard("AI QUEUE", HealthRepository.streamAIQueueSize(), AppColors.gold)),
            const SizedBox(width: 16),
            Expanded(child: _liveVitalsCard("FAILURES", HealthRepository.streamAIFailuresCount(), Colors.redAccent)),
          ],
        ),
        
        const SizedBox(height: 24),
        
        FutureBuilder<Map<String, dynamic>>(
          future: HealthRepository.getSystemHealth(),
          builder: (context, snapshot) {
            final data = snapshot.data ?? {};
            final providers = data['providers'] as Map? ?? {};
            final services = data['services'] as Map? ?? {};
            final latency = data['latency'] as Map? ?? {};

            return Column(
              children: [
                // Phase 7 & 8: Gemini Health + Trace Purge
                if (providers.containsKey('gemini') || providers.isEmpty)
                  _healthCard(
                    "Gemini 1.5 Flash", 
                    providers['gemini']?.toString().toUpperCase() ?? "OFFLINE", 
                    _getStatusColor(providers['gemini']),
                    subValue: latency['gemini'],
                  ),
                
                if (providers.containsKey('gemini') || providers.isEmpty) const SizedBox(height: 12),
                
                // Phase 4: Cloud Firestore Health
                _healthCard(
                  "Cloud Firestore", 
                  services['firestore']?.toString().toUpperCase() ?? "PENDING", 
                  _getStatusColor(services['firestore']),
                  subValue: latency['firestore'],
                ),
                
                const SizedBox(height: 12),
                
                // Phase 3: Firebase Auth Health
                _healthCard(
                  "Firebase Auth", 
                  services['auth']?.toString().toUpperCase() ?? "PENDING", 
                  _getStatusColor(services['auth']),
                ),
                
                const SizedBox(height: 12),
                
                // Phase 5: Cloud Functions Health
                _healthCard(
                  "Cloud Functions", 
                  services['functions']?.toString().toUpperCase() ?? "PENDING", 
                  _getStatusColor(services['functions']),
                  subValue: latency['total'],
                ),
              ],
            );
          },
        ),
        
        const SizedBox(height: 40),
        _costCard(),
        const SizedBox(height: 40),
        const AnalyticsCenter(),
      ],
    );
  }

  Widget _killSwitchCard() {
    return StreamBuilder<bool>(
      stream: HealthRepository.streamAiSystemStatus(),
      builder: (context, snapshot) {
        final enabled = snapshot.data ?? true;
        return DarkCard(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("AI SYSTEM CONTROL", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          width: 8, height: 8, 
                          decoration: BoxDecoration(color: enabled ? Colors.greenAccent : Colors.redAccent, shape: BoxShape.circle)
                        ),
                        const SizedBox(width: 8),
                        Text(enabled ? "ONLINE" : "OFFLINE", style: AppTypography.hero.copyWith(fontSize: 16, color: enabled ? Colors.greenAccent : Colors.redAccent)),
                      ],
                    ),
                  ],
                ),
              ),
              Switch(
                value: enabled,
                activeThumbColor: Colors.greenAccent,
                activeTrackColor: Colors.greenAccent.withValues(alpha: 0.2),
                inactiveThumbColor: Colors.redAccent,
                inactiveTrackColor: Colors.redAccent.withValues(alpha: 0.2),
                onChanged: (v) => HealthRepository.toggleAiSystem(v),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _costCard() {
    return DarkCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("ESTIMATED OPERATIONAL COST", style: AppTypography.cardTitle.copyWith(fontSize: 12)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("₹0.00", style: AppTypography.hero.copyWith(fontSize: 24, color: Colors.greenAccent)),
                  Text("Current Cycle", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text("₹28,710", style: AppTypography.body.copyWith(color: AppColors.gold)),
                  Text("Credits Available", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(dynamic status) {
    final s = status?.toString().toLowerCase();
    if (s == 'online' || s == 'healthy' || s == 'nominal' || s == 'configured') return Colors.greenAccent;
    if (s == 'degraded' || s == 'warning' || s == 'evaluating' || s == 'pending') return Colors.orangeAccent;
    return Colors.redAccent;
  }

  Widget _liveVitalsCard(String label, Stream<int> stream, Color color) {
    return StreamBuilder<int>(
      stream: stream,
      builder: (context, snapshot) {
        final val = snapshot.data?.toString() ?? "0";
        return DarkCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
              const SizedBox(height: 12),
              Text(val, style: AppTypography.hero.copyWith(fontSize: 24, color: color)),
            ],
          ),
        );
      },
    );
  }

  Widget _healthCard(String service, String status, Color color, {String? subValue}) {
    return DarkCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(service, 
                  style: AppTypography.body.copyWith(fontWeight: FontWeight.bold, fontSize: 11),
                  maxLines: 1, 
                  overflow: TextOverflow.ellipsis,
                ),
                Text(status, 
                  style: AppTypography.label.copyWith(color: color, fontSize: 8, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (subValue != null)
            Text(subValue, style: AppTypography.label.copyWith(color: Colors.white10, fontSize: 8)),
        ],
      ),
    );
  }
}
