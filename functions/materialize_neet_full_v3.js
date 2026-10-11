// Retired legacy exam-specific executable. Data remains archived for audit.
require('./services/mission_agnostic_policy').rejectLegacyMissionSpecificExecution('materialize_neet_full_v3.js');

const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

  const atoms = [
  {
    "atom_id": "ATOM_NEET_PHY_U06_at001",
    "atom_title": "Universal Law of Gravitation",
    "subject": "Physics",
    "unit": "UNIT 6: GRAVITATION",
    "topic": "Gravitation",
    "subtopic": "The universal law of gravitation",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U06_at002",
    "atom_title": "Acceleration due to gravity and its variation",
    "subject": "Physics",
    "unit": "UNIT 6: GRAVITATION",
    "topic": "Gravitation",
    "subtopic": "Acceleration due to gravity and its variation with altitude and depth",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U06_at003",
    "atom_title": "Kepler's law of planetary motion",
    "subject": "Physics",
    "unit": "UNIT 6: GRAVITATION",
    "topic": "Gravitation",
    "subtopic": "Kepler's law of planetary motion",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U06_at004",
    "atom_title": "Gravitational potential energy and potential",
    "subject": "Physics",
    "unit": "UNIT 6: GRAVITATION",
    "topic": "Gravitation",
    "subtopic": "Gravitational potential energy: gravitational potential",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U06_at005",
    "atom_title": "Escape velocity",
    "subject": "Physics",
    "unit": "UNIT 6: GRAVITATION",
    "topic": "Gravitation",
    "subtopic": "Escape velocity",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U06_at006",
    "atom_title": "Motion and Energy of a Satellite",
    "subject": "Physics",
    "unit": "UNIT 6: GRAVITATION",
    "topic": "Gravitation",
    "subtopic": "Motion of a satellite, orbital velocity, time period and energy of satellite",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at001",
    "atom_title": "Elastic behavior and Hooke's Law",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "Elastic behaviour, Stress-strain relationship, Hooke's Law",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at002",
    "atom_title": "Moduli of Elasticity",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "Young's modulus, bulk modulus, modulus of rigidity",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at003",
    "atom_title": "Pressure and Pascal's Law",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "Pressure due to a fluid column; Pascal's law and its applications",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at004",
    "atom_title": "Effect of gravity on fluid pressure",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "Effect of gravity on fluid pressure",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at005",
    "atom_title": "Viscosity and Stokes' Law",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "Viscosity. Stokes' law. terminal velocity, streamline, and turbulent flow. critical velocity",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at006",
    "atom_title": "Bernoulli's principle and applications",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "Bemoulli's principle and its applications",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at007",
    "atom_title": "Surface Tension and Energy",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "Surface energy and surface tension, angle of contact, excess of pressure across a curved surface",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at008",
    "atom_title": "Applications of Surface Tension",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "application of surface tension-drops, bubbles, and capillary rise",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at009",
    "atom_title": "Thermal Expansion and Heat",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "Heat, temperature, thermal expansion",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at010",
    "atom_title": "Specific heat capacity and calorimetry",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "specific heat capacity, calorimetry",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at011",
    "atom_title": "Change of state and latent heat",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "change of state, latent heat",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U07_at012",
    "atom_title": "Heat transfer methods",
    "subject": "Physics",
    "unit": "UNIT 7: PROPERTIES OF SOLIDS AND LIQUIDS",
    "topic": "Properties of Solids and Liquids",
    "subtopic": "Heat transfer- conduction, convection, and radiation",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U08_at001",
    "atom_title": "Thermal equilibrium and Zeroth Law",
    "subject": "Physics",
    "unit": "UNIT 8: THERMODYNAMICS",
    "topic": "Thermodynamics",
    "subtopic": "Thermal equilibrium, zeroth law of thermodynamics, the concept of temperature",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U08_at002",
    "atom_title": "Heat, Work, and Internal Energy",
    "subject": "Physics",
    "unit": "UNIT 8: THERMODYNAMICS",
    "topic": "Thermodynamics",
    "subtopic": "Heat, work, and internal energy",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U08_at003",
    "atom_title": "First Law and Thermodynamic Processes",
    "subject": "Physics",
    "unit": "UNIT 8: THERMODYNAMICS",
    "topic": "Thermodynamics",
    "subtopic": "The first law of thermodynamics, isothermal and adiabatic processes",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U08_at004",
    "atom_title": "Second Law: Reversible and Irreversible Processes",
    "subject": "Physics",
    "unit": "UNIT 8: THERMODYNAMICS",
    "topic": "Thermodynamics",
    "subtopic": "The second law of thermodynamics: reversible and irreversible processes",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U09_at001",
    "atom_title": "Equation of state and work on gas",
    "subject": "Physics",
    "unit": "UNIT 9: KINETIC THEORY OF GASES",
    "topic": "Kinetic Theory of Gases",
    "subtopic": "Equation of state of a perfect gas, work done on compressing a gas",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U09_at002",
    "atom_title": "Kinetic theory assumptions and pressure",
    "subject": "Physics",
    "unit": "UNIT 9: KINETIC THEORY OF GASES",
    "topic": "Kinetic Theory of Gases",
    "subtopic": "Kinetic theory of gases assumptions, the concept of pressure",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U09_at003",
    "atom_title": "Kinetic interpretation of temperature and RMS speed",
    "subject": "Physics",
    "unit": "UNIT 9: KINETIC THEORY OF GASES",
    "topic": "Kinetic Theory of Gases",
    "subtopic": "Kinetic interpretation of temperature: RMS speed of gas molecules",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U09_at004",
    "atom_title": "Degrees of freedom",
    "subject": "Physics",
    "unit": "UNIT 9: KINETIC THEORY OF GASES",
    "topic": "Kinetic Theory of Gases",
    "subtopic": "Degrees of freedom",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U09_at005",
    "atom_title": "Equipartition of energy and specific heat",
    "subject": "Physics",
    "unit": "UNIT 9: KINETIC THEORY OF GASES",
    "topic": "Kinetic Theory of Gases",
    "subtopic": "Law of equipartition of energy and applications to specific heat capacities of gases",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U09_at006",
    "atom_title": "Mean free path and Avogadro's number",
    "subject": "Physics",
    "unit": "UNIT 9: KINETIC THEORY OF GASES",
    "topic": "Kinetic Theory of Gases",
    "subtopic": "Mean free path. Avogadro's number",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U10_at001",
    "atom_title": "Oscillations and Periodic Motion",
    "subject": "Physics",
    "unit": "UNIT 10: OSCILLATIONS AND WAVES",
    "topic": "Oscillations and Waves",
    "subtopic": "Oscillations and periodic motion-time period, frequency, displacement as a function of time",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U10_at002",
    "atom_title": "Simple Harmonic Motion (S.H.M.)",
    "subject": "Physics",
    "unit": "UNIT 10: OSCILLATIONS AND WAVES",
    "topic": "Oscillations and Waves",
    "subtopic": "Periodic functions. Simple harmonic motion (S.H.M.) and its equation; phase",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U10_at003",
    "atom_title": "Oscillations of a spring",
    "subject": "Physics",
    "unit": "UNIT 10: OSCILLATIONS AND WAVES",
    "topic": "Oscillations and Waves",
    "subtopic": "oscillations of a spring -restoring force and force constant",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U10_at004",
    "atom_title": "Energy in S.H.M.",
    "subject": "Physics",
    "unit": "UNIT 10: OSCILLATIONS AND WAVES",
    "topic": "Oscillations and Waves",
    "subtopic": "energy in S.H.M. - Kinetic and potential energies",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U10_at005",
    "atom_title": "Simple pendulum time period derivation",
    "subject": "Physics",
    "unit": "UNIT 10: OSCILLATIONS AND WAVES",
    "topic": "Oscillations and Waves",
    "subtopic": "Simple pendulum - derivation of expression for its time period",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U10_at006",
    "atom_title": "Wave motion and speeds",
    "subject": "Physics",
    "unit": "UNIT 10: OSCILLATIONS AND WAVES",
    "topic": "Oscillations and Waves",
    "subtopic": "Wave motion. Longitudinal and transverse waves, speed of travelling wave",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U10_at007",
    "atom_title": "Displacement relation for progressive waves",
    "subject": "Physics",
    "unit": "UNIT 10: OSCILLATIONS AND WAVES",
    "topic": "Oscillations and Waves",
    "subtopic": "Displacement relation for a progressive wave",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U10_at008",
    "atom_title": "Superposition and Reflection of waves",
    "subject": "Physics",
    "unit": "UNIT 10: OSCILLATIONS AND WAVES",
    "topic": "Oscillations and Waves",
    "subtopic": "Principle of superposition of waves, reflection of waves",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U10_at009",
    "atom_title": "Standing waves and Harmonics",
    "subject": "Physics",
    "unit": "UNIT 10: OSCILLATIONS AND WAVES",
    "topic": "Oscillations and Waves",
    "subtopic": "Standing waves in strings and organ pipes, fundamental mode and harmonics",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U10_at010",
    "atom_title": "Beats",
    "subject": "Physics",
    "unit": "UNIT 10: OSCILLATIONS AND WAVES",
    "topic": "Oscillations and Waves",
    "subtopic": "Beats",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at001",
    "atom_title": "Electric charges and conservation",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "Electric charges: Conservation of charge",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at002",
    "atom_title": "Coulomb's Law and forces",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "Coulomb's law forces between two point charges, forces between multiple charges: superposition principle",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at003",
    "atom_title": "Continuous charge distribution",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "continuous charge distribution",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at004",
    "atom_title": "Electric field and dipole",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "Electric field due to a point charge, Electric field lines. Electric dipole, Electric field due to a dipole",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at005",
    "atom_title": "Torque on dipole in electric field",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "Torque on a dipole in a uniform electric field",
    "page_number": 67
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at006",
    "atom_title": "Electric Flux and Gauss's Law",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "Electric flux. Gauss's law and its applications",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at007",
    "atom_title": "Gauss's Law applications",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "field due to infinitely long uniformly charged straight wire, uniformly charged infinite plane sheet, and uniformly charged thin spherical shell",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at008",
    "atom_title": "Electric Potential and Calculation",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "Electric potential and its calculation for a point charge, electric dipole and system of charges",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at009",
    "atom_title": "Equipotential surfaces and Potential energy",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "potential difference, Equipotential surfaces, Electrical potential energy",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at010",
    "atom_title": "Dielectrics and Polarization",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "Conductors and insulators. Dielectrics and electric polarization",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at011",
    "atom_title": "Capacitors and Capacitance",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "capacitors and capacitances, combination in series and parallel, parallel plate capacitor",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U11_at012",
    "atom_title": "Energy stored in a capacitor",
    "subject": "Physics",
    "unit": "UNIT 11: ELECTROSTATICS",
    "topic": "Electrostatics",
    "subtopic": "Energy stored in a capacitor",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U12_at001",
    "atom_title": "Electric Current and Drift Velocity",
    "subject": "Physics",
    "unit": "UNIT 12: CURRENT ELECTRICITY",
    "topic": "Current Electricity",
    "subtopic": "Electric current. Drift velocity, mobility and their relation with electric current",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U12_at002",
    "atom_title": "Ohm's Law and Resistance",
    "subject": "Physics",
    "unit": "UNIT 12: CURRENT ELECTRICITY",
    "topic": "Current Electricity",
    "subtopic": "Ohm's law. Electrical resistance. V-1 characteristics of Ohmic and non-ohmic conductors",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U12_at003",
    "atom_title": "Electrical Energy and Power",
    "subject": "Physics",
    "unit": "UNIT 12: CURRENT ELECTRICITY",
    "topic": "Current Electricity",
    "subtopic": "Electrical energy and power. Electrical resistivity and conductivity",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U12_at004",
    "atom_title": "Combinations of resistors and Temp dependence",
    "subject": "Physics",
    "unit": "UNIT 12: CURRENT ELECTRICITY",
    "topic": "Current Electricity",
    "subtopic": "Series and parallel combinations of resistors; Temperature dependence of resistance",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U12_at005",
    "atom_title": "Cells: Internal Resistance and EMF",
    "subject": "Physics",
    "unit": "UNIT 12: CURRENT ELECTRICITY",
    "topic": "Current Electricity",
    "subtopic": "Internal resistance, potential difference and emf of a cell, a combination of cells in series and parallel",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U12_at006",
    "atom_title": "Kirchhoff's Laws and Applications",
    "subject": "Physics",
    "unit": "UNIT 12: CURRENT ELECTRICITY",
    "topic": "Current Electricity",
    "subtopic": "Kirchhoff's laws and their applications",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U12_at007",
    "atom_title": "Wheatstone and Metre Bridges",
    "subject": "Physics",
    "unit": "UNIT 12: CURRENT ELECTRICITY",
    "topic": "Current Electricity",
    "subtopic": "Wheatstone bridge. Metre Bridge",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U13_at001",
    "atom_title": "Biot - Savart Law and Ampere's Law",
    "subject": "Physics",
    "unit": "UNIT 13: MAGNETIC EFFECTS OF CURRENT AND MAGNETISM",
    "topic": "Magnetic Effects of Current and Magnetism",
    "subtopic": "Biot - Savart law and current loop. Ampere's law and infinitely long wire and solenoid",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U13_at002",
    "atom_title": "Force on moving charge and conductor",
    "subject": "Physics",
    "unit": "UNIT 13: MAGNETIC EFFECTS OF CURRENT AND MAGNETISM",
    "topic": "Magnetic Effects of Current and Magnetism",
    "subtopic": "Force on a moving charge in uniform magnetic and electric fields. Force on a current-carrying conductor",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U13_at003",
    "atom_title": "Force between parallel currents",
    "subject": "Physics",
    "unit": "UNIT 13: MAGNETIC EFFECTS OF CURRENT AND MAGNETISM",
    "topic": "Magnetic Effects of Current and Magnetism",
    "subtopic": "The force between two parallel currents carrying conductors-definition of ampere",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U13_at004",
    "atom_title": "Torque and Moving coil galvanometer",
    "subject": "Physics",
    "unit": "UNIT 13: MAGNETIC EFFECTS OF CURRENT AND MAGNETISM",
    "topic": "Magnetic Effects of Current and Magnetism",
    "subtopic": "Torque on a current loop. Moving coil galvanometer, sensitivity, and conversion",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U13_at005",
    "atom_title": "Magnetic Dipole and Bar Magnet",
    "subject": "Physics",
    "unit": "UNIT 13: MAGNETIC EFFECTS OF CURRENT AND MAGNETISM",
    "topic": "Magnetic Effects of Current and Magnetism",
    "subtopic": "Current loop as a magnetic dipole. Bar magnet as an equivalent solenoid, magnetic field lines",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U13_at006",
    "atom_title": "Magnetic field due to dipole and Torque",
    "subject": "Physics",
    "unit": "UNIT 13: MAGNETIC EFFECTS OF CURRENT AND MAGNETISM",
    "topic": "Magnetic Effects of Current and Magnetism",
    "subtopic": "Field due to dipole along axis and perpendicular. Torque on dipole in uniform field",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U13_at007",
    "atom_title": "Magnetic Substances and properties",
    "subject": "Physics",
    "unit": "UNIT 13: MAGNETIC EFFECTS OF CURRENT AND MAGNETISM",
    "topic": "Magnetic Effects of Current and Magnetism",
    "subtopic": "Para-, dia- and ferromagnetic substances, effect of temperature on properties",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U14_at001",
    "atom_title": "EMI: Faraday's Law and Lenz's Law",
    "subject": "Physics",
    "unit": "UNIT 14: ELECTROMAGNETIC INDUCTION AND ALTERNATING CURRENTS",
    "topic": "Electromagnetic Induction and Alternating Currents",
    "subtopic": "Electromagnetic induction: Faraday's law. Induced emf and current: Lenz's Law, Eddy currents",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U14_at002",
    "atom_title": "Inductance and Alternating Currents",
    "subject": "Physics",
    "unit": "UNIT 14: ELECTROMAGNETIC INDUCTION AND ALTERNATING CURRENTS",
    "topic": "Electromagnetic Induction and Alternating Currents",
    "subtopic": "Self and mutual inductance. peak and RMS values of AC",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U14_at003",
    "atom_title": "Reactance, Impedance and LCR Circuit",
    "subject": "Physics",
    "unit": "UNIT 14: ELECTROMAGNETIC INDUCTION AND ALTERNATING CURRENTS",
    "topic": "Electromagnetic Induction and Alternating Currents",
    "subtopic": "reactance and impedance: LCR series circuit, resonance",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U14_at004",
    "atom_title": "AC Power and Devices",
    "subject": "Physics",
    "unit": "UNIT 14: ELECTROMAGNETIC INDUCTION AND ALTERNATING CURRENTS",
    "topic": "Electromagnetic Induction and Alternating Currents",
    "subtopic": "power in AC circuits, wattless current. AC generator and transformer",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U15_at001",
    "atom_title": "EM Waves: Characteristics and Spectrum",
    "subject": "Physics",
    "unit": "UNIT 15: ELECTROMAGNETIC WAVES",
    "topic": "Electromagnetic Waves",
    "subtopic": "Displacement current. Characteristics, Transverse nature. Electromagnetic spectrum",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U15_at002",
    "atom_title": "Applications of EM Waves",
    "subject": "Physics",
    "unit": "UNIT 15: ELECTROMAGNETIC WAVES",
    "topic": "Electromagnetic Waves",
    "subtopic": "Applications of e.m. waves",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U16_at001",
    "atom_title": "Reflection and Spherical Mirrors",
    "subject": "Physics",
    "unit": "UNIT 16: OPTICS",
    "topic": "Optics",
    "subtopic": "Reflection of light, spherical mirrors, mirror formula",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U16_at002",
    "atom_title": "Refraction at Plane and Spherical surfaces",
    "subject": "Physics",
    "unit": "UNIT 16: OPTICS",
    "topic": "Optics",
    "subtopic": "Refraction of light at plane and spherical surfaces",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U16_at003",
    "atom_title": "Lenses and Lens Maker Formula",
    "subject": "Physics",
    "unit": "UNIT 16: OPTICS",
    "topic": "Optics",
    "subtopic": "thin lens formula and lens maker formula",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U16_at004",
    "atom_title": "Total Internal Reflection and applications",
    "subject": "Physics",
    "unit": "UNIT 16: OPTICS",
    "topic": "Optics",
    "subtopic": "Total internal reflection and its applications",
    "page_number": 68
  },
  {
    "atom_id": "ATOM_NEET_PHY_U16_at005",
    "atom_title": "Magnification and Power of a Lens",
    "subject": "Physics",
    "unit": "UNIT 16: OPTICS",
    "topic": "Optics",
    "subtopic": "Magnification. Power of a Lens. Combination of thin lenses in contact",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U16_at006",
    "atom_title": "Prism and Optical Instruments",
    "subject": "Physics",
    "unit": "UNIT 16: OPTICS",
    "topic": "Optics",
    "subtopic": "Refraction of light through a prism. Microscope and Astronomical Telescope",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U16_at007",
    "atom_title": "Wave Optics: Huygens' Principle",
    "subject": "Physics",
    "unit": "UNIT 16: OPTICS",
    "topic": "Optics",
    "subtopic": "Wave optics: wavefront and Huygens' principle. Laws of reflection and refraction",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U16_at008",
    "atom_title": "Interference and Young's double-slit experiment",
    "subject": "Physics",
    "unit": "UNIT 16: OPTICS",
    "topic": "Optics",
    "subtopic": "Interference, Young's double-slit experiment and fringe width, coherent sources",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U16_at009",
    "atom_title": "Diffraction and Polarization",
    "subject": "Physics",
    "unit": "UNIT 16: OPTICS",
    "topic": "Optics",
    "subtopic": "Diffraction single slit, central maximum. Polarization, plane-polarized light, Brewster's law",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U17_at001",
    "atom_title": "Dual Nature of Radiation and Photoelectric Effect",
    "subject": "Physics",
    "unit": "UNIT 17: DUAL NATURE OF MATTER AND RADIATION",
    "topic": "Dual Nature of Matter and Radiation",
    "subtopic": "Photoelectric effect. Hertz and Lenard's observations; Einstein's photoelectric equation",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U17_at002",
    "atom_title": "Matter waves and de Broglie relation",
    "subject": "Physics",
    "unit": "UNIT 17: DUAL NATURE OF MATTER AND RADIATION",
    "topic": "Dual Nature of Matter and Radiation",
    "subtopic": "Matter waves-wave nature of particle, de Broglie relation",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U18_at001",
    "atom_title": "Atomic Models: Rutherford and Bohr",
    "subject": "Physics",
    "unit": "UNIT 18: ATOMS AND NUCLEI",
    "topic": "Atoms and Nuclei",
    "subtopic": "Alpha-particle scattering experiment; Rutherford's model of atom; Bohr model, energy levels",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U18_at002",
    "atom_title": "Hydrogen Spectrum",
    "subject": "Physics",
    "unit": "UNIT 18: ATOMS AND NUCLEI",
    "topic": "Atoms and Nuclei",
    "subtopic": "hydrogen spectrum",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U18_at003",
    "atom_title": "Nucleus: Composition and Mass-energy",
    "subject": "Physics",
    "unit": "UNIT 18: ATOMS AND NUCLEI",
    "topic": "Atoms and Nuclei",
    "subtopic": "Composition and size of nucleus, atomic masses, Mass-energy relation, mass defect",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U18_at004",
    "atom_title": "Binding Energy and Nuclear Reactions",
    "subject": "Physics",
    "unit": "UNIT 18: ATOMS AND NUCLEI",
    "topic": "Atoms and Nuclei",
    "subtopic": "binding energy per nucleon, nuclear fission, and fusion",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U19_at001",
    "atom_title": "Semiconductors and Diodes",
    "subject": "Physics",
    "unit": "UNIT 19: ELECTRONIC DEVICES",
    "topic": "Electronic Devices",
    "subtopic": "Semiconductors; semiconductor diode: I-V characteristics, diode as a rectifier",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U19_at002",
    "atom_title": "LED, Photodiode, Solar cell, and Zener diode",
    "subject": "Physics",
    "unit": "UNIT 19: ELECTRONIC DEVICES",
    "topic": "Electronic Devices",
    "subtopic": "I-V characteristics of LED, photodiode, solar cell, and Zener diode; Zener diode as voltage regulator",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U19_at003",
    "atom_title": "Logic Gates",
    "subject": "Physics",
    "unit": "UNIT 19: ELECTRONIC DEVICES",
    "topic": "Electronic Devices",
    "subtopic": "Logic gates (OR. AND. NOT. NAND and NOR)",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at001",
    "atom_title": "Exp: Vernier calipers and Screw gauge",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Vernier calipers; Screw gauge thickness/ diameter",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at002",
    "atom_title": "Exp: Simple Pendulum energy dissipation",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Simple Pendulum graph amplitude and time",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at003",
    "atom_title": "Exp: Metre Scale and Principle of moments",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Metre Scale - mass of object by principle of moments",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at004",
    "atom_title": "Exp: Young's modulus of elasticity",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Young's modulus of elasticity of metallic wire",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at005",
    "atom_title": "Exp: Surface tension and Viscosity",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Surface tension of water; Co-efficient of Viscosity measuring terminal velocity",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at006",
    "atom_title": "Exp: Speed of sound and Specific heat",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Speed of sound in air resonance tube; Specific heat capacity of solid and liquid",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at007",
    "atom_title": "Exp: Resistivity and Resistance",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Resistivity of wire using metre bridge; Resistance of wire using Ohm's law",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at008",
    "atom_title": "Exp: Galvanometer: Resistance and figure of merit",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Resistance and figure of merit of galvanometer by half deflection method",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at009",
    "atom_title": "Exp: Focal length and Triangular prism",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Focal length of mirrors and lens; Angle of deviation triangular prism",
    "page_number": 69
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at010",
    "atom_title": "Exp: Refractive index and Diode curves",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Refractive index using travelling microscope; Characteristic curves of p-n junction and Zener diode",
    "page_number": 70
  },
  {
    "atom_id": "ATOM_NEET_PHY_U20_at011",
    "atom_title": "Exp: Identification of Diode, LED, Resistor, Capacitor",
    "subject": "Physics",
    "unit": "UNIT 20: EXPERIMENTAL SKILLS",
    "topic": "Experimental Skills",
    "subtopic": "Identification of Diode. LED,. Resistor. A capacitor",
    "page_number": 70
  },
  {
    "atom_id": "ATOM_NEET_CHE_U01_at001",
    "atom_title": "Matter and Dalton's Atomic Theory",
    "subject": "Chemistry",
    "unit": "UNIT I: SOME BASIC CONCEPTS IN CHEMISTRY",
    "topic": "Some Basic Concepts in Chemistry",
    "subtopic": "Matter and its nature, Dalton's atomic theory",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U01_at002",
    "atom_title": "Laws of Chemical Combination",
    "subject": "Chemistry",
    "unit": "UNIT I: SOME BASIC CONCEPTS IN CHEMISTRY",
    "topic": "Some Basic Concepts in Chemistry",
    "subtopic": "Laws of chemical combination",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U01_at003",
    "atom_title": "Mole concept and Molar masses",
    "subject": "Chemistry",
    "unit": "UNIT I: SOME BASIC CONCEPTS IN CHEMISTRY",
    "topic": "Some Basic Concepts in Chemistry",
    "subtopic": "Atomic and molecular masses, mole concept, molar mass",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U01_at004",
    "atom_title": "Formulae and Stoichiometry",
    "subject": "Chemistry",
    "unit": "UNIT I: SOME BASIC CONCEPTS IN CHEMISTRY",
    "topic": "Some Basic Concepts in Chemistry",
    "subtopic": "percentage composition, empirical and molecular formulae: Chemical equations and stoichiometry",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U02_at001",
    "atom_title": "EM radiation and Hydrogen spectrum",
    "subject": "Chemistry",
    "unit": "UNIT 2: ATOMIC STRUCTURE",
    "topic": "Atomic Structure",
    "subtopic": "Nature of electromagnetic radiation, photoelectric effect; Spectrum of the hydrogen atom",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U02_at002",
    "atom_title": "Bohr model: Postulates and Relations",
    "subject": "Chemistry",
    "unit": "UNIT 2: ATOMIC STRUCTURE",
    "topic": "Atomic Structure",
    "subtopic": "Bohr model hydrogen atom - postulates, energy and radii derivation",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U02_at003",
    "atom_title": "Bohr model limitations",
    "subject": "Chemistry",
    "unit": "UNIT 2: ATOMIC STRUCTURE",
    "topic": "Atomic Structure",
    "subtopic": "limitations of Bohr's model",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U02_at004",
    "atom_title": "Dual nature and Uncertainty Principle",
    "subject": "Chemistry",
    "unit": "UNIT 2: ATOMIC STRUCTURE",
    "topic": "Atomic Structure",
    "subtopic": "Dual nature of matter, de Broglie's relationship. Heisenberg uncertainty principle",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U02_at005",
    "atom_title": "Quantum Mechanics Model",
    "subject": "Chemistry",
    "unit": "UNIT 2: ATOMIC STRUCTURE",
    "topic": "Atomic Structure",
    "subtopic": "Elementary ideas of quantum mechanics, the quantum mechanical model of the atom",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U02_at006",
    "atom_title": "Atomic Orbitals and Wave Functions",
    "subject": "Chemistry",
    "unit": "UNIT 2: ATOMIC STRUCTURE",
    "topic": "Atomic Structure",
    "subtopic": "Concept of atomic orbitals as one-electron wave functions: Variation of \u03a8 and \u03a8\u00b2 with r for Is and 2s orbitals",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U02_at007",
    "atom_title": "Quantum numbers and significance",
    "subject": "Chemistry",
    "unit": "UNIT 2: ATOMIC STRUCTURE",
    "topic": "Atomic Structure",
    "subtopic": "various quantum numbers (principal, angular momentum, and magnetic) and their significance",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U02_at008",
    "atom_title": "Shapes of orbitals and Electron spin",
    "subject": "Chemistry",
    "unit": "UNIT 2: ATOMIC STRUCTURE",
    "topic": "Atomic Structure",
    "subtopic": "shapes of s, p, and d-orbitals, electron spin and spin quantum number",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U02_at009",
    "atom_title": "Filling rules and extra stability",
    "subject": "Chemistry",
    "unit": "UNIT 2: ATOMIC STRUCTURE",
    "topic": "Atomic Structure",
    "subtopic": "Aufbau, Pauli's exclusion and Hund's rule, electronic configuration, extra stability of half/completely filled",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U03_at001",
    "atom_title": "Ionic and Covalent Bonds Intro",
    "subject": "Chemistry",
    "unit": "UNIT 3: CHEMICAL BONDING AND MOLECULAR STRUCTURE",
    "topic": "Chemical Bonding and Molecular Structure",
    "subtopic": "Kossel - Lewis approach, concept of ionic and covalent bonds",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U03_at002",
    "atom_title": "Ionic Bonding factors and Lattice enthalpy",
    "subject": "Chemistry",
    "unit": "UNIT 3: CHEMICAL BONDING AND MOLECULAR STRUCTURE",
    "topic": "Chemical Bonding and Molecular Structure",
    "subtopic": "Ionic Bonding: factors affecting formation; lattice enthalpy calculation",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U03_at003",
    "atom_title": "Dipole moment and Fajan's rule",
    "subject": "Chemistry",
    "unit": "UNIT 3: CHEMICAL BONDING AND MOLECULAR STRUCTURE",
    "topic": "Chemical Bonding and Molecular Structure",
    "subtopic": "Covalent Bonding: Electronegativity, Fajan's rule, dipole moment",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U03_at004",
    "atom_title": "VSEPR theory and shapes",
    "subject": "Chemistry",
    "unit": "UNIT 3: CHEMICAL BONDING AND MOLECULAR STRUCTURE",
    "topic": "Chemical Bonding and Molecular Structure",
    "subtopic": "Valence Shell Electron Pair Repulsion (VSEPR) theory and shapes of simple molecules",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U03_at005",
    "atom_title": "Valence bond theory and Hybridization",
    "subject": "Chemistry",
    "unit": "UNIT 3: CHEMICAL BONDING AND MOLECULAR STRUCTURE",
    "topic": "Chemical Bonding and Molecular Structure",
    "subtopic": "Valence bond theory, hybridization s, p, and d orbitals; Resonance",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U03_at006",
    "atom_title": "Molecular Orbital Theory (MOT)",
    "subject": "Chemistry",
    "unit": "UNIT 3: CHEMICAL BONDING AND MOLECULAR STRUCTURE",
    "topic": "Chemical Bonding and Molecular Structure",
    "subtopic": "MOT important features, LCAO, types of molecular orbitals (bonding, antibonding), sigma and pi-bonds",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U03_at007",
    "atom_title": "MO Configurations and Bond Order",
    "subject": "Chemistry",
    "unit": "UNIT 3: CHEMICAL BONDING AND MOLECULAR STRUCTURE",
    "topic": "Chemical Bonding and Molecular Structure",
    "subtopic": "MO configurations homonuclear diatomic molecules, bond order, length, and energy",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U03_at008",
    "atom_title": "Metallic and Hydrogen Bonding",
    "subject": "Chemistry",
    "unit": "UNIT 3: CHEMICAL BONDING AND MOLECULAR STRUCTURE",
    "topic": "Chemical Bonding and Molecular Structure",
    "subtopic": "Elementary idea of metallic bonding. Hydrogen bonding and applications",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U04_at001",
    "atom_title": "Fundamentals of Thermodynamics",
    "subject": "Chemistry",
    "unit": "UNIT 4: CHEMICAL THERMODYNAMICS",
    "topic": "Chemical Thermodynamics",
    "subtopic": "System and surroundings, properties, state functions, types of processes",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U04_at002",
    "atom_title": "First Law: Heat, Work, and Energy",
    "subject": "Chemistry",
    "unit": "UNIT 4: CHEMICAL THERMODYNAMICS",
    "topic": "Chemical Thermodynamics",
    "subtopic": "First law - Concept of work, heat internal energy and enthalpy, heat capacity, Hess's law",
    "page_number": 71
  },
  {
    "atom_id": "ATOM_NEET_CHE_U04_at003",
    "atom_title": "Enthalpies of different reactions",
    "subject": "Chemistry",
    "unit": "UNIT 4: CHEMICAL THERMODYNAMICS",
    "topic": "Chemical Thermodynamics",
    "subtopic": "Enthalpies of dissociation, combustion, formation, atomization, sublimation, phase transition, hydration, ionization, and solution",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U04_at004",
    "atom_title": "Second Law: Spontaneity and \u0394G",
    "subject": "Chemistry",
    "unit": "UNIT 4: CHEMICAL THERMODYNAMICS",
    "topic": "Chemical Thermodynamics",
    "subtopic": "Spontaneity; \u0394S of universe and \u0394G system criteria. Standard Gibbs energy and equilibrium constant",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U05_at001",
    "atom_title": "Concentration of Solutions",
    "subject": "Chemistry",
    "unit": "UNIT 5: SOLUTIONS",
    "topic": "Solutions",
    "subtopic": "molality, molarity, mole fraction. percentage (volume and mass)",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U05_at002",
    "atom_title": "Raoult's Law and Ideal Solutions",
    "subject": "Chemistry",
    "unit": "UNIT 5: SOLUTIONS",
    "topic": "Solutions",
    "subtopic": "vapour pressure of solutions and Raoult's Law - Ideal and non-ideal solutions",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U05_at003",
    "atom_title": "Colligative Properties",
    "subject": "Chemistry",
    "unit": "UNIT 5: SOLUTIONS",
    "topic": "Solutions",
    "subtopic": "lowering of vapour pressure, freezing point depression, boiling point elevation, osmotic pressure",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U05_at004",
    "atom_title": "Molar Mass and van't Hoff Factor",
    "subject": "Chemistry",
    "unit": "UNIT 5: SOLUTIONS",
    "topic": "Solutions",
    "subtopic": "Determination of molecular mass; Abnormal value, van't Hoff factor",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U06_at001",
    "atom_title": "Dynamic Equilibrium concepts",
    "subject": "Chemistry",
    "unit": "UNIT 6: EQUILIBRIUM",
    "topic": "Equilibrium",
    "subtopic": "Meaning and concept of dynamic equilibrium",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U06_at002",
    "atom_title": "Physical Equilibrium and Henry's Law",
    "subject": "Chemistry",
    "unit": "UNIT 6: EQUILIBRIUM",
    "topic": "Equilibrium",
    "subtopic": "Solid-liquid, liquid-gas and solid-gas equilibria. Henry's law",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U06_at003",
    "atom_title": "Chemical Equilibrium and Constants",
    "subject": "Chemistry",
    "unit": "UNIT 6: EQUILIBRIUM",
    "topic": "Equilibrium",
    "subtopic": "Law of chemical equilibrium, constants (Kp and Kc), \u0394G and \u0394G\u00b0",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U06_at004",
    "atom_title": "Factors affecting Equilibrium",
    "subject": "Chemistry",
    "unit": "UNIT 6: EQUILIBRIUM",
    "topic": "Equilibrium",
    "subtopic": "concentration, pressure, temperature, catalyst; Le Chatelier's principle",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U06_at005",
    "atom_title": "Ionic Equilibrium: Acids and Bases",
    "subject": "Chemistry",
    "unit": "UNIT 6: EQUILIBRIUM",
    "topic": "Equilibrium",
    "subtopic": "Weak/strong electrolytes, acid-base concepts (Arrhenius. Bronsted Lowry and Lewis)",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U06_at006",
    "atom_title": "Ionization and pH",
    "subject": "Chemistry",
    "unit": "UNIT 6: EQUILIBRIUM",
    "topic": "Equilibrium",
    "subtopic": "acid-base equilibria, ionization constants, water ionization, pH scale, common ion effect",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U06_at007",
    "atom_title": "Salt hydrolysis and Solubility",
    "subject": "Chemistry",
    "unit": "UNIT 6: EQUILIBRIUM",
    "topic": "Equilibrium",
    "subtopic": "hydrolysis of salts and pH, sparingly soluble salts and solubility products, buffer solutions",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U07_at001",
    "atom_title": "Redox Reactions and Balancing",
    "subject": "Chemistry",
    "unit": "UNIT 7: REDOX REACTIONS AND ELECTROCHEMISTRY",
    "topic": "Redox Reactions and Electrochemistry",
    "subtopic": "Electronic concepts of oxidation/reduction, oxidation number, balancing redox reactions",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U07_at002",
    "atom_title": "Conduction and Kohlrausch's Law",
    "subject": "Chemistry",
    "unit": "UNIT 7: REDOX REACTIONS AND ELECTROCHEMISTRY",
    "topic": "Redox Reactions and Electrochemistry",
    "subtopic": "Electrolytic/metallic conduction, conductance, molar conductivities; Kohlrausch's law",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U07_at003",
    "atom_title": "Electrochemical Cells and EMF",
    "subject": "Chemistry",
    "unit": "UNIT 7: REDOX REACTIONS AND ELECTROCHEMISTRY",
    "topic": "Redox Reactions and Electrochemistry",
    "subtopic": "Electrolytic and Galvanic cells, electrode potentials, cell reactions, emf measurement",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U07_at004",
    "atom_title": "Nernst Equation and Gibbs Energy",
    "subject": "Chemistry",
    "unit": "UNIT 7: REDOX REACTIONS AND ELECTROCHEMISTRY",
    "topic": "Redox Reactions and Electrochemistry",
    "subtopic": "Nemst equation, cell potential and Gibbs' energy change relation",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U07_at005",
    "atom_title": "Batteries and Fuel Cells",
    "subject": "Chemistry",
    "unit": "UNIT 7: REDOX REACTIONS AND ELECTROCHEMISTRY",
    "topic": "Redox Reactions and Electrochemistry",
    "subtopic": "Dry cell, lead accumulator, fuel cells",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U08_at001",
    "atom_title": "Reaction Rate and factors",
    "subject": "Chemistry",
    "unit": "UNIT 8: CHEMICAL KINETICS",
    "topic": "Chemical Kinetics",
    "subtopic": "Rate of chemical reaction, factors affecting rate",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U08_at002",
    "atom_title": "Order and Molecularity",
    "subject": "Chemistry",
    "unit": "UNIT 8: CHEMICAL KINETICS",
    "topic": "Chemical Kinetics",
    "subtopic": "elementary and complex reactions, order and molecularity",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U08_at003",
    "atom_title": "Rate laws and Characteristics",
    "subject": "Chemistry",
    "unit": "UNIT 8: CHEMICAL KINETICS",
    "topic": "Chemical Kinetics",
    "subtopic": "rate law, rate constant, zero and first-order integral forms, half-lives",
    "page_number": 72
  },
  {
    "atom_id": "ATOM_NEET_CHE_U08_at004",
    "atom_title": "Temperature effect and Arrhenius theory",
    "subject": "Chemistry",
    "unit": "UNIT 8: CHEMICAL KINETICS",
    "topic": "Chemical Kinetics",
    "subtopic": "effect of temperature, Arrhenius theory, activation energy",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U08_at005",
    "atom_title": "Collision Theory",
    "subject": "Chemistry",
    "unit": "UNIT 8: CHEMICAL KINETICS",
    "topic": "Chemical Kinetics",
    "subtopic": "collision theory of bimolecular gascous reactions",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U09_at001",
    "atom_title": "Periodic Law and Blocks",
    "subject": "Chemistry",
    "unit": "UNIT 9: CLASSIFICATION OF ELEMENTS AND PERIODICITY IN PROPERTIES",
    "topic": "Classification of Elements and Periodicity in Properties",
    "subtopic": "Modem periodic law, periodic table form, s. p. d and f block elements",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U09_at002",
    "atom_title": "Periodic trends in properties",
    "subject": "Chemistry",
    "unit": "UNIT 9: CLASSIFICATION OF ELEMENTS AND PERIODICITY IN PROPERTIES",
    "topic": "Classification of Elements and Periodicity in Properties",
    "subtopic": "radii, ionization enthalpy, electron gain enthalpy, valence, oxidation states, reactivity",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U10_at001",
    "atom_title": "P-Block Elements: Groups 13-18",
    "subject": "Chemistry",
    "unit": "UNIT 10: P- BLOCK ELEMENTS",
    "topic": "P- Block Elements",
    "subtopic": "Electronic configuration and general trends physical/chemical",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U10_at002",
    "atom_title": "Anomalous behavior in P-block",
    "subject": "Chemistry",
    "unit": "UNIT 10: P- BLOCK ELEMENTS",
    "topic": "P- Block Elements",
    "subtopic": "unique behaviour of the first element in each group",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U11_at001",
    "atom_title": "Transition Elements Characteristics",
    "subject": "Chemistry",
    "unit": "UNIT 11: d- and f- BLOCK ELEMENTS",
    "topic": "d- and f- Block Elements",
    "subtopic": "General introduction, configuration, and trends (radii, enthalpy, states, colour, catalysis, magnetism)",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U11_at002",
    "atom_title": "Compounds and Alloys",
    "subject": "Chemistry",
    "unit": "UNIT 11: d- and f- BLOCK ELEMENTS",
    "topic": "d- and f- Block Elements",
    "subtopic": "interstitial compounds, alloy formation; Preparation/uses of K2Cr2O7 and KMnO4",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U11_at003",
    "atom_title": "Inner Transition Elements",
    "subject": "Chemistry",
    "unit": "UNIT 11: d- and f- BLOCK ELEMENTS",
    "topic": "d- and f- Block Elements",
    "subtopic": "Lanthanoids and Actinoids electronic configuration and oxidation states",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U12_at001",
    "atom_title": "Coordination Compounds Nomenclature",
    "subject": "Chemistry",
    "unit": "UNIT 12: CO-ORDINATION COMPOUNDS",
    "topic": "Co-ordination Compounds",
    "subtopic": "Werner's theory; ligands, number, denticity, IUPAC nomenclature",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U12_at002",
    "atom_title": "Bonding in Coordination Compounds",
    "subject": "Chemistry",
    "unit": "UNIT 12: CO-ORDINATION COMPOUNDS",
    "topic": "Co-ordination Compounds",
    "subtopic": "Valence bond approach, Crystal field theory, colour and magnetism; isomerism",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U12_at003",
    "atom_title": "Importance of Coordination compounds",
    "subject": "Chemistry",
    "unit": "UNIT 12: CO-ORDINATION COMPOUNDS",
    "topic": "Co-ordination Compounds",
    "subtopic": "qualitative analysis, extraction of metals, biological systems",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U13_at001",
    "atom_title": "Purification methods",
    "subject": "Chemistry",
    "unit": "UNIT 13: PURIFICATION AND CHARACTERISATION OF ORGANIC COMPOUNDS",
    "topic": "Purification and Characterisation of Organic Compounds",
    "subtopic": "Crystallization, sublimation, distillation, extraction, chromatography",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U13_at002",
    "atom_title": "Qualitative Analysis",
    "subject": "Chemistry",
    "unit": "UNIT 13: PURIFICATION AND CHARACTERISATION OF ORGANIC COMPOUNDS",
    "topic": "Purification and Characterisation of Organic Compounds",
    "subtopic": "Detection of nitrogen, sulphur, phosphorus, and halogens",
    "page_number": 73
  },
  {
    "atom_id": "ATOM_NEET_CHE_U13_at003",
    "atom_title": "Quantitative Analysis",
    "subject": "Chemistry",
    "unit": "UNIT 13: PURIFICATION AND CHARACTERISATION OF ORGANIC COMPOUNDS",
    "topic": "Purification and Characterisation of Organic Compounds",
    "subtopic": "Estimation of carbon, hydrogen, nitrogen, halogens, sulphur, phosphorus",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U13_at004",
    "atom_title": "Formula Calculations",
    "subject": "Chemistry",
    "unit": "UNIT 13: PURIFICATION AND CHARACTERISATION OF ORGANIC COMPOUNDS",
    "topic": "Purification and Characterisation of Organic Compounds",
    "subtopic": "Calculations of empirical and molecular formulae",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U14_at001",
    "atom_title": "Organic Basics: Carbon and Shapes",
    "subject": "Chemistry",
    "unit": "UNIT 14:SOME BASIC PRINCIPLES OF ORGANIC CHEMISTRY",
    "topic": "Some Basic Principles of Organic Chemistry",
    "subtopic": "Tetravalency of carbon: Shapes and hybridization (s and p)",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U14_at002",
    "atom_title": "Classification and Nomenclature",
    "subject": "Chemistry",
    "unit": "UNIT 14:SOME BASIC PRINCIPLES OF ORGANIC CHEMISTRY",
    "topic": "Some Basic Principles of Organic Chemistry",
    "subtopic": "Classification functional groups, Homologous series, Nomenclature (Trivial and IUPAC)",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U14_at003",
    "atom_title": "Isomerism",
    "subject": "Chemistry",
    "unit": "UNIT 14:SOME BASIC PRINCIPLES OF ORGANIC CHEMISTRY",
    "topic": "Some Basic Principles of Organic Chemistry",
    "subtopic": "Isomerism - structural and stereoisomerism",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U14_at004",
    "atom_title": "Covalent bond fission and Intermediates",
    "subject": "Chemistry",
    "unit": "UNIT 14:SOME BASIC PRINCIPLES OF ORGANIC CHEMISTRY",
    "topic": "Some Basic Principles of Organic Chemistry",
    "subtopic": "Homolytic and heterolytic fission: radicals, carbocations, and carbanions; stability",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U14_at005",
    "atom_title": "Electronic Displacement in Covalent Bond",
    "subject": "Chemistry",
    "unit": "UNIT 14:SOME BASIC PRINCIPLES OF ORGANIC CHEMISTRY",
    "topic": "Some Basic Principles of Organic Chemistry",
    "subtopic": "Inductive effect, electromeric effect, resonance, and hyperconjugation",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U14_at006",
    "atom_title": "Common types of organic reactions",
    "subject": "Chemistry",
    "unit": "UNIT 14:SOME BASIC PRINCIPLES OF ORGANIC CHEMISTRY",
    "topic": "Some Basic Principles of Organic Chemistry",
    "subtopic": "Substitution, addition, elimination, and rearrangement",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U15_at001",
    "atom_title": "Alkanes and Conformations",
    "subject": "Chemistry",
    "unit": "UNITS 15: HYDROCARBONS",
    "topic": "Hydrocarbons",
    "subtopic": "Alkanes - Conformations: Sawhorse and Newman (ethane); halogenation mechanism",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U15_at002",
    "atom_title": "Alkenes and Addition",
    "subject": "Chemistry",
    "unit": "UNITS 15: HYDROCARBONS",
    "topic": "Hydrocarbons",
    "subtopic": "Alkenes isomerism, electrophilic addition hydrogen, halogens, water, halides (Markownikoff's)",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U15_at003",
    "atom_title": "Alkynes and acidic character",
    "subject": "Chemistry",
    "unit": "UNITS 15: HYDROCARBONS",
    "topic": "Hydrocarbons",
    "subtopic": "Alkynes acidic character, addition reactions, polymerization",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U15_at004",
    "atom_title": "Aromatic hydrocarbons and Benzene",
    "subject": "Chemistry",
    "unit": "UNITS 15: HYDROCARBONS",
    "topic": "Hydrocarbons",
    "subtopic": "Benzene - structure, aromaticity, electrophilic substitution mechanism, alkylation, acylation",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U16_at001",
    "atom_title": "Organic Halogens: Preparation and Bond",
    "subject": "Chemistry",
    "unit": "UNIT 16: ORGANIC COMPOUNDS CONTAINING HALOGENS",
    "topic": "Organic Compounds Containing Halogens",
    "subtopic": "General methods of preparation, properties, reactions; Nature of C-X bond",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U16_at002",
    "atom_title": "Substitution mechanisms and Environmental effects",
    "subject": "Chemistry",
    "unit": "UNIT 16: ORGANIC COMPOUNDS CONTAINING HALOGENS",
    "topic": "Organic Compounds Containing Halogens",
    "subtopic": "Mechanisms of substitution; Effects of chloroform, iodoform freons, and DDT",
    "page_number": 74
  },
  {
    "atom_id": "ATOM_NEET_CHE_U17_at001",
    "atom_title": "Alcohols and Identification",
    "subject": "Chemistry",
    "unit": "UNIT 17: ORGANIC COMPOUNDS CONTAINING OXYGEN",
    "topic": "Organic Compounds Containing Oxygen",
    "subtopic": "Alcohols identification (primary, secondary, tertiary); mechanism of dehydration",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U17_at002",
    "atom_title": "Phenols: Acidity and Substitution",
    "subject": "Chemistry",
    "unit": "UNIT 17: ORGANIC COMPOUNDS CONTAINING OXYGEN",
    "topic": "Organic Compounds Containing Oxygen",
    "subtopic": "Phenols acidic nature, electrophilic substitution; Reimer - Tiemann reaction",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U17_at003",
    "atom_title": "Aldehydes and Ketones: Carbonyl group",
    "subject": "Chemistry",
    "unit": "UNIT 17: ORGANIC COMPOUNDS CONTAINING OXYGEN",
    "topic": "Organic Compounds Containing Oxygen",
    "subtopic": "Nature of carbonyl group; reactivities; Nucleophilic addition reactions",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U17_at004",
    "atom_title": "Acidity of \u03b1-hydrogen and Condensations",
    "subject": "Chemistry",
    "unit": "UNIT 17: ORGANIC COMPOUNDS CONTAINING OXYGEN",
    "topic": "Organic Compounds Containing Oxygen",
    "subtopic": "reduction (Wolf Kishner/Clemmensen); aldol condensation, Cannizzaro, Haloform",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U17_at005",
    "atom_title": "Carboxylic Acids strength",
    "subject": "Chemistry",
    "unit": "UNIT 17: ORGANIC COMPOUNDS CONTAINING OXYGEN",
    "topic": "Organic Compounds Containing Oxygen",
    "subtopic": "Carboxylic Acids: Acidic strength and factors affecting it",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U18_at001",
    "atom_title": "Amines classification and identification",
    "subject": "Chemistry",
    "unit": "UNIT 18: ORGANIC COMPOUNDS CONTAINING NITROGEN",
    "topic": "Organic Compounds Containing Nitrogen",
    "subtopic": "Amines nomenclature, basic character, identification (primary, secondary, tertiary)",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U18_at002",
    "atom_title": "Importance of Diazonium Salts",
    "subject": "Chemistry",
    "unit": "UNIT 18: ORGANIC COMPOUNDS CONTAINING NITROGEN",
    "topic": "Organic Compounds Containing Nitrogen",
    "subtopic": "Diazonium Salts: Importance in synthetic organic chemistry",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U19_at001",
    "atom_title": "Carbohydrates classification",
    "subject": "Chemistry",
    "unit": "UNIT 19: BIOMOLECULES",
    "topic": "Biomolecules",
    "subtopic": "Carbohydrates Classification; aldoses/ketoses; mono/oligosaccharides",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U19_at002",
    "atom_title": "Proteins and Enzymes",
    "subject": "Chemistry",
    "unit": "UNIT 19: BIOMOLECULES",
    "topic": "Biomolecules",
    "subtopic": "\u03b1-amino acids, structure (1\u00b0, 2\u00b0, 3\u00b0, 4\u00b0), denaturation, enzymes",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U19_at003",
    "atom_title": "Vitamins, Nucleic Acids and Hormones",
    "subject": "Chemistry",
    "unit": "UNIT 19: BIOMOLECULES",
    "topic": "Biomolecules",
    "subtopic": "Vitamins, Nucleic Acids (DNA and RNA), Biological functions, Hormones",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U20_at001",
    "atom_title": "Detection of extra elements and Functional groups",
    "subject": "Chemistry",
    "unit": "UNIT 20: PRINCIPLES RELATED TO PRACTICAL CHEMISTRY",
    "topic": "Principles Related to Practical Chemistry",
    "subtopic": "Detection of N, S, halogens; hydroxyl, carbonyl, carboxyl, and amino groups",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U20_at002",
    "atom_title": "Preparation of Inorganic and Organic compounds",
    "subject": "Chemistry",
    "unit": "UNIT 20: PRINCIPLES RELATED TO PRACTICAL CHEMISTRY",
    "topic": "Principles Related to Practical Chemistry",
    "subtopic": "Mohr's salt, potash alum; Acetanilide, p-nitro acetanilide, aniline yellow, iodoform",
    "page_number": 75
  },
  {
    "atom_id": "ATOM_NEET_CHE_U20_at003",
    "atom_title": "Titrimetric exercises",
    "subject": "Chemistry",
    "unit": "UNIT 20: PRINCIPLES RELATED TO PRACTICAL CHEMISTRY",
    "topic": "Principles Related to Practical Chemistry",
    "subtopic": "Acids, bases and indicators; oxalic-acid vs KMnO4, Mohr's salt vs KMnO4",
    "page_number": 76
  },
  {
    "atom_id": "ATOM_NEET_CHE_U20_at004",
    "atom_title": "Qualitative salt analysis: Cations and Anions",
    "subject": "Chemistry",
    "unit": "UNIT 20: PRINCIPLES RELATED TO PRACTICAL CHEMISTRY",
    "topic": "Principles Related to Practical Chemistry",
    "subtopic": "Cations: Pb\u00b2\u207a, Cu\u00b2\u207a, Al\u00b3\u207a, Fe\u00b3\u207a, Zn\u00b2\u207a, Ni\u00b2\u207a, Ca\u00b2\u207a, Ba\u00b2\u207a, Mg\u00b2\u207a, NH\u2084\u207a. Anions: CO\u2083\u00b2\u207b, S\u00b2\u207b, SO\u2084\u00b2\u207b, NO\u2082\u207b, NO\u2083\u207b, Cl\u207b, Br\u207b, I\u207b",
    "page_number": 76
  },
  {
    "atom_id": "ATOM_NEET_CHE_U20_at005",
    "atom_title": "Enthalpy and Kinetic experiments",
    "subject": "Chemistry",
    "unit": "UNIT 20: PRINCIPLES RELATED TO PRACTICAL CHEMISTRY",
    "topic": "Principles Related to Practical Chemistry",
    "subtopic": "Enthalpy of solution/neutralization; lyophilic/lyophobic sols; Reaction kinetics",
    "page_number": 76
  },
  {
    "atom_id": "ATOM_NEET_BIO_U01_at001",
    "atom_title": "Living World and Taxonomy",
    "subject": "Biology",
    "unit": "UNIT 1: Diversity in Living World",
    "topic": "Diversity in Living World",
    "subtopic": "What is living?; Biodiversity; Taxonomy & Systematics; Hierarchy; nomenclature",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U01_at002",
    "atom_title": "Five kingdom classification",
    "subject": "Biology",
    "unit": "UNIT 1: Diversity in Living World",
    "topic": "Diversity in Living World",
    "subtopic": "Monera, Protista, Fungi; Lichens; Viruses and Viroids",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U01_at003",
    "atom_title": "Classification of Plants",
    "subject": "Biology",
    "unit": "UNIT 1: Diversity in Living World",
    "topic": "Diversity in Living World",
    "subtopic": "Algae, Bryophytes, Pteridophytes, Gymnosperms",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U01_at004",
    "atom_title": "Classification of Animals",
    "subject": "Biology",
    "unit": "UNIT 1: Diversity in Living World",
    "topic": "Diversity in Living World",
    "subtopic": "nonchordate phyla and chordate classes",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U02_at001",
    "atom_title": "Morphology and Anatomy of Flowering Plants",
    "subject": "Biology",
    "unit": "UNIT 2: Structural Organisation in Animals and Plants",
    "topic": "Structural Organisation in Animals and Plants",
    "subtopic": "Root, stem, leaf, inflorescence, flower, fruit and seed; Families",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U02_at002",
    "atom_title": "Animal Tissues and Insect (Frog)",
    "subject": "Biology",
    "unit": "UNIT 2: Structural Organisation in Animals and Plants",
    "topic": "Structural Organisation in Animals and Plants",
    "subtopic": "Animal tissues; Morphology and anatomy of systems of a Frog",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U03_at001",
    "atom_title": "Cell Theory and Structure",
    "subject": "Biology",
    "unit": "UNIT 3: Cell Structure and Function",
    "topic": "Cell Structure and Function",
    "subtopic": "Cell theory, prokaryotic and eukaryotic; envelope, membrane, wall",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U03_at002",
    "atom_title": "Cell Organelles structure and function",
    "subject": "Biology",
    "unit": "UNIT 3: Cell Structure and Function",
    "topic": "Cell Structure and Function",
    "subtopic": "Endomembrane system, mitochondria, ribosomes, plastids, micro bodies, cytoskeleton, nucleus",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U03_at003",
    "atom_title": "Biomolecules in cells",
    "subject": "Biology",
    "unit": "UNIT 3: Cell Structure and Function",
    "topic": "Cell Structure and Function",
    "subtopic": "structure/function of proteins, carbodydrates, lipids, nucleic acids",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U03_at004",
    "atom_title": "Enzymes and Cell division",
    "subject": "Biology",
    "unit": "UNIT 3: Cell Structure and Function",
    "topic": "Cell Structure and Function",
    "subtopic": "Enzymes types/properties; Cell cycle, mitosis, meiosis",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U04_at001",
    "atom_title": "Photosynthesis: Phases and Pathways",
    "subject": "Biology",
    "unit": "UNIT 4: Plant Physiology",
    "topic": "Plant Physiology",
    "subtopic": "Autotrophic nutrition, light/biosynthetic phases, photophosphorylation, C3 and C4 pathways",
    "page_number": 77
  },
  {
    "atom_id": "ATOM_NEET_BIO_U04_at002",
    "atom_title": "Chemiosmotic hypothesis and Factors affecting photosynthesis",
    "subject": "Biology",
    "unit": "UNIT 4: Plant Physiology",
    "topic": "Plant Physiology",
    "subtopic": "Chemiosmotic hypothesis; Photorespiration; factors",
    "page_number": 78
  },
  {
    "atom_id": "ATOM_NEET_BIO_U04_at003",
    "atom_title": "Respiration and Energy relations",
    "subject": "Biology",
    "unit": "UNIT 4: Plant Physiology",
    "topic": "Plant Physiology",
    "subtopic": "glycolysis, fermentation, TCA, ETS; ATP number; RQ",
    "page_number": 78
  },
  {
    "atom_id": "ATOM_NEET_BIO_U04_at004",
    "atom_title": "Plant growth and regulators",
    "subject": "Biology",
    "unit": "UNIT 4: Plant Physiology",
    "topic": "Plant Physiology",
    "subtopic": "Seed germination, differentiation, growth regulators (auxin, etc.)",
    "page_number": 78
  },
  {
    "atom_id": "ATOM_NEET_BIO_U05_at001",
    "atom_title": "Human Breathing and Respiration",
    "subject": "Biology",
    "unit": "UNIT 5: Human Physiology",
    "topic": "Human Physiology",
    "subtopic": "respiratory system, mechanism, gas transport, volumes, disorders",
    "page_number": 78
  },
  {
    "atom_id": "ATOM_NEET_BIO_U05_at002",
    "atom_title": "Body fluids and Circulation",
    "subject": "Biology",
    "unit": "UNIT 5: Human Physiology",
    "topic": "Human Physiology",
    "subtopic": "blood groups, heart structure, cardiac cycle, ECG, disorders",
    "page_number": 78
  },
  {
    "atom_id": "ATOM_NEET_BIO_U05_at003",
    "atom_title": "Excretory products and elimination",
    "subject": "Biology",
    "unit": "UNIT 5: Human Physiology",
    "topic": "Human Physiology",
    "subtopic": "modes, kidney function, osmoregulation, dialysis, disorders",
    "page_number": 78
  },
  {
    "atom_id": "ATOM_NEET_BIO_U05_at004",
    "atom_title": "Locomotion and Movement",
    "subject": "Biology",
    "unit": "UNIT 5: Human Physiology",
    "topic": "Human Physiology",
    "subtopic": "muscle contraction, skeletal system, joints, disorders",
    "page_number": 78
  },
  {
    "atom_id": "ATOM_NEET_BIO_U05_at005",
    "atom_title": "Neural control and coordination",
    "subject": "Biology",
    "unit": "UNIT 5: Human Physiology",
    "topic": "Human Physiology",
    "subtopic": "Neuron, CNS/PNS, nerve impulse conduction",
    "page_number": 78
  },
  {
    "atom_id": "ATOM_NEET_BIO_U05_at006",
    "atom_title": "Chemical coordination and regulation",
    "subject": "Biology",
    "unit": "UNIT 5: Human Physiology",
    "topic": "Human Physiology",
    "subtopic": "Endocrine glands, hormone action, hypo/hyperactivity disorders",
    "page_number": 78
  },
  {
    "atom_id": "ATOM_NEET_BIO_U06_at001",
    "atom_title": "Sexual reproduction in flowering plants",
    "subject": "Biology",
    "unit": "UNIT 6: Reproduction",
    "topic": "Reproduction",
    "subtopic": "gametophytes, pollination, fertilization, post fertilization events",
    "page_number": 79
  },
  {
    "atom_id": "ATOM_NEET_BIO_U06_at002",
    "atom_title": "Human Reproduction",
    "subject": "Biology",
    "unit": "UNIT 6: Reproduction",
    "topic": "Reproduction",
    "subtopic": "male/female systems, gametogenesis, menstrual cycle, fertilization, embryo development",
    "page_number": 79
  },
  {
    "atom_id": "ATOM_NEET_BIO_U06_at003",
    "atom_title": "Reproductive health",
    "subject": "Biology",
    "unit": "UNIT 6: Reproduction",
    "topic": "Reproduction",
    "subtopic": "STD, birth control, MTP, Amniocentesis, Assisted technologies (IVF, etc.)",
    "page_number": 79
  },
  {
    "atom_id": "ATOM_NEET_BIO_U07_at001",
    "atom_title": "Heredity and Variation",
    "subject": "Biology",
    "unit": "UNIT 7: Genetics and Evolution",
    "topic": "Genetics and Evolution",
    "subtopic": "Mendelian inheritance, Deviations, polygenic, chromosomes, sex determination, linkage, disorders",
    "page_number": 79
  },
  {
    "atom_id": "ATOM_NEET_BIO_U07_at002",
    "atom_title": "Molecular basis of Inheritance",
    "subject": "Biology",
    "unit": "UNIT 7: Genetics and Evolution",
    "topic": "Genetics and Evolution",
    "subtopic": "DNA/RNA, replication, transcription, genetic code, translation, regulation, Lac Operon, HGP, DNA fingerprinting",
    "page_number": 79
  },
  {
    "atom_id": "ATOM_NEET_BIO_U07_at003",
    "atom_title": "Evolution",
    "subject": "Biology",
    "unit": "UNIT 7: Genetics and Evolution",
    "topic": "Genetics and Evolution",
    "subtopic": "Origin, evidences, Darwin's contribution, Modern theory, Mechanism, selection, drift, Hardy-Weinberg",
    "page_number": 79
  },
  {
    "atom_id": "ATOM_NEET_BIO_U08_at001",
    "atom_title": "Health and Disease",
    "subject": "Biology",
    "unit": "UNIT 8: Biology and Human Welfare",
    "topic": "Biology and Human Welfare",
    "subtopic": "Pathogens, immunology, Cancer, HIV/AIDS, drug/alcohol abuse",
    "page_number": 79
  },
  {
    "atom_id": "ATOM_NEET_BIO_U08_at002",
    "atom_title": "Microbes in human welfare",
    "subject": "Biology",
    "unit": "UNIT 8: Biology and Human Welfare",
    "topic": "Biology and Human Welfare",
    "subtopic": "food processing, industry, sewage, energy, biocontrol agents, biofertilizers",
    "page_number": 80
  },
  {
    "atom_id": "ATOM_NEET_BIO_U09_at001",
    "atom_title": "Principles and Process of Biotechnology",
    "subject": "Biology",
    "unit": "UNIT 9: Biotechnology and Its Applications",
    "topic": "Biotechnology and Its Applications",
    "subtopic": "Genetic engineering (Recombinant DNA technology)",
    "page_number": 80
  },
  {
    "atom_id": "ATOM_NEET_BIO_U09_at002",
    "atom_title": "Applications of Biotechnology",
    "subject": "Biology",
    "unit": "UNIT 9: Biotechnology and Its Applications",
    "topic": "Biotechnology and Its Applications",
    "subtopic": "health, agriculture, insulin, gene therapy, Bt crops, Transgenic Animals, Biosafety",
    "page_number": 80
  },
  {
    "atom_id": "ATOM_NEET_BIO_U10_at001",
    "atom_title": "Organisms and Environment",
    "subject": "Biology",
    "unit": "UNIT 10: Ecology and Environment",
    "topic": "Ecology and Environment",
    "subtopic": "Population interactions, growth, birth/death rate",
    "page_number": 80
  },
  {
    "atom_id": "ATOM_NEET_BIO_U10_at002",
    "atom_title": "Ecosystem",
    "subject": "Biology",
    "unit": "UNIT 10: Ecology and Environment",
    "topic": "Ecology and Environment",
    "subtopic": "Patterns, productivity, decomposition, energy flow, pyramids",
    "page_number": 80
  },
  {
    "atom_id": "ATOM_NEET_BIO_U10_at003",
    "atom_title": "Biodiversity and its conservation",
    "subject": "Biology",
    "unit": "UNIT 10: Ecology and Environment",
    "topic": "Ecology and Environment",
    "subtopic": "Patterns, Importance, Loss, conservation, Hotspots, reserves, National parks",
    "page_number": 80
  }
]