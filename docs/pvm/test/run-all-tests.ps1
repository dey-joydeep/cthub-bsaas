<#
.SYNOPSIS
    Test Runner for Package Version Checker Tests

.DESCRIPTION
    This script runs all test cases and provides a summary of the results.
    It executes each test case script and collects the results.
    
    Usage:
    .\run-all-tests.ps1 [-ProjectName <string>] [-TestCases <int[]>] [-ShowPassed] [-ShowFailed] [-ShowSkipped]

.PARAMETER ProjectName
    Optional. The name of the project to test (e.g., 'root', 'bsaas-front', 'bsaas-back'). Default is 'root'.
    
.PARAMETER TestCases
    Optional. Array of test case numbers to run. If not specified, all test cases will run.
    
.PARAMETER ShowPassed
    Optional. Show details for passed tests. Default is $false.
    
.PARAMETER ShowFailed
    Optional. Show details for failed tests. Default is $true.
    
.PARAMETER ShowSkipped
    Optional. Show details for skipped tests. Default is $false.
    
.EXAMPLE
    # Run all test cases for the root project
    .\run-all-tests.ps1
    
.EXAMPLE
    # Run specific test cases for bsaas-front
    .\run-all-tests.ps1 -ProjectName bsaas-front -TestCases 1,2,3
    
.EXAMPLE
    # Show all test results including passed tests
    .\run-all-tests.ps1 -ShowPassed
#>

param(
    [Parameter()]
    [string]$ProjectName = "root",
    
    [Parameter()]
    [int[]]$TestCases = @(),
    
    [Parameter()]
    [switch]$ShowPassed = $false,
    
    [Parameter()]
    [switch]$ShowFailed = $true,
    
    [Parameter()]
    [switch]$ShowSkipped = $false
)

# Import common test framework to get helper functions
. "$PSScriptRoot\common-script-run-test.ps1"

# Set the project name in the global test environment
$global:TestEnvironment.ProjectName = $ProjectName

# Get all test case files, ensuring they exist and are in the correct format
$testCaseFiles = @()
try {
    $testCaseFiles = Get-ChildItem -Path $PSScriptRoot -Filter "run-test-case-*.ps1" -ErrorAction Stop | 
        Sort-Object { 
            if ($_.Name -match 'run-test-case-(\d+)\.ps1$') {
                [int]$matches[1]
            } else {
                [int]::MaxValue  # Put malformed filenames at the end
            }
        }
    
    # Filter by test case numbers if specified
    if ($TestCases.Count -gt 0) {
        $testCaseFiles = $testCaseFiles | 
            Where-Object { 
                if ($_.Name -match 'run-test-case-(\d+)\.ps1$') {
                    $testNumber = [int]$matches[1]
                    $testNumber -in $TestCases
                } else {
                    $false
                }
            }
    }
    
    # Verify test case files exist and are accessible
    $testCaseFiles = $testCaseFiles | Where-Object { 
        try { 
            $content = Get-Content $_.FullName -ErrorAction Stop
            $content -match '\.SYNOPSIS'  # Basic validation that it's a test case
        } catch {
            Write-Warning "Skipping invalid test case file: $($_.FullName) - $_"
            $false
        }
    }
} catch {
    Write-Error "Error discovering test cases: $_"
    exit 1
}

if ($testCaseFiles.Count -eq 0) {
    Write-Host "No test cases found matching the specified criteria." -ForegroundColor Yellow
    exit 0
}

# Initialize test results
$testResults = @()
$startTime = Get-Date

Write-Host "`n=== Running $($testCaseFiles.Count) Test Case(s) ===" -ForegroundColor Cyan

# Run each test case
foreach ($testCaseFile in $testCaseFiles) {
    $testCaseNumber = [int]($testCaseFile.Name -replace '[^0-9]', '')
    $testCaseName = "Test Case $testCaseNumber"
    
    Write-Host "`n=== $testCaseName - $($testCaseFile.Name) ===" -ForegroundColor Cyan
    
    # Run the test case in a separate process with enhanced error handling
    $output = @()
    $exitCode = 1  # Default to failure
    $startTime = Get-Date
    
    try {
        # Run the test case and capture output
        $output = & "$($testCaseFile.FullName)" 2>&1 | ForEach-Object { 
            Write-Host $_  # Display output in real-time
            $_  # Pass through to capture
        }
        $exitCode = $LASTEXITCODE
    } catch {
        $output += "ERROR executing test case: $_"
        $output += $_.ScriptStackTrace
        $exitCode = 1
    }
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    # Extract test case description from the file
    $testCaseDescription = ""
    try {
        $content = Get-Content -Path $testCaseFile.FullName -Raw
        if ($content -match '(?s)\.SYNOPSIS\s+Test Case \d+:\s*(.*?)\s*\.DESCRIPTION') {
            $testCaseDescription = $matches[1].Trim()
        }
    } catch {
        $output += "WARNING: Could not extract test case description: $_"
    }
    
    # Determine test result
    $result = @{
        Number = $testCaseNumber
        FileName = $testCaseFile.Name
        Description = $testCaseDescription
        Status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
        ExitCode = $exitCode
        Output = $output -join "`n"
        StartTime = $startTime
        EndTime = $endTime
        Duration = $duration
    }
    
    $testResults += $result
    
    # Display test result
    $statusColor = if ($result.Status -eq 'PASS') { 'Green' } else { 'Red' }
    Write-Host "$testCaseName - $($result.Status)" -ForegroundColor $statusColor
}

# Calculate summary statistics
$passedTests = $testResults | Where-Object { $_.Status -eq 'PASS' }
$failedTests = $testResults | Where-Object { $_.Status -eq 'FAIL' }
$skippedTests = $testResults | Where-Object { $_.Status -eq 'SKIP' }
$totalValidations = ($testResults.Validations | Measure-Object).Count
$passedValidations = ($testResults.Validations | Where-Object { $_.Status -eq 'PASS' } | Measure-Object).Count
$warningValidations = ($testResults.Validations | Where-Object { $_.Status -eq 'WARNING' } | Measure-Object).Count
$failedValidations = ($testResults.Validations | Where-Object { $_.Status -eq 'FAIL' } | Measure-Object).Count

# Display test summary
Write-Host "`n=== Test Execution Summary ===" -ForegroundColor Cyan
Write-Host "Test Cases: $($testResults.Count) total" -ForegroundColor White
Write-Host "  |-- [PASS]  $($passedTests.Count)" -ForegroundColor Green
Write-Host "  |-- [FAIL]  $($failedTests.Count)" -ForegroundColor Red
Write-Host "  `-- [SKIP]  $($skippedTests.Count)" -ForegroundColor Yellow

Write-Host "`nValidations: $totalValidations total" -ForegroundColor White
Write-Host "  |-- [PASS]  $passedValidations" -ForegroundColor Green
Write-Host "  |-- [WARN]  $warningValidations" -ForegroundColor DarkYellow
Write-Host "  `-- [FAIL]  $failedValidations" -ForegroundColor Red

# Calculate and display total duration
$totalDuration = ($testResults | ForEach-Object { $_.Duration.TotalSeconds } | Measure-Object -Sum).Sum
Write-Host "`nDuration: $($totalDuration.ToString('0.00')) seconds total" -ForegroundColor White
Write-Host "Average:  $(($totalDuration / [Math]::Max(1, $testResults.Count)).ToString('0.00')) seconds/test case" -ForegroundColor White

# Display detailed results if requested
if ($ShowPassed -or $ShowFailed) {
    Write-Host "`n=== Detailed Results ===" -ForegroundColor Cyan
    
    foreach ($result in $testResults) {
        $shouldShow = ($result.Status -eq 'PASS' -and $ShowPassed) -or 
                     ($result.Status -eq 'FAIL' -and $ShowFailed) -or
                     ($result.Status -eq 'SKIPPED' -and $ShowSkipped)
        
        if ($shouldShow) {
            $statusColor = if ($result.Status -eq 'PASS') { 'Green' } 
                          elseif ($result.Status -eq 'FAIL') { 'Red' } 
                          else { 'Yellow' }
            
            # Display test case header with number and description
            $testHeader = "Test Case $($result.Number):"
            if ($result.Description) {
                $testHeader += " $($result.Description)"
            }
            
            Write-Host "`n=== $testHeader ===" -ForegroundColor Cyan
            Write-Host "File: $($result.FileName)" -ForegroundColor Gray
            Write-Host "Status: $($result.Status)" -ForegroundColor $statusColor
            Write-Host "Duration: $($result.Duration.TotalSeconds.ToString('0.00'))s"
            
            # Display output if available
            if ($result.Output) {
                Write-Host "`n--- Output ---" -ForegroundColor DarkGray
                Write-Host $result.Output.Trim()
            }
            
            # Add a separator line
            Write-Host ("-" * 80) -ForegroundColor DarkGray
        }
    }
}

# Exit with non-zero code if any tests failed
exit $(if ($failedCount -gt 0) { 1 } else { 0 })
