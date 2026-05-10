param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-Dir($path) {
  if (-not (Test-Path $path)) { New-Item -ItemType Directory -Force -Path $path | Out-Null }
}

function Move-IfExists($src, $dst) {
  if (Test-Path $src) {
    Ensure-Dir (Split-Path -Parent $dst)
    git mv $src $dst | Out-Null
    Write-Host "Moved: $src -> $dst"
  } else {
    Write-Host "Skip (missing): $src"
  }
}

# Target structure roots
$uiRoot = "libs/web/ui/src"
$libRoot = Join-Path $uiRoot 'lib'
Ensure-Dir $libRoot
Ensure-Dir (Join-Path $libRoot 'header')
Ensure-Dir (Join-Path $libRoot 'layout')
Ensure-Dir (Join-Path $libRoot 'dialog/confirm-dialog')
Ensure-Dir (Join-Path $libRoot 'enums')
Ensure-Dir (Join-Path $libRoot 'models')

# 1) Move Header component from separate lib into unified ui lib
$headerSrcDir = "libs/web/ui/header/src/lib/header"
Move-IfExists (Join-Path $headerSrcDir 'header.component.ts') (Join-Path $libRoot 'header/header.component.ts')
Move-IfExists (Join-Path $headerSrcDir 'header.component.html') (Join-Path $libRoot 'header/header.component.html')
Move-IfExists (Join-Path $headerSrcDir 'header.component.scss') (Join-Path $libRoot 'header/header.component.scss')

# 2) Move Layout component from separate lib into unified ui lib
$layoutSrcDir1 = "libs/web/ui/layout/src/lib/layout"
$layoutSrcDir2 = "libs/web/ui/layout/src/lib/shell" # fallback if still present
$layoutFrom = if (Test-Path $layoutSrcDir1) { $layoutSrcDir1 } elseif (Test-Path $layoutSrcDir2) { $layoutSrcDir2 } else { $null }
if ($layoutFrom) {
  Move-IfExists (Join-Path $layoutFrom 'layout.component.ts') (Join-Path $libRoot 'layout/layout.component.ts')
  Move-IfExists (Join-Path $layoutFrom 'layout.component.html') (Join-Path $libRoot 'layout/layout.component.html')
  Move-IfExists (Join-Path $layoutFrom 'layout.component.scss') (Join-Path $libRoot 'layout/layout.component.scss')
} else {
  Write-Host 'Skip (missing): layout source directory'
}

# 3) Move Confirm Dialog from components -> lib/dialog/confirm-dialog
$confirmSrc = "libs/web/ui/src/components/confirm-dialog"
Move-IfExists (Join-Path $confirmSrc 'confirm-dialog.component.ts') (Join-Path $libRoot 'dialog/confirm-dialog/confirm-dialog.component.ts')
Move-IfExists (Join-Path $confirmSrc 'confirm-dialog.component.html') (Join-Path $libRoot 'dialog/confirm-dialog/confirm-dialog.component.html')
Move-IfExists (Join-Path $confirmSrc 'confirm-dialog.component.scss') (Join-Path $libRoot 'dialog/confirm-dialog/confirm-dialog.component.scss')

# 4) Fix import inside moved layout.component.ts to point to local header
$layoutTs = Join-Path $libRoot 'layout/layout.component.ts'
if (Test-Path $layoutTs) {
  $content = Get-Content $layoutTs -Raw
  $content = $content -replace "from\s+'@cthub-bsaas/web-ui-header'", "from '../header/header.component'"
  $content = $content -replace 'from\s+"@cthub-bsaas/web-ui-header"', "from '../header/header.component'"
  Set-Content -Path $layoutTs -Value $content -NoNewline
  Write-Host 'Updated imports in layout.component.ts'
}

# 5) Clean up barrel exports in libs/web/ui/src/index.ts
$indexPath = Join-Path $uiRoot 'index.ts'
$desiredIndex = @(
  "export * from './lib/header/header.component';",
  "export * from './lib/layout/layout.component';",
  "export * from './lib/dialog/confirm-dialog/confirm-dialog.component';",
  "export * from './lib/enums/enums';",
  "export * from './lib/enums/user-role.enum';",
  "export * from './lib/models/date-range.model';",
  "export * from './lib/models/day-of-week.enum';",
  "export * from './lib/models/location.model';",
  ''
) -join "`r`n"
Set-Content -Path $indexPath -Value $desiredIndex -NoNewline
Write-Host "Rewrote $indexPath"

Write-Host 'Flatten web-ui complete.'
