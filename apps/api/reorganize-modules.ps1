# Define the base directory
$baseDir = "e:\workspace\cthub-bsaas\bsaas-back\src\modules"

# Get all module directories
$modules = Get-ChildItem -Path $baseDir -Directory

foreach ($module in $modules) {
    $moduleName = $module.Name
    $modulePath = Join-Path $baseDir $moduleName
    
    Write-Host "Processing module: $moduleName"
    
    # Create necessary subdirectories if they don't exist
    $subDirs = @("dto", "interfaces", "entities")
    foreach ($dir in $subDirs) {
        $dirPath = Join-Path $modulePath $dir
        if (-not (Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
        }
    }
    
    # Move DTOs
    $dtoFiles = Get-ChildItem -Path $modulePath -Filter "*.dto.ts" -File
    foreach ($file in $dtoFiles) {
        $destination = Join-Path $modulePath "dto\$($file.Name)"
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "Moved $($file.Name) to dto/"
    }
    
    # Move interfaces/types
    $typeFiles = Get-ChildItem -Path $modulePath -Filter "*.types.ts" -File
    foreach ($file in $typeFiles) {
        $destination = Join-Path $modulePath "interfaces\$($file.Name)"
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "Moved $($file.Name) to interfaces/"
    }
    
    # Move entities (if any)
    $entityFiles = Get-ChildItem -Path $modulePath -Filter "*.entity.ts" -File
    foreach ($file in $entityFiles) {
        $destination = Join-Path $modulePath "entities\$($file.Name)"
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "Moved $($file.Name) to entities/"
    }
    
    # Move test files to __tests__ directory
    $testFiles = Get-ChildItem -Path $modulePath -Filter "*.spec.ts" -File
    if ($testFiles.Count -gt 0) {
        $testDir = Join-Path $modulePath "__tests__"
        if (-not (Test-Path $testDir)) {
            New-Item -ItemType Directory -Path $testDir -Force | Out-Null
        }
        foreach ($file in $testFiles) {
            $destination = Join-Path $testDir $file.Name
            Move-Item -Path $file.FullName -Destination $destination -Force
            Write-Host "Moved $($file.Name) to __tests__/"
        }
    }
}

Write-Host "Reorganization complete!"
