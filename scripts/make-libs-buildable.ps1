<#
Make all libraries buildable (incremental & idempotent)

Usage:
  pwsh ./scripts/make-libs-buildable.ps1 [-All|-a] [-Build] [-CleanDist] [-DryRun] [-Help|-h|--help]

Switches:
  -All, -a       Patch all libs and then build everything (implies -Build and -CleanDist).
  -Build         After patching, run "nx run-many -t build --all --output-style=stream".
  -CleanDist     Remove the "dist" folder before building (auto on with -All).
  -DryRun        Show what would change; do not write files or run installs/builds.
  -Help, -h      Show this help (also accepts --help).

Notes:
  - Web libs are detected via tag "platform:web".
  - Server/other libs use @nx/js:tsc (script installs @nx/js if missing).
  - Never overwrites existing files; only creates missing ones.
#>

[CmdletBinding(PositionalBinding = $false)]
param(
    [Alias('a')] [switch]$All,
    [switch]$Build,
    [switch]$CleanDist,
    [switch]$DryRun,
    [Alias('h')] [switch]$Help,
    # Capture unknown tokens like `--help` so PowerShell doesn't error before we handle it.
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$__Rest
)

# Accept GNU-style --help
if ($__Rest -contains '--help') { $Help = $true }
if ($Help) {
    $helpText = @"
Make all libraries buildable (incremental & idempotent)

Usage:
  pwsh ./scripts/make-libs-buildable.ps1 [-All|-a] [-Build] [-CleanDist] [-DryRun] [-Help|-h|--help]

Switches:
  -All, -a       Patch all libs and then build everything (implies -Build and -CleanDist).
  -Build         After patching, run "nx run-many -t build --all --output-style=stream".
  -CleanDist     Remove the "dist" folder before building (auto on with -All).
  -DryRun        Show what would change; do not write files or run installs/builds.
  -Help, -h      Show this help (also accepts --help).

Notes:
  - Web libs are detected via tag "platform:web".
  - Server/other libs use @nx/js:tsc (script installs @nx/js if missing).
  - Never overwrites existing files; only creates missing ones.
"@
    Write-Host $helpText
    return
}

Write-Host "== Make libs buildable (web -> @nx/angular:package, server -> @nx/js:tsc) ==" -ForegroundColor Cyan

# If -All: also build & clean dist
if ($All) { $Build = $true; $CleanDist = $true }

function Read-Json([string]$path) { Get-Content -Raw -LiteralPath $path | ConvertFrom-Json }
function Write-Json([string]$path, $obj) {
    if ($DryRun) { return }
    $obj | ConvertTo-Json -Depth 100 | Set-Content -Encoding UTF8 -LiteralPath $path
}
function Ensure-Dir([string]$path) {
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
}
function Ensure-File([string]$path, [string]$content) {
    if (-not (Test-Path $path)) {
        if ($DryRun) { Write-Host "  (+) would create: $path" -ForegroundColor Yellow; return }
        $content | Set-Content -Encoding UTF8 -LiteralPath $path
        Write-Host "  (+) created: $path" -ForegroundColor Green
    }
}
function Has-Prop($o, $name) { $o -and ($o.PSObject.Properties.Name -contains $name) }
function Ensure-Prop($o, $name, $default) {
    if (-not (Has-Prop $o $name)) { $o | Add-Member -Name $name -MemberType NoteProperty -Value $default }
    return $o.PSObject.Properties[$name].Value
}
function Ensure-NxJs() {
    $out = (npm ls @nx/js --depth=0 2>$null)
    if ($LASTEXITCODE -ne 0 -or $out -match "empty") {
        Write-Host "Installing @nx/js (needed for @nx/js:tsc)..." -ForegroundColor Yellow
        if (-not $DryRun) { npm i -D @nx/js@^21 | Out-Null }
    }
}

# Extra assets per-lib (repo-relative prefix -> glob array)
$extraAssets = @{
    "libs/data-access"   = @("prisma/**/*", "src/**/*.proto");
    "libs/web/core/http" = @("src/lib/i18n/**/*.json")
}

# Collect library project.json files
$projects = Get-ChildItem -Recurse -Path libs -Filter project.json | ForEach-Object { $_.FullName }
if ($projects.Count -eq 0) { Write-Host "No libs/*/project.json found." -ForegroundColor Yellow; return }

$repoAbs = (Resolve-Path (Get-Location)).Path
$webCount = 0; $serverCount = 0; $patched = 0; $skipped = 0

foreach ($projFile in $projects) {
    $proj = Read-Json $projFile
    if ($proj.projectType -ne "library") { $skipped++; continue }

    $libRoot = Split-Path -Parent $projFile
    $rootAbs = (Resolve-Path $libRoot).Path
    $rootRel = ($rootAbs.Substring($repoAbs.Length).TrimStart('\')).Replace('\', '/')

    $targets = Ensure-Prop $proj 'targets' (@{})
    $hasBuild = Has-Prop $targets 'build'

    $tags = @()
    if (Has-Prop $proj "tags" -and $proj.tags) { $tags = @($proj.tags) }

    $isWeb = $tags -contains "platform:web"
    $isServer = -not $isWeb

    # Compute relative path to tsconfig.base.json
    $depth = ($rootRel -split '/').Count
    $relBase = ('../' * $depth)

    if ($isWeb) {
        $webCount++
        if ($hasBuild) {
            Write-Host "WEB lib (build exists): $($proj.name) ($rootRel)" -ForegroundColor DarkGray
            continue
        }

        # Ensure packaging files
        $srcDir = Join-Path $libRoot "src"
        $indexFile = Join-Path $srcDir "index.ts"
        $tsconfigLib = Join-Path $libRoot "tsconfig.lib.json"
        $ngPackage = Join-Path $libRoot "ng-package.json"

        Ensure-Dir $srcDir
        Ensure-File $indexFile ("// Public API for {0}`nexport * from './lib';" -f $proj.name)

        if (-not (Test-Path $tsconfigLib)) {
            $content = @"
{
  "extends": "${relBase}tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "emitDecoratorMetadata": false
  },
  "exclude": ["src/test-setup.ts", "**/*.spec.ts"]
}
"@
            if ($DryRun) { Write-Host "  (+) would create: $tsconfigLib" -ForegroundColor Yellow }
            else { $content | Set-Content -Encoding UTF8 $tsconfigLib; Write-Host "  (+) created: $tsconfigLib" -ForegroundColor Green }
        }

        Ensure-File $ngPackage @"
{
  "$schema": "node_modules/ng-packagr/ng-package.schema.json",
  "lib": { "entryFile": "src/index.ts" }
}
"@

        # Build target (create property first, then set)
        $null = Ensure-Prop $targets 'build' (@{})
        $targets.build = @{
            executor = "@nx/angular:package";
            outputs  = @("dist/$rootRel");
            options  = @{
                tsConfig   = "$rootRel/tsconfig.lib.json";
                project    = "$rootRel/ng-package.json";
                outputPath = "dist/$rootRel";
            }
        }

        Write-Host "WEB lib (patched build): $($proj.name) ($rootRel) -> @nx/angular:package" -ForegroundColor Green
        Write-Json $projFile $proj
        $patched++
        continue
    }

    # Server / other libs
    $serverCount++
    if ($hasBuild) {
        Write-Host "SERVER lib (build exists): $($proj.name) ($rootRel)" -ForegroundColor DarkGray
        continue
    }

    Ensure-NxJs

    $tsconfigLib = Join-Path $libRoot "tsconfig.lib.json"
    if (-not (Test-Path $tsconfigLib)) {
        $content = @"
{
  "extends": "${relBase}tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "emitDecoratorMetadata": false
  },
  "exclude": ["**/*.spec.ts", "**/*.test.ts"]
}
"@
        if ($DryRun) { Write-Host "  (+) would create: $tsconfigLib" -ForegroundColor Yellow }
        else { $content | Set-Content -Encoding UTF8 $tsconfigLib; Write-Host "  (+) created: $tsconfigLib" -ForegroundColor Green }
    }

    # Asset patterns if configured
    $assets = @()
    foreach ($key in $extraAssets.Keys) {
        if ($rootRel -like "$key*") { $assets += $extraAssets[$key] }
    }

    $null = Ensure-Prop $targets 'build' (@{})
    $targets.build = @{
        executor = "@nx/js:tsc";
        outputs  = @("dist/$rootRel");
        options  = @{
            tsConfig   = "$rootRel/tsconfig.lib.json";
            outputPath = "dist/$rootRel";
            assets     = $assets
        }
    }

    Write-Host "SERVER lib (patched build): $($proj.name) ($rootRel) -> @nx/js:tsc" -ForegroundColor Green
    Write-Json $projFile $proj
    $patched++
}

Write-Host ""
Write-Host ("Summary: Patched={0}, Web={1}, Server={2}, Skipped(non-libs)={3}" -f $patched, $webCount, $serverCount, $skipped) -ForegroundColor Cyan

# Build phase
if ($Build) {
    if ($CleanDist) {
        Write-Host "Cleaning ./dist ..." -ForegroundColor Yellow
        if (-not $DryRun) { Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue }
    }
    Write-Host "Running: npx nx run-many -t build --all --output-style=stream" -ForegroundColor Cyan
    if (-not $DryRun) { npx nx run-many -t build --all --output-style=stream }
}
