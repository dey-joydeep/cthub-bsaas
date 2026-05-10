<#
.SYNOPSIS
    Test Case 6: Report Cleanup

.DESCRIPTION
    Verifies that the script enforces the maximum report retention policy by:
    1. Creating 5 reports with dates from previous days
    2. Running the script to generate a new report
    3. Verifying that the oldest report is deleted and a new one is added
    
    Preconditions:
    - No existing reports in the report directory
    - Project root contains a valid package.json
#>

# Import common test framework
. "$PSScriptRoot\common-script-run-test.ps1"

# Initialize test case
$test = @{
    Name = "Report Cleanup and Retention"
    Description = "Verify that the script enforces the maximum report retention policy"
    Preconditions = "No existing reports in the report directory"
    StartTime = Get-Date
    EndTime = $null
    Status = "RUNNING"
    Validations = @()
}

try {
    Write-Host "[TEST] Starting test: $($test.Name)" -ForegroundColor Cyan
    
    # Get the project name from package.json
    $packageJsonPath = Join-Path -Path $global:TestEnvironment.ProjectRoot -ChildPath "package.json"
    $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
    $projectName = $packageJson.name
    
    # Clean up any existing report folder
    $reportDir = Join-Path -Path $global:TestEnvironment.ReportDir -ChildPath $projectName
    if (Test-Path -Path $reportDir) {
        Write-Host "[TEST] Cleaning up existing report directory: $reportDir" -ForegroundColor Yellow
        Remove-Item -Path $reportDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Create a test directory for reports
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    
    # Create 5 dummy report files with different dates (4-8 days old)
    $today = Get-Date
    $reportFiles = @()
    for ($i = 1; $i -le 5; $i++) {
        $date = $today.AddDays(-1 * (8 - $i))  # Dates from 7 to 3 days ago
        $dateString = $date.ToString("yyyyMMdd")
        $dummyReport = Join-Path -Path $reportDir -ChildPath "${dateString}_report_${projectName}.html"
        
        # Create a dummy report file with the date in its content
        Set-Content -Path $dummyReport -Value "<html><body>Dummy report from $($date.ToShortDateString())</body></html>"
        $reportFiles += $dummyReport
        
        # Set the file's last write time to the report date
        (Get-Item $dummyReport).LastWriteTime = $date
    }
    
    # Verify we have 5 report files
    $initialReportCount = (Get-ChildItem -Path $reportDir -Filter "*_report_*.html").Count
    
    $test.Validations += @{
        ValidationPoint = "Initial report count"
        Expected = 5
        Actual = $initialReportCount
        Status = if ($initialReportCount -eq 5) { 'PASS' } else { 'FAIL' }
    }
    
    # Run the script to generate a new report
    Write-Host "[TEST] Running script to test report cleanup" -ForegroundColor Cyan
    & $global:TestEnvironment.ScriptPath -projectName $projectName
    $exitCode = $LASTEXITCODE
    
    # Verify script exit code
    $test.Validations += @{
        ValidationPoint = "Script exit code"
        Expected = 0
        Actual = $exitCode
        Status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    }
    
    if ($exitCode -eq 0) {
        # Get the list of reports after running the script
        $reportsAfter = Get-ChildItem -Path $reportDir -Filter "*_report_*.html" | 
                       Sort-Object LastWriteTime -Descending
        
        $reportCountAfter = $reportsAfter.Count
        
        # Verify we still have 5 reports (oldest should be deleted, new one added)
        $test.Validations += @{
            ValidationPoint = "Report count after cleanup"
            Expected = 5
            Actual = $reportCountAfter
            Status = if ($reportCountAfter -eq 5) { 'PASS' } else { 'FAIL' }
        }
        
        # Verify the oldest report was deleted (the one from 7 days ago)
        $oldestReportDate = $today.AddDays(-7).ToString("yyyyMMdd")
        $oldestReportPath = Join-Path -Path $reportDir -ChildPath "${oldestReportDate}_report_${projectName}.html"
        $oldestReportExists = Test-Path -Path $oldestReportPath -PathType Leaf
        
        $test.Validations += @{
            ValidationPoint = "Oldest report was deleted"
            Expected = $false
            Actual = $oldestReportExists
            Status = if (-not $oldestReportExists) { 'PASS' } else { 'FAIL' }
        }
        
        # Verify the new report was created
        $todayString = $today.ToString("yyyyMMdd")
        $newReportPath = Join-Path -Path $reportDir -ChildPath "${todayString}_report_${projectName}.html"
        $newReportExists = Test-Path -Path $newReportPath -PathType Leaf
        
        $test.Validations += @{
            ValidationPoint = "New report was created"
            Expected = $true
            Actual = $newReportExists
            Status = if ($newReportExists) { 'PASS' } else { 'FAIL' }
        }
        
        # Verify the index was updated
        $indexPath = Join-Path -Path $global:TestEnvironment.ReportDir -ChildPath "index.html"
        $indexExists = Test-Path -Path $indexPath -PathType Leaf
        
        $test.Validations += @{
            ValidationPoint = "Index file exists"
            Expected = $true
            Actual = $indexExists
            Status = if ($indexExists) { 'PASS' } else { 'FAIL' }
        }
    }
    
    # Calculate final test status
    $failedValidations = @($test.Validations | Where-Object { $_.Status -eq 'FAIL' })
    $test.Status = if ($failedValidations.Count -gt 0) { 'FAIL' } else { 'PASS' }
    
} catch {
    $test.Status = 'FAIL'
    $test.Validations += @{
        ValidationPoint = "Unhandled exception"
        Expected = "No exceptions"
        Actual = $_.Exception.Message
        Status = 'FAIL'
    }
    
    # Add stack trace to output
    Write-Host "[ERROR] $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
    
} finally {
    $test.EndTime = Get-Date
    $test.Duration = $test.EndTime - $test.StartTime
    
    # Display test results
    Write-Host "`n=== Test Results: $($test.Name) ===" -ForegroundColor Cyan
    Write-Host "Status: $($test.Status)" -ForegroundColor $(if ($test.Status -eq 'PASS') { 'Green' } else { 'Red' })
    Write-Host "Duration: $($test.Duration.TotalSeconds.ToString('0.00')) seconds"
    
    # Display validation results
    Write-Host "`nValidations:" -ForegroundColor Cyan
    foreach ($validation in $test.Validations) {
        $statusColor = if ($validation.Status -eq 'PASS') { 'Green' } else { 'Red' }
        Write-Host "- [$($validation.Status)] $($validation.ValidationPoint)" -ForegroundColor $statusColor
        Write-Host "  Expected: $($validation.Expected)" -ForegroundColor Gray
        Write-Host "  Actual  : $($validation.Actual)" -ForegroundColor Gray
    }
    
    # Exit with appropriate status code
    if ($test.Status -eq 'PASS') {
        Write-Host "`nTest completed successfully!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`nTest failed with $($failedValidations.Count) validation error(s)." -ForegroundColor Red
        exit 1
    }
}
