# FUP-2C-UI1 PYQ / Sample Question Atom Cell Mapping Lock

Founder-uploaded PYQs and sample questions must not be stored as random loose question data after extraction.

## Backend Storage Principle
Each extracted PYQ or sample question must be mapped to the closest verified syllabus atomic topic.

Future target shape:
- Subject cell: Chemistry / Physics / Mathematics
- Atomic topic cell: syllabus atom ID / canonical key
- Question source marker: PYQ or SAMPLE
- Source document ID and page/reference proof
- Question text, options, answer if available, explanation if available
- Difficulty, framing, trap pattern, and repeat-frequency metadata when available

## Required Worker Behavior Later
AI workers should identify the question's concept/topic during extraction, attach the matching syllabus atom ID, and route it into the correct topic cell.

## Marker Policy
- PYQ questions must carry a clear PYQ marker.
- Sample questions must carry a clear SAMPLE marker.
- Mixed uploads can create both marker types if the source document contains both.

## Safety Rule
Low-confidence mapping must not be silently accepted. If a question cannot be confidently mapped to a syllabus atom, it should go to a review bucket instead of being attached to the wrong cell.

## UI1 Scope
UI1 only locks this plan and adds upload categories. It does not run extraction, does not mutate backend question stores, and does not publish anything to students.
