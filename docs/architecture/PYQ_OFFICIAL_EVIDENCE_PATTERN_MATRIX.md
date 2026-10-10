# RankCrackers — PYQ Official Evidence Pattern Matrix v1.0

## Purpose
This matrix records architecture-driving patterns observed across representative authorities. It is not a claim that every cycle follows the same publication format.

| Authority/example | Architecture-driving pattern |
|---|---|
| NTA NEET | Multiple booklet codes/variants can exist; answer mapping may vary by booklet/question appearance; re-examination can create a distinct Exam Event. |
| UPSC | Previous Question Papers and Answer Keys can be separate official archives; descriptive papers do not imply objective answer keys; dropped/scoring treatment must be representable. |
| RPSC | Final keys may map to an uploaded paper without a booklet code; deleted questions occur; subject/group-specific papers require Component/Track identity. |
| SSC CGL CBT | Final keys/response sheets may be released behind candidate login for a limited window; release can be proven even when question-level key content was not acquired. |
| NTA JEE Main | Date/shift and authority Question IDs/Correct Option IDs are important; numerical-answer questions and dropped questions require answer types beyond A/B/C/D. |

## Universal conclusion
No authority-specific field may be forced globally. The schema uses optional authority-native identifiers while maintaining strict universal hierarchy:
Mission → Cycle → Exam Event → Stage → Component/Paper → applicability/variant dimensions → Question Appearance → Answer Authority.

## Evidence-strength rule
This matrix guides schema capability. Production records require their own source evidence; an example from one examination never proves another record.

## JEE-specific schema consequence
Store authority_question_id and authority_option_id independently from display question number/option label. Support numerical official answers and DROP disposition. Shift/session is first-class when the authority uses it.

## Cross-authority invariant
Exact provenance outranks convenience. If the source does not establish a field, store UNKNOWN/NOT_APPLICABLE according to semantics rather than infer it.
