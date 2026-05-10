# StatsWidgetComponent

**File**: `src/app/features/dashboard/widgets/stats-widget/`  
**Type**: Angular Component  
**Last Updated**: June 8, 2025

## Overview

Reusable widget component for displaying key metrics with optional trend indicators.

## Quality Metrics

| Category        | Metric  | Status  | Details          |
| --------------- | ------- | ------- | ---------------- |
| **Size**        | 142 LOC | ✅ Good | Well-contained   |
| **Complexity**  | 10      | ✅ Low  | Simple logic     |
| **Reusability** | High    | ✅      | Used in 5+ pages |

## Features

### Core Functionality

- [x] Multiple stat display
- [x] Trend indicators (up/down)
- [x] Customizable appearance
- [ ] Animated transitions

### Input Properties

```types
@Input() title: string;
@Input() value: number | string;
@Input() icon: string;
@Input() trend: number;  // percentage
@Input() loading = false;
@Input() format: 'number' | 'currency' | 'percent' = 'number';
```

## Code Quality

### Type Safety

- **Any Types**: 0 (✅ Excellent)
- **Null Checks**: ✅ Proper null checks
- **OnPush**: ✅ Implemented

### Performance

- **Change Detection**: OnPush (✅ Optimal)
- **Bundle Size**: 3.2 KB (✅ Minimal)
- **Render Time**: <5ms (✅ Excellent)

## Testing

| Test Type | Coverage | Status       |
| --------- | -------- | ------------ |
| Unit      | 92%      | ✅ Excellent |
| Visual    | 100%     | ✅ Excellent |
| A11y      | 100%     | ✅ Excellent |

### Test Cases

- [x] Displays correct value with formatting
- [x] Shows loading state
- [x] Handles null/undefined values
- [x] Displays correct trend indicator

## Accessibility

| WCAG Criteria           | Status | Issues |
| ----------------------- | ------ | ------ |
| 1.1 Text Alt            | ✅     | -      |
| 1.3 Adaptable           | ✅     | -      |
| 1.4.3 Contrast          | ✅     | -      |
| 2.1 Keyboard            | ✅     | -      |
| 4.1.2 Name, Role, Value | ✅     | -      |

## Usage Example

```html
<app-stats-widget title="Total Revenue" [value]="revenue" icon="attach_money" [trend]="12.5" format="currency" [loading]="isLoading">
</app-stats-widget>
```

## Dependencies

### Angular

- @angular/core
- @angular/common
- @angular/material/icon
- @angular/material/card

### External

- None (self-contained)

## Recommendations

1. **Enhancements**
   - Add animation support
   - Implement more formatting options
   - Add support for custom templates

2. **Optimizations**
   - Consider standalone component
   - Add input change detection strategy

3. **Documentation**
   - Add Storybook stories
   - Create usage examples

## Related Components

- [DashboardComponent](./dashboard.md)
- [RevenueChartComponent](./revenue-chart.md)

---

[Back to Components](./README.md) | [Quality Matrix Home](../README.md)
