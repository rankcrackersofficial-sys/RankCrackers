#!/usr/bin/env bash
# Immutable source-only daily snapshot; never performs a Git push or rclone sync/delete.
set -Eeuo pipefail
umask 077

fail() { printf 'BACKUP ERROR: %s\n' "$*" >&2; exit 1; }
: "${RC_BACKUP_REPO:?Missing RC_BACKUP_REPO}"
: "${RC_BACKUP_RUN_ID:?Missing RC_BACKUP_RUN_ID}"
: "${RC_BACKUP_ATTEMPT:?Missing RC_BACKUP_ATTEMPT}"
: "${RC_DRIVE_REMOTE_ROOT:?Missing RC_DRIVE_REMOTE_ROOT}"
[[ "$RC_BACKUP_REPO" == 'rankcrackersofficial-sys/RankCrackers' || "${RC_BACKUP_TEST_MODE:-}" == 'true' ]] || fail 'Unexpected repository'
[[ "$RC_BACKUP_RUN_ID" =~ ^[0-9]+$ && "$RC_BACKUP_ATTEMPT" =~ ^[0-9]+$ ]] || fail 'Invalid run identifiers'
[[ "$RC_DRIVE_REMOTE_ROOT" == gdrive:* ]] || fail 'Drive remote must be gdrive:'
command -v git >/dev/null && command -v rclone >/dev/null && command -v sha256sum >/dev/null || fail 'Missing git/rclone/sha256sum'

workdir="$(mktemp -d)"
cleanup() { rm -rf -- "$workdir"; }
trap cleanup EXIT
mkdir -p "$workdir/package/metadata"

# The workflow supplies a base64-encoded rclone configuration as an Actions Secret.
# For offline tests, an existing RCLONE_CONFIG may be supplied directly.
if [[ -n "${RC_DRIVE_RCLONE_CONFIG_B64:-}" ]]; then
  export RCLONE_CONFIG="$workdir/rclone.conf"
  printf '%s' "$RC_DRIVE_RCLONE_CONFIG_B64" | base64 --decode > "$RCLONE_CONFIG" || fail 'Invalid encoded rclone config'
  chmod 600 "$RCLONE_CONFIG"
  unset RC_DRIVE_RCLONE_CONFIG_B64
elif [[ "${RC_BACKUP_TEST_MODE:-}" != 'true' ]]; then
  fail 'Missing RC_DRIVE_RCLONE_CONFIG_B64 secret'
fi

if [[ "${RC_BACKUP_TEST_MODE:-}" == 'true' ]]; then
  source_url="${RC_BACKUP_SOURCE_URL:?Missing fixture source URL}"
  default_branch="${RC_BACKUP_DEFAULT_BRANCH:?Missing fixture branch}"
else
  : "${GH_TOKEN:?Missing GitHub Actions read-only token}"
  command -v gh >/dev/null && command -v jq >/dev/null && git lfs version >/dev/null || fail 'Missing gh/jq/git-lfs'
  source_url="https://github.com/${RC_BACKUP_REPO}.git"
  gh api "repos/${RC_BACKUP_REPO}" > "$workdir/package/metadata/repository.json"
  default_branch="$(jq -er '.default_branch' "$workdir/package/metadata/repository.json")"
  gh api --paginate --slurp "repos/${RC_BACKUP_REPO}/issues?state=all&per_page=100" > "$workdir/package/metadata/issues.pages.json"
  gh api --paginate --slurp "repos/${RC_BACKUP_REPO}/issues/comments?per_page=100" > "$workdir/package/metadata/issue-comments.pages.json"
  gh api --paginate --slurp "repos/${RC_BACKUP_REPO}/pulls?state=all&per_page=100" > "$workdir/package/metadata/pulls.pages.json"
  gh api --paginate --slurp "repos/${RC_BACKUP_REPO}/pulls/comments?per_page=100" > "$workdir/package/metadata/pull-review-comments.pages.json"
  gh api --paginate --slurp "repos/${RC_BACKUP_REPO}/releases?per_page=100" > "$workdir/package/metadata/releases.pages.json"
fi

git clone --mirror --no-hardlinks "$source_url" "$workdir/repository.git"
if [[ "${RC_BACKUP_TEST_MODE:-}" != 'true' ]]; then
  git -C "$workdir/repository.git" lfs fetch --all origin
fi
git -C "$workdir/repository.git" fsck --full --no-reflogs >/dev/null
head_sha="$(git -C "$workdir/repository.git" rev-parse --verify "refs/heads/${default_branch}^{commit}")" || fail 'Default HEAD not in mirror'
git -C "$workdir/repository.git" show-ref > "$workdir/package/refs.txt"
branch_count="$(git -C "$workdir/repository.git" for-each-ref --format='%(refname)' refs/heads | wc -l | tr -d ' ')"
tag_count="$(git -C "$workdir/repository.git" for-each-ref --format='%(refname)' refs/tags | wc -l | tr -d ' ')"
start_utc="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
backup_id="$(date -u '+%Y%m%dT%H%M%SZ')_run${RC_BACKUP_RUN_ID}_attempt${RC_BACKUP_ATTEMPT}"
{
  printf 'repository=%s\n' "$RC_BACKUP_REPO"
  printf 'captured_at_utc=%s\n' "$start_utc"
  printf 'default_branch=%s\n' "$default_branch"
  printf 'default_branch_commit=%s\n' "$head_sha"
  printf 'branches=%s\n' "$branch_count"
  printf 'tags=%s\n' "$tag_count"
  printf 'git_lfs_all_refs_fetched=%s\n' "$([[ "${RC_BACKUP_TEST_MODE:-}" == 'true' ]] && echo no-test-fixture || echo yes)"
  printf 'metadata_scope=repository,issues,issue_comments,pull_requests,pull_review_comments,releases\n'
  printf 'exclusions=actions_secrets,settings,uncommitted_files,firestore,cloud_storage,github_wiki,github_projects,pr_reviews\n'
} > "$workdir/package/MANIFEST.txt"

# A tarred bare mirror preserves all advertised Git refs/history and fetched LFS files.
tar -czf "$workdir/package/repository-mirror.tar.gz" -C "$workdir" repository.git
# Restore smoke check BEFORE upload; no network writes.
mkdir -p "$workdir/restore-check"
tar -xzf "$workdir/package/repository-mirror.tar.gz" -C "$workdir/restore-check"
git -C "$workdir/restore-check/repository.git" fsck --full --no-reflogs >/dev/null
[[ "$(git -C "$workdir/restore-check/repository.git" rev-parse "refs/heads/${default_branch}^{commit}")" == "$head_sha" ]] || fail 'Restore SHA mismatch'
(
  cd "$workdir/package"
  find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
  sha256sum -c SHA256SUMS >/dev/null
)

# rclone uses copy + immutable, NEVER sync, purge, delete or overwrite.
year_month="$(date -u '+%Y/%m')"
parent="${RC_DRIVE_REMOTE_ROOT%/}/${year_month}"
target="${parent}/${backup_id}"
rclone mkdir "$parent"
# Check parent is reachable, then reject any collision. This matters when re-running jobs.
existing="$(rclone lsf "$parent" --dirs-only)" || fail 'Could not list target parent'
if printf '%s\n' "$existing" | grep -Fxq "${backup_id}/"; then fail 'Backup directory already exists'; fi
rclone copy "$workdir/package" "$target" --immutable --transfers 2 --checkers 4
rclone check "$workdir/package" "$target" --one-way --checkers 4
printf 'VERIFIED\nsource_default_sha=%s\ncompleted_utc=%s\n' "$head_sha" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$workdir/VERIFIED.txt"
rclone copyto "$workdir/VERIFIED.txt" "$target/VERIFIED.txt" --immutable
printf 'BACKUP VERIFIED: %s\nDEFAULT HEAD: %s\n' "$target" "$head_sha"
