#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Initializes a GitHub Epic + sub-issues and populates the project board.

.DESCRIPTION
  1. Creates the parent Epic issue.
  2. Creates each sub-issue.
  3. Links sub-issues to the Epic via GitHub GraphQL addSubIssue mutation.
  4. Adds all items to projects/1.
  5. Populates all custom fields (Status, Priority, Size, Estimate, Domain,
     Start date, End date).
  6. Updates the Epic body checklist with real issue numbers.
  7. Assigns dey-joydeep to all issues.

.PARAMETER EpicTitle
  Title of the parent Epic issue.

.PARAMETER EpicBody
  Markdown body for the Epic. Use the template from SKILL.md.

.PARAMETER Repo
  owner/repo slug, e.g. "dey-joydeep/cthub-bsaas".

.PARAMETER SubIssuesJson
  JSON array of sub-issue objects. Each object must have:
    title, body, domain, priority, size, estimate, start, end, status

.PARAMETER ProjectOwner
  GitHub login that owns the project board. Default: dey-joydeep.

.PARAMETER ProjectNumber
  GitHub project number. Default: 1.

.EXAMPLE
  $subs = '[{"title":"Phase 1","body":"...","domain":"DevOps","priority":"P0","size":"M","estimate":3,"start":"2026-07-01","end":"2026-07-05","status":"Backlog"}]'
  ./init-tracker.ps1 -EpicTitle "[EPIC] My Feature" -Repo "dey-joydeep/cthub-bsaas" -SubIssuesJson $subs
#>
param(
    [Parameter(Mandatory)][string]$EpicTitle,
    [Parameter(Mandatory)][string]$Repo,
    [Parameter(Mandatory)][string]$SubIssuesJson,
    [string]$EpicBody = "",
    [string]$ProjectOwner = "dey-joydeep",
    [int]$ProjectNumber = 1
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Hardcoded field & option IDs for projects/1 ────────────────────────────
$PROJ_ID      = "PVT_kwHOALP8fs4BCwcr"

$F_STATUS     = "PVTSSF_lAHOALP8fs4BCwcrzg04ApY"
$STATUS_MAP   = @{ Backlog="f75ad846"; Ready="08afe404"; "In progress"="47fc9ee4"; "In review"="4cc61d42"; Done="98236657" }

$F_PRIORITY   = "PVTSSF_lAHOALP8fs4BCwcrzg04A1A"
$PRIORITY_MAP = @{ P0="79628723"; P1="0a877460"; P2="da944a9c" }

$F_SIZE       = "PVTSSF_lAHOALP8fs4BCwcrzg04A1E"
$SIZE_MAP     = @{ XS="eff732af"; S="9592a5a3"; M="9728cbdc"; L="c53df028"; XL="7b141a16" }

$F_ESTIMATE   = "PVTF_lAHOALP8fs4BCwcrzg04A1I"
$F_START      = "PVTF_lAHOALP8fs4BCwcrzg04A1Q"
$F_END        = "PVTF_lAHOALP8fs4BCwcrzg04A1U"

$F_DOMAIN     = "PVTSSF_lAHOALP8fs4BCwcrzhWdrWU"
$DOMAIN_MAP   = @{ DevOps="f9b2cc13"; Core="ce8a9745"; Backend="b5a2cdae"; Frontend="712936d5"; QA="03be41e2" }
# ───────────────────────────────────────────────────────────────────────────

$ASSIGNEE = $ProjectOwner

function Write-Step([string]$msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg)   { Write-Host "    ✓ $msg" -ForegroundColor Green }
function Write-Err([string]$msg)  { Write-Host "    ✗ $msg" -ForegroundColor Red; exit 1 }

# ── Validate gh auth ────────────────────────────────────────────────────────
Write-Step "Checking gh authentication..."
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) { Write-Err "gh CLI not authenticated. Run: gh auth login" }
if (-not ($authStatus -match "project")) {
    Write-Host "    ⚠ 'project' scope may be missing. Running: gh auth refresh -s project" -ForegroundColor Yellow
    gh auth refresh -s project
}
Write-Ok "Authenticated"

# ── Parse sub-issues ────────────────────────────────────────────────────────
Write-Step "Parsing sub-issues..."
$subs = $SubIssuesJson | ConvertFrom-Json
Write-Ok "$($subs.Count) sub-issue(s) found"

# ── Create Epic issue ───────────────────────────────────────────────────────
Write-Step "Creating Epic: $EpicTitle"
if (-not $EpicBody) {
    $EpicBody = "**Objective/Business Value:**`n_To be defined._`n`n**Scope & Non-Goals:**`n- Included: TBD`n- Excluded: TBD`n`n**Rollback Strategy:**`nRevert the feature branch.`n`n### Epic Tracker`n_Sub-issues will be listed here after creation._"
}
$epicNum = gh issue create --repo $Repo --title $EpicTitle --body $EpicBody --assignee $ASSIGNEE --label "epic" 2>&1
if ($LASTEXITCODE -ne 0) {
    # label might not exist - retry without label
    $epicNum = gh issue create --repo $Repo --title $EpicTitle --body $EpicBody --assignee $ASSIGNEE 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Err "Failed to create Epic: $epicNum" }
}
# extract number from URL
$epicNumber = ($epicNum -split "/")[-1].Trim()
Write-Ok "Epic created: #$epicNumber ($epicNum)"

# get Epic node ID
$epicNodeId = (gh issue view $epicNumber --repo $Repo --json id | ConvertFrom-Json).id
Write-Ok "Epic node ID: $epicNodeId"

# Add Epic to project board
$epicItemId = (gh project item-add $ProjectNumber --owner $ProjectOwner --url "https://github.com/$Repo/issues/$epicNumber" --format json | ConvertFrom-Json).id
Write-Ok "Epic added to board, item ID: $epicItemId"

# ── Create sub-issues ───────────────────────────────────────────────────────
Write-Step "Creating $($subs.Count) sub-issue(s)..."
$createdSubs = @()

foreach ($sub in $subs) {
    Write-Host "    Creating: $($sub.title)"
    $subUrl = gh issue create --repo $Repo --title $sub.title --body $sub.body --assignee $ASSIGNEE 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Err "Failed to create sub-issue '$($sub.title)': $subUrl" }
    $subNumber = ($subUrl -split "/")[-1].Trim()
    $subNodeId  = (gh issue view $subNumber --repo $Repo --json id | ConvertFrom-Json).id

    $createdSubs += @{
        number = $subNumber
        nodeId = $subNodeId
        meta   = $sub
    }
    Write-Ok "#$subNumber created (node: $subNodeId)"
}

# ── Link sub-issues to Epic via GraphQL addSubIssue ─────────────────────────
Write-Step "Linking sub-issues to Epic #$epicNumber via GraphQL..."

$mutation = @"
mutation addSub(`$epic: ID!, `$sub: ID!) {
  addSubIssue(input: {issueId: `$epic, subIssueId: `$sub}) {
    clientMutationId
  }
}
"@

foreach ($s in $createdSubs) {
    $result = gh api graphql -f query=$mutation -f epic=$epicNodeId -f sub=$s.nodeId 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Host "    ⚠ Could not link #$($s.number): $result" -ForegroundColor Yellow }
    else { Write-Ok "#$($s.number) linked to Epic" }
}

# ── Update Epic body with checklist ─────────────────────────────────────────
Write-Step "Updating Epic checklist..."
$checklist = ($createdSubs | ForEach-Object { "- [ ] #$($_.number) — $($_.meta.title)" }) -join "`n"
$newBody = $EpicBody -replace "### Epic Tracker.*$", "### Epic Tracker`n$checklist"
gh issue edit $epicNumber --repo $Repo --body $newBody *>$null
Write-Ok "Epic body updated with sub-issue checklist"

# ── Add sub-issues to project board and populate fields ─────────────────────
Write-Step "Populating project board fields for all sub-issues..."

foreach ($s in $createdSubs) {
    $m = $s.meta
    Write-Host "    Configuring board for #$($s.number)..."

    # Add to board
    $itemId = (gh project item-add $ProjectNumber --owner $ProjectOwner --url "https://github.com/$Repo/issues/$($s.number)" --format json | ConvertFrom-Json).id

    # Status
    $statusId = $STATUS_MAP[$m.status]
    if ($statusId) {
        gh project item-edit --id $itemId --project-id $PROJ_ID --field-id $F_STATUS --single-select-option-id $statusId *>$null
    }

    # Priority
    $prioId = $PRIORITY_MAP[$m.priority]
    if ($prioId) {
        gh project item-edit --id $itemId --project-id $PROJ_ID --field-id $F_PRIORITY --single-select-option-id $prioId *>$null
    }

    # Size
    $sizeId = $SIZE_MAP[$m.size]
    if ($sizeId) {
        gh project item-edit --id $itemId --project-id $PROJ_ID --field-id $F_SIZE --single-select-option-id $sizeId *>$null
    }

    # Estimate
    if ($m.estimate) {
        gh project item-edit --id $itemId --project-id $PROJ_ID --field-id $F_ESTIMATE --number $m.estimate *>$null
    }

    # Domain
    $domainId = $DOMAIN_MAP[$m.domain]
    if ($domainId) {
        gh project item-edit --id $itemId --project-id $PROJ_ID --field-id $F_DOMAIN --single-select-option-id $domainId *>$null
    }

    # Start date
    if ($m.start) {
        gh project item-edit --id $itemId --project-id $PROJ_ID --field-id $F_START --date $m.start *>$null
    }

    # End date
    if ($m.end) {
        gh project item-edit --id $itemId --project-id $PROJ_ID --field-id $F_END --date $m.end *>$null
    }

    Write-Ok "#$($s.number) board fields set"
}

# ── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  Project tracker initialized successfully!" -ForegroundColor Green
Write-Host "  Epic        : #$epicNumber — $EpicTitle" -ForegroundColor Green
Write-Host "  Sub-issues  : $($createdSubs | ForEach-Object { '#' + $_.number }) " -ForegroundColor Green
Write-Host "  Board       : https://github.com/users/$ProjectOwner/projects/$ProjectNumber/views/1" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
