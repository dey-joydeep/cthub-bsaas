# Simple script to validate Nx project graph

function Write-Header {
    param([string]$message)
    Write-Host "`n=== $($message.ToUpper()) ===" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
}

# Check Nx installation
Write-Header "CHECKING NX INSTALLATION"
try {
    # Get Nx version using a more reliable method
    $nxVersion = (npx nx --version 2>&1 | Select-String -Pattern '\d+\.\d+\.\d+').Matches[0].Value
    if ($LASTEXITCODE -eq 0 -and $nxVersion) {
        Write-Success "Nx is installed (v$nxVersion)"
    } else {
        throw "Nx is not properly installed or version could not be determined"
    }
} catch {
    Write-Error "Failed to verify Nx installation: $_"
    exit 1
}

# Check Nx project graph
Write-Header "VALIDATING NX PROJECT GRAPH"
try {
    $graphOutput = npx nx graph --file=graph.json 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Nx project graph generated successfully"
        
        # Check if graph.json was created
        if (Test-Path "graph.json") {
            $graph = Get-Content -Path "graph.json" -Raw | ConvertFrom-Json
            $projectCount = ($graph.graph.nodes | Measure-Object).Count
            Write-Success "Found $projectCount projects in the workspace"
            Remove-Item "graph.json" -Force
        }
    } else {
        throw $graphOutput
    }
} catch {
    Write-Error "Failed to generate Nx project graph: $_"
    exit 1
}

# List all projects with details
Write-Header "LISTING ALL PROJECTS"
try {
    # Get project details in JSON format
    $projectsJson = npx nx show projects --json 2>&1 | Out-String | ConvertFrom-Json
    
    if ($projectsJson) {
        $projectCount = $projectsJson.Count
        Write-Success "Found $projectCount projects:"
        
        # Get detailed information for each project
        $projectsJson | ForEach-Object {
            $projectName = $_
            $projectType = if ($projectName -match '^bsaas-') { $projectName -replace '^bsaas-', '' -replace '-.*', '' } else { 'other' }
            $projectPath = npx nx show project $projectName --json 2>&1 | Out-String | ConvertFrom-Json | Select-Object -ExpandProperty root -ErrorAction SilentlyContinue
            
            Write-Host "`n  Project: $projectName" -ForegroundColor Yellow
            Write-Host "  Type:    $projectType"
            Write-Host "  Path:    $projectPath"
            
            # Show available targets (build, test, etc.)
            $targets = npx nx show project $projectName --json 2>&1 | Out-String | ConvertFrom-Json | Select-Object -ExpandProperty targets -ErrorAction SilentlyContinue
            if ($targets) {
                Write-Host "  Targets: $($targets.PSObject.Properties.Name -join ', ')"
            }
        }
    } else {
        Write-Error "No projects found in the workspace"
        exit 1
    }
} catch {
    Write-Error "Failed to list projects: $_"
    exit 1
}

# Check for common issues
Write-Header "CHECKING FOR COMMON ISSUES"
$hasIssues = $false

# Check for node_modules in project roots
$strayNodeModules = Get-ChildItem -Path . -Recurse -Depth 3 -Filter "node_modules" -Directory | 
    Where-Object { $_.FullName -notlike '*\node_modules\*' -and $_.FullName -ne 'node_modules' }

if ($strayNodeModules) {
    Write-Error "Found node_modules in project roots. These should be removed:"
    $strayNodeModules | ForEach-Object { Write-Host "  - $($_.FullName)" }
    $hasIssues = $true
}

# Check for package.json in project roots
$strayPackageJsons = Get-ChildItem -Path . -Recurse -Depth 3 -Filter "package.json" -File | 
    Where-Object { $_.DirectoryName -notlike '*\node_modules\*' -and $_.DirectoryName -ne '.' }

if ($strayPackageJsons.Count -gt 1) {
    Write-Error "Found multiple package.json files. These should be removed (keep only root package.json):"
    $strayPackageJsons | ForEach-Object { 
        if ($_.DirectoryName -ne '.') { 
            Write-Host "  - $($_.FullName)" 
        }
    }
    $hasIssues = $true
}

if (-not $hasIssues) {
    Write-Success "No common issues found"
}

Write-Header "VALIDATION COMPLETE"
Write-Success "Nx monorepo validation completed successfully!"
