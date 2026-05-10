# Update import paths in all TypeScript files
$baseDir = "e:\workspace\cthub-bsaas\bsaas-back\src"

# Define the path mappings
$pathMappings = @{
    "@app/modules/auth/" = "@app/core/auth/"
    "@app/middleware/" = "@app/common/middleware/"
    "@app/utils/" = "@app/common/utils/"
    "@app/prisma/" = "@app/core/database/prisma/"
    "@app/prisma" = "@app/core/database/prisma"
}

# Get all TypeScript files
$files = Get-ChildItem -Path $baseDir -Recurse -Filter "*.ts" -File | Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $updated = $false
    
    foreach ($mapping in $pathMappings.GetEnumerator()) {
        if ($content -match $mapping.Key) {
            $content = $content -replace [regex]::Escape($mapping.Key), $mapping.Value
            $updated = $true
        }
    }
    
    if ($updated) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated imports in $($file.FullName)"
    }
}

Write-Host "Import updates complete!"
