/**
 * 🔱 MISSION LIFECYCLE BLUEPRINTS (Hardened v3.4 - Document 73)
 * Canonical roadmaps with state tracking.
 */

const BLUEPRINTS = {
    'ssc_cgl': [
        { type: 'NOTIFICATION_RELEASED', title: 'Official Notification', mandatory: true },
        { type: 'APPLICATION_WINDOW', title: 'Application Window', mandatory: true },
        { type: 'TIER_1_ADMIT_CARD', title: 'Tier 1 Admit Card', mandatory: true },
        { type: 'TIER_1_EXAM', title: 'Tier 1 Examination', mandatory: true },
        { type: 'TIER_1_RESULT', title: 'Tier 1 Result', mandatory: true },
        { type: 'TIER_2_ADMIT_CARD', title: 'Tier 2 Admit Card', mandatory: true },
        { type: 'TIER_2_EXAM', title: 'Tier 2 Examination', mandatory: true },
        { type: 'FINAL_RESULT', title: 'Final Merit List', mandatory: true }
    ],
    'rpsc_ras': [
        { type: 'NOTIFICATION_RELEASED', title: 'Official Notification', mandatory: true },
        { type: 'PRELIMS_ADMIT_CARD', title: 'Prelims Admit Card', mandatory: true },
        { type: 'PRELIMS_EXAM', title: 'Prelims Examination', mandatory: true },
        { type: 'PRELIMS_RESULT', title: 'Prelims Result', mandatory: true },
        { type: 'MAINS_EXAM', title: 'Mains Examination', mandatory: true },
        { type: 'INTERVIEW', title: 'Interview / Viva-Voce', mandatory: true },
        { type: 'FINAL_RESULT', title: 'Final Selection List', mandatory: true }
    ],
    'default': [
        { type: 'NOTIFICATION_RELEASED', title: 'Official Notification', mandatory: true },
        { type: 'APPLICATION_OPEN', title: 'Application Starts', mandatory: false },
        { type: 'APPLICATION_CLOSED', title: 'Application Deadline', mandatory: false },
        { type: 'ADMIT_CARD', title: 'Admit Card Release', mandatory: true },
        { type: 'EXAM', title: 'Examination Date', mandatory: true },
        { type: 'RESULT', title: 'Result Declaration', mandatory: true }
    ]
};

/**
 * 🔱 Resolves blueprint by canonical category.
 */
function getLifecycleBlueprint(examCategory) {
    const key = (examCategory || 'default').toLowerCase();
    return BLUEPRINTS[key] || BLUEPRINTS['default'];
}

module.exports = { getLifecycleBlueprint };
