#!/usr/bin/env pwsh
node (Join-Path $PSScriptRoot 'init-tracker.mjs') @args
exit $LASTEXITCODE
