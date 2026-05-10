# Script to generate README files for all apps and libs using a template
# Compatible with PowerShell 5.1 and later

# Function to create README from template
function New-ReadmeFromTemplate {
    param (
        [string]$ProjectName,
        [string]$ProjectType,
        [string]$ProjectPath
    )

    # Determine project type description
    $projectDescription = switch ($ProjectType) {
        'app' { "Frontend application" }
        'lib' { "Shared library" }
        'docs' { "Documentation site" }
        default { "Project" }
    }

    # Get Node.js and npm versions
    $nodeVersion = (node -v).Trim('v')
    $npmVersion = (npm -v).Trim()

    # Set up template variables
    $templateVars = @{
        'ProjectName'        = $ProjectName
        'ProjectDescription' = $projectDescription
        'NodeVersion'        = $nodeVersion
        'NpmVersion'         = $npmVersion
        'ProjectOverview'    = "This $projectDescription is part of the Beauty SaaS platform."
        'DeploymentInstructions' = "Deployment instructions for $ProjectName will be added here."
        'ApiReference'       = "API reference documentation will be added here."
    }

    # Read the template
    $templatePath = Join-Path $PSScriptRoot 'templates/README.md.template'
    if (-not (Test-Path $templatePath)) {
        Write-Error "Template file not found at $templatePath"
        return
    }

    $templateContent = Get-Content -Path $templatePath -Raw

    # Replace placeholders with actual values
    $templateContent = $templateVars.GetEnumerator() | ForEach-Object {
        $templateContent = $templateContent -replace "\{\{$($_.Key)\}\}", $_.Value
    } | Select-Object -Last 1

    # Create the README file
    $readmePath = Join-Path $ProjectPath 'README.md'
    
    # Only create if it doesn't exist
    if (Test-Path $readmePath) {
        Write-Host "README.md already exists at $readmePath - skipping" -ForegroundColor Yellow
        return
    }

    $templateContent | Out-File -FilePath $readmePath -Encoding utf8
    Write-Host "Created README.md for $ProjectName at $readmePath" -ForegroundColor Green
}

# Main script execution
$rootDir = Split-Path -Parent $PSScriptRoot
$appsDir = Join-Path $rootDir 'apps'
$libsDir = Join-Path $rootDir 'libs'

# Process apps
if (Test-Path $appsDir) {
    Write-Host "\nProcessing applications..." -ForegroundColor Cyan
    Get-ChildItem -Path $appsDir -Directory | ForEach-Object {
        $projectName = $_.Name
        $projectPath = $_.FullName
        Write-Host "- $projectName" -ForegroundColor Blue
        New-ReadmeFromTemplate -ProjectName $projectName -ProjectType 'app' -ProjectPath $projectPath
    }
}

# Process libs
if (Test-Path $libsDir) {
    Write-Host "\nProcessing libraries..." -ForegroundColor Cyan
    Get-ChildItem -Path $libsDir -Directory -Recurse -Depth 2 | 
        Where-Object { $_.FullName -notlike '*\node_modules\*' } |
        ForEach-Object {
            $projectName = $_.Name
            $projectPath = $_.FullName
            
            # Skip if it's a nested directory that's not a lib (e.g., libs/shared/utils)
            $relativePath = $_.FullName.Substring($libsDir.Length + 1).Replace('\', '/')
            if ($relativePath -match '^[^/]+/[^/]+$') {
                Write-Host "- $relativePath" -ForegroundColor Blue
                New-ReadmeFromTemplate -ProjectName $relativePath -ProjectType 'lib' -ProjectPath $projectPath
            }
        }
}

Write-Host "\nDocumentation generation complete!" -ForegroundColor Green
