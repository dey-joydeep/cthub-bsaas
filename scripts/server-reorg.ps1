param(
    [switch]$NoGitCommit
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "[STEP] $msg" -ForegroundColor Cyan }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Gray }
function Write-Ok($msg)   { Write-Host "[OK]  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

function Update-JsonFile {
    param(
        [Parameter(Mandatory)] [string]$Path,
        [Parameter(Mandatory)] [ScriptBlock]$Updater
    )
    if (!(Test-Path $Path)) { Write-Warn "Missing file: $Path"; return }
    $json = Get-Content -Raw -Path $Path | ConvertFrom-Json -Depth 50
    & $Updater -json ([ref]$json)
    ($json | ConvertTo-Json -Depth 50) | Set-Content -Path $Path -Encoding UTF8
    Write-Ok "Updated: $Path"
}

# 1) Ensure libs/server exists
Write-Step "Ensure libs/server exists"
New-Item -ItemType Directory -Force -Path "libs/server" | Out-Null

# 2) Move libraries using git mv to preserve history
$moves = @(
    @{ From = 'libs/core';        To = 'libs/server/core' },
    @{ From = 'libs/data-access'; To = 'libs/server/data-access' },
    @{ From = 'libs/features';    To = 'libs/server/features' }
)

foreach ($m in $moves) {
    if (Test-Path $m.From) {
        Write-Step "git mv $($m.From) $($m.To)"
        git mv $m.From $m.To
        Write-Ok "Moved: $($m.From) -> $($m.To)"
    } else {
        Write-Info "Already moved or not present: $($m.From)"
    }
}

# 3) Patch project.json files with new sourceRoot, tsconfig, main
Write-Step "Patch project.json files"

# core
Update-JsonFile -Path "libs/server/core/project.json" -Updater {
    param([ref]$json)
    if ($json.Value.sourceRoot) { $json.Value.sourceRoot = 'libs/server/core/src' }
    if ($json.Value.targets.build.options.tsConfig) { $json.Value.targets.build.options.tsConfig = 'libs/server/core/tsconfig.lib.json' }
    if ($json.Value.targets.build.options.main) {
        # Ensure core uses absolute main path
        $json.Value.targets.build.options.main = 'libs/server/core/src/index.ts'
    }
}

# data-access
Update-JsonFile -Path "libs/server/data-access/project.json" -Updater {
    param([ref]$json)
    if ($json.Value.sourceRoot) { $json.Value.sourceRoot = 'libs/server/data-access/src' }
    if ($json.Value.targets.build.options.tsConfig) { $json.Value.targets.build.options.tsConfig = 'libs/server/data-access/tsconfig.lib.json' }
    # Keep "main": "src/index.ts" if present; if absolute, rewrite
    if ($json.Value.targets.build.options.main -and ($json.Value.targets.build.options.main -is [string])) {
        $main = $json.Value.targets.build.options.main
        if ($main -like 'libs/*') { $json.Value.targets.build.options.main = 'libs/server/data-access/src/index.ts' }
    }
}

# features
Update-JsonFile -Path "libs/server/features/project.json" -Updater {
    param([ref]$json)
    if ($json.Value.sourceRoot) { $json.Value.sourceRoot = 'libs/server/features/src' }
    if ($json.Value.targets.build.options.tsConfig) { $json.Value.targets.build.options.tsConfig = 'libs/server/features/tsconfig.lib.json' }
    if ($json.Value.targets.build.options.main) { $json.Value.targets.build.options.main = 'libs/server/features/src/index.ts' }
}

# 4) Patch tsconfig.lib.json extends and outDir for each lib
Write-Step "Patch tsconfig.lib.json files"

function Fix-TsconfigLib($path) {
    Update-JsonFile -Path $path -Updater {
        param([ref]$json)
        # Fix extends from ../../ to ../../../ after move
        if ($json.Value.extends -is [string]) {
            $json.Value.extends = $json.Value.extends -replace '^\.\./\.\./', '../../../'
        }
        # Adjust outDir one level up if it starts with ../../
        if ($json.Value.compilerOptions.outDir -is [string]) {
            $json.Value.compilerOptions.outDir = $json.Value.compilerOptions.outDir -replace '^\.\./\.\./', '../../../'
        }
    }
}

Fix-TsconfigLib "libs/server/core/tsconfig.lib.json"
Fix-TsconfigLib "libs/server/data-access/tsconfig.lib.json"
Fix-TsconfigLib "libs/server/features/tsconfig.lib.json"

# 5) Update root tsconfig.base.json legacy aliases to new locations
Write-Step "Update tsconfig.base.json aliases (@cthub-bsaas/core, @cthub-bsaas/data-access)"
Update-JsonFile -Path "tsconfig.base.json" -Updater {
    param([ref]$json)
    $paths = $json.Value.compilerOptions.paths
    if ($paths.'@cthub-bsaas/core') { $paths.'@cthub-bsaas/core' = @('libs/server/core/src/index.ts') }
    if ($paths.'@cthub-bsaas/core/*') { $paths.'@cthub-bsaas/core/*' = @('libs/server/core/src/*') }
    if ($paths.'@cthub-bsaas/data-access') { $paths.'@cthub-bsaas/data-access' = @('libs/server/data-access/src/index.ts') }
    if ($paths.'@cthub-bsaas/data-access/*') { $paths.'@cthub-bsaas/data-access/*' = @('libs/server/data-access/src/*') }
}

# 6) Final git status and optional commit
Write-Step "git status"
cmd /c git status -s

if (-not $NoGitCommit) {
    Write-Step "Create commit"
    git add -A
    git commit -m "chore(server): reorganize server libs under libs/server (core, data-access, features); update project configs and tsconfig paths"
    Write-Ok "Commit created"
} else {
    Write-Info "No commit per --NoGitCommit"
}

Write-Ok "Reorganization completed. Recommended: nx reset; nx affected --target=lint,type-check,build"
