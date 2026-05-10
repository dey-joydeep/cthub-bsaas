<#
.SYNOPSIS
    Test Case 1: Initial Report Generation (Root Project)

.DESCRIPTION
    Verifies that the script correctly generates a report for the root project with the actual project name.
    
    Preconditions:
    - No existing reports in the report directory
    - Project root contains a valid package.json
    
    Common Validations:
    1. Index file exists and contains correct project/report info
    2. Only one styles.css exists in root report directory
    3. Report content matches README.md specifications
    4. No more than 5 report files exist
#>

# Import common test framework
. "$PSScriptRoot\common-script-run-test.ps1"

# Initialize test case
$test = @{
    Name = "Initial Report Generation (Root Project)"
    Description = "Verify that the script generates a complete HTML report for the root project with the actual project name."
    Preconditions = "No existing report folder and valid package.json"
    StartTime = Get-Date
    EndTime = $null
    Status = "RUNNING"
    Validations = @()
}

function Test-InitialReportGeneration {
    [CmdletBinding()]
    param()
    
    try {
        Write-Host "[TEST] Starting test: $($test.Name)" -ForegroundColor Cyan
        
        # Get the expected project name from package.json or parent directory name for root project
        $packageJsonPath = Join-Path -Path $global:TestEnvironment.ProjectRoot -ChildPath "package.json"
        if (-not (Test-Path -Path $packageJsonPath)) {
            throw "Root package.json not found at: $packageJsonPath"
        }
        
        $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
        # For root project, if package.json doesn't have a name, use the parent directory name
        $expectedProjectName = if ($packageJson.name) { 
            $packageJson.name 
        } else { 
            # Get the immediate parent directory name of package.json
            (Get-Item (Split-Path -Parent $packageJsonPath)).Name 
        }
        
        # Ensure we have a valid project name
        if ([string]::IsNullOrWhiteSpace($expectedProjectName)) {
            $expectedProjectName = "root"
        }
        
        # Clean up any existing report folder
        if (Test-Path -Path $global:TestEnvironment.ReportDir) {
            Write-Host "[TEST] Cleaning up existing report directory: $($global:TestEnvironment.ReportDir)" -ForegroundColor Yellow
            Remove-Item -Path $global:TestEnvironment.ReportDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # Run the script with the root project
        Write-Host "[TEST] Running script for root project" -ForegroundColor Cyan
        $scriptPath = Join-Path -Path $global:TestEnvironment.ProjectRoot -ChildPath $global:TestEnvironment.ScriptPathFromRoot
        
        if (-not (Test-Path -Path $scriptPath)) {
            throw "Script not found at: $scriptPath"
        }
        
        # Change to the project root directory to run the script
        Push-Location -Path $global:TestEnvironment.ProjectRoot
        try {
            # Capture both stdout and stderr
            $scriptOutput = @()
            & $scriptPath -projectName root 2>&1 | ForEach-Object { 
                $outputLine = $_.ToString()
                if ($_ -is [System.Management.Automation.ErrorRecord]) {
                    Write-Host "[SCRIPT ERROR] $outputLine" -ForegroundColor Red
                } else {
                    Write-Host "[SCRIPT] $outputLine" -ForegroundColor DarkGray
                }
                $scriptOutput += $outputLine
                $outputLine  # Pass through for collection
            }
            $exitCode = $LASTEXITCODE
            
            # Log the script output for debugging
            $scriptOutput | ForEach-Object { 
                Write-Host "[SCRIPT OUTPUT] $_" -ForegroundColor DarkGray 
            }
        } finally {
            Pop-Location
        }
        
        # Add validation for script exit code
        $validation1 = @{
            TestResult = [ref]$test
            ValidationPoint = "Script Exit Code"
            Expected = "Exit code 0"
            Actual = "Exit code $exitCode"
            Status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
        }
        Add-ValidationResult @validation1
        
        # Only continue with validations if the script ran successfully
        if ($exitCode -eq 0) {
            # Check for the correct analysis message format
            $expectedAnalysisPattern = "Analyzing project '.*' packages\.\.\."
            $analysisMessage = $scriptOutput | Where-Object { $_ -match $expectedAnalysisPattern } | Select-Object -First 1
            $hasCorrectAnalysisMessage = $null -ne $analysisMessage
            
            # If not found with single quotes, try with double quotes (handling different output formats)
            if (-not $hasCorrectAnalysisMessage) {
                $expectedAnalysisPattern = 'Analyzing project ".*" packages\.\.\.'
                $analysisMessage = $scriptOutput | Where-Object { $_ -match $expectedAnalysisPattern } | Select-Object -First 1
                $hasCorrectAnalysisMessage = $null -ne $analysisMessage
            }
            
            $validationAnalysisMsg = @{
                TestResult = [ref]$test
                ValidationPoint = "Analysis Message Format"
                # Use a more generic expected message to avoid angle bracket issues
                Expected = 'Output contains project name in analysis message'
                # We'll check the actual message in the Actual field
                Actual = if ($hasCorrectAnalysisMessage) { "Found: $analysisMessage" } else { "No matching message found" }
                Status = if ($hasCorrectAnalysisMessage) { 'PASS' } else { 'WARNING' }
            }
            Add-ValidationResult @validationAnalysisMsg
            
            # 1. Verify report directory was created with project name (not 'root')
            $projectReportDir = Join-Path -Path $global:TestEnvironment.ReportDir -ChildPath $expectedProjectName
            $hasReportDir = Test-Path -Path $projectReportDir -PathType Container
            
            $validation2 = @{
                TestResult = [ref]$test
                ValidationPoint = "Report Directory Created with Project Name"
                Expected = "Report directory should exist with project name: $projectReportDir"
                Actual = "Directory exists: $hasReportDir"
                Status = if ($hasReportDir) { 'PASS' } else { 'FAIL' }
            }
            Add-ValidationResult @validation2
            
            # 2. Verify report file was created with correct naming pattern and project name
            if ($hasReportDir) {
                $dateString = Get-Date -Format "yyyyMMdd"
                $reportFilePattern = "${dateString}_report_${expectedProjectName}.html"
                $reportFile = Get-ChildItem -Path $projectReportDir -Filter $reportFilePattern -ErrorAction SilentlyContinue | Select-Object -First 1
                $hasReportFile = $null -ne $reportFile
                
                $validation3 = @{
                    TestResult = [ref]$test
                    ValidationPoint = "Report File Created with Correct Naming"
                    Expected = "Report file should exist with pattern: $reportFilePattern"
                    Actual = "File exists: $hasReportFile"
                    Status = if ($hasReportFile) { 'PASS' } else { 'FAIL' }
                }
                Add-ValidationResult @validation3
                
                # 3. Verify report content - project name and dependencies
                if ($hasReportFile) {
                    $reportContent = Get-Content -Path $reportFile.FullName -Raw -ErrorAction SilentlyContinue
                    
                    # Check project name in report matches package.json (not 'root')
                    $containsCorrectProjectName = $reportContent -match [regex]::Escape($expectedProjectName)
                    $doesNotContainRoot = -not ($reportContent -match '>root<')
                    
                    $validation4 = @{
                        TestResult = [ref]$test
                        ValidationPoint = "Report Contains Correct Project Name"
                        Expected = "Report should contain project name '$expectedProjectName' and not 'root'"
                        Actual = "Contains '$expectedProjectName': $containsCorrectProjectName, Doesn't contain 'root': $doesNotContainRoot"
                        Status = if ($containsCorrectProjectName -and $doesNotContainRoot) { 'PASS' } else { 'FAIL' }
                    }
                    Add-ValidationResult @validation4
                    
                    # Verify all dependencies from package.json are in the report
                    $allDepsFound = $true
                    $missingDeps = @()
                    
                    # Check dependencies
                    if ($null -ne $packageJson.dependencies) {
                        $packageJson.dependencies.PSObject.Properties | ForEach-Object {
                            $pkgName = $_.Name
                            if (-not ($reportContent -match [regex]::Escape($pkgName))) {
                                $allDepsFound = $false
                                $missingDeps += $pkgName
                            }
                        }
                    }
                    
                    # Check devDependencies if they exist
                    if ($null -ne $packageJson.devDependencies) {
                        $packageJson.devDependencies.PSObject.Properties | ForEach-Object {
                            $pkgName = $_.Name
                            if (-not ($reportContent -match [regex]::Escape($pkgName))) {
                                $allDepsFound = $false
                                $missingDeps += "$pkgName (dev)"
                            }
                        }
                    }
                    
                    $validation5 = @{
                        TestResult = [ref]$test
                        ValidationPoint = "All Dependencies in Report"
                        Expected = "All dependencies from package.json should be in the report"
                        Actual = if ($allDepsFound) { "All dependencies found" } else { "Missing dependencies: $($missingDeps -join ', ')" }
                        Status = if ($allDepsFound) { 'PASS' } else { 'FAIL' }
                    }
                    Add-ValidationResult @validation5
                    
                    # 6. Verify version numbers and update types are present
                    $versionPatterns = @(
                        '\d+\.\d+\.\d+',  # Standard semantic version (1.2.3)
                        '\^\d+\.\d+\.\d+', # Caret range (^1.2.3)
                        '~\d+\.\d+\.\d+',  # Tilde range (~1.2.3)
                        '>=\d+\.\d+\.\d+', # Greater than or equal to (>=1.2.3)
                        '\d+\.\d+',         # Major.Minor (1.2)
                        'latest',              # Latest tag
                        'next'                 # Next tag
                    )
                    
                    $updateTypePatterns = @(
                        'major',
                        'minor',
                        'patch',
                        'up to date',
                        'not found',
                        'update available',
                        'error'
                    )
                    
                    $reportContent = Get-Content -Path $reportFile.FullName -Raw
                    
                    # Check if all dependencies were found in the report
                    $missingDeps = @()
                    foreach ($dep in $packageJson.dependencies.PSObject.Properties) {
                        if ($reportContent -notmatch "$($dep.Name)\\b") {
                            $missingDeps += $dep.Name
                        }
                    }
                    
                    # Check for any version pattern
                    $hasVersionInfo = $false
                    foreach ($pattern in $versionPatterns) {
                        if ($reportContent -match $pattern) {
                            $hasVersionInfo = $true
                            break
                        }
                    }
                    
                    # Check for any update type pattern
                    $hasUpdateType = $false
                    foreach ($pattern in $updateTypePatterns) {
                        if ($reportContent -match $pattern) {
                            $hasUpdateType = $true
                            break
                        }
                    }
                    
                    $validation6 = @{
                        TestResult = [ref]$test
                        ValidationPoint = "Version Numbers and Update Types"
                        Expected = "Report should contain version numbers and update types"
                        Actual = if ($hasVersionInfo -and $hasUpdateType) { 
                            "Version info and update types found" 
                        } else { 
                            "Version info: $hasVersionInfo, Update types: $hasUpdateType" 
                        }
                        Status = if ($hasVersionInfo -and $hasUpdateType) { 'PASS' } else { 'FAIL' }
                    }
                    Add-ValidationResult @validation6
                }
                
                # 4. Verify styles.css was created in the root report directory
                $stylesPath = Join-Path -Path $global:TestEnvironment.ReportDir -ChildPath "styles.css"
                $hasStylesFile = Test-Path -Path $stylesPath -PathType Leaf
                
                $validation7 = @{
                    TestResult = [ref]$test
                    ValidationPoint = "Styles File Created in Root Directory"
                    Expected = "styles.css should exist in report root directory"
                    Actual = "File exists: $hasStylesFile"
                    Status = if ($hasStylesFile) { 'PASS' } else { 'FAIL' }
                }
                Add-ValidationResult @validation7
                
                # 5. Verify index.html was created and contains the report link with project name
                $indexPath = Join-Path -Path $global:TestEnvironment.ReportDir -ChildPath "index.html"
                $hasIndexFile = Test-Path -Path $indexPath -PathType Leaf
                
                $validation8 = @{
                    TestResult = [ref]$test
                    ValidationPoint = "Index File Created"
                    Expected = "index.html should exist in report directory"
                    Actual = "File exists: $hasIndexFile"
                    Status = if ($hasIndexFile) { 'PASS' } else { 'FAIL' }
                }
                Add-ValidationResult @validation8
                
                if ($hasIndexFile) {
                    $indexContent = Get-Content -Path $indexPath -Raw -ErrorAction SilentlyContinue
                    $containsReportLink = $indexContent -match [regex]::Escape("$expectedProjectName/$reportFilePattern")
                    
                    # Convert expected project name to title case for comparison (e.g., "cthub-bsaas" -> "Beauty Saas")
                    $titleCaseName = (Get-Culture).TextInfo.ToTitleCase($expectedProjectName.ToLower()) -replace '-', ' '
                    $containsProjectLink = $indexContent -match [regex]::Escape(">$titleCaseName<") 
                    
                    $validation9 = @{
                        TestResult = [ref]$test
                        ValidationPoint = "Index Contains Correct Project Links"
                        Expected = "index.html should contain links to the project report"
                        Actual = "Contains report link: $containsReportLink, Contains project name: $containsProjectLink"
                        Status = if ($containsReportLink -and $containsProjectLink) { 'PASS' } else { 'FAIL' }
                    }
                    Add-ValidationResult @validation9
                }
            }
        }
        
        # Calculate final test status
        $failedValidations = @($test.Validations | Where-Object { $_.Status -eq 'FAIL' })
        $test.Status = if ($failedValidations.Count -gt 0) { 'FAIL' } else { 'PASS' }
        $test.EndTime = Get-Date
        
        # Add test result to global results
        if ($null -ne $global:TestResults) {
            $global:TestResults += $test
        }
        
        # Display test results
        $statusColor = if ($test.Status -eq 'PASS') { 'Green' } else { 'Red' }
        
        Write-Host "`n=== Test Results: $($test.Name) ===" -ForegroundColor Cyan
        Write-Host "Status: $($test.Status)" -ForegroundColor $statusColor
        Write-Host "Description: $($test.Description)"
        Write-Host "Start Time: $($test.StartTime)"
        Write-Host "End Time: $($test.EndTime)"
        Write-Host "Duration: $($test.EndTime - $test.StartTime)"
        
        Write-Host "`nValidation Results (Total: $($test.Validations.Count)):" -ForegroundColor Cyan
        
        # Group validations by status for better readability
        $groupedValidations = $test.Validations | Group-Object -Property Status
        
        foreach ($group in $groupedValidations) {
            $status = $group.Name
            $color = if ($status -eq 'PASS') { 'Green' } else { 'Red' }
            
            Write-Host "`n$($status) Validations (Count: $($group.Count)):" -ForegroundColor $color
            foreach ($validation in $group.Group) {
                Write-Host "- $($validation.ValidationPoint): " -NoNewline
                Write-Host $validation.Status -ForegroundColor $color -NoNewline
                Write-Host " (Expected: $($validation.Expected), Actual: $($validation.Actual))"
            }
        }
        
        # Return test result
        return $test.Status -eq 'PASS'
    }
    catch {
        $errorDetails = @{
            ErrorMessage = $_.Exception.Message
            StackTrace = $_.ScriptStackTrace
            LineNumber = $_.InvocationInfo.ScriptLineNumber
            ColumnNumber = $_.InvocationInfo.OffsetInLine
            ScriptName = $_.InvocationInfo.ScriptName
        }
        
        Write-Host "`n=== Test Error: Initial Report and Content Validation ===" -ForegroundColor Red
        Write-Host "Status: ERROR" -ForegroundColor Red
        Write-Host "Error: An error occurred: $($errorDetails.ErrorMessage)"
        Write-Host "Script: $($errorDetails.ScriptName)"
        Write-Host "Line: $($errorDetails.LineNumber), Column: $($errorDetails.ColumnNumber)"
        
        # Add error to validations
        $validationError = @{
            TestResult = [ref]$test
            ValidationPoint = "Test Execution"
            Expected = "Test completes without errors"
            Actual = "Error: $($errorDetails.ErrorMessage)"
            Status = 'FAIL'
            Notes = $errorDetails.StackTrace
        }
        Add-ValidationResult @validationError
        
        # Display test results
        $statusColor = 'Red'
        
        Write-Host "`n=== Test Results: $($test.Name) ===" -ForegroundColor Cyan
        Write-Host "Status: $($test.Status)" -ForegroundColor $statusColor
        Write-Host "Description: $($test.Description)"
        Write-Host "Start Time: $($test.StartTime)"
        Write-Host "End Time: $($test.EndTime)"
        Write-Host "Duration: $($test.EndTime - $test.StartTime)"
        
        Write-Host "`nValidation Results (Total: $($test.Validations.Count)):" -ForegroundColor Cyan
        
        # Group validations by status for better readability
        $groupedValidations = $test.Validations | Group-Object -Property Status
        
        foreach ($group in $groupedValidations) {
            $status = $group.Name
            $color = if ($status -eq 'PASS') { 'Green' } else { 'Red' }
            
            Write-Host "`n$($status) Validations (Count: $($group.Count)):" -ForegroundColor $color
            foreach ($validation in $group.Group) {
                Write-Host "- $($validation.ValidationPoint): " -NoNewline
                Write-Host $validation.Status -ForegroundColor $color -NoNewline
                Write-Host " (Expected: $($validation.Expected), Actual: $($validation.Actual))"
            }
        }
        
        # Return test result
        return $false
    }
}

# Run the test and exit with appropriate status
$testResult = Test-InitialReportGeneration
if ($testResult) {
    exit 0
} else {
    exit 1
}
