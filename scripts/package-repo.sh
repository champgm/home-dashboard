#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
archive="${1:-"$repo_dir/home-dashboard.tar.gz"}"
[[ "$archive" = /* ]] || archive="$repo_dir/$archive"

tar -C "$repo_dir" -czf "$archive" \
  --exclude-vcs \
  --exclude='node_modules' --exclude='*/node_modules' \
  --exclude='.expo*' --exclude='.eas' \
  --exclude='.agents' --exclude='.codex' \
  --exclude='android' --exclude='ios' \
  --exclude='dist' --exclude='build' --exclude='coverage' \
  --exclude='web-build' --exclude='web-report' \
  --exclude='*.apk' --exclude='*.aab' --exclude='*.ipa' \
  --exclude='*.tar*' --exclude='*.log' \
  .

printf 'Created %s\n' "$archive"
