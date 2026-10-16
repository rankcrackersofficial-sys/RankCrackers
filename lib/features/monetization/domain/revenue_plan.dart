enum RevenuePlanKind { starter, missionPass, annualElite }

class RevenuePlan {
  final String offerId;
  final RevenuePlanKind kind;
  final String title;
  final String promise;
  final String price;
  final String cadence;
  final List<String> benefits;
  final bool highlighted;

  const RevenuePlan({
    required this.offerId,
    required this.kind,
    required this.title,
    required this.promise,
    required this.price,
    required this.cadence,
    required this.benefits,
    this.highlighted = false,
  });

  static const List<RevenuePlan> catalog = [
    RevenuePlan(
      offerId: 'starter_7d',
      kind: RevenuePlanKind.starter,
      title: 'Starter Pass',
      promise: 'Try the RankCrackers method',
      price: '₹49',
      cadence: '7 days',
      benefits: [
        'Core study missions',
        'Selected DigiBook units',
        'Progress snapshot'
      ],
    ),
    RevenuePlan(
      offerId: 'rank_mission_90d',
      kind: RevenuePlanKind.missionPass,
      title: '90-Day Rank Mission',
      promise: 'A focused preparation cycle for your exam',
      price: '₹499',
      cadence: '90 days',
      highlighted: true,
      benefits: [
        'Full mission-linked syllabus',
        'Complete DigiBook learning units',
        'Crucible practice and revision queue',
        'Weakness map and readiness analytics',
      ],
    ),
    RevenuePlan(
      offerId: 'elite_annual',
      kind: RevenuePlanKind.annualElite,
      title: 'Elite Annual',
      promise: 'Stay ready across the full exam year',
      price: '₹1,499',
      cadence: '12 months',
      benefits: [
        'Everything in Rank Mission',
        'All accessible exam realms',
        'Priority feature access',
        'Annual progress archive',
      ],
    ),
  ];
}
