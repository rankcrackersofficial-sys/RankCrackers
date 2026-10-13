# RankCrackers: GitHub → Google Drive daily backups

## Safety and activation

**This workflow is OFF by default.** No scheduled backup runs until all three gates are satisfied:
1. Review/merge the draft PR to the repository's default branch.
2. Create repository Actions secret `RC_DRIVE_RCLONE_CONFIG_B64`.
3. Set repository Actions variable `RC_DRIVE_BACKUP_ENABLED=true`.

The workflow uses GitHub read-only permissions and Google Drive upload-only intent. It never pushes/merges/deploys, and never calls `rclone sync`, `delete`, or `purge`. Past backups are never automatically deleted.

Each backup contains a bare `git clone --mirror` (all advertised branches/tags/commits), Git LFS objects available through the GitHub repository, repository/issue/PR/release metadata, hashes, a manifest, and a local restore-verification result. After upload it runs `rclone check`; only then does it upload `VERIFIED.txt`. Daily schedule: **01:21 UTC / 06:51 IST** (subject to GitHub scheduling delay or skip).

## Google Drive OAuth: one-time trusted-PC setup

Use the dedicated RankCrackers Google account rather than a personal or government account. A Google Drive connection inside ChatGPT is NOT the credential GitHub Actions uses.

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project; enable **Google Drive API**, configure OAuth consent and make a **Desktop OAuth client**. Set production/publishing status as appropriate, because unverified external apps in testing mode can have refresh tokens expire in 7 days. Use your own OAuth client ID and secret: rclone's shared OAuth client is being retired in 2026.
2. On a trusted PC, install [rclone](https://rclone.org/downloads/). Run `rclone config`: new remote **gdrive**; type **drive**; your own client ID/secret; scope **drive.file**; authenticate only with the RankCrackers account. `drive.file` limits rclone to files/folders it creates, which is safer than full-Drive access.
3. CREATE the folder **via rclone**: `rclone mkdir gdrive:RankCrackers_GitHub_Backups`. Verify: `rclone lsf gdrive:RankCrackers_GitHub_Backups`. Do not create the folder in Drive web/ChatGPT first when using `drive.file`: it may not be visible to rclone.
4. Run `rclone config file`, and make a private minimal `rclone.conf` containing ONLY the `[gdrive]` remote. On Windows PowerShell, base64 the complete file as a single line: `[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\\path\\to\\rclone.conf'))`.
5. In GitHub Repo → **Settings → Secrets and variables → Actions**: create repository **secret** `RC_DRIVE_RCLONE_CONFIG_B64` with the base64 string, and **variable** `RC_DRIVE_BACKUP_ENABLED=true` only when ready. **Do not paste credentials into chat, code, PRs, issue comments, logs, or screenshots.**
6. After merge, run **Actions → RankCrackers — GitHub to Drive immutable daily backup → Run workflow**. Confirm both a green run and the presence of `VERIFIED.txt` in `RankCrackers_GitHub_Backups/YYYY/MM/<timestamp>_run..._attempt.../`. Download and practice restoring the archive locally.

## Restore rehearsal

Download a folder containing `VERIFIED.txt`. In Git Bash/Linux, run `sha256sum -c SHA256SUMS` from inside the folder. Extract `repository-mirror.tar.gz` into a new empty folder; run `git -C repository.git fsck --full --no-reflogs` and `git -C repository.git show-ref`. To inspect a working copy, run `git clone repository.git rankcrackers-restore-test`. Never push `--mirror` into the live repository without an explicit recovery review.

## Scope limits and risks

- **Not backed up:** local uncommitted/unpushed data, Firebase/Firestore/Cloud Storage, GitHub secrets/variables/settings, GitHub Wiki/Projects, PR review decisions, attachments hosted outside accessible Git refs.
- Full mirrors are made daily; Drive storage may run out. No backup deletion happens automatically, so monitor Drive quota.
- GitHub schedules can run late or be skipped and may disable in inactive public repositories after 60 days; monitor Actions and verified markers. Enable alerts separately if desired.
- The OAuth token is sensitive; use a dedicated rclone app/scope. Revoking the grant or setting `RC_DRIVE_BACKUP_ENABLED=false` pauses uploads without affecting existing copies.
- **Testing:** `bash ops/backup/tests/test_backup.sh` uses a synthetic local repo and fake rclone; validates restore, hashes, versions and failure handling. It does NOT prove real Google OAuth, GitHub Actions live runtime, or a scheduled run.
