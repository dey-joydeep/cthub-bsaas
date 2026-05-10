#!/usr/bin/env bash
# sync-wsl-windows.sh
# Sync uncommitted files between Windows clone and WSL clone of the same repo.

set -u

# ---------- CONFIG ----------
WIN_REPO="/mnt/e/workspace/cthub-bsaas"
LIN_REPO="$HOME/workspace/cthub-bsaas"

# Colors
BOLD="\033[1m"; DIM="\033[2m"; RED="\033[31m"; GRN="\033[32m"; YEL="\033[33m"; BLU="\033[34m"; MAG="\033[35m"; CYN="\033[36m"; RST="\033[0m"

# ---------- UTIL ----------
die() { echo -e "${RED}✖ $*${RST}"; exit 1; }
info() { echo -e "${CYN}ℹ${RST} $*"; }
ok()   { echo -e "${GRN}✔${RST} $*"; }
warn() { echo -e "${YEL}▲${RST} $*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

# Try to offer arrow-key menu via fzf if present, else numbered select
choose() {
  local prompt="$1"; shift
  local -a options=("$@")
  echo
  if command -v fzf >/dev/null 2>&1; then
    printf "%s\n" "${options[@]}" | fzf --prompt="$prompt " --height=12 --border --reverse
  else
    echo -e "${DIM}(Tip: install ${BOLD}fzf${DIM} for arrow-key selection: ${BOLD}sudo apt-get install fzf${DIM})${RST}"
    select opt in "${options[@]}"; do
      [[ -n "$opt" ]] && { echo "$opt"; break; }
      echo "Invalid selection."
    done
  fi
}

ensure_git_repo() {
  local d="$1"
  [[ -d "$d/.git" ]] || die "Not a Git repo: $d"
}

git_clean() {
  local d="$1"
  [[ -z "$(git -C "$d" status --porcelain -uall)" ]]
}

# Return 0 if local has commits not pushed (ahead of upstream), 1 otherwise.
git_ahead_of_upstream() {
  local d="$1"
  if ! git -C "$d" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    # No upstream set → treat as not ahead (or warn)
    return 1
  fi
  local ahead
  ahead="$(git -C "$d" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)"
  [[ "${ahead:-0}" -gt 0 ]]
}

# Gather staged + unstaged + untracked unique file list (relative paths)
gather_uncommitted_files() {
  local d="$1"
  local -a staged unstaged untracked
  mapfile -t staged   < <(git -C "$d" diff --name-only --cached)
  mapfile -t unstaged < <(git -C "$d" diff --name-only)
  mapfile -t untracked< <(git -C "$d" ls-files --others --exclude-standard)

  # De-dup
  declare -A seen=()
  local f
  for f in "${staged[@]}" "${unstaged[@]}" "${untracked[@]}"; do
    [[ -n "$f" ]] || continue
    seen["$f"]=1
  done
  # Output as array on stdout separated by \n
  for f in "${!seen[@]}"; do echo "$f"; done | sort
}

pause() { read -rp "$(echo -e "${DIM}Press Enter to continue...${RST} ")" _; }

# ---------- FLOW ----------
usage() {
  cat <<EOF
Usage: $(basename "$0") [w2l|l2w]

  w2l : Windows -> Linux
  l2w : Linux   -> Windows

If omitted, you'll be prompted to choose.
EOF
}

main() {
  need_cmd git
  need_cmd rsync

  [[ -d "$WIN_REPO" ]] || die "Windows path not found: $WIN_REPO"
  [[ -d "$LIN_REPO" ]] || die "Linux path not found: $LIN_REPO"

  local dir_of_script
  dir_of_script="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
  if [[ "$dir_of_script" != "$LIN_REPO/scripts" ]]; then
    warn "Script is expected at: $LIN_REPO/scripts/sync-wsl-windows.sh"
  fi

  local mode="${1:-}"
  case "$mode" in
    w2l|l2w) ;;
    "")
      local picked
      picked="$(choose "Select sync direction >" "Windows → Linux (w2l)" "Linux → Windows (l2w)")" || exit 1
      [[ "$picked" == *w2l* ]] && mode="w2l" || mode="l2w"
      ;;
    *)
      usage; die "Unknown argument: $mode"
      ;;
  esac

  local SRC DEST SRC_NAME DEST_NAME
  if [[ "$mode" == "w2l" ]]; then
    SRC="$WIN_REPO"; DEST="$LIN_REPO"; SRC_NAME="Windows"; DEST_NAME="Linux"
  else
    SRC="$LIN_REPO"; DEST="$WIN_REPO"; SRC_NAME="Linux"; DEST_NAME="Windows"
  fi

  echo -e "${BOLD}${BLU}Sync uncommitted files ${RST}${BOLD}(${SRC_NAME} → ${DEST_NAME})${RST}"
  echo -e "Source:      ${MAG}$SRC${RST}"
  echo -e "Destination: ${MAG}$DEST${RST}"

  ensure_git_repo "$SRC"
  ensure_git_repo "$DEST"

  # Step 2: list uncommitted files at source
  info "Scanning uncommitted files in ${SRC_NAME}..."
  mapfile -t FILES < <(gather_uncommitted_files "$SRC")
  if [[ "${#FILES[@]}" -eq 0 ]]; then
    ok "No uncommitted files in $SRC_NAME. Nothing to do."
    exit 0
  fi
  ok "Found ${#FILES[@]} uncommitted files in $SRC_NAME."

  # Step 3: ensure source has no unpushed commits
  if git_ahead_of_upstream "$SRC"; then
    warn "$SRC_NAME has local commits not pushed to its upstream."
    local choice
    choice="$(choose "Push now?" "Yes, push commits" "Quit")" || exit 1
    if [[ "$choice" == "Quit" ]]; then die "Aborted by user."; fi
    info "Pushing ${SRC_NAME}..."
    if ! git -C "$SRC" push; then
      die "Push failed. Resolve and rerun."
    fi
    ok "Pushed."
  else
    ok "$SRC_NAME has no unpushed commits."
  fi

  # Step 4/5: destination must be clean. If not, let user commit manually, loop.
  while ! git_clean "$DEST"; do
    warn "$DEST_NAME has uncommitted changes."
    echo -e "${DIM}git status (${DEST_NAME})${RST}"
    git -C "$DEST" status -sb -uall
    local act
    act="$(choose "Choose an action >" \
      "Open a subshell at ${DEST_NAME} to commit" \
      "Re-check cleanliness" \
      "Quit")" || exit 1
    case "$act" in
      "Open a subshell at ${DEST_NAME} to commit")
        echo -e "${DIM}You are now in a shell at ${DEST}. Run: git add -A && git commit -m \"...\" (and push if you like). Exit when done.${RST}"
        ( cd "$DEST" && ${SHELL:-/bin/bash} -i )
        ;;
      "Re-check cleanliness")
        ;;
      "Quit")
        die "Aborted by user."
        ;;
    esac
  done
  ok "$DEST_NAME working tree is clean."

  # Step 6: ensure destination has no unpushed commits
  if git_ahead_of_upstream "$DEST"; then
    warn "$DEST_NAME has local commits not pushed to its upstream."
    local choice2
    choice2="$(choose "Push now?" "Yes, push commits" "Quit")" || exit 1
    if [[ "$choice2" == "Quit" ]]; then die "Aborted by user."; fi
    info "Pushing ${DEST_NAME}..."
    if ! git -C "$DEST" push; then
      die "Push failed. Resolve and rerun."
    fi
    ok "Pushed."
  else
    ok "$DEST_NAME has no unpushed commits."
  fi

  # Step 7: pull on destination to ensure sync
  info "Pulling latest on ${DEST_NAME}..."
  # Prefer fast-forward; if it fails, let user resolve then continue.
  if ! git -C "$DEST" pull --ff-only --recurse-submodules; then
    warn "Fast-forward pull failed (non-FF or conflicts)."
    echo -e "${DIM}Open a subshell at ${DEST} to resolve (rebase/merge), then exit to continue.${RST}"
    ( cd "$DEST" && ${SHELL:-/bin/bash} -i )
    info "Re-attempting pull..."
    git -C "$DEST" pull --recurse-submodules || die "Pull still failing. Resolve and rerun."
  fi
  ok "Destination is up-to-date with remote."

  # Step 8: copy files
  info "Copying ${#FILES[@]} file(s) from ${SRC_NAME} → ${DEST_NAME}..."
  local copied=0 skipped=0
  for rel in "${FILES[@]}"; do
    # Skip deletions: if file missing in source but tracked removal, don't touch dest.
    if [[ ! -e "$SRC/$rel" ]]; then
      warn "Skipping (does not exist at source): $rel"
      ((skipped++))
      continue
    fi
    mkdir -p "$DEST/$(dirname "$rel")"
    # rsync to preserve times/perms reasonably; avoids issues with spaces.
    if rsync -a --no-compress --mkpath "$SRC/$rel" "$DEST/$rel"; then
      ((copied++))
    else
      warn "Failed to copy: $rel"
      ((skipped++))
    fi
  done
  ok "Copied $copied file(s). Skipped $skipped."

  echo
  ok "Done. Review changes in ${DEST_NAME}:"
  echo -e "${DIM}cd \"$DEST\" && git status${RST}"
}

main "$@"
