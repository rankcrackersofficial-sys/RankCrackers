# FUP-2C MIRROR2 Safe Shell Contract

Target: student_mission_catalog/{missionId}

Allowed fields:
- missionId
- title
- displayTitle
- examName
- examYear
- missionType
- missionStructureType
- examScope
- mediumPolicy
- supportedMediums
- defaultMedium
- status
- visibility
- source
- contentLocks
- createdAt
- updatedAt

Visibility defaults:
- studentVisible: false
- catalogVisible: false
- userPanelVisible: false
- quickEntryEnabled: false
- smartEntryEnabled: false

Content locks defaults:
- syllabusPublished: false
- topicNodesPublished: false
- digibookPublished: false
- cruciblePublished: false
- pyqPublished: false
- questionCellsPublished: false

Forbidden fields include variables, contentReadiness, syllabus_atoms, topic_nodes, atomic_question_cells, question_bank, question mappings, PYQ content, DigiBook content, Crucible content, Founder/admin private fields, source excerpts, upload artifacts, payment secrets, and Pro verification queue fields.
