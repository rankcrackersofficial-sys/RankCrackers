#!/usr/bin/env bash
set -Eeuo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
script="$(realpath "$here/../backup_repo_to_drive.sh")"
root="$(mktemp -d)"
trap 'rm -rf "$root"' EXIT
mkdir -p "$root/bin" "$root/src" "$root/drive"
cp "$here/fake_rclone.py" "$root/bin/rclone"
chmod +x "$root/bin/rclone"
export PATH="$root/bin:$PATH"
export FAKE_RCLONE_ROOT="$root/drive"

git -C "$root/src" init --quiet -b main
git -C "$root/src" config user.email fixture@example.invalid
git -C "$root/src" config user.name 'Test Fixture'
printf 'v1\n' > "$root/src/README.md"
git -C "$root/src" add README.md
git -C "$root/src" commit --quiet -m first
git -C "$root/src" tag v1
git -C "$root/src" switch --quiet -c feature
printf 'feature\n' > "$root/src/feature.txt"
git -C "$root/src" add feature.txt
git -C "$root/src" commit --quiet -m feature
git -C "$root/src" switch --quiet main

export RC_BACKUP_TEST_MODE=true
export RC_BACKUP_REPO=rankcrackersofficial-sys/RankCrackers
export RC_BACKUP_SOURCE_URL="$root/src"
export RC_BACKUP_DEFAULT_BRANCH=main
export RC_BACKUP_RUN_ID=12345
export RC_BACKUP_ATTEMPT=1
export RC_DRIVE_REMOTE_ROOT=gdrive:RankCrackers_GitHub_Backups
bash "$script"
backup_path="$(find "$root/drive/RankCrackers_GitHub_Backups" -name VERIFIED.txt -print -quit)"
[[ -n "$backup_path" ]] || { echo 'FAIL: first backup missing verified marker'; exit 1; }
folder="$(dirname "$backup_path")"
(
  cd "$folder"
  sha256sum --check SHA256SUMS >/dev/null
)
mkdir "$root/restored"
tar -xzf "$folder/repository-mirror.tar.gz" -C "$root/restored"
git -C "$root/restored/repository.git" show-ref --verify refs/heads/feature >/dev/null
git -C "$root/restored/repository.git" show-ref --verify refs/tags/v1 >/dev/null

export RC_BACKUP_ATTEMPT=2
bash "$script"
[[ "$(find "$root/drive" -name VERIFIED.txt | wc -l)" -eq 2 ]] || { echo 'FAIL: daily versions overwritten'; exit 1; }

export RC_BACKUP_ATTEMPT=3
export FAKE_RCLONE_FAIL_CHECK=true
if bash "$script"; then echo 'FAIL: validation failure passed'; exit 1; fi
[[ "$(find "$root/drive" -name VERIFIED.txt | wc -l)" -eq 2 ]] || { echo 'FAIL: bad backup marked verified'; exit 1; }
unset FAKE_RCLONE_FAIL_CHECK

export RC_BACKUP_ATTEMPT=4
unset RC_BACKUP_TEST_MODE
unset RC_DRIVE_RCLONE_CONFIG_B64
if bash "$script" 2>/dev/null; then echo 'FAIL: missing secret allowed'; exit 1; fi

echo 'PASS: restore, refs/tags, integrity, versioning, fail-closed, credential gate'
