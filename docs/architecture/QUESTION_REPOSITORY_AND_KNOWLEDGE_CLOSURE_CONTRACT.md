# RankCrackers — Question Repository & Knowledge Closure Contract v1.0

## Purpose
Govern all assessment items independently of delivery surface.

## Repository
One Central Question Repository with explicit classes:
- PYQ Bank: historical examination questions with provenance.
- RankCrackers Question Bank: internally authored/generated questions.
Class identity is immutable except through explicit reviewed migration; internal questions can never become PYQs.

## Question object
CanonicalQuestion → one or more QuestionAppearances/Versions → answer/solution objects → knowledge dependencies → review/publication states.
Required dimensions: Mission, blueprint applicability, language, question type, stem, options/input schema, media, answer authority, solution, atom dependencies, difficulty, depth, provenance, version lineage.

## Knowledge closure
Every substantive fact/concept/method needed to solve an assessment item must be enumerated as a Knowledge Dependency.
QUESTION_KNOWLEDGE_CLOSED is granted only when each dependency is:
1. inside applicable verified scope;
2. mapped to verified atom/prerequisite authority;
3. within allowed depth;
4. taught for the target learner/context when taught authority is required;
5. not invalidated/stale.

Reasoning steps may be novel/hard; substantive untaught knowledge may not be smuggled in as reasoning.

## Authored-question lifecycle
DRAFT → ATOM_MAPPED → ANSWER_VERIFIED → SOLUTION_VERIFIED → KNOWLEDGE_CLOSED → REVIEWED → PUBLICATION_ELIGIBLE.
Failure/hold: SCOPE_LEAK, UNTaught_DEPENDENCY, ANSWER_CONFLICT, AMBIGUOUS_ITEM, DUPLICATE_REVIEW, STALE_UPSTREAM.

## PYQ interaction
PYQ provenance/answer authority follows PYQ contracts. Historical questions outside current scope remain evidence but cannot automatically enter current scored practice.

## Difficulty
Difficulty is empirical/estimated challenge, not permission to exceed depth. Difficulty may evolve from response statistics without changing semantic scope.

## Deduplication
Never merge on text similarity alone. Preserve official appearances, translations, option order and media. Internally authored near-duplicates may be clustered but canonical merge requires reviewed equivalence.

## Solutions
Solution must distinguish required knowledge from reasoning transformation, preserve answer authority label, and not cite a RankCrackers-derived answer as official.

## Delivery
DigiBook, Crucible and Test Arena reference canonical/versioned questions; they do not own duplicate question copies. Attempts/results are separate immutable learner events.

## Acceptance tests
Block wrong mission/track; untaught dependency; out-of-depth dependency; stale atom; unresolved official answer; ambiguous options; unsupported media; silent answer change; fuzzy PYQ merge; duplicate copies across products. Allow hard multi-step reasoning when all substantive knowledge dependencies are closed.
