// FILE: lib/features/dashboard/presentation/widgets/study_plan_engine.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/utils/app_routes.dart';
import '../../data/models/dashboard_model.dart';

class StudyPlanEngine extends StatelessWidget {
  final DashboardModel data;
  const StudyPlanEngine({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final bool isStable = !data.scheduleHealth.contains("Critical");

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(30),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFF111625), // प्रीमियम डार्क कंसोल कार्ड टोन
            border: Border.all(color: Colors.white.withValues(alpha: 0.06), width: 1.5),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("DAY ${data.currentDay} / 99", style: GoogleFonts.sora(fontSize: 24, fontWeight: FontWeight.w900, color: const Color(0xFFD4AF37))),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFFD4AF37).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                        child: Text(data.focusMode.toUpperCase(), style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFD4AF37))),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text("Readiness: ${(data.examReadiness * 100).toInt()}%", style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text("Streak: ${data.consistencyStreak} Days 🔥", style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.white70)),
                    ],
                  )
                ],
              ),
              const SizedBox(height: 20),
              Divider(color: Colors.white.withValues(alpha: 0.06)),
              const SizedBox(height: 16),

              // =======================================================
              // 📚 पार्थ का दिव्य सुझाव: पुस्तक मॉड्यूल का शेड्यूल के भीतर भव्य सुसज्जीकरण
              // =======================================================
              GestureDetector(
                onTap: () => context.go(AppRoutes.digiBook),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 20),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.15), width: 1),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD4AF37).withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.import_contacts_rounded, color: Color(0xFFD4AF37), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "पुस्तक (Digital Library Node)",
                              style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                            Text(
                              "Day ${data.currentDay} के समस्त सिलेबस नोड्स लाइव हैं",
                              style: GoogleFonts.poppins(fontSize: 11, color: Colors.white60),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Color(0xFFD4AF37)),
                    ],
                  ),
                ),
              ),

              _buildSectionTitle(Icons.track_changes_rounded, "Today's Battle Mission"),
              const SizedBox(height: 10),
              ...data.todayMissions.map((mission) => _buildBulletItem(mission.title, Colors.white, Icons.check_circle_outline_rounded, const Color(0xFFD4AF37))),
              const SizedBox(height: 24),
              Divider(color: Colors.white.withValues(alpha: 0.06)),
              const SizedBox(height: 16),

              // एडाप्टिव रो लेआउट - नो ओवरफ्लो
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(child: _buildFooterMetric("Schedule Health", data.scheduleHealth, isStable ? Colors.greenAccent : Colors.redAccent)),
                  Expanded(child: _buildFooterMetric("Target Allocation", "${data.dailyStudyHours} Hrs", Colors.white)),
                  Expanded(child: _buildFooterMetric("Total Syllabus", "${(data.totalSyllabusProgress * 100).toInt()}%", const Color(0xFFD4AF37))),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.white70),
        const SizedBox(width: 8),
        Text(title.toUpperCase(), style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white70)),
      ],
    );
  }

  Widget _buildBulletItem(String text, Color textColor, IconData icon, Color iconColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: iconColor),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: textColor))),
        ],
      ),
    );
  }

  Widget _buildFooterMetric(String title, String value, Color valueColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontSize: 10, color: Colors.white38)),
        const SizedBox(height: 4),
        Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.sora(fontSize: 12, fontWeight: FontWeight.bold, color: valueColor)),
      ],
    );
  }
}