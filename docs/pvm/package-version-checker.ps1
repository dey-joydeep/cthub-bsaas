param (
    [Parameter(Mandatory=$true, HelpMessage="Project name (e.g., 'bsaas-front', 'bsaas-back', 'root' or any custom project folder name)")]
    [string]$projectName
)

# Maximum number of historical reports to keep per project
$MAX_HISTORY = 5

# Get the root directory of the project (3 levels up from the script location)
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$projectRoot = (Get-Item (Split-Path (Split-Path $scriptDir -Parent) -Parent)).FullName

# Import required modules
#Requires -Version 5.1
#Requires -Modules @{ ModuleName="PowerShellGet"; ModuleVersion="1.6.0" }

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to get package information
function Get-PackageInfo {
    param (
        [string]$packageJsonPath
    )
    
    Write-Host "[DEBUG] Get-PackageInfo called with path: $packageJsonPath" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Full path resolved to: $([System.IO.Path]::GetFullPath($packageJsonPath))" -ForegroundColor DarkGray
    
    try {
        if (-not (Test-Path $packageJsonPath -PathType Leaf)) {
            Write-Host "[DEBUG] Error: package.json file not found at the specified path" -ForegroundColor Red
            throw "package.json not found at: $packageJsonPath"
        }
        
        $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
        $dependencies = if ($packageJson.dependencies) { $packageJson.dependencies.PSObject.Properties } else { @() }
        $devDependencies = if ($packageJson.devDependencies) { $packageJson.devDependencies.PSObject.Properties } else { @() }
        
        Write-Host "[DEBUG] Successfully parsed package.json with $($dependencies.Count) dependencies and $($devDependencies.Count) devDependencies" -ForegroundColor DarkGray
        
        return @{
            Dependencies = $dependencies
            DevDependencies = $devDependencies
        }
    }
    catch {
        Write-Error "Error reading package.json: $_"
        exit 1
    }
}

# Function to get latest versions
function Get-LatestVersions {
    param (
        [array]$packages
    )
    
    $results = @()
    
    foreach ($pkg in $packages) {
        $name = $pkg.Name
        $currentVersion = $pkg.Value
        
        try {
            # Use npm view to get the latest version
            $npmOutput = npm view $name version --silent 2>$null
            if ($LASTEXITCODE -eq 0 -and $npmOutput) {
                $latestVersion = $npmOutput.Trim()
            } else {
                $latestVersion = $null
            }
            
            $results += [PSCustomObject]@{
                Name = $name
                CurrentVersion = $currentVersion
                LatestVersion = $latestVersion
                Status = if ($latestVersion) {
                    if ($currentVersion -match '\^|~' -and $latestVersion -match $currentVersion.Replace('^','').Replace('~','')) {
                        'Up to date'
                    } elseif ($currentVersion -eq $latestVersion) {
                        'Up to date'
                    } else {
                        'Update available'
                    }
                } else {
                    'Not found'
                }
            }
        }
        catch {
            $results += [PSCustomObject]@{
                Name = $name
                CurrentVersion = $currentVersion
                LatestVersion = 'Error'
                Status = 'Error checking version'
            }
        }
        
        # Be nice to the npm registry
        Start-Sleep -Milliseconds 200
    }
    
    return $results
}

# Function to compare versions and determine update type
function Get-UpdateType {
    param (
        [string]$currentVersion,
        [string]$latestVersion
    )
    
    try {
        if ([string]::IsNullOrWhiteSpace($currentVersion) -or [string]::IsNullOrWhiteSpace($latestVersion)) {
            return $null
        }
        
        # Normalize versions (remove any non-numeric/period characters at start)
        $currentVersion = $currentVersion -replace '^[^\d.]*', ''
        $latestVersion = $latestVersion -replace '^[^\d.]*', ''
        
        $currentParts = $currentVersion.Split('.')
        $latestParts = $latestVersion.Split('.')
        
        # Ensure both versions have at least MAJOR.MINOR.PATCH
        while ($currentParts.Count -lt 3) { $currentParts += '0' }
        while ($latestParts.Count -lt 3) { $latestParts += '0' }
        
        # Compare major versions
        if ([int]$latestParts[0] -gt [int]$currentParts[0]) {
            return 'major'
        }
        # Compare minor versions
        elseif ([int]$latestParts[0] -eq [int]$currentParts[0] -and [int]$latestParts[1] -gt [int]$currentParts[1]) {
            return 'minor'
        }
        # Compare patch versions
        elseif ([int]$latestParts[0] -eq [int]$currentParts[0] -and 
                [int]$latestParts[1] -eq [int]$currentParts[1] -and 
                [int]$latestParts[2] -gt [int]$currentParts[2]) {
            return 'patch'
        }
        
        return $null
    }
    catch {
        Write-Warning "Error comparing versions: $_"
        return $null
    }
}

# Function to generate HTML report
function New-PackageReport {
    param (
        [array]$dependencies,
        [array]$devDependencies,
        [string]$outputPath,
        [string]$target,
        [string]$packageJsonPath
    )
    
    Write-Host "[DEBUG] New-PackageReport called with outputPath: $outputPath" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Target: $target, packageJsonPath: $packageJsonPath" -ForegroundColor DarkGray
    
    # Ensure output directory exists
    $outputDir = [System.IO.Path]::GetDirectoryName($outputPath)
    if (-not (Test-Path -Path $outputDir)) {
        Write-Host "[DEBUG] Creating output directory: $outputDir" -ForegroundColor DarkGray
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    } else {
        Write-Host "[DEBUG] Output directory exists: $outputDir" -ForegroundColor DarkGray
    }
    
    # Process dependencies
    $dependenciesHtml = @"
    <h2>Dependencies</h2>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Package</th>
                    <th>Current Version</th>
                    <th>Latest Version</th>
                    <th>Update Type</th>
                </tr>
            </thead>
            <tbody>
"@

    foreach ($dep in $dependencies) {
        $packageName = $dep.Name
        $updateType = ''
        $updateTypeHtml = ''
        $rowClass = ''
        
        # Clean up version strings for comparison
        $currentVer = $dep.CurrentVersion -replace '[^0-9.]', ''
        $latestVer = $dep.LatestVersion -replace '[^0-9.]', ''
        
        # Determine status and update type
        if ($dep.Status -eq 'Up to date' -or $dep.Status -eq 'ok') {
            $updateTypeHtml = "<span class='update-type'>Latest</span>"
            $rowClass = 'ok'
        } 
        elseif ($dep.Status -eq 'Update available' -or $dep.Status -eq 'update') {
            $updateType = Get-UpdateType -currentVersion $currentVer -latestVersion $latestVer
            
            if ($updateType -eq 'major') {
                $updateTypeHtml = "<span class='update-type'>Major</span>"
                $rowClass = 'major-update'
            }
            elseif ($updateType -eq 'minor') {
                $updateTypeHtml = "<span class='update-type'>Minor</span>"
                $rowClass = 'minor-update'
            }
            else {
                $updateTypeHtml = "<span class='update-type'>Patch</span>"
                $rowClass = 'update'
            }
        }
        elseif ($dep.Status -eq 'Not found' -or $dep.Status -eq 'missing') {
            $updateTypeHtml = "<span class='update-type'>Not found</span>"
            $rowClass = 'missing'
        } 
        else {
            $updateTypeHtml = "<span class='update-type'>Error</span>"
            $rowClass = 'error'
        }
        
        # Create package link
        $packageLink = "https://www.npmjs.com/package/$packageName"
        $packageCell = "<a href='$packageLink' class='package-link' target='_blank'>$packageName</a>"
        
        $dependenciesHtml += @"
                <tr class="$rowClass">
                    <td class="package-name">$packageCell</td>
                    <td class="version">$($dep.CurrentVersion)</td>
                    <td class="version">$($dep.LatestVersion)</td>
                    <td class="update-type-cell">$updateTypeHtml</td>
                </tr>
"@
    }
    
    $dependenciesHtml += @"
            </tbody>
        </table>
    </div>
"@

    # Process dev dependencies
    $devDependenciesHtml = @"
    <h2>Dev Dependencies</h2>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Package</th>
                    <th>Current Version</th>
                    <th>Latest Version</th>
                    <th>Update Type</th>
                </tr>
            </thead>
            <tbody>
"@

    foreach ($dep in $devDependencies) {
        $packageName = $dep.Name
        $updateType = ''
        $updateTypeHtml = ''
        $rowClass = ''
        
        # Clean up version strings for comparison
        $currentVer = $dep.CurrentVersion -replace '[^0-9.]', ''
        $latestVer = $dep.LatestVersion -replace '[^0-9.]', ''
        
        # Determine status and update type
        if ($dep.Status -eq 'Up to date' -or $dep.Status -eq 'ok') {
            $updateTypeHtml = "<span class='update-type'>Latest</span>"
            $rowClass = 'ok'
        } 
        elseif ($dep.Status -eq 'Update available' -or $dep.Status -eq 'update') {
            $updateType = Get-UpdateType -currentVersion $currentVer -latestVersion $latestVer
            
            if ($updateType -eq 'major') {
                $updateTypeHtml = "<span class='update-type'>Major</span>"
                $rowClass = 'major-update'
            }
            elseif ($updateType -eq 'minor') {
                $updateTypeHtml = "<span class='update-type'>Minor</span>"
                $rowClass = 'minor-update'
            }
            else {
                $updateTypeHtml = "<span class='update-type'>Patch</span>"
                $rowClass = 'update'
            }
        }
        elseif ($dep.Status -eq 'Not found' -or $dep.Status -eq 'missing') {
            $updateTypeHtml = "<span class='update-type'>Not found</span>"
            $rowClass = 'missing'
        } 
        else {
            $updateTypeHtml = "<span class='update-type'>Error</span>"
            $rowClass = 'error'
        }
        
        # Create package link
        $packageLink = "https://www.npmjs.com/package/$packageName"
        $packageCell = "<a href='$packageLink' class='package-link' target='_blank'>$packageName</a>"
        
        $devDependenciesHtml += @"
                <tr class="$rowClass">
                    <td class="package-name">$packageCell</td>
                    <td class="version">$($dep.CurrentVersion)</td>
                    <td class="version">$($dep.LatestVersion)</td>
                    <td class="update-type-cell">$updateTypeHtml</td>
                </tr>
"@
    }
    
    $devDependenciesHtml += @"
            </tbody>
        </table>
    </div>
"@

    # Read the template file
    $templateDir = Join-Path -Path $PSScriptRoot -ChildPath "template"
    $templatePath = Join-Path -Path $templateDir -ChildPath "report-template.html"
    $templateContent = Get-Content -Path $templatePath -Raw
    
    # Get project name from package.json or use the target name as fallback
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    $projectName = if ($packageJson.PSObject.Properties['name'] -and $packageJson.name) {
        $packageJson.name
    } else {
        $target  # Fall back to the target name if no name in package.json
    }
    
    # Calculate summary counts
    $totalPackages = $dependencies.Count + $devDependencies.Count
    $outdatedCount = ($dependencies | Where-Object { $_.Status -eq 'update' -or $_.Status -eq 'Update available' }).Count + 
                    ($devDependencies | Where-Object { $_.Status -eq 'update' -or $_.Status -eq 'Update available' }).Count
    $upToDateCount = ($dependencies | Where-Object { $_.Status -eq 'ok' -or $_.Status -eq 'Up to date' }).Count + 
                    ($devDependencies | Where-Object { $_.Status -eq 'ok' -or $_.Status -eq 'Up to date' }).Count
    $notFoundCount = ($dependencies | Where-Object { $_.Status -eq 'missing' -or $_.Status -eq 'Not found' }).Count + 
                    ($devDependencies | Where-Object { $_.Status -eq 'missing' -or $_.Status -eq 'Not found' }).Count
    $errorCount = ($dependencies | Where-Object { $_.Status -eq 'error' -or $_.Status -eq 'Error' }).Count + 
                 ($devDependencies | Where-Object { $_.Status -eq 'error' -or $_.Status -eq 'Error' }).Count
    
    # Prepare template variables
    $templateVars = @{
        "TARGET" = $projectName
        "GENERATED_DATE" = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        "TOTAL_PACKAGES" = $totalPackages
        "OUTDATED_COUNT" = $outdatedCount
        "UP_TO_DATE_COUNT" = $upToDateCount
        "NOT_FOUND_COUNT" = $notFoundCount
        "ERROR_COUNT" = $errorCount
    }
    # Replace placeholders in template
    $templateContent = $templateContent -replace '\{\{GENERATED_DATE\}\}', $templateVars["GENERATED_DATE"]
    $templateContent = $templateContent -replace '\{\{TARGET\}\}', $templateVars["TARGET"]
    $templateContent = $templateContent -replace '\{\{TOTAL_PACKAGES\}\}', $templateVars["TOTAL_PACKAGES"]
    $templateContent = $templateContent -replace '\{\{UP_TO_DATE_COUNT\}\}', $templateVars["UP_TO_DATE_COUNT"]
    $templateContent = $templateContent -replace '\{\{OUTDATED_COUNT\}\}', $templateVars["OUTDATED_COUNT"]
    $templateContent = $templateContent -replace '\{\{NOT_FOUND_COUNT\}\}', $templateVars["NOT_FOUND_COUNT"]
    $templateContent = $templateContent -replace '\{\{ERROR_COUNT\}\}', $templateVars["ERROR_COUNT"]
    $templateContent = $templateContent -replace '\{\{OUTDATED_COUNT\}\}', $outdatedCount
    $templateContent = $templateContent -replace '\{\{NOT_FOUND_COUNT\}\}', $notFoundCount
    $templateContent = $templateContent -replace '\{\{ERROR_COUNT\}\}', $errorCount
    $templateContent = $templateContent -replace '\{\{DEPENDENCIES_SECTION\}\}', $dependenciesHtml
    $templateContent = $templateContent -replace '\{\{DEV_DEPENDENCIES_SECTION\}\}', $devDependenciesHtml
    
    # Create directory if it doesn't exist
    $outputDir = Split-Path -Path $outputPath -Parent
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    # Save report with UTF-8 encoding
    [System.IO.File]::WriteAllText($outputPath, $templateContent, [System.Text.Encoding]::UTF8)
    
    # CSS file is now handled in Update-ReportIndex to ensure it's only in the root report directory
    # This prevents duplicate CSS files in project directories
    
    Write-Host "Report generated at: $outputPath"
}

# Function to create or update the report index file
function Update-ReportIndex {
    param (
        [string]$projectName,
        [string]$reportPath
    )
    
    $reportDir = Split-Path -Path $reportPath -Parent
    $reportParentDir = Split-Path -Path $reportDir -Parent
    $indexPath = Join-Path -Path $reportParentDir -ChildPath "index.html"
    $cssSource = Join-Path -Path $PSScriptRoot -ChildPath "template\styles.css"
    $cssDest = Join-Path -Path $reportParentDir -ChildPath "styles.css"
    
    # Ensure the report directories exist
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }
    
    if (-not (Test-Path $reportParentDir)) {
        New-Item -ItemType Directory -Path $reportParentDir -Force | Out-Null
    }
    
    # Copy styles.css to the root report directory if it doesn't exist or is older than the source
    if (-not (Test-Path $cssDest) -or ((Test-Path $cssSource) -and ((Get-Item $cssSource).LastWriteTime -gt (Get-Item $cssDest).LastWriteTime))) {
        try {
            if (Test-Path $cssSource) {
                Copy-Item -Path $cssSource -Destination $cssDest -Force -ErrorAction Stop
                Write-Host "Created/Updated styles.css in report directory"
            } else {
                Write-Warning "Source CSS file not found at: $cssSource"
            }
        } catch {
            Write-Warning "Failed to update styles.css: $_"
        }
    }
    
    # Get all project directories (non-hidden directories in the report parent directory)
    $projectDirs = Get-ChildItem -Path $reportParentDir -Directory -ErrorAction SilentlyContinue | 
                   Where-Object { $_.Name -ne 'template' -and -not $_.Name.StartsWith('.') } |
                   Sort-Object Name
    
    # Create a hashtable to store reports by project
    $reportsByProject = @{}
    
    # Collect all reports from all project directories and apply retention policy
    foreach ($dir in $projectDirs) {
        try {
            $allProjectReports = Get-ChildItem -Path $dir.FullName -Filter "*_report_*.html" -ErrorAction Stop | 
                               Sort-Object LastWriteTime -Descending
            
            # Apply retention policy - keep only the most recent $MAX_HISTORY reports
            if ($allProjectReports -and $allProjectReports.Count -gt 0) {
                $reportsToKeep = @($allProjectReports) | Select-Object -First $MAX_HISTORY
                $reportsToDelete = @($allProjectReports) | Select-Object -Skip $MAX_HISTORY
                
                # Delete older reports that exceed the retention limit
                foreach ($oldReport in $reportsToDelete) {
                    try {
                        Remove-Item -Path $oldReport.FullName -Force -ErrorAction Stop
                        Write-Host "Removed old report: $($oldReport.Name)" -ForegroundColor DarkGray
                    } catch {
                        Write-Warning "Failed to remove old report $($oldReport.Name): $_"
                    }
                }
                
                $reportsByProject[$dir.Name] = $reportsToKeep
            }
        } catch {
            Write-Warning "Error processing reports in $($dir.Name): $_"
        }
    }
    
    # Read the index template
    $indexTemplatePath = Join-Path -Path $PSScriptRoot -ChildPath "template\index-template.html"
    if (-not (Test-Path $indexTemplatePath)) {
        throw "Index template not found at: $indexTemplatePath"
    }
    $html = Get-Content -Path $indexTemplatePath -Raw
    
    # Generate project reports HTML
    $projectReportsHtml = @()
    
    # Add a section for each project
    foreach ($projName in ($reportsByProject.Keys | Sort-Object)) {
        $projectReports = $reportsByProject[$projName]
        # Format the project name for display
        if ($projName -eq 'root') {
            # For root project, get the actual project name from package.json or parent directory
            $packageJsonPath = Join-Path -Path $PSScriptRoot -ChildPath '..\package.json'
            if (Test-Path $packageJsonPath) {
                try {
                    $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
                    if ($packageJson -and $packageJson.name) {
                        $displayName = $packageJson.name
                        # Clean up the package name (remove scope if present)
                        if ($displayName.StartsWith('@')) {
                            $displayName = $displayName -replace '^@[^/]+/', ''
                        }
                    } else {
                        # Use parent directory name if package.json has no name
                        $displayName = (Get-Item (Split-Path -Parent $packageJsonPath)).Name
                        Write-Host "No project name found in package.json, using parent directory name: $displayName" -ForegroundColor Yellow
                    }
                } catch {
                    Write-Warning "Failed to parse package.json: $_"
                    # Fall back to parent directory name if package.json parsing fails
                    $displayName = (Get-Item (Split-Path -Parent $packageJsonPath)).Name
                    Write-Host "Using parent directory name as project name: $displayName" -ForegroundColor Yellow
                }
            } else {
                # If package.json doesn't exist, use the parent directory name
                $displayName = (Get-Item (Split-Path -Parent $PSScriptRoot)).Name
                Write-Host "package.json not found, using parent directory name: $displayName" -ForegroundColor Yellow
            }
        } else {
            # For other projects, use the project name with proper formatting
            $displayName = $projName -replace '-', ' ' -replace '_', ' '
            # Convert first letter of each word to uppercase
            $displayName = (Get-Culture).TextInfo.ToTitleCase($displayName.ToLower())
        }
        
        $reportsList = @()
        
        if ($projectReports.Count -gt 0) {
            foreach ($report in $projectReports) {
                $reportName = [System.IO.Path]::GetFileNameWithoutExtension($report.Name)
                $reportDate = $report.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
                $relativePath = "$projName/$(Split-Path $report -Leaf)"
                $reportsList += "<li><a href='$relativePath'>$reportName</a> <span class='date'>($reportDate)</span></li>"
            }
        } else {
            $reportsList += "<li>No reports available</li>"
        }
        
        $projectReportsHtml += @"
        <div class="project-reports">
            <h2 class="project-name">$displayName</h2>
            <ul>
                $($reportsList -join "`n                ")
            </ul>
        </div>
"@
    }
    
    # Replace the placeholder in the template with the generated content
    $html = $html -replace '\{\{PROJECT_REPORTS\}\}', ($projectReportsHtml -join "`n")
    
    # Save the index file
    [System.IO.File]::WriteAllText($indexPath, $html, [System.Text.Encoding]::UTF8)
    
    Write-Host "Report index updated at: $indexPath"
}

try {
    # Debug output for path resolution
    Write-Host "[DEBUG] Main script starting with projectName: $projectName" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Script directory: $PSScriptRoot" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Project root: $projectRoot" -ForegroundColor DarkGray
    
    # First, validate the project directory exists before doing anything else
    $projectDirPath = if ($projectName -eq "root") {
        # For root project, always use the project root directory
        $packageJsonPath = Join-Path -Path $projectRoot -ChildPath 'package.json'
        if (-not (Test-Path $packageJsonPath)) {
            throw "Root package.json not found at: $packageJsonPath"
        }
        
        # Set the project name for display purposes
        try {
            $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
            if ($packageJson -and $packageJson.name) {
                $projectName = $packageJson.name
            } else {
                # If package.json doesn't have a name, use the parent directory name
                $projectName = (Get-Item (Split-Path -Parent $packageJsonPath)).Name
                Write-Host "No project name found in package.json, using parent directory name: $projectName" -ForegroundColor Yellow
            }
        } catch {
            Write-Warning "Failed to parse package.json: $_"
            # Fall back to parent directory name if package.json parsing fails
            $projectName = (Get-Item (Split-Path -Parent $packageJsonPath)).Name
            Write-Host "Using parent directory name as project name: $projectName" -ForegroundColor Yellow
        }
        # Return the normalized project root directory
        [System.IO.Path]::GetFullPath($projectRoot)
    } else {
        # Check if the project name is already an absolute path
        Write-Host "[DEBUG] Processing non-root project: $projectName" -ForegroundColor DarkGray
        if ([System.IO.Path]::IsPathRooted($projectName)) {
            # If an absolute path is provided, use it as-is
            $fullPath = [System.IO.Path]::GetFullPath($projectName)
            Write-Host "[DEBUG] Absolute path provided: $fullPath" -ForegroundColor DarkGray
        } elseif (Test-Path -Path $projectName -PathType Container) {
            # If the project name is a valid relative path, use it directly
            $fullPath = [System.IO.Path]::GetFullPath($projectName)
            Write-Host "[DEBUG] Valid relative path provided: $fullPath" -ForegroundColor DarkGray
        } else {
            # Otherwise, treat it as a subdirectory of the project root
            Write-Host "[DEBUG] Treating as project subdirectory, joining with project root" -ForegroundColor DarkGray
            $fullPath = Join-Path -Path $projectRoot -ChildPath $projectName
            $fullPath = [System.IO.Path]::GetFullPath($fullPath)
            Write-Host "[DEBUG] Resolved full path: $fullPath" -ForegroundColor DarkGray
        }
        
        if (-not (Test-Path $fullPath -PathType Container)) {
            # Write to stderr and exit with non-zero status code for better testability
            $errorMessage = "Error: Project directory not found: $fullPath"
            [Console]::Error.WriteLine($errorMessage)
            Write-Error $errorMessage -ErrorAction Stop  # This will be caught by the outer try/catch
        }
        $fullPath
    }
    
    # Now set the package.json path and validate it
    Write-Host "[DEBUG] projectDirPath before joining with package.json: $projectDirPath" -ForegroundColor DarkGray
    $packageJsonPath = Join-Path -Path $projectDirPath -ChildPath "package.json"
    Write-Host "[DEBUG] packageJsonPath after joining: $packageJsonPath" -ForegroundColor DarkGray
    
    if (-not (Test-Path $packageJsonPath -PathType Leaf)) {
        throw "package.json not found at: $packageJsonPath"
    }
    
    $projectDirName = if ($projectName -eq "root") { "root" } else { $projectName }
    Write-Host "[DEBUG] projectDirName: $projectDirName" -ForegroundColor DarkGray
    
    # Validate package.json exists (duplicate check, but keeping for now)
    if (-not (Test-Path $packageJsonPath -PathType Leaf)) {
        throw "package.json not found at: $packageJsonPath"
    }
    
    # Create report directory for this project if it doesn't exist
    $reportDir = Join-Path -Path (Join-Path -Path $PSScriptRoot -ChildPath "report") -ChildPath $projectDirName
    
    # Ensure report directory exists
    if (-not (Test-Path -Path $reportDir -PathType Container)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }
    
    # Set up report directory and file paths
    $reportDate = Get-Date -Format "yyyyMMdd"
    $projectDirName = (Get-Item $projectDirPath).Name
    
    # Ensure the report directory exists
    $reportBaseDir = Join-Path -Path $PSScriptRoot -ChildPath "report"
    $reportDir = Join-Path -Path $reportBaseDir -ChildPath $projectDirName
    
    # Create the report directory if it doesn't exist
    if (-not (Test-Path -Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
        Write-Host "[DEBUG] Created report directory: $reportDir" -ForegroundColor DarkGray
    }
    
    $reportPath = Join-Path -Path $reportDir -ChildPath "${reportDate}_report_${projectDirName}.html"
    $reportIndexPath = Join-Path -Path $reportBaseDir -ChildPath "index.html"
    
    Write-Host "[DEBUG] Report base directory: $reportBaseDir" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Report directory: $reportDir" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Report path: $reportPath" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Report index path: $reportIndexPath" -ForegroundColor DarkGray
    
    # Get all existing reports (excluding today's which we'll overwrite)
    $existingReports = @(Get-ChildItem -Path $reportDir -Filter "*_report_*.html" -ErrorAction SilentlyContinue | 
                       Sort-Object -Property LastWriteTime -Descending)
    
    Write-Host "[DEBUG] Found $($existingReports.Count) existing reports in $reportDir" -ForegroundColor DarkGray
    
    # If we've reached or exceeded max history, delete the oldest report(s)
    if ($existingReports.Count -ge $MAX_HISTORY) {
        # We want to keep the newest (MAX_HISTORY - 1) reports, plus we'll add today's report
        $reportsToKeep = $existingReports | Select-Object -First ($MAX_HISTORY - 1)
        $reportsToDelete = $existingReports | Where-Object { $reportsToKeep -notcontains $_ }
        
        Write-Host "[DEBUG] Will keep $($reportsToKeep.Count) reports and delete $($reportsToDelete.Count) reports" -ForegroundColor DarkGray
        
        foreach ($report in $reportsToDelete) {
            Write-Host "Maximum report history ($MAX_HISTORY) reached. Removing old report: $($report.Name)"
            try {
                Remove-Item -Path $report.FullName -Force -ErrorAction Stop
                # Small delay to ensure file system operations complete
                Start-Sleep -Milliseconds 100
            } catch {
                Write-Warning "Failed to remove old report $($report.Name): $_"
            }
        }
    }
    
    # Determine the display name for analysis message
    $analysisName = if ($projectName -eq "root") {
        # For root project, use the project name we determined earlier
        if ($projectName -eq (Get-Item (Split-Path -Parent $packageJsonPath)).Name) {
            "root project"
        } else {
            "project '$projectName'"
        }
    } else {
        "project '$projectDirName'"
    }
    
    Write-Host "Analyzing $analysisName packages..."
    
    # Change to the project directory to ensure npm commands work correctly
    $originalLocation = Get-Location
    Write-Host "Analyzing project '$projectDirName' packages..."
    
    # Debug output before getting package info
    Write-Host "[DEBUG] Before Get-PackageInfo call" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Current directory: $(Get-Location)" -ForegroundColor DarkGray
    Write-Host "[DEBUG] projectDirPath: $projectDirPath" -ForegroundColor DarkGray
    Write-Host "[DEBUG] packageJsonPath: $packageJsonPath" -ForegroundColor DarkGray
    
    # Get package info
    $packageInfo = Get-PackageInfo -packageJsonPath $packageJsonPath
    
    # Debug output after getting package info
    Write-Host "[DEBUG] After Get-PackageInfo call" -ForegroundColor DarkGray
    Write-Host "[DEBUG] Dependencies count: $($packageInfo.Dependencies.Count)" -ForegroundColor DarkGray
    Write-Host "[DEBUG] DevDependencies count: $($packageInfo.DevDependencies.Count)" -ForegroundColor DarkGray
    
    Write-Host "Checking for latest versions (this may take a few minutes)..."
    try {
        $deps = if ($packageInfo.Dependencies -and $packageInfo.Dependencies.Count -gt 0) { 
            Get-LatestVersions -packages $packageInfo.Dependencies 
        } else { 
            @() 
        }
        $devDeps = if ($packageInfo.DevDependencies -and $packageInfo.DevDependencies.Count -gt 0) { 
            Get-LatestVersions -packages $packageInfo.DevDependencies 
        } else { 
            @() 
        }
    }
    finally {
        # Always return to the original directory
        Set-Location $originalLocation
    }
    
    # Generate report
    New-PackageReport -dependencies $deps -devDependencies $devDeps -outputPath $reportPath -target $projectDirName -packageJsonPath $packageJsonPath
    
    # Show summary
    $totalDeps = $deps.Count + $devDeps.Count
    $outdatedDeps = ($deps | Where-Object { $_.Status -eq 'Update available' }).Count + 
                    ($devDeps | Where-Object { $_.Status -eq 'Update available' }).Count
    
    Write-Host "`nAnalysis complete!"
    Write-Host "Total packages: $totalDeps"
    Write-Host "Outdated packages: $outdatedDeps"
    Write-Host "Report saved to: $reportPath"
    
    # Create or update index.html
    Update-ReportIndex -projectName $projectDirName -reportPath $reportPath
}
catch {
    Write-Error "An error occurred: $_"
    exit 1
}
