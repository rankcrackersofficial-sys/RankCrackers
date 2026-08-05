# Mechanics Foundations (यांत्रिकी आधार)
## Motion, Reference Frames and Inertia

### A. Mission Opening
This unit establishes the bedrock of Classical Mechanics. Before we can calculate the forces required to launch a satellite or the friction needed for a car to turn, we must define **where** we are observing from and **how** we measure change. We will cover the basic language of motion—position, velocity, and acceleration—and introduce Newton’s First Law, which defines the state of an object when no net force acts upon it.

By the end of this unit, you should be able to:
- Define a Frame of Reference and explain why rest and motion are relative.
- Distinguish between Distance/Displacement and Speed/Velocity.
- Interpret Position-Time and Velocity-Time graphs for uniform and non-uniform motion.
- Apply kinematic equations for constant acceleration.
- State Newton's First Law and explain the concept of Inertia.

---

### B. Prerequisite Check
Ensure you are comfortable with:
- **Elementary Algebra**: Solving for a single variable in linear and quadratic equations.
- **Basic Graphing**: Identifying the x-axis, y-axis, and calculating the slope of a straight line (change in y / change in x).
- **Sign Convention**: Usually, we take 'Right' or 'Up' as positive (+), and 'Left' or 'Down' as negative (-).

---

### C. Frame of Reference
**Definition**: A coordinate system used by an observer to measure the position, orientation, and motion of objects.

**Explanation**: 
Imagine you are sitting in a moving train. To your friend sitting next to you, you are at **rest**. To a person standing on the platform, you are in **motion**. Both are correct. Motion is only meaningful when you specify the "frame" or the "observer".

- **Observer**: The person or device making the measurement.
- **Coordinate System**: Typically a set of x, y, z axes with an origin (0,0,0).

**Common Misconception**: There is a state of "absolute rest" in the universe.
**Correction**: No object is at absolute rest. The Earth is spinning and orbiting the Sun; the Sun is moving through the Galaxy. We choose a convenient frame (like the Ground) and call it "fixed" for that specific problem.

**Self-Check 1 (SC_01)**:
- **Concept**: Frame of Reference
- **Prompt**: A passenger is sitting inside a train moving past a platform. Is the passenger at rest or in motion?
- **Expected Concept**: Rest and motion depend on the selected frame of reference.
- **Model Response**: The passenger is at rest relative to the train but moving relative to the platform.
- **Difficulty**: UNDERSTANDING
- **Scored**: false | **PYQ**: false | **Student Ready**: false

---

### D. Position and Straight-Line Motion
**Position**: The location of an object relative to the origin of a frame of reference.
**Displacement**: The change in position ($\Delta x = x_{final} - x_{initial}$). It is a **vector** (has direction).
**Distance**: The total path length traveled. It is a **scalar** (no direction, always positive).

**Worked Example 1 (WE_01)**:
- **Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Concept**: Distance vs Displacement
- **Given**: A particle moves from x = +2 m to x = +10 m, and then back to x = +5 m.
- **Find**: Total Distance and Net Displacement.
- **Sign Convention**: Right is positive (+).
- **Principle**: Distance is total path; Displacement is final - initial position.
- **Steps**:
  1. Forward path: $|10 - 2| = 8$ m.
  2. Backward path: $|5 - 10| = 5$ m.
  3. Total Distance = $8 + 5 = 13$ m.
  4. Net Displacement = $x_{final} - x_{initial} = 5 - 2 = +3$ m.
- **Final Result**: Distance = 13 m, Displacement = +3 m.
- **Units**: m (meters)
- **Reasonableness**: Distance (13) > Magnitude of Displacement (3). Correct.
- **Common Error**: Thinking displacement is 13 m.
- **Status**: ORIGINAL_TEACHING_EXAMPLE | **PYQ**: false | **Official Answer Key**: false

**Worked Example 2 (WE_02)**:
- **Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Concept**: Average Speed vs Average Velocity
- **Given**: A jogger runs 100 m East in 20 s, then turns and walks 40 m West in 10 s.
- **Find**: Average Speed and Average Velocity.
- **Sign Convention**: East is positive (+).
- **Principle**: $v_{avg} = \text{Total Displacement} / \text{Total Time}$; $\text{Speed}_{avg} = \text{Total Distance} / \text{Total Time}$.
- **Steps**:
  1. Total Distance = $100 + 40 = 140$ m.
  2. Total Time = $20 + 10 = 30$ s.
  3. Net Displacement = $+100 - 40 = +60$ m.
  4. Avg Speed = $140 / 30 = 4.67$ m/s.
  5. Avg Velocity = $+60 / 30 = +2.0$ m/s.
- **Final Result**: Avg Speed = 4.67 m/s, Avg Velocity = 2.0 m/s East.
- **Units**: m/s
- **Reasonableness**: Speed is greater than velocity magnitude because of the turn.
- **Common Error**: Calculating velocity as $(100+40)/30$.
- **Status**: ORIGINAL_TEACHING_EXAMPLE | **PYQ**: false | **Official Answer Key**: false

**Self-Check 2 (SC_02)**:
- **Concept**: Distance and Displacement
- **Prompt**: Can an object have a total distance of 10 km but a displacement of 0? Explain.
- **Expected Concept**: Yes, if the object returns to its starting point.
- **Model Response**: Yes. If you walk 5 km and come back 5 km, total distance is 10 km but displacement is 0.
- **Difficulty**: RECALL
- **Scored**: false | **PYQ**: false | **Student Ready**: false

---

### E. Speed and Velocity
**Average Speed**: Total Distance / Total Time.
**Average Velocity**: Total Displacement / Total Time.
**Instantaneous Velocity**: The velocity at a specific moment in time.

**Scalar vs Vector**: Speed only tells you "how fast". Velocity tells you "how fast and in which direction".

**Self-Check 3 (SC_03)**:
- **Concept**: Speed and Velocity
- **Prompt**: A car is moving at -20 m/s. Is it faster or slower than a car moving at +10 m/s?
- **Expected Concept**: It is faster (speed is 20 m/s), but moving in the opposite direction.
- **Model Response**: Faster. Speed is the magnitude of velocity. $|-20| > |10|$.
- **Difficulty**: UNDERSTANDING
- **Scored**: false | **PYQ**: false | **Student Ready**: false

---

### F. Motion Graphs
#### 1. Position-Time (x-t) Graph
- **Slope**: Represents the **Velocity**.
- **Straight Line**: Constant velocity (Uniform Motion).
- **Horizontal Line**: Velocity is zero (At Rest).
- **Curved Line**: Velocity is changing (Accelerated Motion).

**Worked Example 3 (WE_03)**:
- **Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Concept**: Slope of x-t graph
- **Given**: A position-time graph is a straight line from (0 s, 0 m) to (5 s, 25 m).
- **Find**: Velocity of the particle.
- **Sign Convention**: x-axis for time, y-axis for position.
- **Principle**: $v = \text{Slope} = \Delta x / \Delta t$.
- **Steps**:
  1. $\Delta x = 25 - 0 = 25$ m.
  2. $\Delta t = 5 - 0 = 5$ s.
  3. $Slope = 25 / 5 = 5$ m/s.
- **Final Result**: Velocity = 5 m/s.
- **Units**: m/s
- **Reasonableness**: Positive slope gives positive velocity.
- **Common Error**: Thinking the velocity is 25 m/s (using only the final point).
- **Status**: ORIGINAL_TEACHING_EXAMPLE | **PYQ**: false | **Official Answer Key**: false

**Self-Check 4 (SC_04)**:
- **Concept**: Position-Time Graph
- **Prompt**: What does a horizontal line on a position-time graph tell you about the object's speed?
- **Expected Concept**: The speed is zero (at rest).
- **Model Response**: Object is at rest; position is not changing with time.
- **Difficulty**: RECALL
- **Scored**: false | **PYQ**: false | **Student Ready**: false

#### 2. Velocity-Time (v-t) Graph
- **Slope**: Represents the **Acceleration**.
- **Area under the curve**: Represents the **Displacement**.

**Worked Example 4 (WE_04)**:
- **Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Concept**: Area of v-t graph
- **Given**: A v-t graph is a horizontal line at v = 5 m/s from t = 0 to t = 4 s.
- **Find**: Displacement.
- **Sign Convention**: Above t-axis is positive.
- **Principle**: $\text{Displacement} = \text{Area under v-t graph}$.
- **Steps**:
  1. The area is a rectangle.
  2. $\text{Height} = 5$ m/s, $\text{Width} = 4$ s.
  3. $\text{Area} = 5 \times 4 = 20$.
- **Final Result**: Displacement = 20 m.
- **Units**: m
- **Reasonableness**: Constant velocity of 5 for 4s should give 20m.
- **Common Error**: Calculating slope instead of area.
- **Status**: ORIGINAL_TEACHING_EXAMPLE | **PYQ**: false | **Official Answer Key**: false

**Self-Check 5 (SC_05)**:
- **Concept**: Velocity-Time Graph
- **Prompt**: If a velocity-time graph is a straight line sloping upwards, what does that tell you about the acceleration?
- **Expected Concept**: The acceleration is constant and positive.
- **Model Response**: Acceleration is constant (straight line slope) and positive (sloping up).
- **Difficulty**: RECALL
- **Scored**: false | **PYQ**: false | **Student Ready**: false

---

### G. Uniformly Accelerated Motion
**Definition**: Motion where the velocity changes by the same amount in every equal time interval (Constant Acceleration).

**Standard Equations (Kinematic Equations)**:
1. $v = u + at$
2. $s = ut + \frac{1}{2}at^2$
3. $v^2 = u^2 + 2as$
4. $s = \frac{(u+v)}{2}t$

**Worked Example 5 (WE_05)**:
- **Atom ID**: `JEE_2026_PHY_U01_CH01_TOP05_001`
- **Concept**: Uniformly Accelerated Motion (UAM)
- **Given**: A car starts from rest (u=0) and accelerates at 2 m/s² for 5 s.
- **Find**: Final velocity and Displacement.
- **Sign Convention**: Direction of motion is positive.
- **Principle**: UAM equations.
- **Steps**:
  1. $v = u + at = 0 + (2 \times 5) = 10$ m/s.
  2. $s = ut + \frac{1}{2}at^2 = 0 + \frac{1}{2}(2)(5^2) = 25$ m.
- **Final Result**: v = 10 m/s, s = 25 m.
- **Units**: m/s, m
- **Reasonableness**: $v^2 = 100$, $u^2+2as = 0 + 2(2)(25) = 100$. Matches.
- **Common Error**: Forgetting to square the time in the displacement formula.
- **Status**: ORIGINAL_TEACHING_EXAMPLE | **PYQ**: false | **Official Answer Key**: false

**Self-Check 6 (SC_06)**:
- **Concept**: Uniformly Accelerated Motion
- **Prompt**: Can you use the equation $s = ut + \frac{1}{2}at^2$ for a ball thrown into a strong, changing wind? Why?
- **Expected Concept**: No, because acceleration is likely not constant in a changing wind.
- **Model Response**: No. These equations strictly require acceleration to be constant.
- **Difficulty**: RECALL
- **Scored**: false | **PYQ**: false | **Student Ready**: false

---

### H. Newton’s First Law
**Statement**: An object remains in a state of rest or of uniform motion in a straight line unless acted upon by an external unbalanced force.

**Worked Example 6 (WE_06)**:
- **Atom ID**: `JEE_2026_PHY_U01_CH01_TOP06_001`
- **Concept**: Newton's First Law / Static Equilibrium
- **Given**: A 1 kg book remains at rest on a flat table. Gravity pulls it down with 9.8 N.
- **Find**: The net external force acting on the book.
- **Sign Convention**: Up is positive (+), Down is negative (-).
- **Principle**: NLM 1 (Static equilibrium implies zero acceleration and balanced forces).
- **Steps**:
  1. The book remains at rest, so its acceleration is zero ($a = 0$).
  2. According to NLM 1, if there is no change in motion, the net external force must be zero.
  3. The downward weight (-9.8 N) must be balanced by an upward normal force (+9.8 N) from the table.
  4. Net force = $+9.8 - 9.8 = 0$.
- **Final Result**: Net external force is zero.
- **Units**: N (Newtons)
- **Reasonableness**: If the net force wasn't zero, the book would accelerate.
- **Common Error**: Saying the force is 9.8 N (ignoring the word 'net').
- **Status**: ORIGINAL_TEACHING_EXAMPLE | **PYQ**: false | **Official Answer Key**: false

**Self-Check 7 (SC_07)**:
- **Concept**: Newton's First Law
- **Prompt**: If a spacecraft is moving in deep space (far from planets) at 5000 km/h, how much fuel does it need to keep moving at that same speed?
- **Expected Concept**: Zero fuel (Newton's 1st Law), as there are no external forces to slow it down.
- **Model Response**: Zero. Once in motion, it stays in motion unless a force acts on it.
- **Difficulty**: APPLICATION
- **Scored**: false | **PYQ**: false | **Student Ready**: false

**Self-Check 9 (SC_09)**:
- **Concept**: Balanced Forces
- **Prompt**: If you see an object moving with a constant velocity vector, what can you conclude about the net force acting on it?
- **Expected Concept**: Net force is zero.
- **Model Response**: The net external force must be zero (balanced forces).
- **Difficulty**: UNDERSTANDING
- **Scored**: false | **PYQ**: false | **Student Ready**: false

---

### I. Inertia
**Definition**: The property of an object by virtue of which it resists any change in its state of rest or of uniform motion.
- **Measure of Inertia**: **Mass**. A heavier object (more mass) has more inertia.

**Worked Example 7 (WE_07)**:
- **Atom ID**: `JEE_2026_PHY_U01_CH01_TOP06_001`
- **Concept**: Qualitative Inertia Comparison
- **Given**: A 10 kg bicycle and a 2000 kg car, both initially at rest.
- **Find**: Which object is harder to start moving, and why?
- **Sign Convention**: N/A (Qualitative).
- **Principle**: Inertia is the resistance to change in motion and is measured by mass.
- **Steps**:
  1. Start moving means changing the state from rest.
  2. The car has significantly more mass (2000 kg) compared to the bicycle (10 kg).
  3. Greater mass means greater inertia.
  4. Higher inertia means a greater resistance to changing the state of rest.
- **Final Result**: The car is much harder to start moving due to its greater mass/inertia.
- **Units**: N/A
- **Reasonableness**: It matches common experience.
- **Common Error**: Thinking inertia is a force that pushes back.
- **Status**: ORIGINAL_TEACHING_EXAMPLE | **PYQ**: false | **Official Answer Key**: false

**Self-Check 8 (SC_08)**:
- **Concept**: Inertia types
- **Prompt**: Why does a person standing in a bus jerk backwards when the bus starts suddenly?
- **Expected Concept**: Inertia of Rest.
- **Model Response**: Inertia of Rest. The person's lower body moves with the bus, but the upper body wants to stay at rest.
- **Difficulty**: APPLICATION
- **Scored**: false | **PYQ**: false | **Student Ready**: false

**Self-Check 10 (SC_10)**:
- **Concept**: Concept Connection
- **Prompt**: Which requires a force: maintaining a constant velocity or changing a velocity?
- **Expected Concept**: Only changing a velocity requires a net external force.
- **Model Response**: Changing a velocity. Maintaining constant velocity requires zero net force.
- **Difficulty**: UNDERSTANDING
- **Scored**: false | **PYQ**: false | **Student Ready**: false

---

### J. Concept Connections
- **Kinematics** (Atoms 1): Gives us the tools to describe the "how"—the position, speed, and time.
- **Dynamics - Newton's 1st Law** (Atom 2): Gives us the first "why"—acceleration only happens when an external force breaks the equilibrium.

---

### Misconception Register
1. **Belief**: Distance and displacement are always equal.
   **Correct Principle**: Displacement is the shortest path (vector); distance is total path (scalar). They are equal only in one-way straight-line motion.
   **Corrective Example**: Walking in a circle brings you back to origin (Displacement = 0) but you covered a distance (Circumference).
2. **Belief**: Speed and velocity are identical.
   **Correct Principle**: Velocity has direction; speed does not.
   **Corrective Example**: Two cars moving at 50 km/h in opposite directions have the same speed but different velocities.
3. **Belief**: Negative velocity means slowing down.
   **Correct Principle**: Negative velocity means moving in the opposite direction.
   **Corrective Example**: An object moving at -10 m/s and accelerating at -2 m/s² is speeding up in the negative direction.
4. **Belief**: Zero velocity means zero acceleration.
   **Correct Principle**: An object can be at rest momentarily while changing direction, but still be accelerating.
   **Corrective Example**: A ball at its highest point of a vertical throw has zero velocity but is still accelerating at 'g' downwards.
5. **Belief**: A moving object always needs a force to keep moving.
   **Correct Principle**: No. In the absence of friction/resistance, an object keeps moving forever (Newton's 1st Law).
   **Corrective Example**: Space probes travel between planets without engines running once they reach the target speed.
6. **Belief**: Inertia is a force.
   **Correct Principle**: Inertia is an inherent **property** of matter, not a force.
   **Corrective Example**: You don't "feel" inertia until you try to change your motion.
7. **Belief**: Heavier objects always fall faster.
   **Correct Principle**: In a vacuum (no air resistance), all objects fall with the same constant acceleration 'g'.
   **Corrective Example**: Feather and hammer drop on the Moon (Apollo 15 experiment).
8. **Belief**: Position-time graph height represents speed.
   **Correct Principle**: Slope represents speed. Height is just the distance from the origin.
   **Corrective Example**: A car parked 100m away has a high y-value but zero slope/speed.

---

### Formula Register
| Formula | Symbols | SI Units | Condition | Source Concept | Common Error |
| --- | --- | --- | --- | --- | --- |
| $v_{avg} = d / t$ | $d$: distance, $t$: time | m/s | Average Speed | Atom 1 | Confusing with displacement |
| $\vec{v}_{avg} = \Delta \vec{x} / \Delta t$ | $\vec{x}$: position, $t$: time | m/s | Average Velocity | Atom 1 | Confusing with distance |
| $a = \Delta v / \Delta t$ | $v$: velocity, $t$: time | m/s² | Acceleration | Atom 1 | Using speed instead of velocity |
| $v = u + at$ | $u$: init vel, $v$: final, $a$: acc, $t$: time | m/s | $a = constant$ | UAM | Using it when $a$ varies with time |
| $s = ut + \frac{1}{2}at^2$ | $s$: displacement, $u$: init, $a$: acc, $t$: time | m | $a = constant$ | UAM | Forgetting the $u$ or the $1/2$ |
| $v^2 = u^2 + 2as$ | $v$: final, $u$: init, $a$: acc, $s$: disp | m/s | $a = constant$ | UAM | Using distance instead of displacement |
| $s = \frac{(u+v)}{2}t$ | $s$: disp, $u$: init, $v$: final, $t$: time | m | $a = constant$ | UAM | Using it for non-constant acceleration |

---

### Glossary (शब्दकोश)
- **Frame of Reference**: निर्देश तंत्र (Nirdesh Tantra)
- **Displacement**: विस्थापन (Visthapan)
- **Velocity**: वेग (Veg)
- **Acceleration**: त्वरण (Tvaran)
- **Inertia**: जड़त्व (Jadatva)
- **Force**: बल (Bal)
