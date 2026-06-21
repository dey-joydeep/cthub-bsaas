param(
  [Parameter(Mandatory = $true)]
  [int]$Issue,

  [Parameter(Mandatory = $true)]
  [ValidateSet("codex", "antigravity")]
  [string]$Agent,

  [string]$Repo,
  [string]$Base = "main"
)

$ErrorActionPreference = "Stop"

function Invoke-Gh {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  $output = & gh @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "gh $($Arguments -join ' ') failed."
  }

  return $output
}

function Get-LabelNames {
  param([object]$IssueData)
  return @($IssueData.labels | ForEach-Object { $_.name })
}

if ([string]::IsNullOrWhiteSpace($Repo)) {
  $Repo = (Invoke-Gh repo view --json nameWithOwner --jq .nameWithOwner) -join ""
}

Invoke-Gh auth status | Out-Null

$status = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace(($status -join "`n"))) {
  throw "Working tree is dirty. Commit, stash, or discard local changes before starting a new agent task."
}

$issueJson = (Invoke-Gh issue view $Issue --repo $Repo --json number,title,state,labels,body,url) -join "`n"
$issueData = $issueJson | ConvertFrom-Json

if ($issueData.state -ne "OPEN") {
  throw "Issue #$Issue is not open."
}

$labels = Get-LabelNames -IssueData $issueData

if ($labels -contains "status:blocked") {
  throw "Issue #$Issue is blocked. Agent must not start."
}

if (-not ($labels -contains "status:ready-ai")) {
  throw "Issue #$Issue is not marked status:ready-ai."
}

if ($issueData.body -notmatch "Acceptance Criteria") {
  throw "Issue #$Issue lacks Acceptance Criteria."
}

if ($issueData.body -notmatch "Test Plan") {
  throw "Issue #$Issue lacks Test Plan."
}

$slug = ($issueData.title -replace "[^a-zA-Z0-9]+", "-").Trim("-").ToLowerInvariant()
if ($slug.Length -gt 40) {
  $slug = $slug.Substring(0, 40).Trim("-")
}

$branch = "$Agent/$Issue-$slug"

Invoke-Gh issue comment $Issue --repo $Repo --body "Claimed by $Agent. Branch: $branch. Scope confirmed from issue body." | Out-Null
Invoke-Gh issue edit $Issue --repo $Repo --add-label "agent:$Agent" --add-label "status:in-progress" --remove-label "status:ready-ai" | Out-Null

git fetch origin $Base
if ($LASTEXITCODE -ne 0) {
  throw "git fetch origin $Base failed."
}

git checkout -b $branch "origin/$Base"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to create branch $branch from origin/$Base."
}

Write-Host "Ready for $Agent on issue #$Issue"
Write-Host "Branch: $branch"
Write-Host "Issue: $($issueData.url)"
