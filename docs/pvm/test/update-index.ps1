<#
.SYNOPSIS
    Updates the index.html file with the latest report files in the bsaas-front directory.
    Removes existing list items and adds new ones in ascending order by date.
#>

# Paths
$reportDir = Join-Path $PSScriptRoot '..\report'
$indexPath = Join-Path $reportDir 'index.html'
$bsaasFrontDir = Join-Path $reportDir 'bsaas-front'

# Get all report files and sort them by date (ascending)
$reportFiles = Get-ChildItem -Path $bsaasFrontDir -Filter "*_report_bsaas-front.html" | 
               Sort-Object { [regex]::Match($_.Name, '^(\d{8})').Groups[1].Value }

# Create the new list items
$newListItems = @()
foreach ($file in $reportFiles) {
    $datePart = $file.Name.Substring(0, 8)
    $displayDate = [DateTime]::ParseExact($datePart, 'yyyyMMdd', $null).ToString("yyyy-MM-dd")
    $fileName = $file.Name
    $newListItems += "<li><a href='bsaas-front/$fileName'>${datePart}_report_bsaas-front</a> <span class='date'>($displayDate)</span></li>"
}

# Read the current index.html content
$content = Get-Content -Path $indexPath -Raw

# Replace the content between the <ul> and </ul> tags for bsaas-front
$pattern = '(<h2 class="project-name">Bsaas Front</h2>\s*<ul>\s*).*?(\s*</ul>)'
$replacement = "`$1`n" + ($newListItems -join "`n") + "`n`$2"
$newContent = [regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Write the updated content back to index.html
Set-Content -Path $indexPath -Value $newContent -NoNewline

Write-Host "Successfully updated index.html with the latest report list." -ForegroundColor Green
