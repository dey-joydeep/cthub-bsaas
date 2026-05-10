# Package Version Manager (PVM)

A tool to check and report on outdated npm packages in the Beauty SaaS project.

## Overview

The Package Version Manager (PVM) is a PowerShell script that helps you keep track of outdated npm packages in your project. It generates an HTML report showing the current and latest versions of all dependencies and devDependencies.

## Features

- Check for outdated packages in any project directory
- Generate detailed HTML reports with color-coded status indicators
- Automatic report management with daily overwrites
- Maintains a history of the 5 most recent reports per project
- Works with both regular and dev dependencies
- Clickable package links to npm registry
- Clean, responsive HTML output with summary statistics
- Smart project name handling (extracts actual project name from package.json when using 'root')
- Comprehensive test suite with modular test cases

## Project Name Handling

When running the script with the root project, you can use the special project name `root` and the script will automatically:

1. Look for a `package.json` in the root directory
2. Extract the actual project name from the `name` field (if it exists)
3. If no name is found in package.json, use the parent directory name
4. Use this name in the generated report and file names

The script will display the project name in the console output (e.g., "Analyzing project 'cthub-bsaas' packages...") and use it for report generation.

```powershell
# Using 'root' will extract the actual project name from package.json or parent directory
.\package-version-checker.ps1 -projectName root
```

### Example Output

When running with the root project:

```
No project name found in package.json, using parent directory name: cthub-bsaas
Analyzing project 'cthub-bsaas' packages...
...
Report generated at: E:\workspace\cthub-bsaas\bsaas-docs\pvm\report\cthub-bsaas\20250727_report_cthub-bsaas.html
```

## Running Tests

The test suite is organized into modular test cases for better maintainability and flexibility.

### Running All Tests

To run all test cases:

```powershell
# From the project root
.\test\run-all-tests.ps1
```

### Running Specific Test Cases

To run specific test cases by number:

```powershell
# Run test cases 1, 3, and 5
.\test\run-all-tests.ps1 -TestCases 1,3,5
```

### Test Output Options

Control the verbosity of test output:

```powershell
# Show passed test details
.\test\run-all-tests.ps1 -ShowPassed

# Show all test details
.\test\run-all-tests.ps1 -ShowPassed -ShowFailed -ShowSkipped
```

### Running Individual Test Cases

You can also run individual test cases directly:

```powershell
# Run a specific test case
.\test\run-test-case-1.ps1
```

### Test Structure

- `test/common-script-run-test.ps1` - Common test framework and utilities
- `test/run-all-tests.ps1` - Test runner script
- `test/run-test-case-*.ps1` - Individual test cases
- `test/logs/` - Test execution logs
- `test/screenshots/` - Test screenshots (if applicable)

## Prerequisites

- PowerShell 5.1 or later (Windows PowerShell or PowerShell Core)
- Node.js and npm installed
- Internet connection (for npm registry access)

## Installation

No installation is required. The script can be run directly from the command line.

## Usage

### Basic Usage

```powershell
# Check frontend packages
.\package-version-checker.ps1 -projectName bsaas-front

# Check backend packages
.\package-version-checker.ps1 -projectName bsaas-back

# Check root package.json
.\package-version-checker.ps1 -projectName root

# Check any project with custom name
.\package-version-checker.ps1 -projectName my-project
```

### Parameters

- `-projectName` (Required): Name of the project directory to check (e.g., 'bsaas-front', 'bsaas-back', 'root', or any custom project folder name).

### Report Retention

The script maintains a rolling history of reports with the following behavior:

- **Daily Reports**: Only one report is kept per day (new runs on the same day will overwrite the existing report)
- **Retention Policy**: A maximum of 5 historical reports are kept per project
- **Automatic Cleanup**: The oldest reports are automatically deleted when the limit is reached
- **File Naming**: Reports are named using the format `YYYYMMDD_report_[projectName].html` (date-only, no timestamp)
- **Storage**: Reports are organized in project-specific subdirectories under `bsaas-docs/pvm/report/`

### Output

#### File Structure

```text
bsaas-docs/
└── pvm/
    ├── package-version-checker.ps1  # Main script
    ├── report/
    │   ├── index.html              # Index of all reports
    │   ├── styles.css              # Shared styles
    │   ├── bsaas-front/            # Frontend reports
    │   │   ├── 20250720_report_bsaas-front.html
    │   │   ├── 20250725_report_bsaas-front.html
    │   │   └── 20250726_report_bsaas-front.html
    │   ├── bsaas-back/             # Backend reports
    │   └── [projectName]/          # Custom project reports
    └── template/                   # HTML/CSS templates
```

#### Report Locations

- **Frontend**: `bsaas-docs/pvm/report/bsaas-front/YYYYMMDD_report_bsaas-front.html`
- **Backend**: `bsaas-docs/pvm/report/bsaas-back/YYYYMMDD_report_bsaas-back.html`
- **Root**: `bsaas-docs/pvm/report/root/YYYYMMDD_report_root.html`
- **Custom**: `bsaas-docs/pvm/report/[projectName]/YYYYMMDD_report_[projectName].html`

#### Index File

An `index.html` file is automatically maintained in the report directory, providing links to all available reports organized by project.

## Report Format

The generated HTML report includes:

1. **Project Overview**
   - Project name and analysis timestamp
   - Summary statistics (total packages, up-to-date, updates available)

2. **Dependency Tables**
   - Separate tables for dependencies and devDependencies
   - Color-coded status indicators:
     - Green: Up to date
     - Orange: Minor update available
     - Red: Major update available
     - Dark red: Package not found in registry
   - Current and latest versions for each package
   - Links to package pages on npmjs.com

3. **Update Types**
   - Clear indication of update type (major, minor, patch)
   - Visual indicators for update severity

## Example Report

### Package Version Report - 20250726

**Project:** bsaas-front  
**Generated:** July 26, 2025 18:30:45  
**Total Packages:** 42  
**Up to date:** 35  
**Updates available:** 7 (3 major, 4 minor)

#### Dependencies

| Package | Current Version | Latest Version | Update Type |
|---------|----------------|----------------|-------------|
| @angular/core | ^12.0.0 | 15.2.0 | Major |
| rxjs | ~7.8.0 | 7.8.1 | Minor |

#### Dev Dependencies

| Package | Current Version | Latest Version | Update Type |
|---------|----------------|----------------|-------------|
| @types/jest | ^29.5.1 | 29.5.1 | - |
| typescript | ~5.1.3 | 5.1.6 | Minor |

*Note: The actual report is an HTML file with color-coded status indicators and interactive elements.*

## Best Practices

1. **Scheduling**
   - Run the script regularly (e.g., weekly) to stay on top of updates
   - Consider adding it to your CI/CD pipeline for automated monitoring

2. **Update Strategy**

   - Review major updates carefully as they may contain breaking changes
   - Test updates in a development environment before applying to production
   - Update packages one at a time to isolate any issues

3. **Troubleshooting**
   - Ensure you have a stable internet connection when running the script
   - If you encounter rate limiting, wait a few minutes and try again
   - Check that the project directory contains a valid package.json file

## License

MIT
