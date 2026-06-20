# 🔱 GARBAGE DETECTION REPORT

## 🔍 Forensic Search Criteria
- `subject == "Unknown"`
- `predicate == "Unknown"`
- `object == ""`
- `object.length > 80`
- `content.includes("not mentioned", "N/A", "none")`

## 🛠 Active Countermeasures (v4.2 Implementation)
1. **Source Filtering**: SVO worker now drops any fact where Subject or Predicate is "Unknown" or missing.
2. **Size Constraint**: Prompt now strictly enforces "Maximum object length = 80 characters". Facts exceeding this are rejected at the worker level.
3. **Semantic Filtering**: Facts containing purely negative space placeholders ("N/A", "None") are automatically discarded.
4. **Context Hashing**: Hashing now includes `context` and `factType`, ensuring that similar facts with different categorical truths (e.g., age limits for different castes) are preserved as distinct nodes.

## ⚠️ Known Residue
- Legacy facts extracted under v1.0 schema may still contain unhashed duplicates. 
- **Recommendation**: Wipe `atomic_facts` collection and trigger a re-extraction using the v4.2 hardened svo_worker.
