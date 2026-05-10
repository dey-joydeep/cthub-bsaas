# Package Version Checker - Test Specification

## Test Environment

| Component           | Details                                    |
|---------------------|--------------------------------------------|
| **Main Script**     | `package-version-checker.ps1`              |
| **Test Runner**     | `test/run-all-tests.ps1`                   |
| **Test Cases**      | `test/run-test-case-*.ps1`                 |
| **Common Script**   | `test/common-script-run-test.ps1`          |
| **Test Directory**  | `bsaas-docs/pvm/test/`                     |
| **Test Reports**    | Generated in `bsaas-docs/pvm/report/`      |
| **Test Logs**       | Stored in `bsaas-docs/pvm/test/logs/`      |
| **Test Screenshots**| Stored in `bsaas-docs/pvm/test/screenshots/` |

## Test Case Status Legend

| Status | Description |
|--------|-------------|
| ✅ PASS | Test passed all validations |
| ❌ FAIL | Test failed one or more validations |
| ⚠️ WARN | Test passed but with non-critical issues |
| ⏳ PENDING | Test not yet executed |

## Test Execution Instructions

To execute the test suite, run the following command from the project root:

```powershell
.\test\run-all-tests.ps1 [-ProjectName <name>] [-TestCases <array>] [-Verbose]
```

### Parameters

- `-ProjectName`: (Optional) The name of the project to test (e.g., 'root', 'bsaas-front', 'bsaas-back'). Default is 'root'.
- `-TestCases`: (Optional) Array of test case numbers to run (e.g., @(1,2,3)). If not specified, all test cases will run.
- `-Verbose`: (Switch) Show detailed test output.

### Examples

Run all test cases for the root project:

```powershell
.\test\run-all-tests.ps1
```

Run specific test cases for bsaas-front:

```powershell
.\test\run-all-tests.ps1 -ProjectName bsaas-front -TestCases 3,4,5
```

Run with verbose output:

```powershell
.\test\run-all-tests.ps1 -Verbose
```

## Test Results

Test results will be displayed in the console with a summary at the end.
Each test case will show one of the following statuses:

- ✅ Passed: The test completed successfully
- ❌ Failed: The test encountered an error
- ⏳ Skipped: The test was not executed

## Common Validations for All Tests

The following validations apply to all test cases where the script is expected to complete successfully (exit code 0):

1. **Index File Validation**

   - `index.html` exists in the report root directory
   - Contains correct project name and list of report files
   - Links to all reports are valid and accessible

2. **Stylesheet Validation**

   - Only one `styles.css` exists in the root report directory
   - All report files reference the stylesheet using a relative path
   - Stylesheet is not modified during test execution

3. **Report Content Validation**

   - Report contains all sections as specified in README.md
   - Package versions and update types are correctly identified
   - Report reflects the current state of package.json
   - All links in the report are valid

4. **Report Retention**

   - No more than 5 report files exist per project directory
   - Oldest reports are deleted when the limit is exceeded
   - Reports are sorted by date (newest first)

## Test Cases

### Test Case 1: Initial Report Generation (Root Project)

### Description
Verifies that the script can generate an initial HTML report for the root project, handling the case where the project name is extracted from the parent directory name when not specified in package.json.

### Preconditions
- The root project has a package.json file
- No existing report directory exists for the project

### Test Steps
1. Run the script with the 'root' parameter
2. Verify the script completes successfully (exit code 0)
3. Verify the report directory is created with the correct project name
4. Verify the report file is created with the correct naming pattern (YYYYMMDD_report_<project>.html)
5. Verify the report contains the project name in the title and content
6. Verify the report contains all dependencies from package.json
7. Verify version numbers and update types are displayed correctly
8. Verify styles.css is created in the report root directory
9. Verify index.html is created in the report root directory
10. Verify the index contains a link to the generated report

### Expected Results
- Script exits with code 0
- Output includes "Analyzing project '<name>' packages..." where <name> is either from package.json or the parent directory name
- Report directory is created as report/<project-name>/
- Report file is created with the pattern YYYYMMDD_report_<project>.html
- Report contains all dependencies from package.json
- Version numbers and update types are displayed correctly
- styles.css exists in the report root directory
- index.html exists in the report root directory and contains a link to the generated report

### Notes
- When the root project's package.json doesn't have a name, the parent directory name should be used
- The analysis message should show "Analyzing project '<name>' packages..." with the project name properly quoted

**Objective**: Verify the script generates a complete HTML report for the root project with the actual project name.

**Steps**:

1. Delete the report folder if it exists
2. Run the script with the 'root' project parameter
3. Verify the report is generated with the correct project name (from package.json, not 'root')
4. Validate report content and structure

**Expected Results**:

- Report is generated in the correct location
- Report filename includes the actual project name and current date
- All common validations pass

---

### Test Case 2: Report Overwrite Check

**Objective**: Verify that running the script multiple times on the same day overwrites the existing report.

**Steps**:

1. Run the script to generate an initial report
2. Note the report's timestamp and content
3. Make a small change to package.json
4. Run the script again
5. Verify the report is updated

**Expected Results**:

- Only one report file exists for the current date
- The report content reflects the latest package information
- All common validations pass

---

### Test Case 3: Multi-Project Support

**Objective**: Verify the script handles multiple project directories correctly.

**Steps**:

1. Record `styles.css` last modified time
2. Run the script for 'bsaas-front' project
3. Verify file system changes
4. Check report content and index updates

**Expected Results**:

- Report is generated in the correct project directory
- Report contains project-specific data
- Index is updated with new project entry
- All common validations pass

---

### Test Case 4: Report Retention

**Objective**: Verify that when 5 reports exist (4 historical + 1 today's), running the script again will overwrite today's report without deleting historical reports, and that the index.html maintains the correct order of reports (newest first).

**Preconditions**:
- Test Case 3 has already run, creating an index file and today's report
- Project directory exists with a valid package.json
- Historical reports are created with dates in ascending order (oldest to newest)

**Test Steps**:
1. Create 4 historical report files with different dates
2. Run the script to generate today's report
3. Verify that today's report exists and is the most recent
4. Verify that index.html lists reports in descending order (newest first)
5. Run the script again
6. Verify that today's report was overwritten
7. Verify that historical reports were not modified
8. Verify that the index was updated with the new report timestamp
9. Verify that index.html still maintains the correct order of reports (newest first)

   - Create 4 historical report files with dates from previous days (e.g., 20250724, 20250725, 20250726)
   - Create today's report file (e.g., 20250727)
   - Record the initial content and timestamps of all files
   - Verify there are exactly 5 reports in the directory

2. **Execution**:
   - Run the script with project name 'bsaas-front'
   - Capture the script output and exit code

3. **Verification**:
   - Verify the script exits with code 0 (success)
   - Verify there are still exactly 5 reports in the directory
   - Verify today's report file has been updated (new timestamp, content changed)
   - Verify the 4 historical reports are unchanged (same content and timestamps)
   - Verify the report index is updated with the new report timestamp
   - Verify the stylesheet is not modified
   - Verify the report content reflects the current state of package.json

**Expected Results**:

| Check | Expected Result |
|-------|-----------------|
| Exit Code | 0 (Success) |
| Report Count | 5 (unchanged) |
| Today's Report | Updated with new timestamp |
| Historical Reports | Unchanged (4 files) |
| Index File | Contains updated link to today's report |
| Stylesheet | Not modified |
| Report Content | Reflects current package.json |

**Error Conditions**:
- If more or fewer than 5 reports exist after execution, the test should fail
- If any historical report is modified, the test should fail
- If the script exits with a non-zero code, the test should fail
- If the report content doesn't match the current package.json, the test should fail

---

### Test Case 5: Report Cleanup (Max Reports Reached)

**Objective**: Verify the script enforces the maximum report retention policy by cleaning up old reports when the limit is reached.

**Preconditions**:
- Test directory structure exists: `pvm/test/`
- Report directory exists: `pvm/report/`
- Project directory exists with a valid `package.json`
- No existing reports for the test project

**Test Setup**:
1. Clean up any existing report files
2. Create 5 test report files with dates from 5 days ago to yesterday
3. Update index.html with the test reports

**Test Steps**:
1. **Setup Phase**:
   - Verify and create required directory structure
   - Remove any existing report files
   - Create 5 test report files with sequential dates (5 days ago to yesterday)
   - Update index.html with test reports

2. **Execution Phase**:
   - Run the package version checker script for the test project
   - Capture script output and exit code

3. **Verification Phase**:
   - Verify script exits successfully (exit code 0)
   - Check that exactly 5 reports exist in the directory
   - Confirm the oldest report was deleted
   - Verify today's report was created
   - Check that index.html was updated correctly
   - Verify no temporary files were left behind

**Expected Results**:
- ✅ Script exits with code 0 (success)
- ✅ Oldest report is deleted (5 days old)
- ✅ New report is created with today's date
- ✅ Exactly 5 reports remain in the directory
- ✅ Index.html is updated with the new report
- ✅ No temporary files remain
- ⚠️ Log files may not exist (expected if logging is disabled)

**Error Conditions**:
- ❌ If more or fewer than 5 reports exist after execution
- ❌ If any report other than the oldest is deleted
- ❌ If the script exits with a non-zero code
- ❌ If index.html is not updated correctly

**Notes**:
- The test focuses on core functionality (report creation, deletion, index update)
- HTML structure validation is minimal to avoid test brittleness
- Log file validation is non-critical

---

### Test Case 6: Non-Existent Project

**Objective**: Verify the script handles unknown project names correctly.

**Steps**:

1. Run the script with a non-existent project name
2. Verify the script exits with an error
3. Check the error message

**Expected Results**:

- Script exits with non-zero status
- Clear error message about project not found
- No report is created
- No changes to existing reports

---

### Test Case 7: Project Without package.json

**Objective**: Verify the script handles projects without package.json correctly.

**Steps**:

1. Create a test directory without package.json
2. Run the script pointing to this directory
3. Verify the script exits with an error
4. Check the error message

**Expected Results**:

- Script exits with non-zero status
- Clear error message about missing package.json
- No report is created
- No changes to existing reports

## Test Execution Instructions

### Prerequisites

| Requirement | Verification Command | Expected Result |
|-------------|----------------------|------------------|
| PowerShell 5.1+ | `$PSVersionTable.PSVersion` | ≥ 5.1 |
| Node.js | `node --version` | ≥ 14.0 |
| npm | `npm --version` | ≥ 6.0 |
| Internet | `Test-NetConnection npmjs.com -Port 443` | Success |

### Running Tests

```powershell
# Navigate to project root
cd e:\workspace\cthub-bsaas

# Run all tests
.\bsaas-docs\pvm\test\run-tests.ps1

# Run specific test
.\bsaas-docs\pvm\test\run-tests.ps1 -TestNumber 1

# Generate test report
.\bsaas-docs\pvm\test\run-tests.ps1 -GenerateReport
```

## Test Results Dashboard

| Test Case | Status | Executed At | Details |
|-----------|--------|-------------|---------|
| 1. Initial Report Generation | ⏳ Pending | - | View details |
| 2. Report Overwrite | ⏳ Pending | - | View details |
| 3. Multi-Project Support | ⏳ Pending | - | View details |
| 4. Report Retention | ⏳ Pending | - | View details |
| 5. Report Cleanup | ⏳ Pending | - | View details |
| 6. Error Handling | ⏳ Pending | - | View details |
| 7. Content Validation | ⏳ Pending | - | View details |

## Test Artifacts

### File Structure

```text
bsaas-docs/pvm/
├── test/
│   ├── run-tests.ps1       # Test runner
│   ├── TEST_SPEC.md        # This file
│   └── test-data/          # Test data files
└── report/                 # Generated reports
    ├── index.html
    ├── styles.css
    ├── root/
    └── bsaas-front/
```

### Test Data Management

- Test reports are stored in `bsaas-docs/pvm/report/`
- Each test run creates a timestamped log in `test/logs/`
- Failed tests generate screenshots in `test/screenshots/`

## Maintenance

### Version History

| Date       | Version | Changes |
|------------|---------|---------|
| 2025-07-26 | 1.0.0   | Initial test specification |

### Known Issues

| ID | Description | Status | Workaround |
|----|-------------|--------|------------|
| -  | None        | -      | -          |

### Future Enhancements

- [ ] Add performance testing
- [ ] Add cross-platform compatibility tests
- [ ] Implement visual regression testing
