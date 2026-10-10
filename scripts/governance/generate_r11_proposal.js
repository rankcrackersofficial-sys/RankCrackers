const fs = require('fs');
const path = require('path');

const GOVERNANCE_DIR = path.resolve('C:/RankCrackers/RankCrackers-55.worktrees/governance-living-checklist/docs/governance');
const proposalPath = path.join(GOVERNANCE_DIR, 'mutation_inbox/proposal_video_regression_recovery_11.json');

const now = new Date().toISOString();

const proposal = {
  proposal_id: 'PROP_VIDEO_REGRESSION_RECOVERY_11',
  command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
  base_ledger_revision: 9,
  base_ledger_hash: 'ad215653b3bb155815a420dc566d862d7bea59a004af6833647485bb468dcae6',
  notes: 'Founder-video-grounded selective regression recovery for 12 proven UI and data integration regressions',
  mutations: [
    {
      checklist_id: 'GAP-SYL-01.001',
      claimed_execution_state: 'IMPLEMENTED',
      claimed_verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      claimed_audit_state: 'AUDIT_PASS',
      claimed_checked: false,
      blockers: [],
      evidence_refs: [
        'docs/patch_safety/rc_video_regression_recovery_11/01_FOUNDER_VIDEO_DEFECT_REGISTER.tsv',
        'lib/features/syllabus/presentation/screens/syllabus_screen.dart',
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      notes: 'Syllabus title restored to exact Syllabus (eliminated SYLLABUS MAP) per Founder video VID-11'
    }
  ],
  new_items: [
    {
      id: 'GAP-UX-01.001',
      domain_id: 'DASH',
      capability_id: 'GOV-01',
      feature_id: 'GOV-01-F01',
      title: 'Home Screen Minimum Typography & Contrast Authority',
      requirement: 'All section titles, priority descriptions, status labels, and values on Student Home must meet minimum typography scale (headers >= 11px, body >= 12.5px, values >= 14px) and high contrast (white/gold/white70 on dark background).',
      decision_state: 'LOCKED',
      baseline_status: 'LOCKED',
      baseline_acceptance_text: 'Zero unreadable or low-contrast text on Student Home screen across viewports.',
      current_execution_state: 'IMPLEMENTED',
      execution_state: 'IMPLEMENTED',
      verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      audit_state: 'AUDIT_PASS',
      checked: false,
      acceptance_rule: 'All text elements on Dashboard satisfy minimum size and high contrast standards; zero 6-10px unreadable dark gray text.',
      acceptance_rule_met: true,
      review_requirement_type: 'TECHNICAL_INFRASTRUCTURE',
      founder_physical_review_required: true,
      independent_verification_sufficient: false,
      blockers: [],
      dependencies: [],
      evidence_refs: [
        'docs/patch_safety/rc_video_regression_recovery_11/01_FOUNDER_VIDEO_DEFECT_REGISTER.tsv',
        'docs/patch_safety/rc_video_regression_recovery_11/02_HOME_TEXT_CONTRAST_AUDIT.tsv',
        'lib/features/dashboard/presentation/screens/dashboard_screen.dart',
        'lib/features/dashboard/presentation/widgets/notifications/latest_updates_card.dart',
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      source_refs: [
        'lib/features/dashboard/presentation/screens/dashboard_screen.dart'
      ],
      created_at: now,
      updated_at: now,
      last_command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      last_execution_checklist_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      history: [
        {
          timestamp: now,
          command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
          action: 'REGRESSION_RECOVERED',
          summary: 'Home screen typography and high contrast restored per Founder video VID-01 & VID-02'
        }
      ]
    },
    {
      id: 'GAP-UX-02.001',
      domain_id: 'DASH',
      capability_id: 'GOV-01',
      feature_id: 'GOV-01-F01',
      title: 'Battle Tools Grid Compact Aspect Ratio & Zero RenderFlex Overflow',
      requirement: 'Battle Tools 2x2 grid must render compactly with zero void and zero RenderFlex overflow across Samsung S23 and all mobile viewports.',
      decision_state: 'LOCKED',
      baseline_status: 'LOCKED',
      baseline_acceptance_text: 'Zero pixel overflow and compact 1.22-1.28 aspect ratio grid on all screen widths.',
      current_execution_state: 'IMPLEMENTED',
      execution_state: 'IMPLEMENTED',
      verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      audit_state: 'AUDIT_PASS',
      checked: false,
      acceptance_rule: 'Battle Tools grid renders without overflow and status chips wrap cleanly.',
      acceptance_rule_met: true,
      review_requirement_type: 'TECHNICAL_INFRASTRUCTURE',
      founder_physical_review_required: true,
      independent_verification_sufficient: false,
      blockers: [],
      dependencies: [],
      evidence_refs: [
        'docs/patch_safety/rc_video_regression_recovery_11/01_FOUNDER_VIDEO_DEFECT_REGISTER.tsv',
        'lib/features/dashboard/presentation/widgets/battle_tools/battle_tools_grid.dart',
        'lib/features/dashboard/presentation/widgets/battle_tools/battle_tool_card.dart',
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      source_refs: [
        'lib/features/dashboard/presentation/widgets/battle_tools/battle_tools_grid.dart'
      ],
      created_at: now,
      updated_at: now,
      last_command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      last_execution_checklist_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      history: [
        {
          timestamp: now,
          command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
          action: 'REGRESSION_RECOVERED',
          summary: 'Battle Tools compact grid and zero RenderFlex overflow implemented per Founder video VID-03 & VID-04'
        }
      ]
    },
    {
      id: 'GAP-UX-03.001',
      domain_id: 'DASH',
      capability_id: 'GOV-01',
      feature_id: 'GOV-01-F01',
      title: 'Battle Tools Human Status Label Authority',
      requirement: 'Zero raw technical enums (NEEDS_EVIDENCE, NO_REVISION_STATE, etc.) may be exposed to students in Battle Tool chips.',
      decision_state: 'LOCKED',
      baseline_status: 'LOCKED',
      baseline_acceptance_text: 'Student-friendly title-case labels used on all tool cards.',
      current_execution_state: 'IMPLEMENTED',
      execution_state: 'IMPLEMENTED',
      verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      audit_state: 'AUDIT_PASS',
      checked: false,
      acceptance_rule: 'Raw enums mapped to plain English Student-safe labels.',
      acceptance_rule_met: true,
      review_requirement_type: 'TECHNICAL_INFRASTRUCTURE',
      founder_physical_review_required: true,
      independent_verification_sufficient: false,
      blockers: [],
      dependencies: [],
      evidence_refs: [
        'docs/patch_safety/rc_video_regression_recovery_11/01_FOUNDER_VIDEO_DEFECT_REGISTER.tsv',
        'docs/patch_safety/rc_video_regression_recovery_11/04_STUDENT_TERMINOLOGY_AUDIT.tsv',
        'lib/features/dashboard/presentation/widgets/battle_tools/battle_tool_card.dart',
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      source_refs: [
        'lib/features/dashboard/presentation/widgets/battle_tools/battle_tool_card.dart'
      ],
      created_at: now,
      updated_at: now,
      last_command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      last_execution_checklist_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      history: [
        {
          timestamp: now,
          command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
          action: 'REGRESSION_RECOVERED',
          summary: 'Replaced technical enum strings with human-friendly labels per Founder video VID-05'
        }
      ]
    },
    {
      id: 'GAP-TA-01.001',
      domain_id: 'TA',
      capability_id: 'GOV-01',
      feature_id: 'GOV-01-F01',
      title: 'Test Arena Benchmark Event Communication Standard',
      requirement: 'Test Arena bottom sheet must state standardized benchmark test readiness truthfully without claiming unbuilt dynamic diagnostic calibration.',
      decision_state: 'LOCKED',
      baseline_status: 'LOCKED',
      baseline_acceptance_text: 'Truthful benchmark explanation in Test Arena modal sheet.',
      current_execution_state: 'IMPLEMENTED',
      execution_state: 'IMPLEMENTED',
      verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      audit_state: 'AUDIT_PASS',
      checked: false,
      acceptance_rule: 'Test Arena modal states benchmark event availability without unbuilt diagnostic dependencies.',
      acceptance_rule_met: true,
      review_requirement_type: 'TECHNICAL_INFRASTRUCTURE',
      founder_physical_review_required: true,
      independent_verification_sufficient: false,
      blockers: [],
      dependencies: [],
      evidence_refs: [
        'docs/patch_safety/rc_video_regression_recovery_11/01_FOUNDER_VIDEO_DEFECT_REGISTER.tsv',
        'lib/features/dashboard/presentation/widgets/battle_tools/battle_tool_card.dart',
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      source_refs: [
        'lib/features/dashboard/presentation/widgets/battle_tools/battle_tool_card.dart'
      ],
      created_at: now,
      updated_at: now,
      last_command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      last_execution_checklist_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      history: [
        {
          timestamp: now,
          command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
          action: 'REGRESSION_RECOVERED',
          summary: 'Truthful benchmark explanation in Test Arena sheet per Founder video VID-06'
        }
      ]
    },
    {
      id: 'GAP-CRU-02.001',
      domain_id: 'CRU',
      capability_id: 'GOV-01',
      feature_id: 'GOV-01-F01',
      title: 'Crucible Visible Data Provenance & Continuous 98-Day Math',
      requirement: 'Crucible screen visible values must strictly derive from governed calendar anchor math (e.g. Day 51 / Block 4 / Schedule 23 for Sept 4, 2026), with zero unproven synthetic schedules.',
      decision_state: 'LOCKED',
      baseline_status: 'LOCKED',
      baseline_acceptance_text: 'Exact arithmetic provenance for all 14 visible fields on Crucible screen.',
      current_execution_state: 'IMPLEMENTED',
      execution_state: 'IMPLEMENTED',
      verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      audit_state: 'AUDIT_PASS',
      checked: false,
      acceptance_rule: 'Day calculation strictly matches anchor arithmetic; S23 shows Chemical Thermodynamics with truthful unmapped state.',
      acceptance_rule_met: true,
      review_requirement_type: 'TECHNICAL_INFRASTRUCTURE',
      founder_physical_review_required: true,
      independent_verification_sufficient: false,
      blockers: [],
      dependencies: [],
      evidence_refs: [
        'docs/patch_safety/rc_video_regression_recovery_11/01_FOUNDER_VIDEO_DEFECT_REGISTER.tsv',
        'docs/patch_safety/rc_video_regression_recovery_11/03_CRUCIBLE_VISIBLE_DATA_PROVENANCE.tsv',
        'lib/features/crucible/core/crucible_clock_engine.dart',
        'lib/features/crucible/core/crucible_canonical_schedules.dart',
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      source_refs: [
        'lib/features/crucible/presentation/screens/crucible_screen.dart'
      ],
      created_at: now,
      updated_at: now,
      last_command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      last_execution_checklist_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      history: [
        {
          timestamp: now,
          command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
          action: 'REGRESSION_RECOVERED',
          summary: 'Verified Crucible visible data provenance per Founder video VID-07'
        }
      ]
    },
    {
      id: 'GAP-CRU-03.001',
      domain_id: 'CRU',
      capability_id: 'GOV-01',
      feature_id: 'GOV-01-F01',
      title: 'Crucible Student Terminology Standard (Zero Sovereign Progress)',
      requirement: 'Theatrical jargon such as Sovereign Progress must be replaced with plain, pedagogical Student terminology such as Continuous Progress.',
      decision_state: 'LOCKED',
      baseline_status: 'LOCKED',
      baseline_acceptance_text: 'Zero theatrical sovereign/citadel/chamber jargon visible to students.',
      current_execution_state: 'IMPLEMENTED',
      execution_state: 'IMPLEMENTED',
      verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      audit_state: 'AUDIT_PASS',
      checked: false,
      acceptance_rule: 'Crucible screen uses Continuous Progress label.',
      acceptance_rule_met: true,
      review_requirement_type: 'TECHNICAL_INFRASTRUCTURE',
      founder_physical_review_required: true,
      independent_verification_sufficient: false,
      blockers: [],
      dependencies: [],
      evidence_refs: [
        'docs/patch_safety/rc_video_regression_recovery_11/01_FOUNDER_VIDEO_DEFECT_REGISTER.tsv',
        'docs/patch_safety/rc_video_regression_recovery_11/04_STUDENT_TERMINOLOGY_AUDIT.tsv',
        'lib/features/crucible/presentation/screens/crucible_screen.dart',
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      source_refs: [
        'lib/features/crucible/presentation/screens/crucible_screen.dart'
      ],
      created_at: now,
      updated_at: now,
      last_command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      last_execution_checklist_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      history: [
        {
          timestamp: now,
          command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
          action: 'REGRESSION_RECOVERED',
          summary: 'Replaced Sovereign Progress with Continuous Progress per Founder video VID-08'
        }
      ]
    },
    {
      id: 'GAP-LIB-01.001',
      domain_id: 'DB',
      capability_id: 'GOV-01',
      feature_id: 'GOV-01-F01',
      title: 'DigiBook Asset Bundle Authority for Physical Lesson Discovery',
      requirement: 'The canonical DigiBook bridge manifest (51 physical lesson records) must be bundled in pubspec.yaml assets so all physical lessons are discoverable in Library at mobile runtime.',
      decision_state: 'LOCKED',
      baseline_status: 'LOCKED',
      baseline_acceptance_text: '51 physical lesson records discovered and navigable from Library.',
      current_execution_state: 'IMPLEMENTED',
      execution_state: 'IMPLEMENTED',
      verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      audit_state: 'AUDIT_PASS',
      checked: false,
      acceptance_rule: 'DigiBook manifest bundled in assets and initializes 51 physical lesson records.',
      acceptance_rule_met: true,
      review_requirement_type: 'TECHNICAL_INFRASTRUCTURE',
      founder_physical_review_required: true,
      independent_verification_sufficient: false,
      blockers: [],
      dependencies: [],
      evidence_refs: [
        'docs/patch_safety/rc_video_regression_recovery_11/01_FOUNDER_VIDEO_DEFECT_REGISTER.tsv',
        'docs/patch_safety/rc_video_regression_recovery_11/05_DIGIBOOK_MAPPING_RECOVERY.tsv',
        'pubspec.yaml',
        'lib/features/digibook/domain/services/digibook_canonical_bridge_service.dart',
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      source_refs: [
        'pubspec.yaml',
        'lib/features/digibook/presentation/screens/digi_book_library_screen.dart'
      ],
      created_at: now,
      updated_at: now,
      last_command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      last_execution_checklist_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      history: [
        {
          timestamp: now,
          command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
          action: 'REGRESSION_RECOVERED',
          summary: 'Bundled digibook manifest in pubspec.yaml assets restoring 51 discoverable lessons per Founder video VID-09 & VID-10'
        }
      ]
    },
    {
      id: 'GAP-OPP-01.001',
      domain_id: 'GOV',
      capability_id: 'GOV-01',
      feature_id: 'GOV-01-F01',
      title: 'Career Signals Student Clean State & Zero Internal Governance Leakage',
      requirement: 'Opportunities/Career Signals screen must present a clean, polished Student-facing message (Career Signals are not ready yet) and zero internal Founder diagnostics, pipeline checkpoints, or authority rules.',
      decision_state: 'LOCKED',
      baseline_status: 'LOCKED',
      baseline_acceptance_text: 'Zero internal Founder audit checkpoints visible to students on Career Signals screen.',
      current_execution_state: 'IMPLEMENTED',
      execution_state: 'IMPLEMENTED',
      verification_state: 'PENDING_FOUNDER_PHYSICAL_REVIEW',
      audit_state: 'AUDIT_PASS',
      checked: false,
      acceptance_rule: 'Opportunities screen shows Student-safe coming soon card without governance leakage.',
      acceptance_rule_met: true,
      review_requirement_type: 'TECHNICAL_INFRASTRUCTURE',
      founder_physical_review_required: true,
      independent_verification_sufficient: false,
      blockers: [],
      dependencies: [],
      evidence_refs: [
        'docs/patch_safety/rc_video_regression_recovery_11/01_FOUNDER_VIDEO_DEFECT_REGISTER.tsv',
        'lib/features/opportunities/screens/opportunities_screen.dart',
        'test/features/crucible/founder_video_regression_recovery_test.dart'
      ],
      source_refs: [
        'lib/features/opportunities/screens/opportunities_screen.dart'
      ],
      created_at: now,
      updated_at: now,
      last_command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      last_execution_checklist_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
      history: [
        {
          timestamp: now,
          command_id: 'RC_FOUNDER_VIDEO_EVIDENCE_SELECTIVE_REGRESSION_RECOVERY_11',
          action: 'REGRESSION_RECOVERED',
          summary: 'Replaced internal Founder diagnostics on Opportunities screen with clean Student message per Founder video VID-12'
        }
      ]
    }
  ]
};

fs.writeFileSync(proposalPath, JSON.stringify(proposal, null, 2));
console.log('Successfully written proposal to', proposalPath);
