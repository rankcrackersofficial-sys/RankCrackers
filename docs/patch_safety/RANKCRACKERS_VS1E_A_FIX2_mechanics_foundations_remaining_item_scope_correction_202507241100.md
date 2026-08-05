# VS1E-A-FIX2: Mechanics Foundations Item Pack Scope Correction

## 1. Correction Summary
This patch corrects items `MF_ASI_07` and `MF_ASI_12` to remove implicit gravitation and qualitative NLM 2 inferences, ensuring alignment with the corrected VS1D blueprint.

## 2. Item Adjustments

### MF_ASI_07: Prescribed Acceleration Scenario
- **Old Stem**: Ball thrown upward (implied gravity).
- **New Stem**: Motorized cart with explicitly prescribed constant acceleration ($+1.0\text{ m/s}^2$) passing through zero velocity.
- **Reasoning**: Eliminates dependency on external knowledge of gravity ($g$). Ensures zero velocity moment is evaluated within a prescribed kinematic context.

### MF_ASI_12: Hovercraft Force-Motion Mapping
- **Stem Change**: Removed mass data. Explicitly stated not to determine force direction or magnitude.
- **Key Change**: Removed direction of force ("opposite to motion"). Focused strictly on zero vs. non-zero net force based on NLM 1.
- **Inertia Clarification**: Removed causal language ("causing it to glide"). Inertia is correctly defined as a property of resistance to velocity change.
- **Diagram Spec**: Removed requirement for backward net force arrow.

## 3. Global Stats Verification
- **Total Items**: 12 (No change)
- **Total Points**: 16 (No change)
- **Cognitive Distribution**: Recall: 2, Understanding: 4, Application: 4, Analysis: 2 (No change)
- **Consistency**: MD and JSON fields are synchronized.

## 4. Stale Claim Scan
- "ball is thrown straight upward": 0 active matches.
- "highest point of its flight": 0 active matches.
- "force opposite to motion": 0 active matches.
- "directed opposite to the motion": 0 active matches.
- "inertia causing it to glide": 0 active matches.

## 5. Safety Confirmation
- `studentPublishReady`: false
- `assessmentPackReviewed`: false
- `firestoreMaterializationAuthorized`: false

RC_X4E_VS1E_A_FIX2_ITEM_CORRECTION_COMPLETE
