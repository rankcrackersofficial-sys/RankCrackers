import 'package:rank_crackers/features/opportunities/models/opportunity.dart';

class CareerSignalFixtures {
  static List<Opportunity> getGovernedTestFixtures() {
    final baseTime = DateTime(2026, 8, 1);
    return [
      Opportunity(
        id: "opp_neet_mbbs",
        title: "MBBS Admission - Central Government Medical Pools",
        department: "Ministry of Health & Family Welfare",
        state: "Central",
        totalPosts: 12500,
        notificationDate: baseTime,
        lastDate: baseTime.add(const Duration(days: 30)),
        officialPdfUrl: "https://mohfw.gov.in/notif.pdf",
        status: "published",
        minimumAge: 17,
        maximumAge: 25,
        requiredSubjects: const ["Physics", "Chemistry", "Biology"],
        educationRequirements: const ["Mandatory 10+2 secondary education with Physics, Chemistry, and Biology (PCB) specializations."],
        eligibleMissionIds: const ["neet_2026", "neet_ug_2027"],
        sourceAuthority: "NTA / Ministry of Health",
      ),
      Opportunity(
        id: "opp_jee_cs",
        title: "BTech Computer Science - Indian Institutes of Technology",
        department: "Ministry of Education",
        state: "Central",
        totalPosts: 8500,
        notificationDate: baseTime,
        lastDate: baseTime.add(const Duration(days: 30)),
        officialPdfUrl: "https://jeemain.nta.nic.in/btech.pdf",
        status: "published",
        minimumAge: 16,
        maximumAge: 25,
        requiredSubjects: const ["Physics", "Chemistry", "Mathematics"],
        educationRequirements: const ["Successful qualification in JEE Main/Advanced and 10+2 with Physics, Chemistry, and Mathematics (PCM)."],
        eligibleMissionIds: const ["jee_main_2026", "jee_main_2027"],
        sourceAuthority: "NTA / IIT Council",
      ),
    ];
  }
}
