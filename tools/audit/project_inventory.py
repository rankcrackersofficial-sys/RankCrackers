"""Read-only source inventory. Dependency scans are never semantic acceptance."""
import argparse
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def component(path):
    if path.startswith(("lib/web/", "lib/features/admin/")):
        return "FOUNDER"
    if path.startswith("lib/features/"):
        return "STUDENT:" + path.split("/")[2]
    if path.startswith("lib/"):
        return "SHARED_CLIENT"
    if path.startswith(("functions/src/test/", "functions/test/", "test/")):
        return "TESTS"
    if path.startswith("functions/"):
        return "BACKEND"
    if path.endswith(".rules"):
        return "SECURITY_RULES"
    return "BUILD_DATA_DOCS_TOOLS"


def build_inventory():
    paths = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0")
    rows = []
    for path in sorted(p for p in paths if p):
        file = ROOT / path
        if not file.is_file():
            rows.append({"path": path, "status": "MISSING_TRACKED_FILE"})
            continue
        data = file.read_bytes()
        row = {"path": path, "component": component(path), "bytes": len(data),
               "sha256": hashlib.sha256(data).hexdigest(), "status": "INVENTORIED_NOT_ACCEPTED"}
        if file.suffix in {".dart", ".js", ".ts", ".rules", ".py", ".yaml", ".yml"}:
            text = data.decode("utf-8-sig", errors="replace")
            row["lines"] = len(text.splitlines())
            row["correctness_debt_lines"] = [i for i, line in enumerate(text.splitlines(), 1)
                if re.search(r"TODO|FIXME|placeholder|unimplemented|mock|dummy", line, re.I)]
            row["collections"] = sorted(set(re.findall(r"collection\(['\"]([^'\"]+)", text)))
            row["callables"] = sorted(set(re.findall(r"httpsCallable\(['\"]([^'\"]+)", text)))
            row["exports"] = sorted(set(re.findall(r"exports\.(\w+)\s*=", text)))
            if file.suffix == ".dart":
                missing = []
                for match in re.finditer(r"(?:import|export|part)\s+['\"]([^'\"]+)['\"]", text):
                    uri = match.group(1)
                    if uri.startswith("package:rank_crackers/"):
                        target = ROOT / "lib" / uri.removeprefix("package:rank_crackers/")
                    elif ":" not in uri:
                        target = file.parent / uri
                    else:
                        continue
                    target = target.resolve()
                    if not target.exists():
                        missing.append({"uri": uri, "target": str(target.relative_to(ROOT)),
                                        "line": text[:match.start()].count("\n") + 1})
                row["missing_imports"] = missing
        rows.append(row)
    return {"repository": "rankcrackersofficial-sys/RankCrackers",
            "sha": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT).decode().strip(),
            "acceptance": "WITHHELD; inventory is not audit completion",
            "counts": dict(Counter(row.get("component", "MISSING") for row in rows)), "files": rows}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    result = build_inventory()
    Path(args.output).write_text(json.dumps(result, indent=2) + "\n")
    missing = [row for row in result["files"] if row.get("missing_imports")]
    print(json.dumps({"counts": result["counts"], "missing_import_files": len(missing),
                      "missing_targets": sorted(set(item["target"] for row in missing
                                                    for item in row["missing_imports"]))}, indent=2))
