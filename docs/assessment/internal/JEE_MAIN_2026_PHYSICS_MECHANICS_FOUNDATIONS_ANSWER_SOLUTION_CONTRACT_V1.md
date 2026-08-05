# Mechanics Foundations — Internal Answer and Solution Contract

## 1. Document Identity
* **Answer-Solution Contract ID**: `jee_main_2026_physics_mechanics_foundations_answer_solution_contract_v1`
* **Title**: Mechanics Foundations — Internal Answer and Solution Contract
* **Status**: `DRAFT_FOR_INDEPENDENT_REVIEW`
* **Visibility**: `INTERNAL_ONLY`
* **Content Origin**: `ORIGINAL_AUTHORED_ASSESSMENT`

### Required Safety Fields
- `answerAuthoringComplete`: `true`
- `solutionAuthoringComplete`: `true`
- `answerReviewStatus`: `PENDING_INDEPENDENT_REVIEW`
- `solutionReviewStatus`: `PENDING_INDEPENDENT_REVIEW`
- `founderApprovalStatus`: `PENDING`
- `proReviewStatus`: `PENDING`
- `studentReadiness`: `NOT_READY`
- `officialAnswerKey`: `false`
- `studentPublishReady`: `false`
- `firestoreMaterializationAuthorized`: `false`

---

## 2. Answer and Solution Records

### Record 1: MF_ASR_01
- **Record ID**: `MF_ASR_01`
- **Item ID**: `MF_ASI_01`
- **Blueprint Slot ID**: `AS_01`
- **Independently Derived Answer**: **B**
- **Provisional Key Candidate**: B
- **Normalized Accepted Response**: `B`
- **Answer Derivation**: Rest and motion are relative to the reference frame. The book is at rest relative to the train carriage but moving at 20 m/s relative to the platform.
- **Full Internal Solution**: 
  1. Identify frames of reference: The train carriage and the stationary platform.
  2. Evaluate relative velocity: Inside the train, the book's position relative to the table is constant (velocity = 0).
  3. Evaluate ground velocity: Since the train moves at 20 m/s, any object at rest inside it also moves at 20 m/s relative to the ground.
  4. Conclusion: State of motion depends on the chosen coordinate system.
- **Scoring Approach**: BINARY (1 pt / 0 pt)
- **Critical Errors**: Believing motion is absolute.

### Record 2: MF_ASR_02
- **Record ID**: `MF_ASR_02`
- **Item ID**: `MF_ASI_02`
- **Blueprint Slot ID**: `AS_02`
- **Independently Derived Answer**: **A**
- **Provisional Key Candidate**: A
- **Normalized Accepted Response**: `A`
- **Answer Derivation**: 
  - Distance = Path length 1 + Path length 2 = |15 - 5| + |-2 - 15| = 10 + 17 = 27 m.
  - Displacement = Final position - Initial position = -2 - 5 = -7 m.
- **Full Internal Solution**: 
  - The object travels from x=5 to x=15, covering 10 meters. 
  - It then reverses and travels from x=15 to x=-2, covering 17 meters. 
  - Total distance = 10 + 17 = 27 m. 
  - Net displacement is the change in position: Δx = x_final - x_initial = -2 - 5 = -7 m.
- **Scoring Approach**: BINARY (1 pt / 0 pt)
- **Critical Errors**: Conflating distance with displacement magnitude.
- **Critical Gate**: `distance versus displacement`

### Record 3: MF_ASR_03
- **Record ID**: `MF_ASR_03`
- **Item ID**: `MF_ASI_03`
- **Blueprint Slot ID**: `AS_03`
- **Independently Derived Answer**: **1.4, 2.6**
- **Provisional Key Candidate**: 1.4, 2.6
- **Normalized Accepted Response**: `1.4, 2.6`
- **Answer Derivation**: 
  - Total time = 50 s.
  - Net displacement = 70 - 0 = 70 m. Average velocity magnitude = 70/50 = 1.4 m/s.
  - Total distance = 100 + 30 = 130 m. Average speed = 130/50 = 2.6 m/s.
- **Full Internal Solution**: 
  - Total time = 40 s + 10 s = 50 s.
  - Displacement is final position minus starting position: 70 - 0 = 70 m.
  - Total distance is the sum of magnitudes of segments: |100 - 0| + |70 - 100| = 100 + 30 = 130 m.
  - Average velocity magnitude = Displacement / Total Time = 70 m / 50 s = 1.4 m/s.
  - Average speed = Total Distance / Total Time = 130 m / 50 s = 2.6 m/s.
- **Scoring Approach**: BINARY (1 pt / 0 pt)
- **Critical Errors**: Claiming speed and velocity are identical; averaging the segment speeds.
- **Critical Gate**: `speed versus velocity`

### Record 4: MF_ASR_04
- **Record ID**: `MF_ASR_04`
- **Item ID**: `MF_ASI_04`
- **Blueprint Slot ID**: `AS_04`
- **Independently Derived Answer**: **A, C, D**
- **Provisional Key Candidate**: A, C, D
- **Normalized Accepted Response**: `A, C, D`
- **Answer Derivation**: 
  - v < 0 indicates motion to the left (A).
  - a < 0 indicates acceleration to the left (D).
  - Since v and a have the same sign, speed is increasing (C).
- **Full Internal Solution**: 
  - Velocity (v = -8 m/s) is negative, meaning the particle moves in the negative direction (left). Statement A is correct.
  - Acceleration (a = -3 m/s²) is negative, meaning the acceleration vector points left. Statement D is correct.
  - When velocity and acceleration point in the same direction, the object's speed increases. Thus, it is speeding up. Statement C is correct.
  - Statement B is incorrect because a negative velocity does not imply deceleration.
- **Scoring Approach**: BINARY (1 pt / 0 pt)
- **Critical Errors**: Believing negative velocity means slowing down.

### Record 5: MF_ASR_05
- **Record ID**: `MF_ASR_05`
- **Item ID**: `MF_ASI_05`
- **Blueprint Slot ID**: `AS_05`
- **Independently Derived Answer**: **A**
- **Provisional Key Candidate**: A
- **Normalized Accepted Response**: `A`
- **Answer Derivation**: Velocity is the slope of the position-time graph.
  - v_A = (10 - 0) / (2 - 0) = 5 m/s.
  - v_B = 0 (horizontal line).
- **Full Internal Solution**: 
  - Velocity = slope of x-t graph.
  - For Object A: Line from (0,0) to (2,10). Slope = 10 / 2 = 5 m/s.
  - For Object B: Horizontal line at x=20. Slope = 0 m/s.
  - Distinction: High height on the graph indicates a far position, not a high speed.
- **Scoring Approach**: BINARY (2 pts / 0 pt)
- **Scoring Feasibility**: The item records one selected option only. Independent one-point component scores cannot be inferred from that response.
- **Operational Scoring**: 2 points — Option A selected. 0 points — Any other option selected.
- **Critical Errors**: Treating graph height as speed.
- **Critical Gate**: `slope of x-t graph`

### Record 6: MF_ASR_06
- **Record ID**: `MF_ASR_06`
- **Item ID**: `MF_ASI_06`
- **Blueprint Slot ID**: `AS_06`
- **Independently Derived Answer**: **B**
- **Provisional Key Candidate**: B
- **Normalized Accepted Response**: `B`
- **Answer Derivation**: 
  - a (6-10s) = slope = (0 - 8) / (10 - 6) = -2 m/s².
  - Net Disp = Area = (0.5 * 4 * 8) + (2 * 8) + (0.5 * 4 * 8) = 16 + 16 + 16 = 48 m.
- **Full Internal Solution**: 
  - Acceleration is the slope of the velocity-time graph. For t=6 to t=10: Slope = (0 - 8)/(10 - 6) = -2 m/s².
  - Displacement is the total area under the v-t graph. 
  - Area 1 (0-4s): 0.5 * 4 * 8 = 16 m.
  - Area 2 (4-6s): 2 * 8 = 16 m.
  - Area 3 (6-10s): 0.5 * 4 * 8 = 16 m.
  - Net Displacement = 16 + 16 + 16 = 48 m.
- **Scoring Approach**: PARTIAL_CREDIT (Total 2 pts)
  - 1 pt: Correct acceleration calculation.
  - 1 pt: Correct net displacement calculation.
- **Critical Errors**: Confusing slope with area.
- **Critical Gate**: `signed area under v-t graph`

### Record 7: MF_ASR_07
- **Record ID**: `MF_ASR_07`
- **Item ID**: `MF_ASI_07`
- **Blueprint Slot ID**: `AS_07`
- **Independently Derived Answer**: **No; acceleration is +1.0 m/s².**
- **Provisional Key Candidate**: No. Its acceleration remains +1.0 m/s² even when its velocity is momentarily zero. The standard kinematic equations may be used when acceleration remains constant throughout the interval. That constant acceleration may be zero or non-zero.
- **Normalized Accepted Response**: `Acceleration is non-zero (+1.0 m/s²). Constant-acceleration equations require constant acceleration.`
- **Answer Derivation**: Acceleration is given as constant (+1.0 m/s²). It remains non-zero even if velocity is momentarily zero. Equations require a = const.
- **Full Internal Solution**: 
  - The problem explicitly states the cart has a "constant acceleration of +1.0 m/s²". This property does not depend on the instantaneous value of velocity.
  - At t = 2.0 s, the velocity is zero, but it is changing at a rate of 1.0 m/s²; therefore, acceleration is not zero.
  - Constant-acceleration kinematic equations are valid if and only if acceleration remains constant throughout the motion interval, regardless of whether that acceleration is zero or non-zero.
- **Scoring Approach**: BINARY (1 pt / 0 pt)
- **Critical Errors**: Stating acceleration is zero when velocity is zero.
- **Critical Gate**: `constant-acceleration condition`

### Record 8: MF_ASR_08
- **Record ID**: `MF_ASR_08`
- **Item ID**: `MF_ASI_08`
- **Blueprint Slot ID**: `AS_08`
- **Independently Derived Answer**: **A**
- **Provisional Key Candidate**: A
- **Normalized Accepted Response**: `A`
- **Answer Derivation**: 
  - 1: {u, a, t} find v -> v = u + at (Y).
  - 2: {u, v, s} find a -> v² = u² + 2as (X).
  - 3: {u, a, s} find t -> s = ut + 0.5at² (Z).
- **Full Internal Solution**: 
  - Match given physical variables to the formula containing only those variables and the target unknown.
  - Scenario 1 links u, a, t, and v. Equation Y is correct.
  - Scenario 2 links u, v, s, and a. Equation X is correct.
  - Scenario 3 links u, a, s, and t. Equation Z is correct.
  - Correct matching: 1-Y, 2-X, 3-Z.
- **Scoring Approach**: BINARY (1 pt / 0 pt)
- **Critical Errors**: Choosing variable acceleration equations.

### Record 9: MF_ASR_09
- **Record ID**: `MF_ASR_09`
- **Item ID**: `MF_ASI_09`
- **Blueprint Slot ID**: `AS_09`
- **Independently Derived Answer**: **9.0**
- **Provisional Key Candidate**: 9.0
- **Normalized Accepted Response**: `9.0`
- **Accepted Response Variants**: `["9", "9.0"]`
- **Normalization Rule**: Unit-bearing strings (e.g., "9.0 m") are academically equivalent but rejected by the configured answer-box constraint because the item requires numeric-only input.
- **Answer Derivation**: 
  - Use s = ut + 0.5at² for the 5 kg cart.
  - u = 0, a = 2.0, t = 3.0. 
  - s = 0 + 0.5 * 2.0 * 3.0² = 9.0 m. 
  - Mass is irrelevant.
- **Full Internal Solution**: 
  - Identify knowns: u = 0 m/s, a = 2.0 m/s², t = 3.0 s.
  - Identify unknown: displacement s.
  - Select equation: s = ut + 1/2 at².
  - Substitute: s = (0)(3.0) + 0.5 * (2.0) * (3.0)² = 1.0 * 9.0 = 9.0 m.
  - Note: In prescribed kinematic problems, mass does not affect the calculation of displacement under a given acceleration.
- **Scoring Approach**: PARTIAL_CREDIT (Total 2 pts)
  - 1 pt: Correct formula selection and setup.
  - 1 pt: Correct numerical calculation and rounding (9.0 m).
- **Critical Errors**: Attempting to insert mass into kinematic equations.

### Record 10: MF_ASR_10
- **Record ID**: `MF_ASR_10`
- **Item ID**: `MF_ASI_10`
- **Blueprint Slot ID**: `AS_10`
- **Independently Derived Answer**: **B**
- **Provisional Key Candidate**: B
- **Normalized Accepted Response**: `B`
- **Answer Derivation**: Constant velocity implies zero acceleration. By Newton's First Law, net force must be zero.
- **Full Internal Solution**: 
  - Newton's First Law states that an object continues in its state of uniform motion in a straight line unless acted upon by a net external force.
  - Constant velocity means magnitude (speed) and direction are unchanging, thus acceleration is zero.
  - A zero acceleration state requires the net external force acting on the object to be zero. No forward force is required to sustain motion in a frictionless environment.
- **Scoring Approach**: BINARY (1 pt / 0 pt)
- **Critical Errors**: Claiming a forward force is needed to maintain constant velocity.
- **Critical Gate**: `zero net force under Newton's First Law`

### Record 11: MF_ASR_11
- **Record ID**: `MF_ASR_11`
- **Item ID**: `MF_ASI_11`
- **Blueprint Slot ID**: `AS_11`
- **Independently Derived Answer**: **A**
- **Provisional Key Candidate**: A
- **Normalized Accepted Response**: `A`
- **Answer Derivation**: Mass is the quantitative measure of inertia. Larger mass (10 kg) implies larger inertia (resistance to acceleration). Inertia is a property, not a force.
- **Full Internal Solution**: 
  - Inertia is the resistance of any physical object to any change in its velocity.
  - Mass is the physical quantity that measures the amount of inertia an object has.
  - Since Block Y (10 kg) has more mass than Block X (2 kg), it has greater inertia.
  - Inertia is an inherent property of the object and is not an active force that acts against the push.
- **Scoring Approach**: BINARY (1 pt / 0 pt)
- **Critical Errors**: Modeling inertia as a force vector.
- **Critical Gate**: `inertia is not a force`

### Record 12: MF_ASR_12
- **Record ID**: `MF_ASR_12`
- **Item ID**: `MF_ASI_12`
- **Blueprint Slot ID**: `AS_12`
- **Independently Derived Answer**: **Phase 1: Zero; Phase 2: Non-Zero.**
- **Provisional Key Candidate**: Phase 1: The net external force is zero because the velocity is constant. Phase 2: The net external force is non-zero because the velocity is changing. Inertia is a property of the hovercraft describing resistance to a change in velocity. It is not a force and does not itself cause motion.
- **Normalized Accepted Response**: `Phase 1: Zero. Phase 2: Non-zero. Inertia is a property.`
- **Answer Derivation**: Constant velocity -> F_net = 0. Changing velocity -> F_net != 0. Inertia != Force.
- **Full Internal Solution**: 
  - Phase 1: The velocity-time graph shows a horizontal line (v = constant), meaning acceleration is zero. According to Newton's First Law, the net external force is zero.
  - Phase 2: The velocity changes linearly from +4 m/s to 0 m/s, meaning acceleration is constant and non-zero. Thus, a non-zero net external force must be acting on the object.
  - Role of Inertia: Inertia is the hovercraft's inherent resistance to this change in motion. It is a property derived from mass, not an additional force.
- **Scoring Approach**: RUBRIC_BASED (Total 2 pts)
  - 1 pt: Correct net-force classification for both phases.
  - 1 pt: Correct conceptual explanation of inertia.
- **Critical Errors**: Inferring force direction; treating inertia as a force.
- **Critical Gates**: `zero net force under Newton's First Law`, `inertia is not a force`

---

## 3. Global Invariants and Rubric Summary
- **Total Records**: 12
- **Total Points**: 16
- **RECALL**: 2 items (MF_ASI_07, MF_ASI_10)
- **UNDERSTANDING**: 4 items (MF_ASI_01, MF_ASI_02, MF_ASI_04, MF_ASI_08)
- **APPLICATION**: 4 items (MF_ASI_03, MF_ASI_05, MF_ASI_09, MF_ASI_11)
- **ANALYSIS**: 2 items (MF_ASI_06, MF_ASI_12)

### Safety and Review Status
- `officialAnswerKey`: `false`
- `answerReviewStatus`: `PENDING_INDEPENDENT_REVIEW`
- `solutionReviewStatus`: `PENDING_INDEPENDENT_REVIEW`
- `studentPublishReady`: `false`

---

## 4. Distractor and Validation Summary
Every selectable item was audited for distractor quality. All distractors map to documented misconceptions (e.g., absolute rest, speed/velocity conflation, inertia as force). No ambiguous options or multiple unintended keys were found.

## 5. Scope Safety Verification
The solutions strictly adhere to the authorized two-atom scope.
- Zero Newton's Second Law direction/magnitude calculations.
- Zero Newton's Third Law pairs.
- Zero projectile/circular motion.
- Zero gravitation/gravity ($g$) dependency in AS_07.
- Zero NLM 2 direction inference in AS_12.
- Inertia correctly defined as a property of mass.

**Status**: `READY_FOR_INDEPENDENT_REVIEW`
