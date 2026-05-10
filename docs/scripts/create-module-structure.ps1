# Create-ModuleStructure.ps1
# Script to create consistent module structure for documentation

param (
    [Parameter(Mandatory=$true)]
    [string]$ModuleName,
    
    [Parameter(Mandatory=$true)]
    [string]$Functions
)

# Convert comma-separated functions to array
$functionArray = $Functions -split ',' | ForEach-Object { $_.Trim() }

$basePath = "e:\workspace\cthub-bsaas\bsaas-docs\specs\$ModuleName"
$functionFiles = @(
    "frontend-controller-api.md",
    "backend-controller-api.md",
    "design-details.md",
    "frontend-progress-status.md",
    "backend-progress-status.md"
)

# Create module directory if it doesn't exist
if (-not (Test-Path $basePath)) {
    New-Item -ItemType Directory -Path $basePath | Out-Null
    Write-Host "Created module directory: $basePath"
}

# Create module-level files
$moduleFiles = @(
    @{ 
        Name = "$ModuleName-functional-requirements.md"; 
        Template = @"
# $($ModuleName -replace '-',' ') - Functional Requirements

## Overview
This document outlines the functional requirements for the $($ModuleName -replace '-',' ') module.

## Core Features

### 1. Feature 1
- Description
- Requirements
- Acceptance Criteria

### 2. Feature 2
- Description
- Requirements
- Acceptance Criteria

## User Flows

### Flow 1
1. Step 1
2. Step 2
3. Step 3

## Integration Points
- Integration 1
- Integration 2
"@
    },
    @{ 
        Name = "$ModuleName-web-api.md"; 
        Template = @"
# $($ModuleName -replace '-',' ') - Web API

## Base URL
`/api/v1/$($ModuleName -replace '-','')`

## Authentication
[Authentication requirements]

## Endpoints

### Get All
- **URL**: `/`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "data": [],
    "pagination": {}
  }
  ```

### Get By ID
- **URL**: `/{id}`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "id": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
  ```
"@
    },
    @{ 
        Name = "progress-status-summary.md"; 
        Template = @"
# $($ModuleName -replace '-',' ') - Progress Status Summary

## Overall Status
- **Frontend**: 0%
- **Backend**: 0%
- **Testing**: 0%
- **Documentation**: 0%

## Components
| Component | Status | Notes |
|-----------|--------|-------|
| Component 1 | $($([char]0x23F3)) Not Started | |
| Component 2 | $($([char]0x23F3)) Not Started | |

## Open Issues
- [ ] Initial implementation
"@
    }
)

foreach ($file in $moduleFiles) {
    $filePath = Join-Path $basePath $file.Name
    if (-not (Test-Path $filePath)) {
        Set-Content -Path $filePath -Value $file.Template
        Write-Host "Created file: $filePath"
    }
}

# Create functions directory
$functionsPath = Join-Path $basePath "$ModuleName-functions"
if (-not (Test-Path $functionsPath)) {
    New-Item -ItemType Directory -Path $functionsPath | Out-Null
    Write-Host "Created functions directory: $functionsPath"
}

# Create function directories and files
foreach ($function in $functionArray) {
    $functionPath = Join-Path $functionsPath $function
    if (-not (Test-Path $functionPath)) {
        New-Item -ItemType Directory -Path $functionPath | Out-Null
        Write-Host "Created function directory: $functionPath"
        
        # Create function files
        foreach ($templateFile in $functionFiles) {
            $templateContent = switch -Wildcard ($templateFile) {
                "*frontend*" { @"
# $($ModuleName -replace '-',' ') - $($function -replace '-',' ') - Frontend

## Overview
[Overview of the frontend component]

## Props
| Name | Type | Required | Description |
|------|------|----------|-------------|
| prop1 | type | yes | Description |

## State
| Name | Type | Description |
|------|------|-------------|
| state1 | type | Description |

## Methods
### handleAction()
Description of the method

## Styling
[Styling guidelines and requirements]
"@ }
                "*backend*" { @"
# $($ModuleName -replace '-',' ') - $($function -replace '-',' ') - Backend API

## Endpoint
`/api/v1/$($ModuleName -replace '-','')/$function`

### Request
```http
GET /api/v1/$($ModuleName -replace '-','')/$function
Authorization: Bearer {token}
```

### Response
```json
{
  "data": {},
  "meta": {}
}
```

## Error Responses
| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
"@ }
                "*design*" { @"
# $($ModuleName -replace '-',' ') - $($function -replace '-',' ') - Design

## Architecture
[Architectural decisions and diagrams]

## Data Flow
1. Step 1
2. Step 2
3. Step 3

## Components
- Component 1
- Component 2
- Component 3

## State Management
[State management approach and structure]
"@ }
                "*frontend-progress*" { @"
# $($ModuleName -replace '-',' ') - $($function -replace '-',' ') - Frontend Progress

## Status
- [ ] Not Started
- [ ] In Progress
- [ ] Code Complete
- [ ] Testing
- [ ] Done

## Tasks
- [ ] Implement component
- [ ] Add tests
- [ ] Update documentation

## Issues
- [ ] Issue 1
- [ ] Issue 2
"@ }
                "*backend-progress*" { @"
# $($ModuleName -replace '-',' ') - $($function -replace '-',' ') - Backend Progress

## Status
- [ ] Not Started
- [ ] In Progress
- [ ] Code Complete
- [ ] Testing
- [ ] Done

## Tasks
- [ ] Implement endpoint
- [ ] Add validation
- [ ] Add tests

## Performance
- [ ] Response time < 200ms
- [ ] Memory usage < 100MB
- [ ] Database queries < 5
"@ }
                default { "# $($ModuleName -replace '-',' ') - $($function -replace '-',' ')

## Overview
[Documentation for $($ModuleName -replace '-',' ') - $($function -replace '-',' ')]" }
            }
            
            $filePath = Join-Path $functionPath $templateFile
            Set-Content -Path $filePath -Value $templateContent
            Write-Host "  Created file: $filePath"
        }
    }
}

Write-Host "\nModule structure created successfully for: $ModuleName"
