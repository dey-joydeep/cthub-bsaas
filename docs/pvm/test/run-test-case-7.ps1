<#
.SYNOPSIS
    Test Case 7: Project Without package.json

.DESCRIPTION
    Verifies that the script handles projects without a package.json file correctly.
    The script should exit with an error and no report should be created.
    
    Common Validations:
    1. Script exits with non-zero status
    2. No report directory is created
    3. Appropriate error message is displayed
#>

# Import common test framework
. "$PSScriptRoot\common-script-run-test.ps1"

# Initialize test case
$test = @{
    Name = "Project Without package.json"
    Description = "Verify that the script handles projects without a package.json file correctly."
    Preconditions = "Test directory without package.json"
    StartTime = Get-Date
    EndTime = $null
    Status = "RUNNING"
    Validations = @()
}

function Test-ProjectWithoutPackageJson {
    [CmdletBinding()]
    param()
    
    try {
        Write-Host "[TEST] Starting test: $($test.Name)" -ForegroundColor Cyan
        
        # Create a temporary test directory without package.json
        $tempTestDir = Join-Path -Path $global:TestEnvironment.TestDataDir -ChildPath "test-project-no-pkg"
        $null = New-Item -ItemType Directory -Path $tempTestDir -Force -ErrorAction Stop
        
        # Ensure the directory is empty
        Get-ChildItem -Path $tempTestDir -Force | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
        
        # Run the script and capture output
        $scriptOutput = @()
        $exitCode = 0
        
        try {
            # Run the script and capture all output streams
            $scriptOutput = & $global:TestEnvironment.ScriptPath -projectName $tempTestDir 2>&1 | ForEach-Object { 
                if ($_ -is [System.Management.Automation.ErrorRecord]) {
                    # Convert error records to strings
                    $_.Exception.Message
                } else {
                    $_
                }
            }
        } catch {
            $scriptOutput += $_.Exception.Message
            $exitCode = 1
        }
        
        if ($LASTEXITCODE -ne 0) {
            $exitCode = $LASTEXITCODE
        }
        
        # 1. Verify the script failed (non-zero exit code)
        $test.Validations += @{
            Name = "Script Execution"
            Status = if ($exitCode -ne 0) { "PASS" } else { "FAIL" }
            Message = if ($exitCode -ne 0) { "Script failed as expected" } else { "Script should have failed" }
            Details = "Exit code: $exitCode"
        }
        
        # 2. Verify the error message is appropriate
        $errorMessage = $scriptOutput -join "`n"
        $hasCorrectErrorMessage = $errorMessage -match "Project directory not found|package\.json not found|not a valid project directory"
        
        $test.Validations += @{
            Name = "Error Message"
            Status = if ($hasCorrectErrorMessage) { "PASS" } else { "FAIL" }
            Message = if ($hasCorrectErrorMessage) { "Correct error message" } else { "Incorrect or missing error message" }
            Details = "Error message: $errorMessage"
        }
        
        # 3. Verify no report directory was created
        $reportDir = Join-Path -Path $global:TestEnvironment.ReportDir -ChildPath (Split-Path -Leaf $tempTestDir)
        $reportDirExists = Test-Path -Path $reportDir -PathType Container
        
        $test.Validations += @{
            Name = "Report Directory"
            Status = if (-not $reportDirExists) { "PASS" } else { "FAIL" }
            Message = if (-not $reportDirExists) { "No report directory was created" } else { "Report directory should not have been created" }
            Details = "Report directory exists: $reportDirExists"
        }
        
        # Clean up
        Remove-Item -Path $tempTestDir -Recurse -Force -ErrorAction SilentlyContinue
        
        # Calculate final test status
        $failedValidations = @($test.Validations | Where-Object { $_.Status -eq 'FAIL' })
        $test.Status = if ($failedValidations.Count -gt 0) { 'FAIL' } else { 'PASS' }
        
        # Add test results to global results
        $test.EndTime = Get-Date
        $test.Duration = $test.EndTime - $test.StartTime
        
        # Create a simplified result object
        $result = [PSCustomObject]@{
            Number = 7
            Name = $test.Name
            Status = $test.Status
            StartTime = $test.StartTime
            EndTime = $test.EndTime
            Duration = $test.Duration
            Validations = $test.Validations
        }
        
        # Output the results
        Write-Host "`n=== Test Results ===" -ForegroundColor Cyan
        Write-Host "Test Case 7: $($test.Name)" -ForegroundColor White
        Write-Host "Status: $($test.Status)" -ForegroundColor $(if ($test.Status -eq 'PASS') { 'Green' } else { 'Red' })
        Write-Host "Duration: $($test.Duration.TotalSeconds.ToString('0.00')) seconds" -ForegroundColor White
        
        Write-Host "`nValidations:" -ForegroundColor Cyan
        foreach ($validation in $test.Validations) {
            $statusColor = if ($validation.Status -eq 'PASS') { 'Green' } else { 'Red' }
            Write-Host "- $($validation.Name): " -NoNewline
            Write-Host $validation.Status -ForegroundColor $statusColor
            Write-Host "  $($validation.Message)" -ForegroundColor White
            if ($validation.Details) {
                Write-Host "  Details: $($validation.Details)" -ForegroundColor Gray
            }
        }
        
        return $result
    }
    catch {
        $errorDetails = @{
            ErrorMessage = $_.Exception.Message
            StackTrace = $_.ScriptStackTrace
            Line = $_.InvocationInfo.ScriptLineNumber
            LineText = $_.InvocationInfo.Line
        }
        
        $test.Validations += @{
            Name = "Test Execution"
            Status = "FAIL"
            Message = "Unexpected error occurred during test execution"
            Details = $errorDetails | ConvertTo-Json -Depth 5
        }
        
        $test.Status = "FAIL"
        $test.EndTime = Get-Date
        $test.Duration = $test.EndTime - $test.StartTime
        
        # Output error details
        Write-Host "`n[ERROR] Test failed with unexpected error:" -ForegroundColor Red
        Write-Host $errorDetails.ErrorMessage -ForegroundColor Red
        Write-Host "At line $($errorDetails.Line): $($errorDetails.LineText)" -ForegroundColor Red
        
        # Create a result object for the failed test
        return [PSCustomObject]@{
            Number = 7
            Name = $test.Name
            Status = "FAIL"
            StartTime = $test.StartTime
            EndTime = $test.EndTime
            Duration = $test.Duration
            Validations = $test.Validations
            Error = $errorDetails
        }
    }
}

# Run the test and exit with appropriate status
$testResult = Test-ProjectWithoutPackageJson
if ($testResult) {
    # Add to global test results
    $global:TestResults += $testResult
    
    # Exit with non-zero code if test failed
    if ($testResult.Status -ne 'PASS') {
        exit 1
    }
}
exit 0
