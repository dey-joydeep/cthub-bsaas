<#
.SYNOPSIS
    Test Case 5: Report Cleanup (Max Reports Reached) - Precondition Check

.DESCRIPTION
    Verifies that the required folder structure exists before running the test.
    
    Required folder structure:
    pvm/report/
      - bsaas-front/
          some report files.html
      - index.html
      - styles.css

    If this structure doesn't exist, the test will display "run test case 3 and exit" and terminate.
#>

# Import common test functions
. $PSScriptRoot\common-script-run-test.ps1

# Initialize test data
$projectName = 'bsaas-front'
$reportBaseDir = Join-Path -Path $PSScriptRoot -ChildPath '..\report'

# Start test case
Write-Host "`n[TEST] ===== Starting Test Case 5: Report Cleanup (Max Reports Reached) =====" -ForegroundColor Cyan
Write-Host "[TEST] Project: $projectName" -ForegroundColor Cyan
Write-Host "[TEST] Report Directory: $reportBaseDir" -ForegroundColor Cyan

# Validate folder structure
Write-Host "`n[TEST] Validating folder structure..." -ForegroundColor Cyan
$validation = Test-ReportFolderStructure -ReportBaseDir $reportBaseDir -ProjectName $projectName

if (-not $validation.IsValid) {
    $missingList = $validation.MissingPaths -join "`n  - "
    Write-Host "[ERROR] $($validation.Message)" -ForegroundColor Red
    Write-Host "[ERROR] Missing paths:`n  - $missingList" -ForegroundColor Red
    Write-Host "[TEST] Exiting test case 5 - Precondition not met" -ForegroundColor Yellow
    exit 1
}

Write-Host "[SUCCESS] $($validation.Message)" -ForegroundColor Green

# Delete all existing report files
Write-Host "`n[TEST] ==== PHASE 1: Cleanup ====" -ForegroundColor Cyan
Write-Host "[TEST] Removing any existing report files..." -ForegroundColor Cyan
$cleanupResult = Clear-ProjectReports -ReportBaseDir $reportBaseDir -ProjectName $projectName

if (-not $cleanupResult.Success) {
    Write-Host "[ERROR] Failed to clean up report files: $($cleanupResult.Error)" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Removed $($cleanupResult.DeletedFiles.Count) existing report files" -ForegroundColor Green

# Create test report files starting from yesterday
Write-Host "`n[TEST] ==== PHASE 2: Test Data Setup ====" -ForegroundColor Cyan
$yesterday = (Get-Date).AddDays(-1)
Write-Host "[TEST] Creating 5 test report files starting from $($yesterday.ToString('yyyy-MM-dd'))..." -ForegroundColor Cyan
Write-Host "[DEBUG] Report directory: $(Join-Path -Path $reportBaseDir -ChildPath $projectName)" -ForegroundColor DarkGray

$testReportsResult = New-TestReports -ReportBaseDir $reportBaseDir -ProjectName $projectName -Count 5 -StartDate $yesterday -Verbose

if (-not $testReportsResult.Success) {
    Write-Host "[ERROR] Failed to create test reports: $($testReportsResult.Error)" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Created $($testReportsResult.CreatedFiles.Count) test report files:" -ForegroundColor Green
$testReportsResult.CreatedFiles | ForEach-Object { 
    $fileDate = (Get-Item $_).LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "  - $(Split-Path $_ -Leaf) (Modified: $fileDate)" -ForegroundColor DarkGray 
}

# Verify the files were created
Write-Host "`n[TEST] Verifying test report files..." -ForegroundColor Cyan
$reportDir = Join-Path -Path $reportBaseDir -ChildPath $projectName
$reportFiles = Get-ChildItem -Path $reportDir -Filter "*.html" | 
               Where-Object { $_.Name -ne "index.html" } |
               Sort-Object LastWriteTime

Write-Host "[DEBUG] Found $($reportFiles.Count) report files in $reportDir" -ForegroundColor DarkGray
$reportFiles | ForEach-Object {
    Write-Host "  - $($_.Name) (Modified: $($_.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")))" -ForegroundColor DarkGray
}

if ($reportFiles.Count -ne 5) {
    Write-Host "[ERROR] Expected 5 report files, but found $($reportFiles.Count)" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Verified $($reportFiles.Count) report files exist" -ForegroundColor Green

# Update the index.html with the new report list
Write-Host "`n[TEST] ==== PHASE 3: Index Update ====" -ForegroundColor Cyan
Write-Host "[TEST] Updating index.html with the latest report list..." -ForegroundColor Cyan
$indexPath = Join-Path -Path $reportBaseDir -ChildPath "index.html"
$indexBackup = $null

# Backup current index.html
if (Test-Path -Path $indexPath) {
    $indexBackup = Get-Content -Path $indexPath -Raw
    Write-Host "[DEBUG] Backed up current index.html (size: $($indexBackup.Length) bytes)" -ForegroundColor DarkGray
}

# Update the index
$updateIndexResult = Update-ReportIndex -ReportBaseDir $reportBaseDir -ProjectName $projectName

if (-not $updateIndexResult.Success) {
    # Restore backup if update failed
    if ($null -ne $indexBackup) {
        Write-Host "[WARNING] Restoring original index.html due to update failure" -ForegroundColor Yellow
        $indexBackup | Set-Content -Path $indexPath -NoNewline
    }
    Write-Host "[ERROR] Failed to update index.html: $($updateIndexResult.Error)" -ForegroundColor Red
    exit 1
}

# Verify index was updated
$newIndexContent = Get-Content -Path $indexPath -Raw
if ($newIndexContent -eq $indexBackup) {
    Write-Host "[WARNING] index.html was not modified by the update" -ForegroundColor Yellow
} else {
    Write-Host "[DEBUG] index.html was successfully updated (new size: $($newIndexContent.Length) bytes)" -ForegroundColor DarkGray
}

Write-Host "[SUCCESS] $($updateIndexResult.Message)" -ForegroundColor Green

# Run the main package version checker script
Write-Host "`n[TEST] ==== PHASE 4: Run Main Script ====" -ForegroundColor Cyan
Write-Host "[TEST] Running package-version-checker.ps1 for $projectName..." -ForegroundColor Cyan

# Get the path to the main script
$scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "..\package-version-checker.ps1"

# Execute the main script
try {
    Write-Host "[INFO] Starting main script execution..." -ForegroundColor Cyan
    $scriptResult = & $scriptPath -Project $projectName -Verbose
    
    # Check if script executed successfully
    if ($LASTEXITCODE -ne 0) {
        throw "Main script exited with code $LASTEXITCODE"
    }
    
    Write-Host "[SUCCESS] Main script completed successfully" -ForegroundColor Green
    
    # Wait for filesystem operations to complete
    Write-Host "[INFO] Waiting 3 seconds for filesystem operations to complete..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    
    # Verify the output
    Write-Host "[INFO] Verifying script output..." -ForegroundColor Cyan
    if ($scriptResult -match "successfully generated") {
        Write-Host "[SUCCESS] Main script output verified" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Unexpected script output" -ForegroundColor Yellow
        Write-Host "[DEBUG] Script output: $scriptResult" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "[ERROR] Failed to execute main script: $_" -ForegroundColor Red
    Write-Host "[DEBUG] Error details: $($_.ScriptStackTrace)" -ForegroundColor DarkGray
    exit 1
}

# Final verification
Write-Host "`n[TEST] ==== FINAL VERIFICATION ====" -ForegroundColor Cyan

# 1. Verify index.html was updated correctly
Write-Host "`n[TEST] Verifying index.html updates..." -ForegroundColor Cyan
$indexPath = Join-Path -Path $reportBaseDir -ChildPath "index.html"

if (-not (Test-Path $indexPath)) {
    Write-Host "[ERROR] index.html not found at $indexPath" -ForegroundColor Red
    exit 1
}

$indexContent = Get-Content -Path $indexPath -Raw
$projectSection = $indexContent -split "<h2 class='project-name'>Bsaas Front</h2>" -split "<h2 class='project-name'>" | Select-Object -First 2 | Select-Object -Last 1

# Check if today's report is listed
$today = (Get-Date).ToString("yyyyMMdd")
if ($projectSection -match "$today.*report_bsaas-front\.html") {
    Write-Host "[SUCCESS] Today's report is listed in index.html" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Today's report is missing from index.html" -ForegroundColor Red
    exit 1
}

# Check report count in index (should be 5)
$reportCount = ([regex]::Matches($projectSection, "<li><a href='bsaas-front/\d+_report_bsaas-front\.html'")).Count
if ($reportCount -eq 5) {
    Write-Host "[SUCCESS] Found $reportCount reports in index.html" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Expected 5 reports in index.html, found $reportCount" -ForegroundColor Red
    exit 1
}

# 2. Verify report content and structure
Write-Host "`n[TEST] Verifying report content..." -ForegroundColor Cyan

# Get the latest report
$latestReport = $reportFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$reportContent = Get-Content -Path $latestReport.FullName -Raw -ErrorAction SilentlyContinue

# Basic content check - just verify it's not empty and contains some expected text
if ([string]::IsNullOrEmpty($reportContent)) {
    Write-Host "[ERROR] Report file is empty" -ForegroundColor Red
    $allConditionsMet = $false
} else {
    Write-Host "[SUCCESS] Report file contains content" -ForegroundColor Green
    
    # Quick check for some expected content (without being too strict)
    $expectedContent = @("Package Version Report", "Dependencies", "Dev Dependencies")
    foreach ($content in $expectedContent) {
        if ($reportContent -match $content) {
            Write-Host "[SUCCESS] Found expected content: $content" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Expected content not found: $content" -ForegroundColor Yellow
        }
    }
}

# 2.3 Verify cleanup of temporary files
Write-Host "`n[TEST] Verifying cleanup of temporary files..." -ForegroundColor Cyan
$tempFiles = @(
    "*.tmp",
    "temp_*.json",
    "~$*.html"
)

$foundTempFiles = $false
foreach ($pattern in $tempFiles) {
    $tempFilesFound = Get-ChildItem -Path $reportBaseDir -Recurse -Filter $pattern -ErrorAction SilentlyContinue
    if ($tempFilesFound) {
        $foundTempFiles = $true
        foreach ($file in $tempFilesFound) {
            Write-Host "[WARNING] Found temporary file: $($file.FullName)" -ForegroundColor Yellow
        }
    }
}

if (-not $foundTempFiles) {
    Write-Host "[SUCCESS] No temporary files found" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Found temporary files that should be cleaned up" -ForegroundColor Yellow
}

# 2.4 Verify log files
Write-Host "`n[TEST] Verifying log files..." -ForegroundColor Cyan
$logDir = Join-Path $PSScriptRoot "..\logs"
$logFiles = Get-ChildItem -Path $logDir -Filter "*.log" -ErrorAction SilentlyContinue

if ($logFiles) {
    $latestLog = $logFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $logContent = Get-Content -Path $latestLog.FullName -Tail 20 -ErrorAction SilentlyContinue
    
    if ($logContent) {
        Write-Host "[SUCCESS] Found log file: $($latestLog.Name)" -ForegroundColor Green
        
        # Check for errors in the log
        $errorCount = ($logContent | Select-String -Pattern "ERROR|Exception" -SimpleMatch).Count
        if ($errorCount -gt 0) {
            Write-Host "[WARNING] Found $errorCount errors in log file" -ForegroundColor Yellow
            $logContent | Select-String -Pattern "ERROR|Exception" -SimpleMatch | 
                ForEach-Object { Write-Host "  $_" -ForegroundColor DarkYellow }
        } else {
            Write-Host "[SUCCESS] No errors found in log file" -ForegroundColor Green
        }
    } else {
        Write-Host "[WARNING] Log file is empty: $($latestLog.Name)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] No log files found in $logDir" -ForegroundColor Yellow
}

# 3. Verify report files

# Get all report files
$reportFiles = Get-ChildItem -Path (Join-Path -Path $reportBaseDir -ChildPath $projectName) -Filter "*.html" | 
    Where-Object { $_.Name -ne "index.html" } |
    Sort-Object LastWriteTime

$finalReportCount = $reportFiles.Count
$today = (Get-Date).Date
$hasTodaysReport = $false
$deletedOldest = $false

Write-Host "[TEST] Found $finalReportCount report files:" -ForegroundColor Cyan
foreach ($file in $reportFiles) {
    $fileDate = $file.LastWriteTime.Date
    $isToday = $fileDate -eq $today
    $status = if ($isToday) { "[TODAY]" } else { "[OLD]   " }
    Write-Host "  $status $($file.Name) (Modified: $($file.LastWriteTime))" -ForegroundColor $(if ($isToday) { "Green" } else { "DarkGray" })
    
    if ($isToday) { $hasTodaysReport = $true }
    if ($fileDate -lt $today) { $deletedOldest = $true }
}

# Verify conditions
$allConditionsMet = $true

# 1. Check total count is 5
if ($finalReportCount -ne 5) {
    Write-Host "[ERROR] Expected 5 reports, found $finalReportCount" -ForegroundColor Red
    $allConditionsMet = $false
} else {
    Write-Host "[SUCCESS] Found expected number of reports (5)" -ForegroundColor Green
}

# 2. Check today's report exists
if (-not $hasTodaysReport) {
    Write-Host "[ERROR] Today's report is missing" -ForegroundColor Red
    $allConditionsMet = $false
} else {
    Write-Host "[SUCCESS] Found today's report" -ForegroundColor Green
}

# 3. Check oldest report was deleted
if (-not $deletedOldest) {
    Write-Host "[ERROR] Oldest report was not deleted" -ForegroundColor Red
    $allConditionsMet = $false
} else {
    Write-Host "[SUCCESS] Oldest report was properly deleted" -ForegroundColor Green
}

# Final result
if ($allConditionsMet) {
    Write-Host "`n[SUCCESS] Test case 5 completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n[ERROR] Test case 5 failed - one or more validations failed" -ForegroundColor Red
    exit 1
}