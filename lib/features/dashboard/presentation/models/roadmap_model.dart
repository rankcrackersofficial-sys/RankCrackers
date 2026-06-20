class RoadmapModel {
  final String day;
  final List<String> tasks;
  final bool locked;

  const RoadmapModel({
    required this.day,
    required this.tasks,
    this.locked = false,
  });
}