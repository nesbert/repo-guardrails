#!/usr/bin/env bash
set -euo pipefail

package_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
command="${1:-}"
shift || true

usage() {
  echo "🧭 Usage: repo-guardrails.sh <init|branchlint|commitlint> [options]" >&2
}

repo_root() {
  git rev-parse --show-toplevel 2>/dev/null
}

copy_if_missing() {
  local source="$1" target="$2" executable="${3:-true}"
  if [[ -e "$target" ]]; then
    skipped+=("$target")
    return
  fi
  mkdir -p "$(dirname "$target")"
  cp "$source" "$target"
  "$executable" && chmod +x "$target"
  created+=("$target")
}

init() {
  local root
  root="$(repo_root)" || { echo "⛔️ No Git repository found." >&2; exit 1; }
  cd "$root"

  local -a created=() skipped=()
  copy_if_missing "$package_root/src/shell/branchlint.sh" ".repo-guardrails/branchlint.sh"
  copy_if_missing "$package_root/policy/branch-names.conf" ".repo-guardrails/branch-names.conf" false
  copy_if_missing "$package_root/src/shell/commitlint.sh" ".repo-guardrails/commitlint.sh"
  copy_if_missing "$package_root/templates/shell/hooks/commit-msg" ".githooks/commit-msg"
  copy_if_missing "$package_root/templates/shell/hooks/pre-push" ".githooks/pre-push"
  copy_if_missing "$package_root/templates/shell/workflows/commitlint.yml" ".github/workflows/commitlint.yml"
  copy_if_missing "$package_root/templates/shell/workflows/branchlint.yml" ".github/workflows/branchlint.yml"

  local existing_hooks_path
  existing_hooks_path="$(git config --get core.hooksPath || true)"
  if [[ -z "$existing_hooks_path" ]]; then
    git config --local core.hooksPath .githooks
    printf 'ℹ️ Configured Git hooks path: .githooks\n'
  elif [[ "$existing_hooks_path" == ".githooks" ]]; then
    printf 'ℹ️ Git hooks path already configured: .githooks\n'
  else
    printf '⚠️ Preserved existing Git hooks path: %s\n' "$existing_hooks_path"
  fi
  printf '✅ Shell guardrails initialization complete.\n'
  if ((${#created[@]})); then
    printf '✨ Created:\n'
    for path in "${created[@]}"; do
      printf '  - %s\n' "$path"
    done
  fi
  if ((${#skipped[@]})); then
    printf 'ℹ️ Preserved existing files:\n'
    for path in "${skipped[@]}"; do
      printf '  - %s\n' "$path"
    done
  fi
}

case "$command" in
  init) init ;;
  branchlint) REPO_GUARDRAILS_POLICY_FILE="$package_root/policy/branch-names.conf" exec "$package_root/src/shell/branchlint.sh" "$@" ;;
  commitlint) exec "$package_root/src/shell/commitlint.sh" "$@" ;;
  *) usage; exit 1 ;;
esac
