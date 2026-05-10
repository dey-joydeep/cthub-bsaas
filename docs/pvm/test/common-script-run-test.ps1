<#
.SYNOPSIS
    Common test framework for package-version-checker.ps1 tests

.DESCRIPTION
    This script contains shared functions and variables used by individual test case scripts.
    It should be dot-sourced by each test case script.
#>

# Global variables
$global:TestEnvironment = @{
    ScriptPath = "$PSScriptRoot\..\package-version-checker.ps1"
    ReportDir = "$PSScriptRoot\..\report"
    TestDataDir = "$PSScriptRoot\test-data"
    LogDir = "$PSScriptRoot\logs"
    ScreenshotDir = "$PSScriptRoot\screenshots"
    ProjectName = "root"  # Default project name
    # Path to the project root (two levels up from test directory to reach the monorepo root)
    ProjectRoot = (Get-Item -Path "$PSScriptRoot\..\..\..").FullName
    # Path to the package-version-checker.ps1 script relative to the monorepo root
    ScriptPathFromRoot = "bsaas-docs\pvm\package-version-checker.ps1"
}

<#
.SYNOPSIS
    Validates that a report directory exists and contains the expected files

.DESCRIPTION
    Checks for the existence of the report directory and verifies that it contains
    the expected HTML report and styles.css file.

.PARAMETER ReportDir
    The path to the report directory to validate

.PARAMETER TestResult
    A reference to the test result hashtable to update with validation results
#>
function Test-ReportDirectory {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [string]$ReportDir,
        
        [Parameter(Mandatory=$true)]
        [hashtable]$TestResult
    )
    
    try {
        Write-Host "[DEBUG] Validating report directory: $ReportDir" -ForegroundColor Cyan
        
        # Check if the report directory exists
        $hasReportDir = Test-Path -Path $ReportDir -PathType Container -ErrorAction Stop
        
        # Add validation result
        $TestResult.Validations += @{
            ValidationPoint = "Report Directory Exists"
            Expected = $true
            Actual = $hasReportDir
            Status = if ($hasReportDir) { 'PASS' } else { 'FAIL' }
        }
        
        # If the directory exists, check for required files
        if ($hasReportDir) {
            # Get all HTML files in the directory (excluding index.html)
            $reportFiles = Get-ChildItem -Path $ReportDir -Filter "*.html" -File | 
                          Where-Object { $_.Name -ne "index.html" } |
                          Sort-Object -Property LastWriteTime -Descending
            
            $hasReportFiles = $reportFiles.Count -gt 0
            
            $TestResult.Validations += @{
                ValidationPoint = "Report Files Exist"
                Expected = $true
                Actual = $hasReportFiles
                Status = if ($hasReportFiles) { 'PASS' } else { 'FAIL' }
            }
            
            # If we have report files, check the most recent one
            if ($hasReportFiles) {
                $latestReport = $reportFiles | Select-Object -First 1
                $TestResult.Validations += @{
                    ValidationPoint = "Latest Report File Exists"
                    Expected = $true
                    Actual = $true
                    Status = 'PASS'
                }
                
                # Check if the file is not empty
                $fileInfo = Get-Item -Path $latestReport.FullName -ErrorAction Stop
                $isValid = $fileInfo.Length -gt 0
                
                $TestResult.Validations += @{
                    ValidationPoint = "Latest Report File is Not Empty"
                    Expected = $true
                    Actual = $isValid
                    Status = if ($isValid) { 'PASS' } else { 'FAIL' }
                }
                
                # If the file is not empty, check if it's a valid HTML file
                if ($isValid) {
                    try {
                        $content = Get-Content -Path $latestReport.FullName -Raw -ErrorAction Stop
                        $isHtml = $content -match '<!DOCTYPE\s+html' -or $content -match '<html'
                        
                        $TestResult.Validations += @{
                            ValidationPoint = "Latest Report is Valid HTML"
                            Expected = $true
                            Actual = $isHtml
                            Status = if ($isHtml) { 'PASS' } else { 'FAIL' }
                        }
                    } catch {
                        $TestResult.Validations += @{
                            ValidationPoint = "Read Latest Report Content"
                            Expected = "Successfully read report content"
                            Actual = $_.Exception.Message
                            Status = 'FAIL'
                        }
                    }
                }
            }
        }
        
        # Return true only if all validations passed
        $allValidationsPassed = ($TestResult.Validations | Where-Object { $_.Status -ne 'PASS' }).Count -eq 0
        return $allValidationsPassed
    } catch {
        $errorMsg = "Error validating report directory: $_"
        Write-Host "[ERROR] $errorMsg" -ForegroundColor Red
        Write-Host "[ERROR] Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
        
        $TestResult.Validations += @{
            ValidationPoint = "Report Directory Validation"
            Expected = "Successful validation"
            Actual = $errorMsg
            Status = 'ERROR'
        }
        
        return $false
    }
    
    if ($hasReportDir) {
        # Check for styles.css
        $stylesPath = Join-Path -Path $ReportDir -ChildPath "styles.css"
        $hasStyles = Test-Path -Path $stylesPath -PathType Leaf
        
        $TestResult.Validations += @{
            ValidationPoint = "Styles File Exists"
            Expected = $true
            Actual = $hasStyles
            Status = if ($hasStyles) { 'PASS' } else { 'FAIL' }
        }
        
        # Check for index.html
        $indexPath = Join-Path -Path $ReportDir -ChildPath "index.html"
        $hasIndex = Test-Path -Path $indexPath -PathType Leaf
        
        $TestResult.Validations += @{
            ValidationPoint = "Index File Exists"
            Expected = $true
            Actual = $hasIndex
            Status = if ($hasIndex) { 'PASS' } else { 'FAIL' }
        }
        
        # If we have an index file, check its content
        if ($hasIndex) {
            try {
                $indexContent = Get-Content -Path $indexPath -Raw -ErrorAction Stop
                $hasExpectedContent = $indexContent -match "Package Version Checker Report"
                
                $TestResult.Validations += @{
                    ValidationPoint = "Index File Contains Expected Content"
                    Expected = $true
                    Actual = $hasExpectedContent
                    Status = if ($hasExpectedContent) { 'PASS' } else { 'FAIL' }
                }
            }
            catch {
                $TestResult.Validations += @{
                    ValidationPoint = "Read Index File Content"
                    Expected = "Successfully read index file"
                    Actual = "Failed to read file: $_"
                    Status = 'FAIL'
                }
            }
        }
    }
    
    return $hasReportDir
}

<#
.SYNOPSIS
    Validates the most recent report file in a directory

.DESCRIPTION
    Finds the most recent HTML report file in the specified directory and validates its content.

.PARAMETER ReportDir
    The path to the directory containing the report files

.PARAMETER TestResult
    A reference to the test result hashtable to update with validation results
#>
function Test-LatestReportFile {
    param (
        [Parameter(Mandatory=$true)]
        [string]$ReportDir,
        
        [Parameter(Mandatory=$true)]
        [hashtable]$TestResult
    )
    
    try {
        Write-Host "[DEBUG] Looking for HTML files in: $ReportDir" -ForegroundColor Cyan
        
        # Initialize variables
        $htmlFiles = @()
        $hasReportFiles = $false
        
        # Check if directory exists first
        if (-not (Test-Path -Path $ReportDir -PathType Container)) {
            Write-Host "[DEBUG] Report directory does not exist: $ReportDir" -ForegroundColor Yellow
            $TestResult.Validations += @{
                ValidationPoint = "Report Directory Exists"
                Expected = $true
                Actual = $false
                Status = 'FAIL'
            }
            return $false
        }
        
        # Get all HTML files, excluding index.html
        try {
            $allFiles = @(Get-ChildItem -Path $ReportDir -Filter "*.html" -ErrorAction Stop)
            Write-Host "[DEBUG] Found $($allFiles.Count) HTML files in directory" -ForegroundColor Cyan
            
            # Filter out index.html and ensure we have valid files
            $htmlFiles = @($allFiles | Where-Object { 
                $isValid = $_.Name -ne "index.html" -and $null -ne $_.LastWriteTime
                if (-not $isValid) {
                    Write-Host "[DEBUG] Excluding file (index.html or invalid): $($_.Name)" -ForegroundColor Yellow
                }
                return $isValid
            })
            
            Write-Host "[DEBUG] Found $($htmlFiles.Count) valid report files" -ForegroundColor Cyan
            $hasReportFiles = $htmlFiles.Count -gt 0
        }
        catch {
            $errorMsg = "Error getting HTML files: $_"
            Write-Host "[ERROR] $errorMsg" -ForegroundColor Red
            $TestResult.Validations += @{
                ValidationPoint = "Get HTML Files"
                Expected = "Successfully retrieved HTML files"
                Actual = $errorMsg
                Status = 'FAIL'
            }
            return $false
        }
        
        $TestResult.Validations += @{
            ValidationPoint = "Found Report Files"
            Expected = $true
            Actual = $hasReportFiles
            Status = if ($hasReportFiles) { 'PASS' } else { 'FAIL' }
        }
        
        if (-not $hasReportFiles) {
            Write-Host "[DEBUG] No report files found, skipping further validation" -ForegroundColor Yellow
            return
        }
        
        try {
            Write-Host "[DEBUG] Sorting files by LastWriteTime" -ForegroundColor Cyan
            
            # Debug: Show what we have before sorting
            Write-Host "[DEBUG] Files before sorting: $($htmlFiles.Count)" -ForegroundColor Cyan
            
            # Check if we have any files to process
            if ($null -eq $htmlFiles -or $htmlFiles.Count -eq 0) {
                Write-Host "[DEBUG] No HTML files found to process" -ForegroundColor Yellow
                $TestResult.Validations += @{
                    ValidationPoint = "Report Files Exist"
                    Expected = "At least one report file"
                    Actual = "No report files found"
                    Status = 'FAIL'
                }
                return $false
            }
            
            # Log the files we found
            $htmlFiles | ForEach-Object { 
                Write-Host "[DEBUG]   - $($_.Name) (LastWrite: $($_.LastWriteTime))" -ForegroundColor Cyan 
            }
                
            # Store the sorted files in a variable first for debugging
            $sortedFiles = $htmlFiles | Sort-Object -Property LastWriteTime -Descending -ErrorAction Stop
            
            Write-Host "[DEBUG] Files after sorting: $($sortedFiles.Count)" -ForegroundColor Cyan
            $sortedFiles | ForEach-Object { 
                Write-Host "[DEBUG]   - $($_.Name) (LastWrite: $($_.LastWriteTime))" -ForegroundColor Cyan 
            }
            
            # Debug: Check if we have files to process
            Write-Host "[DEBUG] Number of sorted files: $($sortedFiles.Count)" -ForegroundColor Cyan
            if ($null -eq $sortedFiles -or $sortedFiles.Count -eq 0) {
                Write-Host "[ERROR] No files to process after sorting" -ForegroundColor Red
                $TestResult.Validations += @{
                    ValidationPoint = "Files Available After Sorting"
                    Expected = "At least one file to process"
                    Actual = "No files available"
                    Status = 'FAIL'
                }
                return $false
            }
                
                # Get the most recent report
                Write-Host "[DEBUG] Attempting to select the most recent report" -ForegroundColor Cyan
                $latestReport = $null
                try {
                    $latestReport = $sortedFiles | Select-Object -First 1 -ErrorAction Stop
                    Write-Host "[DEBUG] Successfully selected the most recent report: $($latestReport.FullName)" -ForegroundColor Cyan
                } catch {
                    $errorMsg = "Error selecting the most recent report: $_"
                    Write-Host "[ERROR] $errorMsg" -ForegroundColor Red
                    $TestResult.Validations += @{
                        ValidationPoint = "Select Most Recent Report"
                        Expected = "Successfully select the most recent report"
                        Actual = $errorMsg
                        Status = 'FAIL'
                    }
                    return $false
                }
                
                # Validate the report file exists and is not empty
                if ($latestReport -and (Test-Path -Path $latestReport.FullName)) {
                    $fileInfo = Get-Item -Path $latestReport.FullName
                    $isValid = $fileInfo.Length -gt 0
                    
                    $TestResult.Validations += @{
                        ValidationPoint = "Latest Report File Exists and is Not Empty"
                        Expected = $true
                        Actual = $isValid
                        Status = if ($isValid) { 'PASS' } else { 'FAIL' }
                    }
                    
                    if ($isValid) {
                        # Read the file content to validate it's a proper HTML file
                        $content = Get-Content -Path $latestReport.FullName -Raw -ErrorAction Stop
                        $isHtml = $content -match '<!DOCTYPE\s+html' -or $content -match '<html'
                        
                        $TestResult.Validations += @{
                            ValidationPoint = "Latest Report is Valid HTML"
                            Expected = $true
                            Actual = $isHtml
                            Status = if ($isHtml) { 'PASS' } else { 'FAIL' }
                        }
                        
                        # Check if the CSS file is referenced correctly
                        $cssReference = $content -match '<link[^>]*href=["'']styles\.css["''][^>]*>'
                        
                        $TestResult.Validations += @{
                            ValidationPoint = "CSS File is Referenced Correctly"
                            Expected = $true
                            Actual = $cssReference
                            Status = if ($cssReference) { 'PASS' } else { 'WARNING' }
                        }
                        
                        return $true
                    }
                } else {
                    $TestResult.Validations += @{
                        ValidationPoint = "Latest Report File Exists"
                        Expected = $true
                        Actual = $false
                        Status = 'FAIL'
                    }
                    return $false
                }
            
            if (-not $latestReport) {
                Write-Host "[DEBUG] Latest report is null" -ForegroundColor Yellow
                return
            }
            
            try {
                Write-Host "[DEBUG] Reading content from: $($latestReport.FullName)" -ForegroundColor Cyan
                $reportContent = Get-Content -Path $latestReport.FullName -Raw -ErrorAction Stop
                $hasExpectedContent = $reportContent -match "Package Version Checker Report"
                
                $TestResult.Validations += @{
                    ValidationPoint = "Report Contains Expected Content"
                    Expected = $true
                    Actual = $hasExpectedContent
                    Status = if ($hasExpectedContent) { 'PASS' } else { 'FAIL' }
                }
            }
            catch {
                $errorMsg = "Failed to read file: $_"
                Write-Host "[ERROR] $errorMsg" -ForegroundColor Red
                $TestResult.Validations += @{
                    ValidationPoint = "Read Report Content"
                    Expected = "Successfully read report file"
                    Actual = $errorMsg
                    Status = 'FAIL'
                }
            }
        }
        catch {
            $errorMsg = "Error processing report files: $_"
            Write-Host "[ERROR] $errorMsg" -ForegroundColor Red
            $TestResult.Validations += @{
                ValidationPoint = "Process Report Files"
                Expected = "Successfully processed report files"
                Actual = $errorMsg
                Status = 'FAIL'
            }
        }
    }
    catch {
        $errorMsg = "Error finding report files: $_"
        Write-Host "[ERROR] $errorMsg" -ForegroundColor Red
        $TestResult.Validations += @{
            ValidationPoint = "Find Report Files"
            Expected = "Successfully searched for report files"
            Actual = $errorMsg
            Status = 'FAIL'
        }
    }
}

$global:TestResults = @()

# Ensure required directories exist
$requiredDirs = @(
    $global:TestEnvironment.ReportDir,
    $global:TestEnvironment.LogDir,
    $global:TestEnvironment.ScreenshotDir,
    $global:TestEnvironment.TestDataDir
)

foreach ($dir in $requiredDirs) {
    if (-not (Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "[INFO] Created directory: $dir" -ForegroundColor Green
    }
}

<#
.SYNOPSIS
    Initializes a test environment for a test case.

.DESCRIPTION
    Creates a new test object with the specified parameters and adds it to the test results.

.PARAMETER TestName
    The name of the test.

.PARAMETER TestDescription
    A description of what the test verifies.

.PARAMETER TestPreconditions
    Any preconditions required for the test.

.OUTPUTS
    A hashtable representing the test case.
#>
function Initialize-TestEnvironment {
    param (
        [Parameter(Mandatory=$true)]
        [string]$TestName,
        
        [Parameter(Mandatory=$true)]
        [string]$TestDescription,
        
        [string]$TestPreconditions = "None"
    )
    
    $test = @{
        Name = $TestName
        Description = $TestDescription
        Preconditions = $TestPreconditions
        StartTime = Get-Date
        EndTime = $null
        Status = "NOT_RUN"
        Validations = @()
    }
    
    Write-Host "`n=== $TestName ===" -ForegroundColor Cyan
    Write-Host "Description: $TestDescription"
    Write-Host "Preconditions: $TestPreconditions"
    
    return $test
}

<#
.SYNOPSIS
    Adds a validation result to a test case.

.DESCRIPTION
    Records the result of a validation point in a test case.

.PARAMETER TestResult
    A reference to the test case hashtable.

.PARAMETER ValidationPoint
    A description of what is being validated.

.PARAMETER Expected
    The expected result.

.PARAMETER Actual
    The actual result.

.PARAMETER Status
    The status of the validation (PASS/FAIL).

.PARAMETER Notes
    Any additional notes about the validation.
#>
function Add-ValidationResult {
    param (
        [Parameter(Mandatory=$true)]
        [ref]$TestResult,
        
        [Parameter(Mandatory=$true)]
        [string]$ValidationPoint,
        
        [Parameter(Mandatory=$true)]
        [string]$Expected,
        
        [Parameter(Mandatory=$true)]
        [string]$Actual,
        
        [Parameter(Mandatory=$true)]
        [ValidateSet('PASS', 'FAIL', 'WARNING')]
        [string]$Status,
        
        [string]$Notes = ""
    )
    
    $validation = @{
        Point = $ValidationPoint
        Expected = $Expected
        Actual = $Actual
        Status = $Status
        Notes = $Notes
    }
    
    $color = if ($Status -eq 'PASS') { 'Green' } 
             elseif ($Status -eq 'WARNING') { 'Yellow' } 
             else { 'Red' }
    
    Write-Host "  [$Status] $ValidationPoint" -ForegroundColor $color
    Write-Host "    Expected: $Expected" -ForegroundColor $color
    Write-Host "    Actual  : $Actual" -ForegroundColor $color
    
    if ($Notes) {
        Write-Host "    Notes   : $Notes" -ForegroundColor $color
    }
    
    $TestResult.Value.Validations += $validation
}

<#
.SYNOPSIS
    Completes a test case and updates the test result.

.DESCRIPTION
    Marks a test case as complete and updates its status based on the validation results.

.PARAMETER TestResult
    A reference to the test case hashtable.

.OUTPUTS
    The final status of the test case (PASS/FAIL).
#>
function Complete-Test {
    param(
        [Parameter(Mandatory=$true)]
        [ref]$TestResult
    )
    
    $TestResult.Value.EndTime = Get-Date
    $duration = $TestResult.Value.EndTime - $TestResult.Value.StartTime
    
    # Determine overall test status
    $failedValidations = $TestResult.Value.Validations | Where-Object { $_.Status -eq 'FAIL' }
    $testStatus = if ($failedValidations.Count -eq 0) { 'PASS' } else { 'FAIL' }
    
    $TestResult.Value.Status = $testStatus
    $TestResult.Value.Duration = $duration
    
    # Add to global test results
    $global:TestResults += $TestResult.Value
    
    # Display test completion message
    $statusColor = if ($testStatus -eq 'PASS') { 'Green' } else { 'Red' }
    Write-Host "`nTest completed with status: $testStatus (Duration: $($duration.TotalSeconds.ToString('0.00'))s)" -ForegroundColor $statusColor
    
    return $testStatus
}

<#
.SYNOPSIS
    Shows a summary of all test results.
#>
<#
.SYNOPSIS
    Validates the required report folder structure

.DESCRIPTION
    Checks if the required folder structure for reports exists.
    The required structure is:
    pvm/report/
      - <project-name>/
          some report files.html
      - index.html
      - styles.css

.PARAMETER ReportBaseDir
    The base directory where reports are stored (e.g., "pvm/report")

.PARAMETER ProjectName
    The name of the project to check (e.g., "bsaas-front")

.OUTPUTS
    Returns a hashtable with the following properties:
    - IsValid: Boolean indicating if all required paths exist
    - MissingPaths: Array of paths that are missing (empty if all exist)
    - Message: A message describing the validation result
#>
<#
.SYNOPSIS
    Clears all report files for a specific project

.DESCRIPTION
    Deletes all report files (*.html) in the specified project's report directory.
    This is useful for cleaning up before running tests that require a clean state.

.PARAMETER ReportBaseDir
    The base directory where reports are stored (e.g., "pvm/report")

.PARAMETER ProjectName
    The name of the project to clear reports for (e.g., "bsaas-front")

.OUTPUTS
    Returns a hashtable with the following properties:
    - Success: Boolean indicating if the operation was successful
    - DeletedFiles: Array of files that were deleted
    - Error: Error message if the operation failed, $null otherwise
#>
<#
.SYNOPSIS
    Creates test report files with specific dates

.DESCRIPTION
    Creates a specified number of test report files with dates going back from a specified start date.
    This is useful for testing report retention logic and date-based file operations.

.PARAMETER ReportBaseDir
    The base directory where reports are stored (e.g., "pvm/report")

.PARAMETER ProjectName
    The name of the project to create test reports for (e.g., "bsaas-front")

.PARAMETER Count
    Number of test reports to create (default: 5)

.PARAMETER StartDate
    The most recent date for report generation. Files will be created for this date and previous (Count-1) days.
    Default is yesterday's date.

.OUTPUTS
    Returns a hashtable with the following properties:
    - Success: Boolean indicating if the operation was successful
    - CreatedFiles: Array of file paths that were created
    - Error: Error message if the operation failed, $null otherwise
#>
function New-TestReports {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [string]$ReportBaseDir,
        
        [Parameter(Mandatory=$true)]
        [string]$ProjectName,
        
        [Parameter()]
        [int]$Count = 5,
        
        [Parameter()]
        [DateTime]$StartDate = (Get-Date).AddDays(-1)  # Default to yesterday
    )
    
    try {
        $projectDir = Join-Path -Path $ReportBaseDir -ChildPath $ProjectName
        $createdFiles = @()
        
        # Check if project directory exists
        if (-not (Test-Path -Path $projectDir -PathType Container)) {
            return @{
                Success = $false
                CreatedFiles = @()
                Error = "Project directory does not exist: $projectDir"
            }
        }
        
        # Create test report files with dates going back from StartDate
        for ($i = 0; $i -lt $Count; $i++) {
            $fileDate = $StartDate.AddDays(-$i)
            $dateString = $fileDate.ToString("yyyyMMdd")
            $fileName = "${dateString}_report_${ProjectName}.html"
            $filePath = Join-Path -Path $projectDir -ChildPath $fileName
            
            # Create empty file with just the date in it for testing
            "<!-- Test report generated on $($fileDate.ToString('yyyy-MM-dd')) -->" | Out-File -FilePath $filePath -Force
            
            if (Test-Path -Path $filePath) {
                $createdFiles += $filePath
                # Set the file's last write time to match the date in the filename
                (Get-Item $filePath).LastWriteTime = $fileDate
                Write-Verbose "Created test file: $filePath (Date: $($fileDate.ToString('yyyy-MM-dd')))"
            } else {
                Write-Warning "Failed to create test file: $filePath"
            }
        }
        
        return @{
            Success = $true
            CreatedFiles = $createdFiles
            Error = $null
        }
    }
    catch {
        return @{
            Success = $false
            CreatedFiles = @()
            Error = $_.Exception.Message
        }
    }
}

function Clear-ProjectReports {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [string]$ReportBaseDir,
        
        [Parameter(Mandatory=$true)]
        [string]$ProjectName
    )
    
    try {
        $projectDir = Join-Path -Path $ReportBaseDir -ChildPath $ProjectName
        
        # Check if project directory exists
        if (-not (Test-Path -Path $projectDir -PathType Container)) {
            return @{
                Success = $false
                DeletedFiles = @()
                Error = "Project directory does not exist: $projectDir"
            }
        }
        
        # Get all HTML files in the project directory
        $filesToDelete = Get-ChildItem -Path $projectDir -Filter "*.html" -File | 
                        Where-Object { $_.Name -ne "index.html" }
        
        $deletedFiles = @()
        
        # Delete each file
        foreach ($file in $filesToDelete) {
            try {
                Remove-Item -Path $file.FullName -Force -ErrorAction Stop
                $deletedFiles += $file.FullName
            }
            catch {
                Write-Warning "Failed to delete file $($file.FullName): $_"
            }
        }
        
        return @{
            Success = $true
            DeletedFiles = $deletedFiles
            Error = $null
        }
    }
    catch {
        return @{
            Success = $false
            DeletedFiles = @()
            Error = $_.Exception.Message
        }
    }
}

<#
.SYNOPSIS
    Updates the index.html file with the latest report files for a project.

.DESCRIPTION
    Reads all report files for a project and updates the index.html file
    with the latest list of reports, sorted in ascending order by date.

.PARAMETER ReportBaseDir
    The base directory where reports are stored (e.g., "pvm/report")

.PARAMETER ProjectName
    The name of the project to update reports for (e.g., "bsaas-front")

.OUTPUTS
    Returns a hashtable with the following properties:
    - Success: Boolean indicating if the operation was successful
    - Message: Status message
    - Error: Error message if the operation failed, $null otherwise
#>
function Update-ReportIndex {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [string]$ReportBaseDir,
        
        [Parameter(Mandatory=$true)]
        [string]$ProjectName
    )
    
    try {
        $indexPath = Join-Path -Path $ReportBaseDir -ChildPath 'index.html'
        $projectDir = Join-Path -Path $ReportBaseDir -ChildPath $ProjectName
        
        # Verify index.html exists
        if (-not (Test-Path -Path $indexPath)) {
            return @{
                Success = $false
                Message = "index.html not found at $indexPath"
                Error = "File not found"
            }
        }
        
        # Get all report files and sort them by date (ascending)
        $reportFiles = Get-ChildItem -Path $projectDir -Filter "*_report_${ProjectName}.html" | 
                      Sort-Object { [regex]::Match($_.Name, '^(\d{8})').Groups[1].Value }
        
        # Create the new list items
        $newListItems = @()
        foreach ($file in $reportFiles) {
            $datePart = $file.Name.Substring(0, 8)
            $displayDate = [DateTime]::ParseExact($datePart, 'yyyyMMdd', $null).ToString("yyyy-MM-dd HH:mm")
            $fileName = $file.Name
            $newListItems += "<li><a href='${ProjectName}/$fileName'>${datePart}_report_${ProjectName}</a> <span class='date'>($displayDate)</span></li>"
        }
        
        # Read the current index.html content
        $content = Get-Content -Path $indexPath -Raw
        
        # Create the project header pattern (handles both 'bsaas-front' and 'Bsaas Front' formats)
        $projectPattern = [regex]::Escape($ProjectName).Replace('-', '[- ]')
        $pattern = '(?s)(<h2 class="project-name">' + $projectPattern + '</h2>\s*<ul>\s*).*?(\s*</ul>)'
        
        # Replace the content between the <ul> and </ul> tags for the project
        $replacement = "`$1`n" + ($newListItems -join "`n") + "`n`$2"
        $newContent = [regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        
        # Write the updated content back to index.html
        Set-Content -Path $indexPath -Value $newContent -NoNewline
        
        return @{
            Success = $true
            Message = "Successfully updated index.html with $($reportFiles.Count) reports for $ProjectName"
            Error = $null
        }
    }
    catch {
        return @{
            Success = $false
            Message = "Failed to update index.html"
            Error = $_.Exception.Message
        }
    }
}

function Test-ReportFolderStructure {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [string]$ReportBaseDir,
        
        [Parameter(Mandatory=$true)]
        [string]$ProjectName
    )
    
    # Define required paths to check
    $requiredPaths = @(
        @{ Path = $ReportBaseDir; Type = 'Directory' },
        @{ Path = (Join-Path -Path $ReportBaseDir -ChildPath $ProjectName); Type = 'Directory' },
        @{ Path = (Join-Path -Path $ReportBaseDir -ChildPath 'index.html'); Type = 'File' },
        @{ Path = (Join-Path -Path $ReportBaseDir -ChildPath 'styles.css'); Type = 'File' }
    )
    
    # Check each path
    $missingPaths = @()
    
    foreach ($item in $requiredPaths) {
        $path = $item.Path
        $type = $item.Type
        $exists = $false
        
        if ($type -eq 'Directory') {
            $exists = Test-Path -Path $path -PathType Container
        } else {
            $exists = Test-Path -Path $path -PathType Leaf
        }
        
        if (-not $exists) {
            $missingPaths += $path
        }
    }
    
    # Prepare result
    $isValid = $missingPaths.Count -eq 0
    
    $result = @{
        IsValid = $isValid
        MissingPaths = $missingPaths
        Message = if ($isValid) {
            "All required paths exist."
        } else {
            "Missing required paths. Run test case 3 first to set up the required structure."
        }
    }
    
    return $result
}

function Show-TestReport {
    $total = $global:TestResults.Count
    $passed = ($global:TestResults | Where-Object { $_.Status -eq 'PASS' }).Count
    $failed = $total - $passed
    
    Write-Host "`n=== TEST EXECUTION SUMMARY ===" -ForegroundColor Cyan
    Write-Host "Total Tests: $total"
    Write-Host "Passed: $passed" -ForegroundColor Green
    Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'Green' })
    
    if ($failed -gt 0) {
        Write-Host "`nFailed Tests:" -ForegroundColor Red
        $global:TestResults | Where-Object { $_.Status -eq 'FAIL' } | ForEach-Object {
            Write-Host "- $($_.Name)" -ForegroundColor Red
            $_.Validations | Where-Object { $_.Status -eq 'FAIL' } | ForEach-Object {
                Write-Host "  - $($_.Point)" -ForegroundColor Red
                Write-Host "    Expected: $($_.Expected)" -ForegroundColor Red
                Write-Host "    Actual  : $($_.Actual)" -ForegroundColor Red
            }
        }
    }
    
    # Return overall status (0 for success, 1 for failure)
    return [int]($failed -gt 0)
}

# Functions and variables are available in the parent scope when dot-sourced
