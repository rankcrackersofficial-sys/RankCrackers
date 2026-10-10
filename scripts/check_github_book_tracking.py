"""Read-only GitHub documentation tracking check for the RankCracker Book.

The script does not pull, merge, overwrite or publish anything. It compares the
book's recorded source commits with the current GitHub branch and reports remote
documentation changes that require a Chief Author review and book recompilation.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "docs" / "rankcrackers_book" / "github_source_manifest.json"


def fetch_json(url: str) -> object:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "RankCrackers-Book-Tracker/1.0",
    }
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = Request(url, headers=headers)
    with urlopen(request, timeout=20) as response:
        return json.load(response)


def github_commits_url(repo: str, branch: str, path: str | None = None) -> str:
    query = {"sha": branch, "per_page": "20"}
    if path:
        query["path"] = path
    return f"https://api.github.com/repos/{repo}/commits?{urlencode(query)}"


def check_via_local_git(repo: str, branch: str, manifest: dict, result: dict) -> None:
    remote_ref = f"origin/{branch}"
    result["tracked_sources"] = []
    result["documentation_commits_seen"] = []
    result["status"] = "PASS"
    result["mode"] = "LOCAL_GIT_TRACKING"

    for source in manifest.get("tracked_sources", []):
        path = source["path"]
        recorded_sha = source.get("latest_observed_commit")
        cp = subprocess.run(
            ["git", "log", "-n", "1", "--format=%H", remote_ref, "--", path],
            capture_output=True,
            text=True,
            cwd=str(ROOT),
        )
        latest_sha = cp.stdout.strip() or None
        source_status = "UNCHANGED" if latest_sha == recorded_sha else "REMOTE_AHEAD"
        result["tracked_sources"].append(
            {
                "path": path,
                "book_chapter": source.get("book_chapter"),
                "recorded_commit": recorded_sha,
                "remote_latest_commit": latest_sha,
                "remote_latest_url": f"https://github.com/{repo}/commit/{latest_sha}" if latest_sha else None,
                "status": source_status,
            }
        )
        if source_status == "REMOTE_AHEAD":
            result["status"] = "ACTION_REQUIRED"

    cp = subprocess.run(
        ["git", "log", "-n", "20", "--format=%H\t%s", remote_ref],
        capture_output=True,
        text=True,
        cwd=str(ROOT),
    )
    for line in cp.stdout.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t", 1)
        sha = parts[0]
        msg = parts[1] if len(parts) > 1 else ""
        diff_cp = subprocess.run(
            ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", sha],
            capture_output=True,
            text=True,
            cwd=str(ROOT),
        )
        doc_files = [
            f.strip()
            for f in diff_cp.stdout.splitlines()
            if f.strip().startswith("docs/") and Path(f.strip()).suffix.lower() in {".md", ".mdx", ".rst", ".txt", ".adoc"}
        ]
        if doc_files:
            result["documentation_commits_seen"].append(
                {
                    "sha": sha,
                    "message": msg,
                    "html_url": f"https://github.com/{repo}/commit/{sha}",
                    "documentation_files": doc_files,
                }
            )


def main() -> int:
    parser = argparse.ArgumentParser(description="Check GitHub documentation sources tracked by the book.")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()

    manifest_path = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    repo = manifest["repository"]
    branch = manifest["branch"]

    result = {
        "repository": repo,
        "branch": branch,
        "recorded_commit": manifest.get("last_scanned_commit"),
        "tracked_sources": [],
        "documentation_commits_seen": [],
        "status": "PASS",
    }

    try:
        branch_commits = fetch_json(github_commits_url(repo, branch))
        if not isinstance(branch_commits, list):
            raise RuntimeError("GitHub returned a non-list commit response")

        for item in branch_commits:
            commit_sha = item.get("sha")
            detail_url = item.get("url")
            if not commit_sha or not detail_url:
                continue
            detail = fetch_json(detail_url)
            changed_files = [f.get("filename", "") for f in detail.get("files", [])]
            doc_files = [
                filename
                for filename in changed_files
                if filename.startswith("docs/")
                and Path(filename).suffix.lower() in {".md", ".mdx", ".rst", ".txt", ".adoc"}
            ]
            if doc_files:
                result["documentation_commits_seen"].append(
                    {
                        "sha": commit_sha,
                        "message": detail.get("commit", {}).get("message", "").splitlines()[0],
                        "html_url": detail.get("html_url"),
                        "documentation_files": doc_files,
                    }
                )

        for source in manifest.get("tracked_sources", []):
            source_commits = fetch_json(github_commits_url(repo, branch, source["path"]))
            latest = source_commits[0] if isinstance(source_commits, list) and source_commits else None
            latest_sha = latest.get("sha") if latest else None
            recorded_sha = source.get("latest_observed_commit")
            source_status = "UNCHANGED" if latest_sha == recorded_sha else "REMOTE_AHEAD"
            result["tracked_sources"].append(
                {
                    "path": source["path"],
                    "book_chapter": source.get("book_chapter"),
                    "recorded_commit": recorded_sha,
                    "remote_latest_commit": latest_sha,
                    "remote_latest_url": latest.get("html_url") if latest else None,
                    "status": source_status,
                }
            )
            if source_status == "REMOTE_AHEAD":
                result["status"] = "ACTION_REQUIRED"
    except (HTTPError, URLError, TimeoutError, OSError, RuntimeError, KeyError, json.JSONDecodeError) as error:
        # Graceful fallback to local git remote-tracking ref when GitHub API rate-limits or is offline
        try:
            check_via_local_git(repo, branch, manifest, result)
        except Exception as git_error:
            result["status"] = "CHECK_FAILED"
            result["error"] = f"{error}; Local git fallback failed: {git_error}"

    if args.as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Repository: {repo}")
        print(f"Branch: {branch}")
        print(f"Status: {result['status']}")
        for source in result["tracked_sources"]:
            print(f"- {source['path']}: {source['status']}")
        if result["documentation_commits_seen"]:
            print("Documentation commits seen:")
            for commit in result["documentation_commits_seen"]:
                print(f"  - {commit['sha'][:12]}: {commit['message']}")
        if result.get("error"):
            print(f"Error: {result['error']}", file=sys.stderr)

    return 1 if result["status"] in {"ACTION_REQUIRED", "CHECK_FAILED"} else 0


if __name__ == "__main__":
    raise SystemExit(main())
