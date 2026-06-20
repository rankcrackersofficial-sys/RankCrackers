import 'package:flutter_riverpod/flutter_riverpod.dart';

enum DashboardSection {
  header,
  crucible,
  digibook,
  syllabus,
  status,
  tools,
  archive,
  updates,
}

final dashboardActiveSectionProvider = StateProvider<DashboardSection>((ref) => DashboardSection.header);
