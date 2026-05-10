<#
.SYNOPSIS
    Test Case 2: Report Overwrite Check

.DESCRIPTION
    Verifies that running the script multiple times on the same day overwrites the existing report.
    
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
    Name = "Report Overwrite Check"
    Description = "Verify that running the script multiple times on the same day overwrites the existing report."
    Preconditions = "No existing report folder and valid package.json"
    StartTime = Get-Date
    EndTime = $null
    Status = "RUNNING"
    Validations = @()
}

function Test-ReportOverwrite {
    [CmdletBinding()]
    param()
    
    try {
        Write-Host "[TEST] Starting test: $($test.Name)" -ForegroundColor Cyan
        
        # Get the project name from package.json or use parent directory name
        $packageJsonPath = Join-Path -Path $global:TestEnvironment.ProjectRoot -ChildPath "package.json"
        if (Test-Path -Path $packageJsonPath) {
            $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
            $projectName = if ($packageJson.name) { $packageJson.name } else { (Get-Item -Path $global:TestEnvironment.ProjectRoot).Name }
        } else {
            $projectName = (Get-Item -Path $global:TestEnvironment.ProjectRoot).Name
        }
        
        # Ensure report directory exists with the correct project name
        $reportDir = Join-Path -Path $global:TestEnvironment.ReportDir -ChildPath $projectName
        if (-not (Test-Path -Path $reportDir -PathType Container)) {
            New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
            Write-Host "[TEST] Created report directory: $reportDir" -ForegroundColor Yellow
        }
        
        # Create a test report file with today's date
        $dateString = Get-Date -Format "yyyyMMdd"
        $testReportPath = Join-Path -Path $reportDir -ChildPath "${dateString}_report_${projectName}.html"
        
        # Save the original content for comparison
        $testContent = "<html><body>Test Report</body></html>"
        Set-Content -Path $testReportPath -Value $testContent -Force
        Write-Host "[TEST] Created test report at: $testReportPath" -ForegroundColor Yellow
        
        # Get file info before running the script
        $fileBefore = Get-Item -Path $testReportPath -ErrorAction Stop
        $originalLength = $fileBefore.Length
        
        # Run the script
        Write-Host "[TEST] Running script: $($global:TestEnvironment.ScriptPath) -projectName root" -ForegroundColor Cyan
        & $global:TestEnvironment.ScriptPath -projectName root
        $exitCode = $LASTEXITCODE
        
        # Add validation for script exit code
        $status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
        $validationAdded = Add-ValidationResult -TestResult ([ref]$test) `
            -ValidationPoint "Script Exit Code" `
            -Expected "Exit code 0" `
            -Actual "Exit code $exitCode" `
            -Status $status
            
        if (-not $validationAdded) {
            Write-Host "[WARNING] Failed to add validation for script exit code" -ForegroundColor Yellow
        }
        
        # Only continue with validations if the script ran successfully
        if ($exitCode -eq 0) {
            # Check if the file was overwritten
            $fileAfter = Get-Item -Path $testReportPath -ErrorAction Stop
            $newLength = $fileAfter.Length
            $wasOverwritten = $newLength -ne $originalLength
            
            $status = if ($wasOverwritten) { 'PASS' } else { 'FAIL' }
            $expected = if ($wasOverwritten) { "File should be overwritten (size changed from $originalLength to $newLength bytes)" } else { "File should be overwritten" }
            $validationAdded = Add-ValidationResult -TestResult ([ref]$test) `
                -ValidationPoint "Report File Was Overwritten" `
                -Expected $expected `
                -Actual "File size changed: $wasOverwritten" `
                -Status $status
                
            if (-not $validationAdded) {
                Write-Host "[WARNING] Failed to add validation for report file overwrite" -ForegroundColor Yellow
            }
            
            # Verify the new content is valid
            $content = Get-Content -Path $testReportPath -Raw -ErrorAction Stop
            $hasValidContent = $content -match '<!DOCTYPE html>' -and $content -match 'Package Version Report'
            
            $status = if ($hasValidContent) { 'PASS' } else { 'FAIL' }
            $expected = if ($hasValidContent) { "Report contains valid HTML and title" } else { "Report should contain valid HTML and title" }
            $validationAdded = Add-ValidationResult -TestResult ([ref]$test) `
                -ValidationPoint "New Report Content Is Valid" `
                -Expected $expected `
                -Actual "Content valid: $hasValidContent" `
                -Status $status
                
            if (-not $validationAdded) {
                Write-Host "[WARNING] Failed to add validation for report content" -ForegroundColor Yellow
            }
        }
        
        # Calculate final test status
        $failedValidations = @($test.Validations | Where-Object { $_.Status -eq 'FAIL' })
        $test.Status = if ($failedValidations.Count -gt 0) { 'FAIL' } else { 'PASS' }
        $test.EndTime = Get-Date
        
        # Add test result to global results
        $global:TestResults += $test
        
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
        
        Write-Host "`n=== Test Error: Report Overwrite (Root Project) ===" -ForegroundColor Red
        Write-Host "Status: ERROR" -ForegroundColor Red
        Write-Host "Error: An error occurred: $($errorDetails.ErrorMessage)"
        Write-Host "Script: $($errorDetails.ScriptName)"
        Write-Host "Line: $($errorDetails.LineNumber), Column: $($errorDetails.ColumnNumber)"
        
        # Add error to validations
        $validationAdded = Add-ValidationResult -TestResult ([ref]$test) `
            -ValidationPoint 'Test Execution' `
            -Expected 'Test completes without errors' `
            -Actual "Test failed with error: $($errorDetails.ErrorMessage)" `
            -Status 'FAIL'
            
        if (-not $validationAdded) {
            Write-Host "[ERROR] Failed to add error validation: $($errorDetails.ErrorMessage)" -ForegroundColor Red
        }
        
        return $false
    }
}

# Run the test and exit with appropriate status
$testResult = Test-ReportOverwrite
if ($testResult) {
    exit 0
} else {
    exit 1
}
