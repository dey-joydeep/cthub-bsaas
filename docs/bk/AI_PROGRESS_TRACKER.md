# AI Progress Tracker for Compliance with User Coding Standards

## User Instructions to Track

- All backend features/modules must use PostgreSQL and/or MongoDB for production logic (no demo/in-memory data in production code).
- Interfaces must be placed in a dedicated 'models' folder, with each interface in a separate file.
- Demo data is only allowed in test/mocks.
- For any function parameter of object type with 3 or more properties, define a named type or interface for that parameter.
- All new features must follow these patterns.

## User Workflow Instruction (2025-04-20, updated)

- For each feature, proceed in this strict order:
  1. Frontend coding
  2. Frontend linting
  3. Check for frontend compilation errors
  4. Frontend unit testing (UT)
  5. Backend coding
  6. Backend linting
  7. Check for backend compilation errors
  8. Backend unit testing (UT)

- Repeat steps 1-8 for each feature, one at a time, in planning order.
- After all features are coded, linted, and unit tested: 9. Integration testing (IT) for all features, one-by-one 10. Edge testing (ET) for all features, one-by-one
- Always keep checklists and docs in sync at each step.

## Current Compliance (auto-updated)

- [x] Backend DB implementation for all modules (salon, appointment, portfolio, review, user, social)
- [x] All function object parameters (3+ props) use named type/interface
- [x] Backend feature completeness for Approve/Manage Staff (add, activate, deactivate, remove endpoints)
- [x] Backend feature completeness for Social module (all CRUD endpoints now use real DB logic, all naming conventions enforced, no dummy/stub logic remains)
- [x] Backend feature completeness for SalonService.getAverageRatingForSalon (real DB aggregation, no dummy logic)
- [x] ReviewNoSQLService: Documented fallback for sync rating/count (MongoDB does not support synchronous queries; async/caching recommended for production)
- [x] DashboardService.getRevenue: Replaced example raw SQL with real Prisma aggregation for revenue by month
- [x] UserService.getUsers: Returns real DB users, output mapping enforces camelCase and relation normalization
- [x] UserService.getUserById: Returns real DB user, output mapping enforces camelCase and relation normalization
- [x] UserService.createUser: Real DB insert, output mapping enforces camelCase and relation normalization
- [x] UserService.updateUser: Real DB update, output mapping enforces camelCase and relation normalization
- [x] PortfolioService.getPortfolios: Real DB fetch, camelCase output, images normalized
- [x] PortfolioService.getPortfolioById: Real DB fetch, camelCase output, images normalized
- [x] PortfolioService.createPortfolio: Real DB insert, camelCase output, images normalized
- [x] PortfolioService.updatePortfolio: Real DB update, camelCase output, images normalized
- [x] PortfolioService.deletePortfolio: Real DB delete
- [x] ThemeService.getTheme: Real DB fetch, output uses DB field names
- [x] ThemeService.getThemeById: Real DB fetch, output uses DB field names
- [x] ThemeService.getThemes: Real DB fetch, output uses DB field names
- [x] ThemeService.updateTheme: Real DB update, validates hex colors, output uses DB field names
- [x] AppointmentService.getAppointments: Real DB fetch, output normalized (camelCase, null fallback)
- [x] AppointmentService.getAppointmentById: Real DB fetch, output normalized (camelCase, null fallback)
- [x] AppointmentService.createAppointment: Real DB insert
- [x] AppointmentService.updateAppointment: Real DB update
- [x] AppointmentService.deleteAppointment: Real DB delete
- [x] SalonService.getAllSalons: Real DB fetch, camelCase output, null fallback
- [x] SalonService.getSalonById: Real DB fetch, camelCase output, null fallback
- [x] SalonService.searchSalons: Real DB search, supports query, filter, sort, pagination, and rating filters
- [x] SalonService.getTopSalons: Real DB logic, returns top salons by rating/reviews, output normalized
- [x] SalonService.getAverageRatingForSalon: Real DB aggregation, returns average rating, output normalized
- [x] ReviewService.getReviewsForSalon: Real DB fetch, output normalized (camelCase, null fallback)
- [x] ReviewService.addReview: Real DB insert, eligibility checked, output normalized
- [x] ReviewService.getAverageRating: Real DB aggregation (in-memory), returns average/count
- [x] ReviewService.getAverageRatingForSalon: Alias, real DB aggregation, returns average/count
- [x] ReviewService.getReviewCount: Real DB count aggregation
- [x] AuthService.findOrCreateSocialUser: Real DB logic, finds or creates user for social login, updates lastLoginAt, uses camelCase in TS
- [x] SalonStaffRequestService.createLeaveRequest: Real DB insert, uses enums for type/status, null fallback
- [x] SalonStaffRequestService.approveRequest: Real DB update, updates staff leave status if leave request
- [x] SalonStaffRequestService.rejectRequest: Real DB update, sets rejection reason
- [x] SalonStaffRequestService.getRequestsForStaff: Real DB fetch, by staffId
- [x] SalonStaffRequestService.getPendingRequests: Real DB fetch, pending only
- [ ] Backend feature completeness for Approve Services/Prod.
- [ ] Frontend feature completeness for Approve Services/Prod.

## Instructions

- Update this file when user gives new instructions or when compliance state changes.
- Use this as an internal AI checklist to ensure all future work aligns with user standards.
