$ErrorActionPreference = 'Stop'

# Root to operate on
$root = 'apps/web'

# Collect candidate files
$files = Get-ChildItem -Path $root -Recurse -File -Include *.ts,*.tsx,*.js,*.cjs,*.mjs

# Helper: apply a literal string replacement across all files
function Invoke-LiteralReplace {
    param(
        [Parameter(Mandatory = $true)] [string] $Old,
        [Parameter(Mandatory = $true)] [string] $New
    )
    foreach ($f in $files) {
        $c = Get-Content -LiteralPath $f.FullName -Raw
        $n = $c -replace [regex]::Escape($Old), $New
        if ($n -ne $c) {
            Set-Content -LiteralPath $f.FullName -Value $n
        }
    }
}

# Helper: apply a regex replacement across all files
function Invoke-RegexReplace {
    param(
        [Parameter(Mandatory = $true)] [string] $Pattern,
        [Parameter(Mandatory = $true)] [string] $Replacement
    )
    foreach ($f in $files) {
        $c = Get-Content -LiteralPath $f.FullName -Raw
        $n = [regex]::Replace($c, $Pattern, $Replacement)
        if ($n -ne $c) {
            Set-Content -LiteralPath $f.FullName -Value $n
        }
    }
}

# 1) Specific import path replacements
Invoke-LiteralReplace -Old '@frontend-shared/core/utils/platform-utils' -New '@cthub-bsaas/web-config'
Invoke-LiteralReplace -Old '@frontend-shared/core/services/storage/storage.service' -New '@cthub-bsaas/web-core/http'
Invoke-LiteralReplace -Old '@frontend-shared/core/services/error/error.service' -New '@cthub-bsaas/core'
Invoke-LiteralReplace -Old '@frontend-shared/core/translate/translate-server.loader' -New '@cthub-bsaas/core'

# 2) Generic fallback replacement
Invoke-LiteralReplace -Old '@frontend-shared/' -New '@cthub-bsaas/'

# 3) PlatformUtils typing & DI
Invoke-RegexReplace -Pattern '\\bIPlatformUtils\\b' -Replacement 'PlatformUtils'
Invoke-RegexReplace -Pattern 'inject\\s*<\\s*PlatformUtils\\s*>\\(\\s*PLATFORM_UTILS_TOKEN\\s*\\)' -Replacement 'inject(PLATFORM_UTILS_TOKEN) as PlatformUtils'
Invoke-RegexReplace -Pattern 'inject\\s*<\\s*IPlatformUtils\\s*>\\(\\s*PLATFORM_UTILS_TOKEN\\s*\\)' -Replacement 'inject(PLATFORM_UTILS_TOKEN) as PlatformUtils'

# 4) API usage updates (.window/.document -> .windowRef/.documentRef) scoped to platformUtils
Invoke-RegexReplace -Pattern '((?:\\bthis\\.)?platformUtils)\\.window\\b' -Replacement '$1.windowRef'
Invoke-RegexReplace -Pattern '((?:\\bthis\\.)?platformUtils)\\.document\\b' -Replacement '$1.documentRef'

# 5) Clean server config factories if any remain
$serverConfigs = Get-ChildItem -Path $root -Recurse -Filter 'app.config.server.ts' -File
foreach ($f in $serverConfigs) {
    $c = Get-Content -LiteralPath $f.FullName -Raw
    $c = [regex]::Replace($c, '(?s)\{\s*provide:\s*PLATFORM_UTILS_TOKEN[\s\S]*?\},\s*', '')
    $c = [regex]::Replace($c, '(?s)\{\s*provide:\s*StorageService[\s\S]*?\},\s*', '')
    Set-Content -LiteralPath $f.FullName -Value $c
}
