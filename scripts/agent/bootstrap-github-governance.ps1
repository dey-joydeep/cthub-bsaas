param(
  [string]$Repo,
  [string]$ProjectTitle = "CTHub BSAAS Execution",
  [switch]$CreateProject
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

function Ensure-Label {
  param(
    [Parameter(Mandatory = $true)] [string]$Name,
    [Parameter(Mandatory = $true)] [string]$Color,
    [Parameter(Mandatory = $true)] [string]$Description
  )

  $jq = ".[] | select(.name == `"$Name`") | .name"
  $existing = Invoke-Gh label list --repo $Repo --json name --jq $jq

  if ([string]::IsNullOrWhiteSpace(($existing -join "`n"))) {
    Invoke-Gh label create $Name --repo $Repo --color $Color --description $Description | Out-Null
    Write-Host "Created label: $Name"
  } else {
    Write-Host "Label exists: $Name"
  }
}

if ([string]::IsNullOrWhiteSpace($Repo)) {
  $Repo = (Invoke-Gh repo view --json nameWithOwner --jq .nameWithOwner) -join ""
}

Invoke-Gh auth status | Out-Null

$labels = @(
  @{ Name = "status:triage"; Color = "D4C5F9"; Description = "Needs review before execution" },
  @{ Name = "status:ready-ai"; Color = "0E8A16"; Description = "Ready for AI agent execution" },
  @{ Name = "status:in-progress"; Color = "1D76DB"; Description = "Work has started" },
  @{ Name = "status:blocked"; Color = "B60205"; Description = "Blocked; agents must not start" },
  @{ Name = "status:review"; Color = "FBCA04"; Description = "Ready for human review" },
  @{ Name = "status:done"; Color = "5319E7"; Description = "Completed" },

  @{ Name = "agent:codex"; Color = "5319E7"; Description = "Owned by Codex" },
  @{ Name = "agent:antigravity"; Color = "1D76DB"; Description = "Owned by Antigravity" },
  @{ Name = "agent:human"; Color = "C2E0C6"; Description = "Owned by human developer" },

  @{ Name = "type:feature"; Color = "0E8A16"; Description = "New capability" },
  @{ Name = "type:bug"; Color = "D73A4A"; Description = "Defect or regression" },
  @{ Name = "type:chore"; Color = "C5DEF5"; Description = "Tooling, config, maintenance, or dependency work" },
  @{ Name = "type:refactor"; Color = "BFDADC"; Description = "Internal improvement without intended behavior change" },
  @{ Name = "type:design"; Color = "FBCA04"; Description = "HLD, LLD, ADR, or technical planning" },
  @{ Name = "type:spike"; Color = "F9D0C4"; Description = "Time-boxed investigation" },

  @{ Name = "area:server"; Color = "5319E7"; Description = "Backend or server libraries" },
  @{ Name = "area:web-admin"; Color = "1D76DB"; Description = "Admin frontend" },
  @{ Name = "area:web-partner"; Color = "1D76DB"; Description = "Partner frontend" },
  @{ Name = "area:web-customer"; Color = "1D76DB"; Description = "Customer frontend" },
  @{ Name = "area:shared"; Color = "C5DEF5"; Description = "Shared library or cross-app code" },
  @{ Name = "area:infra"; Color = "BFD4F2"; Description = "CI, tooling, repository, or infrastructure" },
  @{ Name = "area:docs"; Color = "0075CA"; Description = "Documentation" },

  @{ Name = "priority:p0"; Color = "B60205"; Description = "Critical" },
  @{ Name = "priority:p1"; Color = "D93F0B"; Description = "High" },
  @{ Name = "priority:p2"; Color = "FBCA04"; Description = "Normal" },
  @{ Name = "priority:p3"; Color = "C2E0C6"; Description = "Low" },

  @{ Name = "needs:hld"; Color = "FBCA04"; Description = "Requires HLD update or review" },
  @{ Name = "needs:lld"; Color = "FBCA04"; Description = "Requires LLD update or review" },
  @{ Name = "needs:test"; Color = "D4C5F9"; Description = "Requires test coverage or test evidence" },
  @{ Name = "needs:migration"; Color = "F9D0C4"; Description = "Requires DB/schema/data migration consideration" },
  @{ Name = "needs:security-review"; Color = "B60205"; Description = "Requires security/auth/privacy review" }
)

foreach ($label in $labels) {
  Ensure-Label -Name $label.Name -Color $label.Color -Description $label.Description
}

if ($CreateProject) {
  $owner = (Invoke-Gh api user --jq .login) -join ""
  Invoke-Gh auth refresh -s project | Out-Null
  Invoke-Gh project create --owner $owner --title $ProjectTitle | Out-Null
  Write-Host "Created project: $ProjectTitle"
}

Write-Host "GitHub governance bootstrap completed for $Repo"
