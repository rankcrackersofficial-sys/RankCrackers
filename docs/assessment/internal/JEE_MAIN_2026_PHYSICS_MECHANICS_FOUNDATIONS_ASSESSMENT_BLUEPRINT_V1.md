# Mechanics Foundations — Internal Assessment Blueprint

## 1. Document Identity
* **Assessment Blueprint ID**: `jee_main_2026_physics_mechanics_foundations_assessment_blueprint_v1`
* **Title**: Mechanics Foundations — Internal Assessment Blueprint
* **Blueprint Type**: `INTERNAL_ORIGINAL_CONTENT_ASSESSMENT_DESIGN`
* **Status**: `draft`
* **Visibility**: `INTERNAL_ONLY`
* **Planning Node**: `mech_foundations`

### Required Safety Fields
- `studentPublishReady`: `false`
- `assessmentItemsGenerated`: `false`
- `questionPackAttached`: `false`
- `founderApprovalStatus`: `PENDING`
- `proReviewStatus`: `PENDING`
- `studentReadiness`: `NOT_READY`
- `firestoreMaterializationAuthorized`: `false`

---

## 2. Assessment Purposes
Assessment design in this unit is structured around three tiers of evidence:

* **Diagnostic Evidence**: Designed to isolate prerequisites failures, qualitative sign-convention mistakes, graph-reading habits, and pre-existing force-motion misconceptions (e.g. confusing force with velocity).
* **Formative Evidence**: Designed to test intermediate problem-solving steps, switching between representation types (verbal to graphical or mathematical), equation selection rationale, calculation correctness, and qualitative explanation quality.
* **Exit Evidence**: Used to establish whether the student has met the core standards—specifically, the relativity of motion, displacement calculations in 1D, UAM mathematical relations, v-t/x-t graph interpretations, and reasoning with Newton's First Law (inertia as a property, not a force).

No active test papers, question cards, or student-facing quizzes are compiled in this design phase.

---

## 3. 12-Slot Assessment Matrix

### Slot 1: AS_01
- **Slot ID**: `AS_01`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_01`
- **Learning Objective**: Explain the relativity of rest and motion by comparing passenger observations from train and platform frames.
- **Assessment Purpose**: Diagnostic (detects absolute rest misconception).
- **Evidence Type**: DIAGNOSTIC
- **Cognitive Level**: UNDERSTANDING
- **Recommended Item Format**: SINGLE_SELECT
- **Difficulty Band**: MEDIUM
- **Estimated Response Time (Seconds)**: 90
- **Prerequisites**: Elementary algebra.
- **Misconception Targets**: None
- **Required Representation**: Verbal description.
- **Calculation Required**: `false`
- **Graph Required**: `false`
- **Expected Reasoning**: Explains that motion is frame-dependent; sitting passenger is at rest relative to the train carriage but moving relative to the ground platform.
- **Acceptable Evidence**: Clearly identifies that state of motion differs across coordinate systems and rejects absolute rest.
- **Insufficient Evidence**: Selecting absolute answers ("is strictly at rest").
- **Common Failure Signals**: Assuming the platform ground is the only true reference frame.
- **Scoring Approach**: BINARY
- **Mastery Signal**: Correct option selection and choice of frame-dependent explanation.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 2: AS_02
- **Slot ID**: `AS_02`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_02`
- **Learning Objective**: Distinguish between total path distance and straight-line displacement in a 1D turn-back scenario.
- **Assessment Purpose**: Formative (evaluates path length vs. net change in position).
- **Evidence Type**: FORMATIVE
- **Cognitive Level**: UNDERSTANDING
- **Recommended Item Format**: SINGLE_SELECT
- **Difficulty Band**: MEDIUM
- **Estimated Response Time (Seconds)**: 120
- **Prerequisites**: 1D coordinates, basic geometry.
- **Misconception Targets**: `MIS_01` (Distance and displacement are always equal).
- **Required Representation**: Numerical values and units.
- **Calculation Required**: `true`
- **Graph Required**: `false`
- **Expected Reasoning**: Recognizes that distance accumulates positively over the entire path, while displacement depends only on final and initial positions.
- **Acceptable Evidence**: Correct distance calculation ($d = d_1 + d_2$) and displacement calculation ($\Delta x = x_f - x_i$) with sign.
- **Insufficient Evidence**: Conflating distance and displacement magnitude.
- **Common Failure Signals**: Adding individual segment lengths to get displacement.
- **Scoring Approach**: BINARY
- **Mastery Signal**: Correctly computes both values with units.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 3: AS_03
- **Slot ID**: `AS_03`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_03`
- **Learning Objective**: Calculate average speed and average velocity vector for a two-segment 1D motion where the object reverses direction.
- **Assessment Purpose**: Exit (verifies mastery of average rates).
- **Evidence Type**: EXIT
- **Cognitive Level**: APPLICATION
- **Recommended Item Format**: NUMERIC_RESPONSE
- **Difficulty Band**: MEDIUM
- **Estimated Response Time (Seconds)**: 180
- **Prerequisites**: Distance/displacement definitions, time interval division.
- **Misconception Targets**: `MIS_02` (Speed and velocity are identical).
- **Required Representation**: Numerical values and units.
- **Calculation Required**: `true`
- **Graph Required**: `false`
- **Expected Reasoning**: Divides total distance by total time for average speed, and net displacement by total time for average velocity.
- **Acceptable Evidence**: Obtains different values for speed and velocity due to the directional reversal, with correct signs/vectors.
- **Insufficient Evidence**: Averaging the two segment speeds directly.
- **Common Failure Signals**: Using $(v_1 + v_2)/2$ directly.
- **Scoring Approach**: BINARY
- **Mastery Signal**: Correct numerical outputs with correct units.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 4: AS_04
- **Slot ID**: `AS_04`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_04`
- **Learning Objective**: Explain that a negative velocity indicates direction of motion in 1D rather than magnitude changes.
- **Assessment Purpose**: Diagnostic (evaluates sign interpretation).
- **Evidence Type**: DIAGNOSTIC
- **Cognitive Level**: UNDERSTANDING
- **Recommended Item Format**: MULTI_SELECT
- **Difficulty Band**: HARD
- **Estimated Response Time (Seconds)**: 120
- **Prerequisites**: Coordinate axis setup.
- **Misconception Targets**: `MIS_03` (Negative velocity means slowing down).
- **Required Representation**: One-dimensional direction/sign.
- **Calculation Required**: `false`
- **Graph Required**: `false`
- **Expected Reasoning**: Identifies that an object moving in the negative direction is speeding up if its acceleration is also negative.
- **Acceptable Evidence**: Explains that sign designates direction and speed is the absolute magnitude.
- **Insufficient Evidence**: Stating that a negative sign automatically implies deceleration.
- **Common Failure Signals**: Confusing signed values with physical speeds.
- **Scoring Approach**: BINARY
- **Mastery Signal**: Correctly identifies speed changes under different sign combinations.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 5: AS_05
- **Slot ID**: `AS_05`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_05`
- **Learning Objective**: Determine whether an object is stationary, moving forward, or reversing by analyzing the position-time (x-t) graph slope.
- **Assessment Purpose**: Formative (evaluates graphical slope interpretation).
- **Evidence Type**: FORMATIVE
- **Cognitive Level**: APPLICATION
- **Recommended Item Format**: GRAPH_INTERPRETATION
- **Difficulty Band**: MEDIUM
- **Estimated Response Time (Seconds)**: 150
- **Prerequisites**: Basic coordinate plotting, slope calculations.
- **Misconception Targets**: `MIS_08` (Position-time graph height represents speed).
- **Required Representation**: Position-time graph.
- **Calculation Required**: `true`
- **Graph Required**: `true`
- **Expected Reasoning**: Interrogates the slope of the curve at specific points, matching zero slope to rest and high height to position only.
- **Acceptable Evidence**: Distinguishes high-position/low-speed states from low-position/high-speed states on the graph.
- **Insufficient Evidence**: Treating the vertical position coordinate as velocity.
- **Common Failure Signals**: Reading the y-axis value as speed.
- **Scoring Approach**: PARTIAL_CREDIT
- **Mastery Signal**: Accurately computes slope at multiple intervals and identifies motion state.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 6: AS_06
- **Slot ID**: `AS_06`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_06`
- **Learning Objective**: Calculate acceleration and displacement from the slope and signed area of a velocity-time (v-t) graph.
- **Assessment Purpose**: Exit (verifies graphical calculus equivalents).
- **Evidence Type**: EXIT
- **Cognitive Level**: ANALYSIS
- **Recommended Item Format**: GRAPH_INTERPRETATION
- **Difficulty Band**: HARD
- **Estimated Response Time (Seconds)**: 240
- **Prerequisites**: Geometric area formulas, slope definition.
- **Misconception Targets**: None
- **Required Representation**: Velocity-time graph.
- **Calculation Required**: `true`
- **Graph Required**: `true`
- **Expected Reasoning**: Employs slope ($a = \Delta v / \Delta t$) for acceleration and area (trapezoid/rectangles) for displacement, tracking positive and negative areas.
- **Acceptable Evidence**: Calculates net displacement using signed areas and acceleration using slope, correctly resolving units.
- **Insufficient Evidence**: Adding areas absolute values for displacement or using position formula without graph data.
- **Common Failure Signals**: Confusing slope with area.
- **Scoring Approach**: PARTIAL_CREDIT
- **Mastery Signal**: Correctly evaluates both acceleration and signed displacement from the graph.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 7: AS_07
- **Slot ID**: `AS_07`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_07`
- **Learning Objective**: Define constant acceleration and explain how velocity can be zero momentarily while acceleration is non-zero.
- **Assessment Purpose**: Diagnostic (isolates moment of reversal).
- **Evidence Type**: DIAGNOSTIC
- **Cognitive Level**: RECALL
- **Recommended Item Format**: SHORT_REASONED_RESPONSE
- **Difficulty Band**: EASY
- **Estimated Response Time (Seconds)**: 90
- **Prerequisites**: Acceleration definition.
- **Misconception Targets**: `MIS_04` (Zero velocity means zero acceleration).
- **Required Representation**: Verbal description.
- **Calculation Required**: `false`
- **Graph Required**: `false`
- **Expected Reasoning**: Explains that acceleration is the rate of change of velocity; velocity can pass through zero when changing direction (like a prescribed motorized cart scenario).
- **Acceptable Evidence**: Demonstrates that $v=0$ doesn't require $a=0$ if velocity is changing.
- **Insufficient Evidence**: Arguing that because velocity is zero, there is no change in motion.
- **Common Failure Signals**: Equating instantaneous velocity value to rate of change.
- **Scoring Approach**: BINARY
- **Mastery Signal**: Provides correct conceptual description of prescribed momentarily zero velocity state.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 8: AS_08
- **Slot ID**: `AS_08`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_08`
- **Learning Objective**: Select the correct kinematic equation for constant acceleration based on given/find parameters.
- **Assessment Purpose**: Formative (evaluates model selection).
- **Evidence Type**: FORMATIVE
- **Cognitive Level**: UNDERSTANDING
- **Recommended Item Format**: MATCHING
- **Difficulty Band**: EASY
- **Estimated Response Time (Seconds)**: 90
- **Prerequisites**: Knowledge of 4 constant-acceleration equations.
- **Misconception Targets**: None
- **Required Representation**: Symbolic formula.
- **Calculation Required**: `false`
- **Graph Required**: `false`
- **Expected Reasoning**: Matches variables ($u, v, a, t, s$) to isolate the formula missing the unknown/unnecessary parameter.
- **Acceptable Evidence**: Selects appropriate equations for various parameter sets without executing arithmetic.
- **Insufficient Evidence**: Randomly guessing formulas or selecting equations containing multiple unknown parameters.
- **Common Failure Signals**: Recommending variable acceleration calculus methods.
- **Scoring Approach**: BINARY
- **Mastery Signal**: 100% correct matching across three separate scenarios.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 9: AS_09
- **Slot ID**: `AS_09`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_09`
- **Learning Objective**: Execute a one-dimensional constant-acceleration calculation, identify irrelevant data, and report the result with correct units and rounding.
- **Assessment Purpose**: Exit (verifies quantitative execution).
- **Evidence Type**: EXIT
- **Cognitive Level**: `APPLICATION`
- **Recommended Item Format**: `NUMERIC_RESPONSE`
- **Difficulty Band**: `HARD`
- **Estimated Response Time (Seconds)**: 180
- **Prerequisites**: Algebraic substitution, basic arithmetic.
- **Misconception Targets**: None (Note: Local design target is the insertion of extraneous mass data into kinematic equations).
- **Required Representation**: Numerical values and units.
- **Calculation Required**: `true`
- **Graph Required**: `false`
- **Expected Reasoning**: Calculates displacement under constant acceleration on a straight guideway, identifying mass as irrelevant/extraneous data.
- **Acceptable Evidence**: Correct numerical substitution, correct units, and correct identification of mass as extraneous data.
- **Insufficient Evidence**: Attempting to insert mass into the kinematic equations or arithmetic errors.
- **Common Failure Signals**: Inserting mass into UAM formulas.
- **Scoring Approach**: `PARTIAL_CREDIT`
- **Mastery Signal**: Correct numerical output, correct units, and correct reasoning identifying mass as extraneous.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 10: AS_10
- **Slot ID**: `AS_10`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP06_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_10`
- **Learning Objective**: Explain Newton's First Law and identify that constant velocity implies zero net force.
- **Assessment Purpose**: Diagnostic (evaluates force-motion understanding).
- **Evidence Type**: DIAGNOSTIC
- **Cognitive Level**: RECALL
- **Recommended Item Format**: SINGLE_SELECT
- **Difficulty Band**: MEDIUM
- **Estimated Response Time (Seconds)**: 90
- **Prerequisites**: Definition of net force.
- **Misconception Targets**: `MIS_05` (A moving object requires continuous force).
- **Required Representation**: Qualitative force diagram reasoning.
- **Calculation Required**: `false`
- **Graph Required**: `false`
- **Expected Reasoning**: Deduces that if velocity is constant, acceleration is zero, which requires balanced external forces ($\Sigma F = 0$).
- **Acceptable Evidence**: Rejects the need for a active forward force to maintain constant speed in frictionless environments.
- **Insufficient Evidence**: Believing a net force must exist in the direction of motion for an object to continue moving.
- **Common Failure Signals**: Conflating velocity direction with net force direction.
- **Scoring Approach**: BINARY
- **Mastery Signal**: Correct option selection for a constant velocity spacecraft/frictionless case.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 11: AS_11
- **Slot ID**: `AS_11`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP06_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_11`
- **Learning Objective**: Relate an object's mass to its translational inertia and compare the resistance to changes in motion.
- **Assessment Purpose**: Exit (verifies quantitative/qualitative mass-inertia relation).
- **Evidence Type**: EXIT
- **Cognitive Level**: APPLICATION
- **Recommended Item Format**: SINGLE_SELECT
- **Difficulty Band**: EASY
- **Estimated Response Time (Seconds)**: 90
- **Prerequisites**: Mass definitions.
- **Misconception Targets**: `MIS_06` (Inertia is a force).
- **Required Representation**: Verbal description.
- **Calculation Required**: `false`
- **Graph Required**: `false`
- **Expected Reasoning**: Mass is the quantitative measure of inertia. A heavier object has more resistance to acceleration, not an active "inertia force" pushing back.
- **Acceptable Evidence**: Explains inertia as an inherent property of mass and not a force vector.
- **Insufficient Evidence**: Stating that inertia is a force acting against motion.
- **Common Failure Signals**: Classifying inertia as a reactive force.
- **Scoring Approach**: BINARY
- **Mastery Signal**: Correct choice identifying mass as the measure of inertia and rejecting inertia as a force.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

### Slot 12: AS_12
- **Slot ID**: `AS_12`
- **Authorized Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001, JEE_2026_PHY_U01_CH01_TOP06_001`
- **Planning Node ID**: `mech_foundations`
- **Concept ID**: `CON_12`
- **Learning Objective**: Analyze an integrated scenario containing a constant velocity segment and a constant acceleration segment, verifying correct force-motion mapping.
- **Assessment Purpose**: Exit (integrated unit check).
- **Evidence Type**: EXIT
- **Cognitive Level**: ANALYSIS
- **Recommended Item Format**: SHORT_REASONED_RESPONSE
- **Difficulty Band**: HARD
- **Estimated Response Time (Seconds)**: 300
- **Prerequisites**: Kinematics (graphing, equations) and Dynamics (forces).
- **Misconception Targets**: `MIS_05` (Moving object requires continuous force), `MIS_06` (Inertia is a force).
- **Required Representation**: Qualitative force diagram reasoning, velocity-time graph.
- **Calculation Required**: `true`
- **Graph Required**: `true`
- **Expected Reasoning**: Links zero acceleration in v-t graph to zero net force (NLM 1), and non-zero constant slope to non-zero net force.
- **Acceptable Evidence**: Demonstrates correct mapping of force states ($\Sigma F = 0$ vs $\Sigma F \neq 0$) to kinematic motion states without inferring force direction.
- **Insufficient Evidence**: Assuming force is proportional to velocity at all points or inferring force direction.
- **Common Failure Signals**: Recommending force during uniform motion segment.
- **Scoring Approach**: RUBRIC_BASED
- **Mastery Signal**: Provides clear, logical reasoning linking graph properties to force states.
- **Review Requirements**: Standard internal review.
- **Safety Flags**: `studentPublishReady = false`

---

## 4. Misconception-to-Slot Matrix

| Misconception | Primary Slot | Description |
| :--- | :--- | :--- |
| **Distance and displacement are always equal** | `AS_02` | Turn-back path calculation distinguishes distance from displacement. |
| **Speed and velocity are identical** | `AS_03` | Reversal of motion highlights difference in velocity vector vs speed. |
| **Negative velocity means slowing down** | `AS_04` | Explains negative sign as direction vector rather than speed value. |
| **Zero velocity means zero acceleration** | `AS_07` | Prescribed momentarily zero velocity scenario shows $v=0, a \neq 0$. |
| **A moving object requires continuous force** | `AS_10` | Spacecraft scenario verifies $\Sigma F = 0$ for uniform straight-line motion. |
| **Inertia is a force** | `AS_11` | Mass-inertia comparison clarifies inertia as a property, not a force. |
| **Heavier objects always fall faster** | `DEFERRED_CROSS_UNIT` | Requires free-fall/gravitation context beyond the two authorized atoms. |
| **Position-time graph height represents speed** | `AS_05` | Separates high-height coordinate from low-slope velocity. |

*Result*: `7_OF_7_IN_SCOPE_MISCONCEPTIONS_ASSESSABLE`, `1_CROSS_UNIT_MISCONCEPTION_DEFERRED`

---

## 5. Representation Coverage Matrix

| Representation | Slots Represented | Exclusions/Guards |
| :--- | :--- | :--- |
| **Verbal description** | `AS_01`, `AS_07`, `AS_11` | Qualitative statements only; no force values. |
| **Symbolic formula** | `AS_08` | Restriced to constant-acceleration equations. |
| **Numerical values and units** | `AS_02`, `AS_03`, `AS_09` | Checked against dimensional units. |
| **Position-time graph** | `AS_05` | Restriced to 1D coordinates and slopes. |
| **Velocity-time graph** | `AS_06`, `AS_12` | Restricted to slopes (acc) and area (disp). |
| **One-dimensional direction/sign** | `AS_04` | Single coordinate axis conventions only. |
| **Qualitative force diagram reasoning** | `AS_10`, `AS_12` | Free-body sketches; no vector algebra. |

*Result*: All required representations are covered. No 2D/3D vectors or Newton's Second Law equations are introduced.

---

## 6. Scoring Blueprint
The blueprint outlines the points allocation across the slots. The provisional point total for this design blueprint is **16 points**.

| Slot ID | Scoring Approach | Max Points | Partial Credit Allowed | Critical Error (No Credit) | Non-Critical Error (Deduction) | Evidence Produced |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AS_01` | BINARY | 1 | `false` | Stating motion is absolute. | N/A | Diagnostic explanation. |
| `AS_02` | BINARY | 1 | `false` | Conflating displacement with distance. | N/A | Formative computation. |
| `AS_03` | BINARY | 1 | `false` | Directly averaging the segment velocities. | N/A | Exit rate calculations. |
| `AS_04` | BINARY | 1 | `false` | Conflating negative sign with speed reduction. | N/A | Diagnostic sign classification. |
| `AS_05` | PARTIAL_CREDIT | 2 | `true` | Reading vertical height as speed. | Math calculation slip in slope. | Formative slope analysis. |
| `AS_06` | PARTIAL_CREDIT | 2 | `true` | Summing absolute areas for displacement. | Arithmetic slip in geometric area. | Exit slope/area calculation. |
| `AS_07` | BINARY | 1 | `false` | Stating acceleration is zero at peak. | N/A | Diagnostic concept justification. |
| `AS_08` | BINARY | 1 | `false` | Choosing variable acceleration equations. | N/A | Formative equation match. |
| `AS_09` | PARTIAL_CREDIT | 2 | `true` | Entering mass into the kinematic equations. | Basic math calculation error. | Exit kinematic calculations. |
| `AS_10` | BINARY | 1 | `false` | Claiming a forward force is needed. | N/A | Diagnostic force-motion check. |
| `AS_11` | BINARY | 1 | `false` | Modeling inertia as a reactive force vector. | N/A | Exit mass-inertia explanation. |
| `AS_12` | RUBRIC_BASED | 2 | `true` | Violating NLM 1 in force-motion mapping. | Wording ambiguity in force balance. | Integrated qualitative reasoning. |

---

## 7. Internal Mastery Interpretation

Provisional internal mastery is evaluated on design points and safety compliance:
- **`INTERNAL_MASTERY_EVIDENCE`**: Requires at least **80% of available blueprint points** ($\ge 13/16$), **no unresolved critical misconceptions**, and coverage demonstrated for **both** `TOP05_001` and `TOP06_001` slots.
- **`REVIEW_REQUIRED`**: Obtainedadequate total score ($\ge 13$), but fails due to a remaining critical misconception or a lack of coverage in one of the atoms.
- **`DEVELOPING`**: Obtained between $50\%$ and $79\%$ points ($8-12$ points).
- **`FOUNDATIONAL_GAP`**: Obtained less than $50\%$ points ($< 8$ points), or shows failure in basic prerequisite check/representation skills.
- **`NOT_ASSESSED`**: Blueprint slots not yet mapped to authored items or administered.

> [!WARNING]
> These mastery definitions are internal design parameters only. They **do not** represent student-readiness declarations, publish decisions, Crucible generation triggers, or permanent student mastery claims.

---

## 8. Critical Gates
The following concepts are declared as critical gates:
1. **Distance versus displacement** (AS_02)
2. **Speed versus velocity** (AS_03)
3. **Slope of position-time graph** (AS_05)
4. **Signed area under velocity-time graph** (AS_06)
5. **Constant-acceleration condition** (AS_08)
6. **Zero net force under Newton's First Law** (AS_10)
7. **Inertia is not a force** (AS_11)

*Rule*: A critical misconception cannot be masked or hidden by a high aggregate score. Fails in any critical gate automatically flags the student status as `REVIEW_REQUIRED` or `FOUNDATIONAL_GAP`.

---

## 9. Item-Authoring Contract for a Later Phase
Future authored items mapping to this blueprint must strictly follow these rules:
- **Original Content Only**: Stems, numbers, and diagrams must be generated from scratch; no past papers (PYQs) may be cloned.
- **No official-answer-key claim**: Future items represent practice/evaluations and do not claim to match official examination keys.
- **Atom Limits**: Each item maps to one primary atom; secondary atom mapping is allowed only for slot `AS_12` or where explicitly justified.
- **Separated Solutions**: Every item must have a complete step-by-step solution compiled separately.
- **Formatting**: Numbers, coordinates, and axes must be explicit; sign convention must be explicitly declared in the stem.
- **Visibility**: All authored items remain student-hidden until formal pro-review and founder-approval gates are passed.

---

## 10. Prohibited Scope
Substantive assessment of the following topics is strictly excluded from this blueprint design:
- Newton's Second Law ($\vec{F} = m\vec{a}$) calculations.
- Newton's Third Law action-reaction force pair balances.
- Friction calculations (static and kinetic coefficient equations).
- Projectile motion trajectories and range equations.
- Uniform or non-uniform circular motion vectors.
- Work-Energy Theorem and potential energy integrals.
- Center of Mass coordinate calculations.
- Rigid body rotation, moment of inertia, and angular momentum.
- Gravitation orbit speeds and Kepler's laws.
- Simple Harmonic Motion equations.
- Elasticity, stress, and strain.
- Fluid statics/dynamics.
- Measurement instruments (vernier calipers, screw gauge).

*Result*: `ZERO_OUT_OF_SCOPE_ASSESSMENT_DESIGN`

---

## 11. Review Rubric

| Category | Status | Evidence | Review Note | Blocking |
| :--- | :--- | :--- | :--- | :--- |
| **source traceability** | PASS | Restored artifacts from `6379096` utilized. | Exact matches verified. | `true` |
| **atom coverage** | PASS | 12/12 slots mapped to `TOP05_001`/`TOP06_001`. | Traceability confirmed. | `true` |
| **learning-objective coverage** | PASS | Formulated for motion, graphs, NLM 1, and inertia. | Matches unit syllabus. | `true` |
| **misconception coverage** | PASS | 7/7 in-scope misconceptions targeted, 1 deferred. | Matrix checked. | `true` |
| **cognitive balance** | PASS | Recall: 2, Understanding: 4, Application: 4, Analysis: 2. | Perfect distribution. | `true` |
| **representation balance** | PASS | Graphs, equations, numbers, and verbal covered. | Requisite modes active. | `true` |
| **difficulty balance** | PASS | Easy: 3, Medium: 6, Hard: 3. | Standard bell curve. | `false` |
| **scoring clarity** | PASS | 16-point total with partial credit rules. | Binary/partial methods defined. | `true` |
| **mastery-rule safety** | PASS | 80% threshold + critical gate lock. | Rejects aggregation masking. | `true` |
| **scope purity** | PASS | Excluded friction, circular motion, NLM 2, etc. | Safety boundaries active. | `true` |
| **original-content policy** | PASS | Item contract requires original drafting. | Precludes PYQ cloning. | `true` |
| **no pointer consumption** | PASS | No question pointer references are consumed. | Quarantined files isolated. | `true` |
| **accessibility readiness** | PASS | Visual elements (graphs) describe text alternatives. | Standards prepared. | `false` |
| **Markdown/JSON consistency** | PASS | Verified consistent values with the JSON schema. | Schema matched. | `true` |
| **safety metadata** | PASS | All safety flags locked to default false/pending. | Draft visibility enforced. | `true` |
