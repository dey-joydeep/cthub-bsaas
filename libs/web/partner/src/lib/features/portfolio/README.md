# Portfolio Feature Documentation

## Production Data Requirements

- All form fields (`tenant_id`, `user_id`, `image_path`, `description`) are **required** and must come from actual user context or input.
- No fallback or dummy values (like `test-tenant`, `test-user`, or empty strings) are accepted in production code.
- If a required field is missing, the submission will not proceed, and the user will see a validation error.

## Module Integration

- The `PortfolioComponent` is a **standalone Angular component**.
- It imports the following modules in its `@Component.imports` array:
  - `CommonModule`
  - `ReactiveFormsModule`
  - `TranslateModule` (for i18n)
- If you add new features or forms, ensure to import `CommonModule` and `ReactiveFormsModule` for template directives like `*ngIf` and `formGroup`.

## Security & Naming Conventions

- All TypeScript interfaces and service code must use **camelCase** for field names.
- Any mapping to or from backend/database should be handled via service/model logic, not by using snake_case in the frontend.
- If you see any snake_case fields in frontend code, refactor them to camelCase immediately.

## Error Handling

- Errors from service calls are displayed to the user via `this.error`.
- Loading state is managed by `this.loading`.

## Further Reading

- For more on Angular standalone modules: [Angular Standalone Modules](https://angular.dev/reference/standalone-apis)
- For naming conventions: see project-wide standards in the main README or architecture docs.

## Last Updated

2025-04-22

**Instruction:** If you update the naming convention or required modules for this feature, you must also update this README and notify the team in the next standup.

## Portfolio Feature

This module provides portfolio management for users and tenants.

## Features

- Upload images
- Edit descriptions
- Delete portfolio items

## Usage

1. Go to the Portfolio page.
2. Click 'Add Item'.
3. Upload an image and fill in the description.
4. Save to add to your portfolio.

## API Endpoints

- `GET /api/portfolio`
- `POST /api/portfolio`
- `DELETE /api/portfolio/:id`

## Notes

- Images must be JPG or PNG.
- Max file size: 5MB.
- Only the owner can delete items.

For more details, see the [documentation](https://example.com/docs/portfolio).
