# Salon Owner API Endpoint Map

This document maps feature specifications to OpenAPI operations. The executable HTTP contract remains [openapi.yaml](./openapi.yaml).

## Business Settings

| Capability              | Method | Path                               | Operation ID          |
| ----------------------- | ------ | ---------------------------------- | --------------------- |
| List owned businesses   | `GET`  | `/partner/businesses`              | `listSalonBusinesses` |
| Create salon business   | `POST` | `/partner/businesses`              | `createSalonBusiness` |
| Get business settings   | `GET`  | `/partner/businesses/{businessId}` | `getSalonBusiness`    |
| Update business profile | `PUT`  | `/partner/businesses/{businessId}` | `updateSalonBusiness` |

## Branch Settings

| Capability           | Method | Path                                           | Operation ID         |
| -------------------- | ------ | ---------------------------------------------- | -------------------- |
| List branches        | `GET`  | `/partner/branches`                            | `listBranches`       |
| Create branch        | `POST` | `/partner/branches`                            | `createBranch`       |
| Get branch           | `GET`  | `/partner/branches/{branchId}`                 | `getBranch`          |
| Update branch        | `PUT`  | `/partner/branches/{branchId}`                 | `updateBranch`       |
| Replace hours        | `PUT`  | `/partner/branches/{branchId}/hours`           | `replaceBranchHours` |
| Set holiday          | `PUT`  | `/partner/branches/{branchId}/holidays/{date}` | `setBranchHoliday`   |
| Update branch policy | `PUT`  | `/partner/branches/{branchId}/policy`          | `updateBranchPolicy` |

## Staff

| Capability               | Method | Path                                                     | Operation ID                  |
| ------------------------ | ------ | -------------------------------------------------------- | ----------------------------- |
| List staff               | `GET`  | `/partner/staff`                                         | `listStaff`                   |
| Create staff             | `POST` | `/partner/staff`                                         | `createStaff`                 |
| Get staff                | `GET`  | `/partner/staff/{staffId}`                               | `getStaff`                    |
| Update staff             | `PUT`  | `/partner/staff/{staffId}`                               | `updateStaff`                 |
| Get personal details     | `GET`  | `/partner/staff/{staffId}/personal`                      | `getStaffPersonalDetails`     |
| Update personal details  | `PUT`  | `/partner/staff/{staffId}/personal`                      | `updateStaffPersonalDetails`  |
| Self-update contact info | `PUT`  | `/partner/staff/self/contact`                            | `selfUpdateStaffContact`      |
| Upload identity document | `POST` | `/partner/staff/{staffId}/documents`                     | `uploadStaffIdentityDocument` |
| List identity documents  | `GET`  | `/partner/staff/{staffId}/documents`                     | `listStaffIdentityDocuments`  |
| Verify identity document | `PUT`  | `/partner/staff/{staffId}/documents/{documentId}/verify` | `verifyStaffIdentityDocument` |
| Replace roles            | `PUT`  | `/partner/staff/{staffId}/roles`                         | `replaceStaffRoles`           |
| Replace skills           | `PUT`  | `/partner/staff/{staffId}/skills`                        | `replaceStaffSkills`          |
| Replace shifts           | `PUT`  | `/partner/staff/{staffId}/shifts`                        | `replaceStaffShifts`          |
| Create leave block       | `POST` | `/partner/staff/{staffId}/leave-blocks`                  | `createStaffLeaveBlock`       |

## Service Catalog

| Capability                | Method | Path                                              | Operation ID                     |
| ------------------------- | ------ | ------------------------------------------------- | -------------------------------- |
| List categories           | `GET`  | `/partner/service-categories`                     | `listServiceCategories`          |
| Create category           | `POST` | `/partner/service-categories`                     | `createServiceCategory`          |
| List services             | `GET`  | `/partner/services`                               | `listServices`                   |
| Create service            | `POST` | `/partner/services`                               | `createService`                  |
| Get service               | `GET`  | `/partner/services/{serviceId}`                   | `getService`                     |
| Update service            | `PUT`  | `/partner/services/{serviceId}`                   | `updateService`                  |
| Update service status     | `PUT`  | `/partner/services/{serviceId}/status`            | `updateServiceStatus`            |
| Replace staff eligibility | `PUT`  | `/partner/services/{serviceId}/staff-eligibility` | `replaceServiceStaffEligibility` |

## Customer CRM

| Capability                       | Method | Path                                                        | Operation ID                             |
| -------------------------------- | ------ | ----------------------------------------------------------- | ---------------------------------------- |
| Search customers                 | `GET`  | `/partner/customers`                                        | `searchCustomers`                        |
| Create customer                  | `POST` | `/partner/customers`                                        | `createCustomer`                         |
| Get customer                     | `GET`  | `/partner/customers/{customerId}`                           | `getCustomer`                            |
| Update customer                  | `PUT`  | `/partner/customers/{customerId}`                           | `updateCustomer`                         |
| Create customer note             | `POST` | `/partner/customers/{customerId}/notes`                     | `createCustomerNote`                     |
| Update communication preferences | `PUT`  | `/partner/customers/{customerId}/communication-preferences` | `updateCustomerCommunicationPreferences` |
| Get visit history                | `GET`  | `/partner/customers/{customerId}/visit-history`             | `getCustomerVisitHistory`                |

## Appointment

| Capability         | Method | Path                                               | Operation ID              |
| ------------------ | ------ | -------------------------------------------------- | ------------------------- |
| Get day board      | `GET`  | `/partner/appointments/day-board`                  | `getAppointmentDayBoard`  |
| Find slots         | `GET`  | `/partner/appointments/slots`                      | `findAppointmentSlots`    |
| Create appointment | `POST` | `/partner/appointments`                            | `createAppointment`       |
| Create walk-in     | `POST` | `/partner/appointments/walk-ins`                   | `createWalkInAppointment` |
| Get appointment    | `GET`  | `/partner/appointments/{appointmentId}`            | `getAppointment`          |
| Reschedule         | `POST` | `/partner/appointments/{appointmentId}/reschedule` | `rescheduleAppointment`   |
| Confirm            | `POST` | `/partner/appointments/{appointmentId}/confirm`    | `confirmAppointment`      |
| Cancel             | `POST` | `/partner/appointments/{appointmentId}/cancel`     | `cancelAppointment`       |
| Mark no-show       | `POST` | `/partner/appointments/{appointmentId}/no-show`    | `markAppointmentNoShow`   |
| Mark arrived       | `POST` | `/partner/appointments/{appointmentId}/arrive`     | `markAppointmentArrived`  |
| Start service      | `POST` | `/partner/appointments/{appointmentId}/start`      | `startAppointmentService` |
| Complete           | `POST` | `/partner/appointments/{appointmentId}/complete`   | `completeAppointment`     |

## POS

| Capability           | Method | Path                                         | Operation ID            |
| -------------------- | ------ | -------------------------------------------- | ----------------------- |
| Get checkout context | `GET`  | `/partner/pos/checkout-context`              | `getCheckoutContext`    |
| Create invoice       | `POST` | `/partner/pos/invoices`                      | `createInvoice`         |
| Get invoice          | `GET`  | `/partner/pos/invoices/{invoiceId}`          | `getInvoice`            |
| Finalize invoice     | `POST` | `/partner/pos/invoices/{invoiceId}/finalize` | `finalizeInvoice`       |
| Capture payment      | `POST` | `/partner/pos/invoices/{invoiceId}/payments` | `captureInvoicePayment` |
| List pending dues    | `GET`  | `/partner/pos/pending-dues`                  | `listPendingDues`       |

## Inventory

| Capability            | Method | Path                                                   | Operation ID          |
| --------------------- | ------ | ------------------------------------------------------ | --------------------- |
| List products         | `GET`  | `/partner/inventory/products`                          | `listProducts`        |
| Create product        | `POST` | `/partner/inventory/products`                          | `createProduct`       |
| Get product           | `GET`  | `/partner/inventory/products/{productId}`              | `getProduct`          |
| Update product        | `PUT`  | `/partner/inventory/products/{productId}`              | `updateProduct`       |
| List branch stock     | `GET`  | `/partner/inventory/branch-stock`                      | `listBranchStock`     |
| Create movement       | `POST` | `/partner/inventory/stock-movements`                   | `createStockMovement` |
| Adjust stock          | `POST` | `/partner/inventory/products/{productId}/adjust-stock` | `adjustProductStock`  |
| List low-stock alerts | `GET`  | `/partner/inventory/low-stock-alerts`                  | `listLowStockAlerts`  |

## Dashboard

| Capability       | Method | Path                        | Operation ID          |
| ---------------- | ------ | --------------------------- | --------------------- |
| Owner dashboard  | `GET`  | `/partner/dashboard/owner`  | `getOwnerDashboard`   |
| Dashboard alerts | `GET`  | `/partner/dashboard/alerts` | `listDashboardAlerts` |
