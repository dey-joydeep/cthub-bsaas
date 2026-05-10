<#
.SYNOPSIS
    Test Case 3: Multi-Project Support

.DESCRIPTION
    Verifies that the script correctly handles multiple project directories.
    
    Preconditions:
    - The bsaas-front project exists in the workspace
    - The project has a valid package.json file
#>

# Import common test framework
. "$PSScriptRoot\common-script-run-test.ps1"

function Test-MultiProjectSupport {
    # Initialize test case
    $test = @{
        Name = "Multi-Project Support"
        Description = "Verify that the script correctly handles multiple project directories"
        Preconditions = "The bsaas-front project exists in the workspace"
        StartTime = Get-Date
        EndTime = $null
        Status = "RUNNING"
        Validations = @()
    }
    
    try {
        Write-Host "[TEST] Starting test: $($test.Name)" -ForegroundColor Cyan
        
        # Define the project name to test
        $projectName = "bsaas-front"
        
        # Get the path to the project (bsaas-front is at the same level as bsaas-docs)
        $workspaceRoot = (Get-Item (Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent)).FullName
        $projectPath = Join-Path -Path $workspaceRoot -ChildPath $projectName
        $packageJsonPath = Join-Path -Path $projectPath -ChildPath "package.json"
        
        Write-Host "[TEST] Looking for package.json at: $packageJsonPath" -ForegroundColor Cyan
        
        # Verify the project exists and has a package.json
        if (-not (Test-Path -Path $packageJsonPath -PathType Leaf)) {
            throw "Package.json not found at: $packageJsonPath"
        }
        
        # Record the last modified time of styles.css
        $stylesPath = Join-Path -Path $global:TestEnvironment.ReportDir -ChildPath "styles.css"
        $stylesLastModified = if (Test-Path -Path $stylesPath) { 
            (Get-Item $stylesPath).LastWriteTime 
        } else { 
            $null 
        }
        
        # Clean up any existing reports for this project
        $reportDir = Join-Path -Path $global:TestEnvironment.ReportDir -ChildPath $projectName
        if (Test-Path -Path $reportDir) {
            Write-Host "[TEST] Cleaning up existing report directory: $reportDir" -ForegroundColor Yellow
            Remove-Item -Path "$reportDir\*" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # Run the script with the project name
        Write-Host "[TEST] Running script: $($global:TestEnvironment.ScriptPath) -projectName $projectName" -ForegroundColor Cyan
        & $global:TestEnvironment.ScriptPath -projectName $projectName
        $exitCode = $LASTEXITCODE
        
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
            # 1. Verify report directory was created
            $hasReportDir = Test-Path -Path $reportDir -PathType Container
            
            $validation2 = @{
                TestResult = [ref]$test
                ValidationPoint = "Report Directory Created"
                Expected = "Report directory should exist for project: $projectName"
                Actual = "Directory exists: $hasReportDir"
                Status = if ($hasReportDir) { 'PASS' } else { 'FAIL' }
            }
            Add-ValidationResult @validation2
            
            # 2. Verify report file was created with correct naming pattern
            if ($hasReportDir) {
                $dateString = Get-Date -Format "yyyyMMdd"
                $reportFilePattern = "${dateString}_report_${projectName}.html"
                $reportFile = Get-ChildItem -Path $reportDir -Filter $reportFilePattern -ErrorAction SilentlyContinue | Select-Object -First 1
                $hasReportFile = $null -ne $reportFile
                
                $validation3 = @{
                    TestResult = [ref]$test
                    ValidationPoint = "Report File Created"
                    Expected = "Report file should exist with pattern: $reportFilePattern"
                    Actual = "File exists: $hasReportFile"
                    Status = if ($hasReportFile) { 'PASS' } else { 'FAIL' }
                }
                Add-ValidationResult @validation3
                
                # 3. Verify report content contains project data
                if ($hasReportFile) {
                    $reportContent = Get-Content -Path $reportFile.FullName -Raw -ErrorAction SilentlyContinue
                    $containsProjectData = $reportContent -match "$projectName" -and $reportContent -match "dependencies"
                    
                    $validation4 = @{
                        TestResult = [ref]$test
                        ValidationPoint = "Report Content Contains Project Data"
                        Expected = "Report should contain project name and dependencies"
                        Actual = "Contains project data: $containsProjectData"
                        Status = if ($containsProjectData) { 'PASS' } else { 'FAIL' }
                    }
                    Add-ValidationResult @validation4
                }
                
                # 4. Verify styles.css was not modified (should only be created once)
                $stylesModified = if ($null -eq $stylesLastModified) {
                    $false  # No styles.css before, so it's not modified
                } else {
                    (Get-Item $stylesPath).LastWriteTime -ne $stylesLastModified
                }
                
                $validation5 = @{
                    TestResult = [ref]$test
                    ValidationPoint = "Styles File Not Modified"
                    Expected = "styles.css should not be modified when running for additional projects"
                    Actual = "Styles modified: $stylesModified"
                    Status = if (-not $stylesModified) { 'PASS' } else { 'WARNING' }
                    Notes = "This is a warning, not a failure, as it doesn't affect functionality"
                }
                Add-ValidationResult @validation5
                
                # 5. Verify index.html was updated with the new project
                $indexPath = Join-Path -Path $global:TestEnvironment.ReportDir -ChildPath "index.html"
                if (Test-Path -Path $indexPath) {
                    $indexContent = Get-Content -Path $indexPath -Raw -ErrorAction SilentlyContinue
                    $containsProjectLink = $indexContent -match [regex]::Escape("$projectName/") -and $indexContent -match [regex]::Escape($reportFilePattern)
                    
                    $validation6 = @{
                        TestResult = [ref]$test
                        ValidationPoint = "Index Updated with Project"
                        Expected = "index.html should contain a link to the new project report"
                        Actual = "Contains project link: $containsProjectLink"
                        Status = if ($containsProjectLink) { 'PASS' } else { 'FAIL' }
                    }
                    Add-ValidationResult @validation6
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
        
        Write-Host "`n=== Test Error: Root Project Name Extraction ===" -ForegroundColor Red
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
if (Test-MultiProjectSupport) {
    exit 0
} else {
    exit 1
}
