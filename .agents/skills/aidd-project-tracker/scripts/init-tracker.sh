#!/usr/bin/env bash
# init-tracker.sh — Linux/macOS companion to init-tracker.ps1
# Usage: See SKILL.md for full documentation.

set -euo pipefail

# ── Defaults ────────────────────────────────────────────────────────────────
EPIC_TITLE=""
EPIC_BODY=""
REPO=""
SUB_ISSUES_JSON=""
PROJECT_OWNER="dey-joydeep"
PROJECT_NUMBER="1"

# ── Field IDs (same as PS script) ───────────────────────────────────────────
PROJ_ID="PVT_kwHOALP8fs4BCwcr"
F_STATUS="PVTSSF_lAHOALP8fs4BCwcrzg04ApY"
F_PRIORITY="PVTSSF_lAHOALP8fs4BCwcrzg04A1A"
F_SIZE="PVTSSF_lAHOALP8fs4BCwcrzg04A1E"
F_ESTIMATE="PVTF_lAHOALP8fs4BCwcrzg04A1I"
F_START="PVTF_lAHOALP8fs4BCwcrzg04A1Q"
F_END="PVTF_lAHOALP8fs4BCwcrzg04A1U"
F_DOMAIN="PVTSSF_lAHOALP8fs4BCwcrzhWdrWU"

status_id()   { case "$1" in Backlog) echo "f75ad846";; Ready) echo "08afe404";; "In progress") echo "47fc9ee4";; "In review") echo "4cc61d42";; Done) echo "98236657";; esac; }
priority_id() { case "$1" in P0) echo "79628723";; P1) echo "0a877460";; P2) echo "da944a9c";; esac; }
size_id()     { case "$1" in XS) echo "eff732af";; S) echo "9592a5a3";; M) echo "9728cbdc";; L) echo "c53df028";; XL) echo "7b141a16";; esac; }
domain_id()   { case "$1" in DevOps) echo "f9b2cc13";; Core) echo "ce8a9745";; Backend) echo "b5a2cdae";; Frontend) echo "712936d5";; QA) echo "03be41e2";; esac; }

step() { echo; echo "==> $*"; }
ok()   { echo "    ✓ $*"; }
err()  { echo "    ✗ $*" >&2; exit 1; }

# ── Argument parsing ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --epic-title)       EPIC_TITLE="$2"; shift 2 ;;
    --epic-body)        EPIC_BODY="$2"; shift 2 ;;
    --repo)             REPO="$2"; shift 2 ;;
    --sub-issues-json)  SUB_ISSUES_JSON="$2"; shift 2 ;;
    --project-owner)    PROJECT_OWNER="$2"; shift 2 ;;
    --project-number)   PROJECT_NUMBER="$2"; shift 2 ;;
    *) err "Unknown argument: $1" ;;
  esac
done

[[ -z "$EPIC_TITLE" ]] && err "--epic-title is required"
[[ -z "$REPO" ]]       && err "--repo is required"
[[ -z "$SUB_ISSUES_JSON" ]] && err "--sub-issues-json is required"

# ── Validate gh auth ─────────────────────────────────────────────────────────
step "Checking gh authentication..."
gh auth status 2>/dev/null || err "gh CLI not authenticated. Run: gh auth login"
ok "Authenticated"

# ── Write sub-issues JSON to tmp file for jq processing ─────────────────────
TMP_JSON=$(mktemp)
echo "$SUB_ISSUES_JSON" > "$TMP_JSON"
COUNT=$(jq 'length' "$TMP_JSON")
ok "$COUNT sub-issue(s) found"

# ── Create Epic ──────────────────────────────────────────────────────────────
step "Creating Epic: $EPIC_TITLE"
if [[ -z "$EPIC_BODY" ]]; then
  EPIC_BODY="**Objective/Business Value:**\n_To be defined._\n\n**Scope & Non-Goals:**\n- Included: TBD\n- Excluded: TBD\n\n**Rollback Strategy:**\nRevert the feature branch.\n\n### Epic Tracker\n_Sub-issues will be listed here after creation._"
fi

EPIC_URL=$(gh issue create --repo "$REPO" --title "$EPIC_TITLE" --body "$EPIC_BODY" --assignee "$PROJECT_OWNER" 2>&1) || \
EPIC_URL=$(gh issue create --repo "$REPO" --title "$EPIC_TITLE" --body "$EPIC_BODY" --assignee "$PROJECT_OWNER")
EPIC_NUMBER="${EPIC_URL##*/}"
ok "Epic created: #$EPIC_NUMBER"

EPIC_NODE_ID=$(gh issue view "$EPIC_NUMBER" --repo "$REPO" --json id --jq '.id')
ok "Epic node ID: $EPIC_NODE_ID"

EPIC_ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" \
  --url "https://github.com/$REPO/issues/$EPIC_NUMBER" --format json | jq -r '.id')
ok "Epic added to board: $EPIC_ITEM_ID"

# ── Create sub-issues and link ───────────────────────────────────────────────
step "Creating and linking $COUNT sub-issue(s)..."
CHECKLIST=""

MUTATION='mutation addSub($epic: ID!, $sub: ID!) { addSubIssue(input: {issueId: $epic, subIssueId: $sub}) { clientMutationId } }'

for i in $(seq 0 $((COUNT - 1))); do
  TITLE=$(jq -r ".[$i].title" "$TMP_JSON")
  BODY=$(jq -r ".[$i].body" "$TMP_JSON")
  DOMAIN=$(jq -r ".[$i].domain" "$TMP_JSON")
  PRIORITY=$(jq -r ".[$i].priority" "$TMP_JSON")
  SIZE=$(jq -r ".[$i].size" "$TMP_JSON")
  ESTIMATE=$(jq -r ".[$i].estimate" "$TMP_JSON")
  START=$(jq -r ".[$i].start" "$TMP_JSON")
  END=$(jq -r ".[$i].end" "$TMP_JSON")
  STATUS=$(jq -r ".[$i].status" "$TMP_JSON")

  echo "    Creating: $TITLE"
  SUB_URL=$(gh issue create --repo "$REPO" --title "$TITLE" --body "$BODY" --assignee "$PROJECT_OWNER")
  SUB_NUMBER="${SUB_URL##*/}"
  SUB_NODE_ID=$(gh issue view "$SUB_NUMBER" --repo "$REPO" --json id --jq '.id')
  ok "#$SUB_NUMBER created"

  # Link to Epic
  gh api graphql -f query="$MUTATION" -f epic="$EPIC_NODE_ID" -f sub="$SUB_NODE_ID" >/dev/null 2>&1 \
    && ok "#$SUB_NUMBER linked to Epic" \
    || echo "    ⚠ Could not link #$SUB_NUMBER (non-fatal)"

  # Add to board
  ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" \
    --url "https://github.com/$REPO/issues/$SUB_NUMBER" --format json | jq -r '.id')

  # Populate fields
  SID=$(status_id "$STATUS");   [[ -n "$SID" ]] && gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$F_STATUS" --single-select-option-id "$SID" >/dev/null
  PID=$(priority_id "$PRIORITY"); [[ -n "$PID" ]] && gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$F_PRIORITY" --single-select-option-id "$PID" >/dev/null
  SZID=$(size_id "$SIZE");      [[ -n "$SZID" ]] && gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$F_SIZE" --single-select-option-id "$SZID" >/dev/null
  DID=$(domain_id "$DOMAIN");   [[ -n "$DID" ]] && gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$F_DOMAIN" --single-select-option-id "$DID" >/dev/null
  [[ -n "$ESTIMATE" && "$ESTIMATE" != "null" ]] && gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$F_ESTIMATE" --number "$ESTIMATE" >/dev/null
  [[ -n "$START" && "$START" != "null" ]] && gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$F_START" --date "$START" >/dev/null
  [[ -n "$END" && "$END" != "null" ]] && gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$F_END" --date "$END" >/dev/null

  ok "#$SUB_NUMBER board fields set"
  CHECKLIST="$CHECKLIST\n- [ ] #$SUB_NUMBER — $TITLE"
done

# ── Update Epic checklist ────────────────────────────────────────────────────
step "Updating Epic checklist..."
NEW_BODY="$EPIC_BODY\n\n### Epic Tracker$CHECKLIST"
gh issue edit "$EPIC_NUMBER" --repo "$REPO" --body "$(printf '%b' "$NEW_BODY")" >/dev/null
ok "Epic #$EPIC_NUMBER checklist updated"

# ── Cleanup & Summary ────────────────────────────────────────────────────────
rm -f "$TMP_JSON"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Project tracker initialized successfully!"
echo "  Epic        : #$EPIC_NUMBER — $EPIC_TITLE"
echo "  Board       : https://github.com/users/$PROJECT_OWNER/projects/$PROJECT_NUMBER/views/1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
