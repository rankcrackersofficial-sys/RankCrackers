import 'package:equatable/equatable.dart';

/// DIGIBOOK SCHEDULE AVAILABILITY
enum ScheduleDigiBookAvailability {
  full,
  partial,
  none,
}

/// CRUCIBLE CANONICAL SCHEDULE
/// Master immutable schedule model for the 98-Day Continuous Ring.
/// Fully supports multi-canonical-node and multi-GU syllabus scopes.
class CrucibleCanonicalSchedule extends Equatable {
  final int scheduleNumber; // 1..42
  final String scheduleId; // e.g. 'sch_jee_main_2027_1'
  final String canonicalTitle; // Founder-locked for S01-S12
  final String subject; // 'Physics', 'Chemistry', 'Mathematics'
  final List<String> canonicalNodeIds; // Exact physical syllabus nodes (zero synthetic suffixes)
  final List<String> generationUnitIds; // Exact physical GUs (multi-GU supported)
  final int phaseIndex; // 1..7 (Block)
  final int startCycleDay; // e.g. 1
  final int endCycleDay; // e.g. 2
  final ScheduleDigiBookAvailability availability;
  final String bindingStatus; // 'CANONICALLY_BOUND', 'PARTIALLY_BOUND', 'AUTHORITY_UNPROVEN'
  final String bindingAuthorityArtifact;

  const CrucibleCanonicalSchedule({
    required this.scheduleNumber,
    required this.scheduleId,
    required this.canonicalTitle,
    required this.subject,
    required this.canonicalNodeIds,
    required this.generationUnitIds,
    required this.phaseIndex,
    required this.startCycleDay,
    required this.endCycleDay,
    required this.availability,
    required this.bindingStatus,
    required this.bindingAuthorityArtifact,
  });

  String get formattedCode => 'S${scheduleNumber.toString().padLeft(2, '0')}';
  bool get hasContent => availability != ScheduleDigiBookAvailability.none;
  String get primaryNodeId => canonicalNodeIds.isNotEmpty ? canonicalNodeIds.first : '';
  String get primaryGuId => generationUnitIds.isNotEmpty ? generationUnitIds.first : '';

  @override
  List<Object?> get props => [
        scheduleNumber,
        scheduleId,
        canonicalTitle,
        subject,
        canonicalNodeIds,
        generationUnitIds,
        phaseIndex,
        startCycleDay,
        endCycleDay,
        availability,
        bindingStatus,
        bindingAuthorityArtifact,
      ];
}

/// CRUCIBLE CANONICAL SCHEDULE REGISTRY
/// Sovereign implementation registry mapping the 42 schedules of JEE Main 2027.
/// Sourced strictly from upstream physical blueprint and syllabus authorities.
class CrucibleCanonicalScheduleRegistry {
  static const List<CrucibleCanonicalSchedule> all42Schedules = [
    // =========================================================================
    // PHASE 1 (DAYS 1–14): MECHANICS I
    // =========================================================================
    CrucibleCanonicalSchedule(
      scheduleNumber: 1,
      scheduleId: 'sch_jee_main_2027_1',
      canonicalTitle: 'Kinematics 1D',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U01_T_54665f87',
        'JEE_MAIN_2026_PHY_U01_T_deb95734',
        'JEE_MAIN_2026_PHY_U01_T_9008e402',
        'JEE_MAIN_2026_PHY_U02_T_057cee13',
        'JEE_MAIN_2026_PHY_U02_T_ad1f2fda',
      ],
      generationUnitIds: [
        'GU_JEEMAIN2027_PHY_54665F87',
        'GU_JEEMAIN2027_PHY_DEB95734',
        'GU_JEEMAIN2027_PHY_9008E402',
        'GU_JEEMAIN2027_PHY_057CEE13',
        'GU_JEEMAIN2027_PHY_AD1F2FDA',
      ],
      phaseIndex: 1,
      startCycleDay: 1,
      endCycleDay: 2,
      availability: ScheduleDigiBookAvailability.full,
      bindingStatus: 'CANONICALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s01_physics/pack_01_kinematics_1d.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 2,
      scheduleId: 'sch_jee_main_2027_2',
      canonicalTitle: 'Laws of Motion & Friction',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U03_T_00000002',
        'JEE_MAIN_2026_PHY_U03_T_00000003',
        'JEE_MAIN_2026_PHY_U03_T_fca3afa8',
        'JEE_MAIN_2026_PHY_U03_T_6202b09b',
      ],
      generationUnitIds: [
        'GU_JEEMAIN2027_PHY_0059FC83',
        'GU_JEEMAIN2027_PHY_10A164C1',
        'GU_JEEMAIN2027_PHY_FCA3AFA8',
        'GU_JEEMAIN2027_PHY_6202B09B',
      ],
      phaseIndex: 1,
      startCycleDay: 3,
      endCycleDay: 4,
      availability: ScheduleDigiBookAvailability.full,
      bindingStatus: 'CANONICALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s02_to_s06_pipeline/s02_physics_50q_review_pack.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 3,
      scheduleId: 'sch_jee_main_2027_3',
      canonicalTitle: 'Work, Energy & Power',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U04_T_65a072bd',
        'JEE_MAIN_2026_PHY_U04_T_00000002',
        'JEE_MAIN_2026_PHY_U04_T_87eb50db',
      ],
      generationUnitIds: [
        'GU_JEEMAIN2027_PHY_65A072BD',
        'GU_JEEMAIN2027_PHY_017FC3AC',
        'GU_JEEMAIN2027_PHY_87EB50DB',
      ],
      phaseIndex: 1,
      startCycleDay: 5,
      endCycleDay: 6,
      availability: ScheduleDigiBookAvailability.full,
      bindingStatus: 'CANONICALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s02_to_s06_pipeline/s03_physics_50q_review_pack.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 4,
      scheduleId: 'sch_jee_main_2027_4',
      canonicalTitle: 'Centre of Mass & Rotational Motion',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U05_T_8b5d7bd6',
        'JEE_MAIN_2026_PHY_U05_T_ab220534',
        'JEE_MAIN_2026_PHY_U05_T_00000001',
        'JEE_MAIN_2026_PHY_U05_T_00000003',
        'JEE_MAIN_2026_PHY_U05_T_00000002',
        'JEE_MAIN_2026_PHY_U_REM_0001',
        'JEE_MAIN_2026_PHY_U_REM_0002',
        'JEE_MAIN_2026_PHY_U_REM_0003',
        'JEE_MAIN_2026_PHY_U_REM_0005',
        'JEE_2026_PHY_U02_CH01_TOP01_001',
        'JEE_2026_PHY_U02_CH01_TOP02_001',
      ],
      generationUnitIds: [
        'GU_JEEMAIN2027_PHY_8B5D7BD6',
        'GU_JEEMAIN2027_PHY_REM_0001',
        'GU_JEEMAIN2027_PHY_AB220534',
        'GU_JEEMAIN2027_PHY_1367A8D3',
        'GU_JEEMAIN2027_PHY_2218270C',
        'GU_JEEMAIN2027_PHY_1C4E0301',
        'GU_JEEMAIN2027_PHY_REM_0002',
        'GU_JEEMAIN2027_PHY_REM_0003',
        'GU_JEEMAIN2027_PHY_REM_0005',
        'GU_JEEMAIN2027_PHY_7E2B0101',
        'GU_JEEMAIN2027_PHY_9A3C0201',
      ],
      phaseIndex: 1,
      startCycleDay: 7,
      endCycleDay: 8,
      availability: ScheduleDigiBookAvailability.full,
      bindingStatus: 'CANONICALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s02_to_s06_pipeline/s04_physics_50q_review_pack.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 5,
      scheduleId: 'sch_jee_main_2027_5',
      canonicalTitle: 'Gravitation & Satellite Motion',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U06_T_00000001',
        'JEE_MAIN_2026_PHY_U06_T_bacfbe4a',
        'JEE_MAIN_2026_PHY_U06_T_5f4143ee',
        'JEE_MAIN_2026_PHY_U06_T_b821705d',
        'JEE_MAIN_2026_PHY_U06_T_a8ebea76',
      ],
      generationUnitIds: [
        'GU_JEEMAIN2027_PHY_3D48D86E',
        'GU_JEEMAIN2027_PHY_BACFBE4A',
        'GU_JEEMAIN2027_PHY_5F4143EE',
        'GU_JEEMAIN2027_PHY_B821705D',
        'GU_JEEMAIN2027_PHY_A8EBEA76',
      ],
      phaseIndex: 1,
      startCycleDay: 9,
      endCycleDay: 10,
      availability: ScheduleDigiBookAvailability.full,
      bindingStatus: 'CANONICALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s02_to_s06_pipeline/s05_physics_50q_review_pack.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 6,
      scheduleId: 'sch_jee_main_2027_6',
      canonicalTitle: 'Properties of Matter & Fluids',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U07_T_CE9FA0F6',
      ],
      generationUnitIds: [], // REM_0001 removed (governed under S04 COM)
      phaseIndex: 1,
      startCycleDay: 11,
      endCycleDay: 12,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s02_to_s06_pipeline/s06_physics_50q_review_pack.json',
    ),

    // =========================================================================
    // PHASE 2 (DAYS 15–28): THERMAL PHYSICS & ELECTROMAGNETISM I
    // =========================================================================
    CrucibleCanonicalSchedule(
      scheduleNumber: 7,
      scheduleId: 'sch_jee_main_2027_7',
      canonicalTitle: 'Thermodynamics',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U09_T_031A6136',
      ],
      generationUnitIds: [],
      phaseIndex: 2,
      startCycleDay: 15,
      endCycleDay: 16,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s07_to_s12_pipeline/s07_physics_50q_review_pack.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 8,
      scheduleId: 'sch_jee_main_2027_8',
      canonicalTitle: 'Kinetic Theory of Gases',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U10_T_91CE6418',
      ],
      generationUnitIds: [],
      phaseIndex: 2,
      startCycleDay: 17,
      endCycleDay: 18,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s07_to_s12_pipeline/s08_physics_50q_review_pack.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 9,
      scheduleId: 'sch_jee_main_2027_9',
      canonicalTitle: 'Oscillations & SHM',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U10_T_91CE6418', // Zero synthetic _OSC suffix
      ],
      generationUnitIds: [],
      phaseIndex: 2,
      startCycleDay: 19,
      endCycleDay: 20,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s07_to_s12_pipeline/s09_physics_50q_review_pack.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 10,
      scheduleId: 'sch_jee_main_2027_10',
      canonicalTitle: 'Waves & Acoustics',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U10_T_91CE6418', // Zero synthetic _WAV suffix
      ],
      generationUnitIds: [],
      phaseIndex: 2,
      startCycleDay: 21,
      endCycleDay: 22,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s07_to_s12_pipeline/s10_physics_50q_review_pack.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 11,
      scheduleId: 'sch_jee_main_2027_11',
      canonicalTitle: 'Electrostatics',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U11_T_3A21919F',
      ],
      generationUnitIds: [],
      phaseIndex: 2,
      startCycleDay: 23,
      endCycleDay: 24,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s07_to_s12_pipeline/s11_physics_50q_review_pack.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 12,
      scheduleId: 'sch_jee_main_2027_12',
      canonicalTitle: 'Potential & Capacitance',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U12_T_7FBEB7FD',
      ],
      generationUnitIds: [],
      phaseIndex: 2,
      startCycleDay: 25,
      endCycleDay: 26,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/s07_to_s12_pipeline/s12_physics_50q_review_pack.json',
    ),

    // =========================================================================
    // PHASE 3 (DAYS 29–42): ELECTROMAGNETISM II & MODERN PHYSICS
    // =========================================================================
    CrucibleCanonicalSchedule(
      scheduleNumber: 13,
      scheduleId: 'sch_jee_main_2027_13',
      canonicalTitle: 'Current Electricity',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U13_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 3,
      startCycleDay: 29,
      endCycleDay: 30,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 14,
      scheduleId: 'sch_jee_main_2027_14',
      canonicalTitle: 'Magnetic Effects of Current & Magnetism',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U14_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 3,
      startCycleDay: 31,
      endCycleDay: 32,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 15,
      scheduleId: 'sch_jee_main_2027_15',
      canonicalTitle: 'Electromagnetic Induction & Alternating Currents',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U15_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 3,
      startCycleDay: 33,
      endCycleDay: 34,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 16,
      scheduleId: 'sch_jee_main_2027_16',
      canonicalTitle: 'Electromagnetic Waves & Ray Optics',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U16_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 3,
      startCycleDay: 35,
      endCycleDay: 36,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 17,
      scheduleId: 'sch_jee_main_2027_17',
      canonicalTitle: 'Wave Optics & Dual Nature of Radiation',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U17_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 3,
      startCycleDay: 37,
      endCycleDay: 38,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 18,
      scheduleId: 'sch_jee_main_2027_18',
      canonicalTitle: 'Atoms & Nuclei',
      subject: 'Physics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_PHY_U18_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 3,
      startCycleDay: 39,
      endCycleDay: 40,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),

    // =========================================================================
    // PHASE 4 (DAYS 43–56): PHYSICAL CHEMISTRY I
    // =========================================================================
    CrucibleCanonicalSchedule(
      scheduleNumber: 19,
      scheduleId: 'sch_jee_main_2027_19',
      canonicalTitle: 'Some Basic Concepts of Chemistry',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U01_T_00000001',
        'JEE_MAIN_2026_CHE_U01_T_00000002',
        'JEE_MAIN_2026_CHE_U01_T_00000003',
        'JEE_MAIN_2026_CHE_U01_T_00000004',
        'JEE_MAIN_2026_CHE_U01_T_00000005',
        'JEE_MAIN_2026_CHE_U01_T_00000006',
        'JEE_MAIN_2026_CHE_U01_T_00000007',
        'JEE_MAIN_2026_CHE_U01_T_00000008',
        'JEE_MAIN_2026_CHE_U01_T_0000000A',
        'JEE_MAIN_2026_CHE_U01_T_0000000C',
        'JEE_MAIN_2026_CHE_U01_T_0000000D',
        'JEE_MAIN_2026_CHE_U01_T_0000000E',
        'JEE_MAIN_2026_CHE_U01_T_00000011',
        'JEE_MAIN_2026_CHE_U01_T_00000012',
        'JEE_MAIN_2026_CHE_U01_T_00000013',
        'JEE_MAIN_2026_CHE_U01_T_00000014',
      ],
      generationUnitIds: [
        'GU_JEEMAIN2027_CHE_910B0B49',
        'GU_JEEMAIN2027_CHE_8ADB0D17',
        'GU_JEEMAIN2027_CHE_B6EA7762',
        'GU_JEEMAIN2027_CHE_2679365D',
        'GU_JEEMAIN2027_CHE_AFF61328',
        'GU_JEEMAIN2027_CHE_A92E33EC',
        'GU_JEEMAIN2027_CHE_6C5A7754',
        'GU_JEEMAIN2027_CHE_ECB3B44F',
        'GU_JEEMAIN2027_CHE_32DA7803',
        'GU_JEEMAIN2027_CHE_F19671DA',
        'GU_JEEMAIN2027_CHE_2AF5BFC3',
        'GU_JEEMAIN2027_CHE_F7D196DB',
        'GU_JEEMAIN2027_CHE_EE3AD3D8',
        'GU_JEEMAIN2027_CHE_E5AFA359',
        'GU_JEEMAIN2027_CHE_024AF105',
        'GU_JEEMAIN2027_CHE_2AE52211',
        'GU_JEEMAIN2027_CHE_D9AD4557',
        'GU_JEEMAIN2027_CHE_B2DE828B',
        'GU_JEEMAIN2027_CHE_9737F355',
        'GU_JEEMAIN2027_CHE_AC8B192F',
      ],
      phaseIndex: 4,
      startCycleDay: 43,
      endCycleDay: 44,
      availability: ScheduleDigiBookAvailability.full,
      bindingStatus: 'CANONICALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/digibook_authority_bridge_manifest.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 20,
      scheduleId: 'sch_jee_main_2027_20',
      canonicalTitle: 'Structure of Atom',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U02_T_00000001',
        'JEE_MAIN_2026_CHE_U02_T_00000002',
        'JEE_MAIN_2026_CHE_U02_T_00000003',
        'JEE_MAIN_2026_CHE_U02_T_00000016',
        'JEE_MAIN_2026_CHE_U02_T_00000019',
      ],
      generationUnitIds: [
        'GU_JEEMAIN2027_CHE_4DB27569',
        'GU_JEEMAIN2027_CHE_A6A45FCE',
        'GU_JEEMAIN2027_CHE_4DF35115',
        'GU_JEEMAIN2027_CHE_1DF8039E',
        'GU_JEEMAIN2027_CHE_FC0B77A4',
      ],
      phaseIndex: 4,
      startCycleDay: 45,
      endCycleDay: 46,
      availability: ScheduleDigiBookAvailability.full,
      bindingStatus: 'CANONICALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/digibook_authority_bridge_manifest.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 21,
      scheduleId: 'sch_jee_main_2027_21',
      canonicalTitle: 'Classification of Elements & Periodicity',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U03_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 4,
      startCycleDay: 47,
      endCycleDay: 48,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 22,
      scheduleId: 'sch_jee_main_2027_22',
      canonicalTitle: 'Chemical Bonding & Molecular Structure',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U04_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 4,
      startCycleDay: 49,
      endCycleDay: 50,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 23,
      scheduleId: 'sch_jee_main_2027_23',
      canonicalTitle: 'Chemical Thermodynamics',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U05_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 4,
      startCycleDay: 51,
      endCycleDay: 52,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 24,
      scheduleId: 'sch_jee_main_2027_24',
      canonicalTitle: 'Chemical & Ionic Equilibrium',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U06_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 4,
      startCycleDay: 53,
      endCycleDay: 54,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),

    // =========================================================================
    // PHASE 5 (DAYS 57–70): PHYSICAL CHEMISTRY II & INORGANIC/GENERAL ORGANIC
    // =========================================================================
    CrucibleCanonicalSchedule(
      scheduleNumber: 25,
      scheduleId: 'sch_jee_main_2027_25',
      canonicalTitle: 'Redox Reactions & Electrochemistry',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U07_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 5,
      startCycleDay: 57,
      endCycleDay: 58,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 26,
      scheduleId: 'sch_jee_main_2027_26',
      canonicalTitle: 'Chemical Kinetics',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U09_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 5,
      startCycleDay: 59,
      endCycleDay: 60,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 27,
      scheduleId: 'sch_jee_main_2027_27',
      canonicalTitle: 'Solutions',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U10_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 5,
      startCycleDay: 61,
      endCycleDay: 62,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 28,
      scheduleId: 'sch_jee_main_2027_28',
      canonicalTitle: 'p-Block & d/f-Block Elements',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U11_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 5,
      startCycleDay: 63,
      endCycleDay: 64,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 29,
      scheduleId: 'sch_jee_main_2027_29',
      canonicalTitle: 'Coordination Compounds',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U13_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 5,
      startCycleDay: 65,
      endCycleDay: 66,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 30,
      scheduleId: 'sch_jee_main_2027_30',
      canonicalTitle: 'Organic Chemistry — Basic Principles & Techniques',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U14_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 5,
      startCycleDay: 67,
      endCycleDay: 68,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),

    // =========================================================================
    // PHASE 6 (DAYS 71–84): ORGANIC CHEMISTRY & MATHEMATICS I
    // =========================================================================
    CrucibleCanonicalSchedule(
      scheduleNumber: 31,
      scheduleId: 'sch_jee_main_2027_31',
      canonicalTitle: 'Hydrocarbons',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U15_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 6,
      startCycleDay: 71,
      endCycleDay: 72,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 32,
      scheduleId: 'sch_jee_main_2027_32',
      canonicalTitle: 'Haloalkanes & Haloarenes',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U16_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 6,
      startCycleDay: 73,
      endCycleDay: 74,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 33,
      scheduleId: 'sch_jee_main_2027_33',
      canonicalTitle: 'Alcohols, Phenols & Ethers',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U17_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 6,
      startCycleDay: 75,
      endCycleDay: 76,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 34,
      scheduleId: 'sch_jee_main_2027_34',
      canonicalTitle: 'Aldehydes, Ketones & Carboxylic Acids',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U18_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 6,
      startCycleDay: 77,
      endCycleDay: 78,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 35,
      scheduleId: 'sch_jee_main_2027_35',
      canonicalTitle: 'Organic Compounds Containing Nitrogen & Biomolecules',
      subject: 'Chemistry',
      canonicalNodeIds: [
        'JEE_MAIN_2026_CHE_U19_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 6,
      startCycleDay: 79,
      endCycleDay: 80,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 36,
      scheduleId: 'sch_jee_main_2027_36',
      canonicalTitle: 'Sets, Relations & Functions',
      subject: 'Mathematics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_MAT_U01_T_00000001',
      ],
      generationUnitIds: [
        'GU_JEEMAIN2027_MAT_9BB8FB46',
      ],
      phaseIndex: 6,
      startCycleDay: 81,
      endCycleDay: 82,
      availability: ScheduleDigiBookAvailability.full,
      bindingStatus: 'CANONICALLY_BOUND',
      bindingAuthorityArtifact: 'docs/academic_review/digibook_authority_bridge_manifest.json',
    ),

    // =========================================================================
    // PHASE 7 (DAYS 85–98): MATHEMATICS II
    // =========================================================================
    CrucibleCanonicalSchedule(
      scheduleNumber: 37,
      scheduleId: 'sch_jee_main_2027_37',
      canonicalTitle: 'Complex Numbers & Quadratic Equations',
      subject: 'Mathematics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_MAT_U02_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 7,
      startCycleDay: 85,
      endCycleDay: 86,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 38,
      scheduleId: 'sch_jee_main_2027_38',
      canonicalTitle: 'Matrices & Determinants',
      subject: 'Mathematics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_MAT_U03_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 7,
      startCycleDay: 87,
      endCycleDay: 88,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 39,
      scheduleId: 'sch_jee_main_2027_39',
      canonicalTitle: 'Permutations, Combinations & Binomial Theorem',
      subject: 'Mathematics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_MAT_U04_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 7,
      startCycleDay: 89,
      endCycleDay: 90,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 40,
      scheduleId: 'sch_jee_main_2027_40',
      canonicalTitle: 'Sequences & Series, Limits, Continuity & Differentiability',
      subject: 'Mathematics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_MAT_U05_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 7,
      startCycleDay: 91,
      endCycleDay: 92,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 41,
      scheduleId: 'sch_jee_main_2027_41',
      canonicalTitle: 'Integral Calculus & Differential Equations',
      subject: 'Mathematics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_MAT_U06_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 7,
      startCycleDay: 93,
      endCycleDay: 94,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
    CrucibleCanonicalSchedule(
      scheduleNumber: 42,
      scheduleId: 'sch_jee_main_2027_42',
      canonicalTitle: 'Coordinate Geometry & Vector Algebra',
      subject: 'Mathematics',
      canonicalNodeIds: [
        'JEE_MAIN_2026_MAT_U07_T_00000001',
      ],
      generationUnitIds: [],
      phaseIndex: 7,
      startCycleDay: 95,
      endCycleDay: 96,
      availability: ScheduleDigiBookAvailability.none,
      bindingStatus: 'PARTIALLY_BOUND',
      bindingAuthorityArtifact: 'docs/authority/jee_crucible_coverage_mapping.json',
    ),
  ];

  static CrucibleCanonicalSchedule? getScheduleByNumber(int number) {
    if (number < 1 || number > 42) return null;
    return all42Schedules[number - 1];
  }

  static CrucibleCanonicalSchedule? getScheduleForCycleDay(int cycleDay) {
    if (cycleDay < 1 || cycleDay > 98) return null;
    for (final sch in all42Schedules) {
      if (cycleDay >= sch.startCycleDay && cycleDay <= sch.endCycleDay) {
        return sch;
      }
    }
    return null; // On rebuild (13, 27, ...) or macro (14, 28, ...)
  }

  static bool isRebuildDay(int cycleDay) {
    const rebuildDays = {13, 27, 41, 55, 69, 83, 97};
    return rebuildDays.contains(cycleDay);
  }

  static bool isMacroDay(int cycleDay) {
    const macroDays = {14, 28, 42, 56, 70, 84, 98};
    return macroDays.contains(cycleDay);
  }

  static int getPhaseForCycleDay(int cycleDay) {
    if (cycleDay < 1 || cycleDay > 98) return 1;
    return ((cycleDay - 1) ~/ 14) + 1;
  }
}
