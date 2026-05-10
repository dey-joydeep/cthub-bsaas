<#
.SYNOPSIS
    Test Case 4: Report Overwrite (Existing Today's Report)

.DESCRIPTION
    Verifies that when 5 reports exist (4 historical + 1 today's), running the script again
    will overwrite today's report without deleting historical reports.
    
    Preconditions:
    - Test Case 3 has already run, creating an index file and today's report
    - Project directory exists with a valid package.json
#>

# Import common test framework
. "$PSScriptRoot\common-script-run-test.ps1"

function Test-ReportOrder {
    [CmdletBinding()]
    param(
        [string]$IndexPath,
        [string]$ProjectName
    )
    
    $indexContent = Get-Content -Path $IndexPath -Raw
    $reportLinks = [regex]::Matches($indexContent, "${ProjectName}/\d{8}_report_${ProjectName}\.html") | 
        ForEach-Object { $_.Value } | 
        Sort-Object -Descending
    
    # Extract just the date part for comparison
    $dates = $reportLinks | ForEach-Object { 
        if ($_ -match '(\d{8})_report_') { $matches[1] }
    }
    
    # Check if dates are in descending order
    $isOrdered = $true
    for ($i = 0; $i -lt $dates.Count - 1; $i++) {
        if ([int]$dates[$i] -lt [int]$dates[$i + 1]) {
            $isOrdered = $false
            break
        }
    }
    
    return @{
        IsOrdered = $isOrdered
        ReportLinks = $reportLinks
        Dates = $dates
    }
}

function Test-ReportOverwrite {
    [CmdletBinding()]
    param()
    
    # Initialize test case
    $test = @{
        Name = "Report Overwrite (Existing Today's Report)"
        Description = "Verify that when 5 reports exist (4 historical + 1 today's), running the script again will overwrite today's report without deleting historical reports"
        Preconditions = "Test Case 3 has already run, creating an index file and today's report"
        StartTime = Get-Date
        EndTime = $null
        Status = "RUNNING"
        Validations = @()
        TestData = @{
            ProjectName = "bsaas-front"
            HistoricalReportDates = @(
                (Get-Date).AddDays(-4).ToString("yyyyMMdd"),
                (Get-Date).AddDays(-3).ToString("yyyyMMdd"),
                (Get-Date).AddDays(-2).ToString("yyyyMMdd"),
                (Get-Date).AddDays(-1).ToString("yyyyMMdd")
            )
            TodaysReportDate = (Get-Date).ToString("yyyyMMdd")
        }
    }
    
    try {
        Write-Host "[TEST] Starting test: $($test.Name)" -ForegroundColor Cyan
        
        # Initialize variables
        $projectName = $test.TestData.ProjectName
        
        # Get script path from test environment
        $scriptPath = $global:TestEnvironment.ScriptPath
        
        # Set up paths - use the same path resolution as the main script
        $scriptDir = Split-Path -Path $PSScriptRoot -Parent
        $projectRoot = (Get-Item (Split-Path (Split-Path $scriptDir -Parent) -Parent)).FullName
        $projectDir = Join-Path -Path $projectRoot -ChildPath $projectName
        $reportBaseDir = Join-Path -Path $scriptDir -ChildPath "report"
        $reportDir = Join-Path -Path $reportBaseDir -ChildPath $projectName
        $reportIndexPath = Join-Path -Path $reportBaseDir -ChildPath "index.html"
        
        # Ensure report directories exist
        if (-not (Test-Path -Path $reportBaseDir)) {
            New-Item -ItemType Directory -Path $reportBaseDir -Force | Out-Null
        }
        if (-not (Test-Path -Path $reportDir)) {
            New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
        }
        
        # Debug output
        Write-Host "[DEBUG] Script path: $scriptPath" -ForegroundColor DarkGray
        Write-Host "[DEBUG] Project dir: $projectDir" -ForegroundColor DarkGray
        Write-Host "[DEBUG] Report base dir: $reportBaseDir" -ForegroundColor DarkGray
        Write-Host "[DEBUG] Report dir: $reportDir" -ForegroundColor DarkGray
        Write-Host "[DEBUG] Report index: $reportIndexPath" -ForegroundColor DarkGray
        
        # Verify directories exist
        if (-not (Test-Path -Path $projectDir)) { throw "Project directory not found: $projectDir" }
        if (-not (Test-Path -Path $reportDir)) { throw "Report directory not found: $reportDir" }
        if (-not (Test-Path -Path $reportIndexPath)) { throw "Report index not found: $reportIndexPath" }
        
        # Validate preconditions
        if (-not $scriptPath) { throw "TestEnvironment.ScriptPath is not set" }
        if (-not (Test-Path -Path $projectDir)) { throw "Project directory not found: $projectDir" }
        
        # Ensure package.json exists in project directory
        $packageJsonPath = Join-Path -Path $projectDir -ChildPath "package.json"
        if (-not (Test-Path -Path $packageJsonPath)) {
            throw "package.json not found in project directory: $packageJsonPath"
        }
        
        # Ensure report directory exists (from Test Case 3)
        if (-not (Test-Path -Path $reportDir)) {
            throw "Report directory not found. Please run Test Case 3 first: $reportDir"
        }
        
        # Ensure index.html exists (from Test Case 3)
        if (-not (Test-Path -Path $reportIndexPath)) {
            throw "index.html not found. Please run Test Case 3 first: $reportIndexPath"
        }
        
        # Create historical reports if they don't exist
        $historicalReports = @()
        foreach ($date in $test.TestData.HistoricalReportDates) {
            $reportName = "${date}_report_${projectName}.html"
            $reportPath = Join-Path -Path $reportDir -ChildPath $reportName
            
            if (-not (Test-Path -Path $reportPath)) {
                $content = @"
<!DOCTYPE html>
<html>
<head>
    <title>Report for $projectName - $date</title>
</head>
<body>
    <h1>Historical Report</h1>
    <p>Project: $projectName</p>
    <p>Date: $date</p>
</body>
</html>
"@
                $content | Out-File -FilePath $reportPath -Force
                Write-Host "[TEST] Created historical report: $reportPath" -ForegroundColor Cyan
            } else {
                Write-Host "[TEST] Using existing historical report: $reportPath" -ForegroundColor Cyan
            }
            
            $historicalReports += $reportPath
        }
        
        # Get today's report (from Test Case 3)
        $todaysReportName = "$($test.TestData.TodaysReportDate)_report_${projectName}.html"
        $todaysReportPath = Join-Path -Path $reportDir -ChildPath $todaysReportName
        
        if (-not (Test-Path -Path $todaysReportPath)) {
            throw "Today's report not found. Please run Test Case 3 first: $todaysReportPath"
        }
        
        # Record initial state
        $initialReports = Get-ChildItem -Path $reportDir -Filter "*_report_*.html" | Sort-Object Name
        $initialContentMap = @{}
        $initialTimestamps = @{}
        
        foreach ($report in $initialReports) {
            $initialContentMap[$report.Name] = Get-Content -Path $report.FullName -Raw
            $initialTimestamps[$report.Name] = $report.LastWriteTime
        }
        
        # Verify we have at least 5 reports (4 historical + 1 today's)
        if ($initialReports.Count -lt 5) {
            throw "Expected at least 5 reports but found $($initialReports.Count)"
        }
        
        # Record initial index content
        $initialIndexContent = Get-Content -Path $reportIndexPath -Raw
        
        # Run the package version checker script with debug output
        Write-Host "[TEST] Running package version checker script..." -ForegroundColor Cyan
        Write-Host "[DEBUG] Script path: $scriptPath" -ForegroundColor DarkGray
        Write-Host "[DEBUG] Project name: $projectName" -ForegroundColor DarkGray
        Write-Host "[DEBUG] Project directory: $projectDir" -ForegroundColor DarkGray
        
        # Run the script with just the project name, not the full path
        $output = & $scriptPath -ProjectName $projectName 2>&1 | Out-String
        
        # Output the script's output for debugging
        Write-Host "[DEBUG] Script output: $output" -ForegroundColor DarkGray
        
        if ($LASTEXITCODE -ne 0) {
            throw "Script failed with exit code $LASTEXITCODE. Output: $output"
        }
        
        # Verify results
        Write-Host "[TEST] Verifying results..." -ForegroundColor Cyan
        
        # 1. Check that we still have the same number of reports
        $finalReports = Get-ChildItem -Path $reportDir -Filter "*_report_*.html" | Sort-Object Name
        if ($finalReports.Count -ne $initialReports.Count) {
            throw "Expected $($initialReports.Count) reports after script execution but found $($finalReports.Count)"
        }
        
        # 2. Check that today's report was updated (new timestamp)
        $finalTodaysReport = Get-Item -Path $todaysReportPath
        if ($finalTodaysReport.LastWriteTime -le $initialTimestamps[$finalTodaysReport.Name]) {
            throw "Today's report was not updated (timestamp not changed)"
        }
        
        # 3. Verify historical reports were not modified
        foreach ($report in $finalReports) {
            if ($report.Name -eq $todaysReportName) { continue } # Skip today's report
            
            if ($report.LastWriteTime -ne $initialTimestamps[$report.Name]) {
                throw "Historical report was modified: $($report.Name)"
            }
            
            $currentContent = Get-Content -Path $report.FullName -Raw
            if ($currentContent -ne $initialContentMap[$report.Name]) {
                throw "Historical report content was modified: $($report.Name)"
            }
        }
        
        # 4. Verify index was updated
        $finalIndexContent = Get-Content -Path $reportIndexPath -Raw
        if ($finalIndexContent -eq $initialIndexContent) {
            throw "Index file was not updated"
        }
        
        # 5. Verify index contains link to today's report
        if ($finalIndexContent -notmatch [regex]::Escape($todaysReportName)) {
            throw "Index file does not contain link to today's report"
        }
        
        # 6. Verify index.html lists reports in descending order (newest first)
        $reportOrder = Test-ReportOrder -IndexPath $reportIndexPath -ProjectName $projectName
        if (-not $reportOrder.IsOrdered) {
            $errorMessage = "Reports in index.html are not in descending order.`n"
            $errorMessage += "Expected order (newest first):`n"
            $errorMessage += ($reportOrder.Dates | Sort-Object -Descending) -join "`n"
            $errorMessage += "`nActual order:`n"
            $errorMessage += $reportOrder.Dates -join "`n"
            throw $errorMessage
        }
        
        # Log the report order for debugging
        Write-Host "[DEBUG] Reports in index.html (newest first):" -ForegroundColor DarkGray
        $reportOrder.ReportLinks | ForEach-Object { Write-Host "  - $_" -ForegroundColor DarkGray }
        
        # Test passed
        $test.Status = "PASSED"
        Write-Host "[TEST] Test passed successfully" -ForegroundColor Green
        
    } catch {
        $test.Status = "FAILED"
        $test.Error = $_.Exception.Message
        Write-Host "[TEST] Test failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
    } finally {
        $test.EndTime = Get-Date
        $test.Duration = $test.EndTime - $test.StartTime
        
        # Add test results to global test results
        $global:TestResults += $test
        
        # Output test results
        Write-Host "`n[TEST] Test Results:" -ForegroundColor Cyan
        Write-Host "  Name: $($test.Name)"
        Write-Host "  Status: $($test.Status)"
        if ($test.Status -eq "FAILED") {
            Write-Host "  Error: $($test.Error)" -ForegroundColor Red
        }
        Write-Host "  Duration: $($test.Duration.TotalSeconds.ToString('0.00')) seconds"
        
        # Store test result in a variable
        $script:testResult = $test.Status -eq "PASSED"
    }
}

# Run the test and exit with appropriate status
$testResult = $false
Test-ReportOverwrite | Out-Null

if ($script:testResult) {
    exit 0
} else {
    exit 1
}
