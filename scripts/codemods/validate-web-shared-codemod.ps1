$ErrorActionPreference = 'Stop'
$tokens = $null
$errors = $null
$scriptPath = Join-Path $PSScriptRoot 'web-shared-codemod.ps1'
if (-not (Test-Path -LiteralPath $scriptPath)) {
    Write-Host "Codemod script not found: $scriptPath" -ForegroundColor Red
    exit 1
}
$null = [System.Management.Automation.Language.Parser]::ParseFile($scriptPath, [ref]$tokens, [ref]$errors)
if ($errors -and $errors.Count -gt 0) {
    Write-Host ("ParseErrors: {0}" -f $errors.Count) -ForegroundColor Red
    foreach ($e in $errors) {
        Write-Host ("Line {0}, Col {1}: {2}" -f $e.Extent.StartLineNumber, $e.Extent.StartColumnNumber, $e.Message) -ForegroundColor Red
    }
    exit 2
}
Write-Host 'Syntax OK: no parse errors' -ForegroundColor Green
exit 0
