import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser, COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';

import {
  BusinessRoleInputDto,
  BusinessRoleQueryDto,
  StaffIdentityDocumentInputDto,
  StaffInputDto,
  StaffLeaveBlockInputDto,
  StaffLeaveBlockQueryDto,
  StaffListQueryDto,
  StaffPersonalDetailsInputDto,
  StaffRolesInputDto,
  StaffSelfContactInputDto,
  StaffShiftDayDto,
  StaffShiftInputDto,
  StaffSkillsInputDto,
  VerifyStaffIdentityDocumentInputDto,
  staffBankAccountTypeValues,
  staffDocVerificationStatusValues,
  staffDocumentTypeValues,
  staffEmploymentTypeValues,
  staffGenderValues,
  staffPayoutMethodValues,
} from '../dto/staff-service-catalog.dto';
import { PagedResult, SalonOwnerRequestContext, TimeIntervalModel } from '../models/salon-owner-settings.models';
import {
  BusinessRoleModel,
  PermissionItemModel,
  StaffIdentityDocumentModel,
  StaffLeaveBlockModel,
  StaffModel,
  StaffPersonalProfileModel,
  StaffShiftDayModel,
  StaffShiftModel,
  SuccessResult,
} from '../models/staff-service-catalog.models';

const validationMessage = COMMON_MESSAGE_KEYS.ERROR.VALIDATION;
const forbiddenMessage = COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;
const duplicateStaffMessage = 'error.staff.profile.duplicate';
const finalOwnerConflictMessage = 'error.staff.owner.final_required';
const finalOwnerRoleConflictMessage = 'error.staff.roles.final_owner';
const duplicateRoleMessage = 'error.business.role.name.duplicate';
const inUseRoleMessage = 'error.business.roles.in_use';
const invalidRolesMessage = 'error.staff.roles.invalid';
const invalidRolePermissionsMessage = 'error.business.role.perm.invalid';

const staffInclude = {
  branches: true,
  skills: true,
  roleAssignments: {
    include: {
      businessRole: true,
    },
  },
} as const;

type BusinessRecord = Prisma.SalonBusinessGetPayload<object>;
type BranchRecord = Awaited<ReturnType<PrismaService['salonBranch']['findFirstOrThrow']>>;
type StaffRecord = Prisma.SalonOwnerStaffGetPayload<{ include: typeof staffInclude }>;
type StaffLeaveBlockRecord = Awaited<ReturnType<PrismaService['salonOwnerStaffLeaveBlock']['create']>>;

function trimRequired(value: string, minimumLength = 1): string {
  const trimmed = value.trim();
  if (trimmed.length < minimumLength) {
    throw new UnprocessableEntityException(validationMessage);
  }
  return trimmed;
}

function optionalTrim(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function toIso(value: Date): string {
  return value.toISOString();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function parseMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    throw new UnprocessableEntityException(validationMessage);
  }
  return hours * 60 + minutes;
}

function assertIntervals(intervals: readonly TimeIntervalModel[]): void {
  const sorted = intervals
    .map((interval) => ({
      ...interval,
      startMinutes: parseMinutes(interval.start),
      endMinutes: parseMinutes(interval.end),
    }))
    .sort((left, right) => left.startMinutes - right.startMinutes);

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current.startMinutes >= current.endMinutes) {
      throw new UnprocessableEntityException(validationMessage);
    }

    const previous = sorted[index - 1];
    if (previous && previous.endMinutes > current.startMinutes) {
      throw new UnprocessableEntityException(validationMessage);
    }
  }
}

function assertTimezone(value: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
  } catch {
    throw new UnprocessableEntityException(validationMessage);
  }
}

function normalizeShiftDays(days: readonly StaffShiftDayDto[]): StaffShiftDayModel[] {
  const seen = new Set<number>();
  const normalized = days.map((day) => {
    if (seen.has(day.dayOfWeek)) {
      throw new UnprocessableEntityException(validationMessage);
    }
    seen.add(day.dayOfWeek);
    const intervals = day.intervals.map((interval) => ({ start: interval.start, end: interval.end }));
    assertIntervals(intervals);
    return { dayOfWeek: day.dayOfWeek, intervals };
  });

  return normalized.sort((left, right) => left.dayOfWeek - right.dayOfWeek);
}

function toJsonShiftDays(days: readonly StaffShiftDayModel[]): Prisma.InputJsonValue {
  return days.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    intervals: day.intervals.map((interval) => ({ start: interval.start, end: interval.end })),
  }));
}

function isDuplicate(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2002';
  }
  return error instanceof Error && error.message === 'A unique constraint was violated';
}

function extractRoleNames(user: AuthenticatedUser): string[] {
  if (!user.roles) return [];
  return (user.roles as Array<string | { name?: string }>).map((r) =>
    typeof r === 'string' ? r.toUpperCase() : (r.name ?? '').toUpperCase(),
  );
}

function isUserOwnerOrAdmin(user: AuthenticatedUser): boolean {
  const roleNames = extractRoleNames(user);
  return roleNames.includes('OWNER') || roleNames.includes('ADMIN');
}

function isUserAssignedBranchManager(user: AuthenticatedUser, staffBranchIds: readonly string[]): boolean {
  const roleNames = extractRoleNames(user);
  const isManager = roleNames.includes('MANAGER') || roleNames.includes('BRANCH_MANAGER') || Boolean(user.canManageBranches);
  if (!isManager) return false;
  if (!user.managedBranchIds || user.managedBranchIds.length === 0) {
    return Boolean(user.canManageBranches);
  }
  return staffBranchIds.some((bId) => user.managedBranchIds!.includes(bId));
}

function isUserSelf(user: AuthenticatedUser, staff: { id: string; userId?: string | null; email?: string | null }): boolean {
  if (staff.userId && staff.userId === user.id) return true;
  if (staff.id === user.id) return true;
  if (staff.email && user.email && staff.email.toLowerCase() === user.email.toLowerCase()) return true;
  return false;
}

function validatePersonalDetailsInput(input: StaffPersonalDetailsInputDto): void {
  if (input.legalName !== undefined && input.legalName !== null) {
    const trimmed = input.legalName.trim();
    if (trimmed.length < 2 || trimmed.length > 120) {
      throw new UnprocessableEntityException('error.staff.personal.legal_name.invalid');
    }
  }

  if (input.dateOfBirth) {
    const dob = new Date(input.dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      throw new UnprocessableEntityException('error.staff.personal.dob.invalid');
    }
    const ageDiff = Date.now() - dob.getTime();
    const ageYears = ageDiff / (1000 * 60 * 60 * 24 * 365.25);
    if (dob > new Date() || ageYears < 15) {
      throw new UnprocessableEntityException('error.staff.personal.dob.invalid');
    }
  }

  if (input.gender !== undefined && input.gender !== null) {
    if (!staffGenderValues.includes(input.gender)) {
      throw new UnprocessableEntityException('error.staff.personal.gender.invalid');
    }
  }

  if (!staffEmploymentTypeValues.includes(input.employmentType)) {
    throw new UnprocessableEntityException('error.staff.personal.employment_type.invalid');
  }

  const hire = new Date(input.hireDate);
  if (Number.isNaN(hire.getTime())) {
    throw new UnprocessableEntityException('error.staff.personal.hire_date.invalid');
  }

  if (input.terminationDate) {
    const term = new Date(input.terminationDate);
    if (Number.isNaN(term.getTime()) || term <= hire) {
      throw new UnprocessableEntityException('error.staff.personal.termination_date.invalid');
    }
  }

  if (!staffPayoutMethodValues.includes(input.payoutMethod)) {
    throw new UnprocessableEntityException('error.staff.personal.payout_method.invalid');
  }

  if (input.payoutMethod === 'BANK_TRANSFER') {
    const bank = input.bankDetails;
    if (!bank || !bank.bankName?.trim()) {
      throw new UnprocessableEntityException('error.staff.personal.bank.name.invalid');
    }
    if (!bank.branchName?.trim() && !bank.branchCode?.trim()) {
      throw new UnprocessableEntityException('error.staff.personal.bank.branch.invalid');
    }
    if (!bank.accountType || !staffBankAccountTypeValues.includes(bank.accountType)) {
      throw new UnprocessableEntityException('error.staff.personal.bank.account_type.invalid');
    }
    if (!bank.accountNumber || !/^\d{4,10}$/.test(bank.accountNumber.trim())) {
      throw new UnprocessableEntityException('error.staff.personal.bank.account_number.invalid');
    }
    if (!bank.accountHolder?.trim()) {
      throw new UnprocessableEntityException('error.staff.personal.bank.account_holder.invalid');
    }
  }

  if (input.address) {
    if (input.address.line1 !== undefined && input.address.line1.trim().length > 120) {
      throw new UnprocessableEntityException('error.staff.personal.address.line1.invalid');
    }
    if (input.address.line2 !== undefined && input.address.line2.trim().length > 120) {
      throw new UnprocessableEntityException('error.staff.personal.address.line2.invalid');
    }
    if (input.address.city !== undefined && input.address.city.trim().length > 60) {
      throw new UnprocessableEntityException('error.staff.personal.address.city.invalid');
    }
    if (input.address.state !== undefined && input.address.state.trim().length > 60) {
      throw new UnprocessableEntityException('error.staff.personal.address.state.invalid');
    }
    if (input.address.postalCode !== undefined && input.address.postalCode.trim().length > 20) {
      throw new UnprocessableEntityException('error.staff.personal.address.postal_code.invalid');
    }
  }

  if (input.emergencyContact) {
    const { name, relationship, phone } = input.emergencyContact;
    if (name && (name.trim().length < 2 || name.length > 60)) {
      throw new UnprocessableEntityException('error.staff.personal.emergency.name.invalid');
    }
    if (relationship && relationship.length > 40) {
      throw new UnprocessableEntityException('error.staff.personal.emergency.relationship.invalid');
    }
    if (phone && phone.length > 30) {
      throw new UnprocessableEntityException('error.staff.personal.emergency.phone.invalid');
    }
  }
}

function validateSelfContactInput(input: StaffSelfContactInputDto): void {
  const forbiddenFields = [
    'legalName',
    'dateOfBirth',
    'dob',
    'gender',
    'employmentType',
    'hireDate',
    'terminationDate',
    'payoutMethod',
    'bankDetails',
    'roles',
    'roleIds',
    'branchIds',
    'status',
    'displayName',
    'email',
  ];

  for (const field of forbiddenFields) {
    if (field in input && input[field] !== undefined) {
      throw new ForbiddenException('error.staff.self_edit.forbidden_fields');
    }
  }
}

function validateIdentityDocumentUpload(input: StaffIdentityDocumentInputDto): void {
  if (!staffDocumentTypeValues.includes(input.documentType)) {
    throw new UnprocessableEntityException('error.staff.document.type.invalid');
  }
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimes.includes(input.mimeType)) {
    throw new UnprocessableEntityException('error.staff.document.file.invalid');
  }
  if (!input.fileSizeBytes || input.fileSizeBytes < 1 || input.fileSizeBytes > 10485760) {
    throw new UnprocessableEntityException('error.staff.document.file.invalid');
  }
}

function validateVerifyIdentityDocument(input: VerifyStaffIdentityDocumentInputDto): void {
  if (!staffDocVerificationStatusValues.includes(input.verificationStatus) || input.verificationStatus === 'PENDING_VERIFICATION') {
    throw new UnprocessableEntityException('error.staff.document.verification_status.invalid');
  }
  if (input.verificationStatus === 'REJECTED' && !input.rejectionReason?.trim()) {
    throw new UnprocessableEntityException('error.staff.document.rejection_reason.required');
  }
}

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async listStaff(context: SalonOwnerRequestContext, options: StaffListQueryDto = {}): Promise<PagedResult<StaffModel>> {
    const tenantId = this.requireTenantId(context);
    const { branchId, businessId } = options;
    if (businessId) {
      await this.resolveBusinessInScope(context, businessId);
    }
    if (branchId) {
      await this.findBranchInScope(context, branchId);
    }

    // Delegated manager scoping
    const isOwner = isUserOwnerOrAdmin(context.user);
    if (!isOwner && context.user.managedBranchIds && context.user.managedBranchIds.length > 0) {
      if (branchId && !context.user.managedBranchIds.includes(branchId)) {
        throw new ForbiddenException(forbiddenMessage);
      }
    }

    const query = optionalTrim(options.q);
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;

    const branchFilter = branchId
      ? { branches: { some: { branchId } } }
      : !isOwner && context.user.managedBranchIds && context.user.managedBranchIds.length > 0
        ? { branches: { some: { branchId: { in: context.user.managedBranchIds } } } }
        : {};

    const where: Prisma.SalonOwnerStaffWhereInput = {
      business: { tenantId, ...(businessId ? { id: businessId } : {}) },
      ...branchFilter,
      ...(query
        ? {
            OR: [
              { displayName: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const total = await this.prisma.salonOwnerStaff.count({ where });
    const staff = await this.prisma.salonOwnerStaff.findMany({
      where,
      include: staffInclude,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return this.page(
      staff.map((member) => this.mapStaff(member)),
      { page, pageSize, total },
    );
  }

  async createStaff(context: SalonOwnerRequestContext, input: StaffInputDto): Promise<StaffModel> {
    const branches = await this.findBranchesInScope(context, input.branchIds);
    const businessId = this.requireSingleBusiness(branches);

    // Delegated manager scoping
    if (!isUserOwnerOrAdmin(context.user) && context.user.managedBranchIds && context.user.managedBranchIds.length > 0) {
      const allInScope = input.branchIds.every((id) => context.user.managedBranchIds!.includes(id));
      if (!allInScope) {
        throw new ForbiddenException(forbiddenMessage);
      }
    }

    try {
      const staff = await this.prisma.$transaction(async (tx) => {
        const created = await tx.salonOwnerStaff.create({
          data: {
            businessId,
            displayName: trimRequired(input.displayName, 2),
            phone: trimRequired(input.phone),
            email: optionalTrim(input.email),
            status: input.status,
          },
        });
        await tx.salonOwnerStaffBranch.createMany({
          data: unique(input.branchIds).map((branchId) => ({ staffId: created.id, branchId })),
        });
        return tx.salonOwnerStaff.findUniqueOrThrow({ where: { id: created.id }, include: staffInclude });
      });
      return this.mapStaff(staff);
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateStaffMessage);
      }
      throw error;
    }
  }

  async getStaff(context: SalonOwnerRequestContext, staffId: string): Promise<StaffModel> {
    const staff = await this.findStaffInScope(context, staffId);
    if (!isUserOwnerOrAdmin(context.user) && context.user.managedBranchIds && context.user.managedBranchIds.length > 0) {
      const staffBranchIds = staff.branches.map((b) => b.branchId);
      const hasOverlap = staffBranchIds.some((bId) => context.user.managedBranchIds!.includes(bId));
      if (!hasOverlap) {
        throw new ForbiddenException(forbiddenMessage);
      }
    }
    return this.mapStaff(staff);
  }

  async updateStaff(context: SalonOwnerRequestContext, staffId: string, input: StaffInputDto): Promise<StaffModel> {
    const existing = await this.findStaffInScope(context, staffId);
    const branches = await this.findBranchesInScope(context, input.branchIds);
    this.requireBusinessMatch(branches, existing.businessId);

    const isOwner =
      existing.roles.includes('OWNER') ||
      (existing.roleAssignments ?? []).some(
        (ra) => ra.businessRole?.roleCode === 'OWNER' || ra.businessRole?.name?.toUpperCase() === 'OWNER',
      );

    if (isOwner && input.status === 'INACTIVE') {
      await this.assertRemainingActiveOwner(existing.businessId, staffId);
    }

    try {
      const staff = await this.prisma.$transaction(async (tx) => {
        await tx.salonOwnerStaffBranch.deleteMany({ where: { staffId } });
        await tx.salonOwnerStaffBranch.createMany({
          data: unique(input.branchIds).map((branchId) => ({ staffId, branchId })),
        });
        return tx.salonOwnerStaff.update({
          where: { id: staffId },
          data: {
            displayName: trimRequired(input.displayName, 2),
            phone: trimRequired(input.phone),
            email: optionalTrim(input.email),
            status: input.status,
          },
          include: staffInclude,
        });
      });
      return this.mapStaff(staff);
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateStaffMessage);
      }
      throw error;
    }
  }

  async replaceStaffRoles(context: SalonOwnerRequestContext, staffId: string, input: StaffRolesInputDto): Promise<StaffModel> {
    const existing = await this.findStaffInScope(context, staffId);
    const roleIdentifiers = unique(input.roleIds ?? input.roles ?? []);

    if (roleIdentifiers.length === 0) {
      throw new UnprocessableEntityException(invalidRolesMessage);
    }

    const targetRoles = await this.prisma.businessRole.findMany({
      where: {
        businessId: existing.businessId,
        isActive: true,
        OR: [{ id: { in: roleIdentifiers } }, { roleCode: { in: roleIdentifiers } }, { name: { in: roleIdentifiers } }],
      },
    });

    if (targetRoles.length === 0) {
      throw new UnprocessableEntityException(invalidRolesMessage);
    }

    const hasOwner = targetRoles.some((r) => r.roleCode === 'OWNER' || r.name.toUpperCase() === 'OWNER');
    const wasOwner =
      (existing.roleAssignments ?? []).some(
        (ra) => ra.businessRole?.roleCode === 'OWNER' || ra.businessRole?.name?.toUpperCase() === 'OWNER',
      ) || existing.roles.includes('OWNER');

    if (wasOwner && !hasOwner) {
      await this.assertRemainingActiveOwner(existing.businessId, staffId);
    }

    const staff = await this.prisma.$transaction(async (tx) => {
      await tx.staffRoleAssignment.deleteMany({ where: { staffId } });
      await tx.staffRoleAssignment.createMany({
        data: targetRoles.map((role) => ({ staffId, businessRoleId: role.id })),
      });
      return tx.salonOwnerStaff.update({
        where: { id: staffId },
        data: {
          roles: targetRoles.map((role) => role.roleCode ?? role.name),
        },
        include: staffInclude,
      });
    });

    return this.mapStaff(staff);
  }

  async listBusinessRoles(context: SalonOwnerRequestContext, query?: BusinessRoleQueryDto): Promise<BusinessRoleModel[]> {
    const business = await this.resolveBusinessInScope(context);
    const roles = await this.prisma.businessRole.findMany({
      where: {
        businessId: business.id,
        ...(query?.includeInactive ? {} : { isActive: true }),
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: [{ isSystemDefault: 'desc' }, { name: 'asc' }],
    });

    return roles.map((role) => ({
      id: role.id,
      businessId: role.businessId,
      roleCode: role.roleCode,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p) => p.permissionCode),
      isSystemDefault: role.isSystemDefault,
      isActive: role.isActive,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }));
  }

  async createBusinessRole(context: SalonOwnerRequestContext, input: BusinessRoleInputDto): Promise<BusinessRoleModel> {
    const business = await this.resolveBusinessInScope(context);
    const name = trimRequired(input.name, 2);

    const existing = await this.prisma.businessRole.findFirst({
      where: {
        businessId: business.id,
        name: { equals: name, mode: 'insensitive' },
      },
    });
    if (existing) {
      throw new ConflictException(duplicateRoleMessage);
    }

    const permissions = unique(input.permissions);
    if (permissions.length === 0) {
      throw new UnprocessableEntityException(invalidRolePermissionsMessage);
    }

    const validPerms = await this.prisma.permissionMaster.findMany({
      where: { code: { in: permissions } },
      select: { code: true },
    });
    const validCodeSet = new Set(validPerms.map((p) => p.code));
    if (permissions.some((code) => !validCodeSet.has(code))) {
      throw new UnprocessableEntityException(invalidRolePermissionsMessage);
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const role = await tx.businessRole.create({
          data: {
            businessId: business.id,
            name,
            description: optionalTrim(input.description) ?? null,
            isSystemDefault: false,
            isActive: input.isActive ?? true,
          },
        });

        await tx.businessRolePermission.createMany({
          data: permissions.map((code) => ({
            businessRoleId: role.id,
            permissionCode: code,
          })),
        });

        return tx.businessRole.findUniqueOrThrow({
          where: { id: role.id },
          include: { permissions: true },
        });
      });

      return {
        id: created.id,
        businessId: created.businessId,
        roleCode: created.roleCode,
        name: created.name,
        description: created.description,
        permissions: created.permissions.map((p) => p.permissionCode),
        isSystemDefault: created.isSystemDefault,
        isActive: created.isActive,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateRoleMessage);
      }
      throw error;
    }
  }

  async updateBusinessRole(context: SalonOwnerRequestContext, roleId: string, input: BusinessRoleInputDto): Promise<BusinessRoleModel> {
    const business = await this.resolveBusinessInScope(context);
    const role = await this.prisma.businessRole.findFirst({
      where: { id: roleId, businessId: business.id },
    });
    if (!role) {
      throw new NotFoundException(notFoundMessage);
    }

    const name = trimRequired(input.name, 2);
    if (name.toLowerCase() !== role.name.toLowerCase()) {
      const duplicate = await this.prisma.businessRole.findFirst({
        where: {
          businessId: business.id,
          id: { not: roleId },
          name: { equals: name, mode: 'insensitive' },
        },
      });
      if (duplicate) {
        throw new ConflictException(duplicateRoleMessage);
      }
    }

    const permissions = unique(input.permissions);
    if (permissions.length === 0) {
      throw new UnprocessableEntityException(invalidRolePermissionsMessage);
    }

    const validPerms = await this.prisma.permissionMaster.findMany({
      where: { code: { in: permissions } },
      select: { code: true },
    });
    const validCodeSet = new Set(validPerms.map((p) => p.code));
    if (permissions.some((code) => !validCodeSet.has(code))) {
      throw new UnprocessableEntityException(invalidRolePermissionsMessage);
    }

    const targetIsActive = input.isActive ?? role.isActive;
    if (role.isActive && !targetIsActive) {
      if (role.roleCode === 'OWNER') {
        throw new ConflictException(finalOwnerRoleConflictMessage);
      }
      const assignedCount = await this.prisma.staffRoleAssignment.count({
        where: {
          businessRoleId: roleId,
          staff: { status: 'ACTIVE' },
        },
      });
      if (assignedCount > 0) {
        throw new ConflictException(inUseRoleMessage);
      }
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.businessRolePermission.deleteMany({
          where: { businessRoleId: roleId },
        });
        await tx.businessRolePermission.createMany({
          data: permissions.map((code) => ({
            businessRoleId: roleId,
            permissionCode: code,
          })),
        });
        return tx.businessRole.update({
          where: { id: roleId },
          data: {
            name,
            description: optionalTrim(input.description) ?? null,
            isActive: targetIsActive,
          },
          include: { permissions: true },
        });
      });

      return {
        id: updated.id,
        businessId: updated.businessId,
        roleCode: updated.roleCode,
        name: updated.name,
        description: updated.description,
        permissions: updated.permissions.map((p) => p.permissionCode),
        isSystemDefault: updated.isSystemDefault,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateRoleMessage);
      }
      throw error;
    }
  }

  async deleteBusinessRole(context: SalonOwnerRequestContext, roleId: string): Promise<SuccessResult> {
    const business = await this.resolveBusinessInScope(context);
    const role = await this.prisma.businessRole.findFirst({
      where: { id: roleId, businessId: business.id },
    });
    if (!role) {
      throw new NotFoundException(notFoundMessage);
    }

    if (role.roleCode === 'OWNER') {
      throw new ConflictException(finalOwnerRoleConflictMessage);
    }

    const assignedCount = await this.prisma.staffRoleAssignment.count({
      where: {
        businessRoleId: roleId,
        staff: { status: 'ACTIVE' },
      },
    });
    if (assignedCount > 0) {
      throw new ConflictException(inUseRoleMessage);
    }

    await this.prisma.businessRole.update({
      where: { id: roleId },
      data: { isActive: false },
    });

    return { success: true };
  }

  async listSystemPermissions(): Promise<PermissionItemModel[]> {
    const perms = await this.prisma.permissionMaster.findMany({
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
    return perms.map((p) => ({
      code: p.code,
      name: p.name,
      category: p.category,
      description: p.description,
    }));
  }

  async replaceStaffSkills(context: SalonOwnerRequestContext, staffId: string, input: StaffSkillsInputDto): Promise<StaffModel> {
    const staff = await this.findStaffInScope(context, staffId);
    const serviceIds = unique(input.serviceIds);

    if (serviceIds.length > 0) {
      const services = await this.prisma.salonOwnerService.findMany({
        where: { id: { in: serviceIds }, businessId: staff.businessId },
        select: { id: true },
      });
      if (services.length !== serviceIds.length) {
        throw new NotFoundException(notFoundMessage);
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.salonOwnerStaffSkill.deleteMany({ where: { staffId } });
      if (serviceIds.length > 0) {
        await tx.salonOwnerStaffSkill.createMany({
          data: serviceIds.map((serviceId) => ({ staffId, serviceId })),
        });
      }
      return tx.salonOwnerStaff.findUniqueOrThrow({ where: { id: staffId }, include: staffInclude });
    });

    return this.mapStaff(updated);
  }

  async getStaffShifts(context: SalonOwnerRequestContext, staffId: string): Promise<StaffShiftModel> {
    const staff = await this.findStaffInScope(context, staffId);
    const shift = await this.prisma.salonOwnerStaffShift.findFirst({
      where: { staffId },
    });

    if (!shift) {
      const primaryBranchId = staff.branches[0]?.branchId ?? '';
      return { staffId, branchId: primaryBranchId, timezone: 'Asia/Tokyo', days: [] };
    }

    // Delegated manager scoping
    if (!isUserOwnerOrAdmin(context.user) && context.user.managedBranchIds && context.user.managedBranchIds.length > 0) {
      if (!context.user.managedBranchIds.includes(shift.branchId)) {
        throw new ForbiddenException(forbiddenMessage);
      }
    }

    const rawDays = Array.isArray(shift.days) ? (shift.days as unknown as StaffShiftDayDto[]) : [];
    const days = rawDays.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      intervals: Array.isArray(day.intervals) ? day.intervals.map((i) => ({ start: i.start, end: i.end })) : [],
    }));

    return { staffId, branchId: shift.branchId, timezone: shift.timezone, days };
  }

  async replaceStaffShifts(context: SalonOwnerRequestContext, staffId: string, input: StaffShiftInputDto): Promise<StaffShiftModel> {
    assertTimezone(input.timezone);
    const staff = await this.findStaffInScope(context, staffId);
    const branch = await this.findBranchInScope(context, input.branchId);
    if (branch.businessId !== staff.businessId || !staff.branches.some((assigned) => assigned.branchId === branch.id)) {
      throw new ForbiddenException(forbiddenMessage);
    }
    if (input.timezone !== branch.timezone) {
      throw new UnprocessableEntityException(validationMessage);
    }

    // Delegated manager scoping
    if (!isUserOwnerOrAdmin(context.user) && context.user.managedBranchIds && context.user.managedBranchIds.length > 0) {
      if (!context.user.managedBranchIds.includes(branch.id)) {
        throw new ForbiddenException(forbiddenMessage);
      }
    }

    const days = normalizeShiftDays(input.days);
    const shift = await this.prisma.salonOwnerStaffShift.upsert({
      where: { staffId_branchId: { staffId, branchId: branch.id } },
      create: { staffId, branchId: branch.id, timezone: input.timezone, days: toJsonShiftDays(days) },
      update: { timezone: input.timezone, days: toJsonShiftDays(days) },
    });

    return { staffId, branchId: shift.branchId, timezone: shift.timezone, days };
  }

  async listStaffLeaveBlocks(
    context: SalonOwnerRequestContext,
    staffId: string,
    query: StaffLeaveBlockQueryDto = {},
  ): Promise<PagedResult<StaffLeaveBlockModel>> {
    await this.findStaffInScope(context, staffId);

    const fromDate = query.from ? new Date(query.from) : undefined;
    const toDate = query.to ? new Date(query.to) : undefined;

    if (fromDate && Number.isNaN(fromDate.getTime())) {
      throw new UnprocessableEntityException(validationMessage);
    }
    if (toDate && Number.isNaN(toDate.getTime())) {
      throw new UnprocessableEntityException(validationMessage);
    }
    if (fromDate && toDate && fromDate > toDate) {
      throw new UnprocessableEntityException(validationMessage);
    }

    const where: Prisma.SalonOwnerStaffLeaveBlockWhereInput = {
      staffId,
      ...(fromDate ? { endsAt: { gte: fromDate } } : {}),
      ...(toDate ? { startsAt: { lte: toDate } } : {}),
    };

    const blocks = await this.prisma.salonOwnerStaffLeaveBlock.findMany({
      where,
      orderBy: { startsAt: 'asc' },
    });

    return this.page(blocks.map((block) => this.mapLeaveBlock(block)));
  }

  async createStaffLeaveBlock(
    context: SalonOwnerRequestContext,
    staffId: string,
    input: StaffLeaveBlockInputDto,
  ): Promise<StaffLeaveBlockModel> {
    const staff = await this.findStaffInScope(context, staffId);
    if (input.branchId) {
      const branch = await this.findBranchInScope(context, input.branchId);
      if (branch.businessId !== staff.businessId || !staff.branches.some((assigned) => assigned.branchId === branch.id)) {
        throw new ForbiddenException(forbiddenMessage);
      }
      if (!isUserOwnerOrAdmin(context.user) && context.user.managedBranchIds && context.user.managedBranchIds.length > 0) {
        if (!context.user.managedBranchIds.includes(branch.id)) {
          throw new ForbiddenException(forbiddenMessage);
        }
      }
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) {
      throw new UnprocessableEntityException(validationMessage);
    }

    const block = await this.prisma.salonOwnerStaffLeaveBlock.create({
      data: {
        staffId,
        branchId: input.branchId,
        startsAt,
        endsAt,
        reason: trimRequired(input.reason),
      },
    });

    return this.mapLeaveBlock(block);
  }

  async deleteStaffLeaveBlock(context: SalonOwnerRequestContext, staffId: string, leaveBlockId: string): Promise<SuccessResult> {
    await this.findStaffInScope(context, staffId);
    const existing = await this.prisma.salonOwnerStaffLeaveBlock.findFirst({
      where: { id: leaveBlockId, staffId },
    });
    if (!existing) {
      throw new NotFoundException(notFoundMessage);
    }

    await this.prisma.salonOwnerStaffLeaveBlock.delete({ where: { id: leaveBlockId } });
    return { success: true };
  }

  async getStaffPersonalDetails(context: SalonOwnerRequestContext, staffId: string): Promise<StaffPersonalProfileModel> {
    const staff = await this.findStaffInScope(context, staffId);
    this.assertStaffPersonalAccess(context.user, staff, { allowSelf: true });

    const profile = await this.prisma.staffPersonalProfile.findUnique({
      where: { staffId },
    });

    return this.mapPersonalProfile(staffId, profile, staff.createdAt);
  }

  async updateStaffPersonalDetails(
    context: SalonOwnerRequestContext,
    staffId: string,
    input: StaffPersonalDetailsInputDto,
  ): Promise<StaffPersonalProfileModel> {
    const staff = await this.findStaffInScope(context, staffId);
    this.assertStaffPersonalAccess(context.user, staff, { allowSelf: false });

    validatePersonalDetailsInput(input);

    const isBank = input.payoutMethod === 'BANK_TRANSFER';
    const profile = await this.prisma.staffPersonalProfile.upsert({
      where: { staffId },
      update: {
        legalName: optionalTrim(input.legalName),
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        gender: input.gender ?? null,
        addressLine1: optionalTrim(input.address?.line1),
        addressLine2: optionalTrim(input.address?.line2),
        city: optionalTrim(input.address?.city),
        state: optionalTrim(input.address?.state),
        postalCode: optionalTrim(input.address?.postalCode),
        country: optionalTrim(input.address?.country) ?? 'JP',
        emergencyContactName: optionalTrim(input.emergencyContact?.name),
        emergencyContactRelationship: optionalTrim(input.emergencyContact?.relationship),
        emergencyContactPhone: optionalTrim(input.emergencyContact?.phone),
        employmentType: input.employmentType,
        hireDate: new Date(input.hireDate),
        terminationDate: input.terminationDate ? new Date(input.terminationDate) : null,
        payoutMethod: input.payoutMethod,
        bankName: isBank ? optionalTrim(input.bankDetails?.bankName) : null,
        branchName: isBank ? optionalTrim(input.bankDetails?.branchName) : null,
        branchCode: isBank ? optionalTrim(input.bankDetails?.branchCode) : null,
        accountType: isBank && input.bankDetails?.accountType ? input.bankDetails.accountType : null,
        accountNumber: isBank ? optionalTrim(input.bankDetails?.accountNumber) : null,
        accountHolderName: isBank ? optionalTrim(input.bankDetails?.accountHolder) : null,
      },
      create: {
        staffId,
        legalName: optionalTrim(input.legalName),
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        gender: input.gender ?? null,
        addressLine1: optionalTrim(input.address?.line1),
        addressLine2: optionalTrim(input.address?.line2),
        city: optionalTrim(input.address?.city),
        state: optionalTrim(input.address?.state),
        postalCode: optionalTrim(input.address?.postalCode),
        country: optionalTrim(input.address?.country) ?? 'JP',
        emergencyContactName: optionalTrim(input.emergencyContact?.name),
        emergencyContactRelationship: optionalTrim(input.emergencyContact?.relationship),
        emergencyContactPhone: optionalTrim(input.emergencyContact?.phone),
        employmentType: input.employmentType,
        hireDate: new Date(input.hireDate),
        terminationDate: input.terminationDate ? new Date(input.terminationDate) : null,
        payoutMethod: input.payoutMethod,
        bankName: isBank ? optionalTrim(input.bankDetails?.bankName) : null,
        branchName: isBank ? optionalTrim(input.bankDetails?.branchName) : null,
        branchCode: isBank ? optionalTrim(input.bankDetails?.branchCode) : null,
        accountType: isBank && input.bankDetails?.accountType ? input.bankDetails.accountType : null,
        accountNumber: isBank ? optionalTrim(input.bankDetails?.accountNumber) : null,
        accountHolderName: isBank ? optionalTrim(input.bankDetails?.accountHolder) : null,
      },
    });

    await this.recordAuditEvent(context.user.id, context.user.tenantId, 'StaffPersonalProfileUpdated', staffId);

    return this.mapPersonalProfile(staffId, profile, staff.createdAt);
  }

  async selfUpdateStaffContact(
    context: SalonOwnerRequestContext,
    input: StaffSelfContactInputDto,
    staffId?: string,
  ): Promise<SuccessResult> {
    const tenantId = this.requireTenantId(context);
    validateSelfContactInput(input);

    const staff = await this.prisma.salonOwnerStaff.findFirst({
      where: staffId
        ? { id: staffId, business: { tenantId } }
        : {
            business: { tenantId },
            OR: [{ userId: context.user.id }, { id: context.user.id }, ...(context.user.email ? [{ email: context.user.email }] : [])],
          },
      include: staffInclude,
    });

    if (!staff) {
      throw new NotFoundException(notFoundMessage);
    }

    if (staffId) {
      this.assertStaffPersonalAccess(context.user, staff, { allowSelf: true });
    }

    await this.prisma.$transaction(async (tx) => {
      if (input.phone) {
        await tx.salonOwnerStaff.update({
          where: { id: staff.id },
          data: { phone: trimRequired(input.phone) },
        });
      }

      if (input.address || input.emergencyContact) {
        await tx.staffPersonalProfile.upsert({
          where: { staffId: staff.id },
          update: {
            ...(input.address?.line1 !== undefined ? { addressLine1: optionalTrim(input.address.line1) } : {}),
            ...(input.address?.line2 !== undefined ? { addressLine2: optionalTrim(input.address.line2) } : {}),
            ...(input.address?.city !== undefined ? { city: optionalTrim(input.address.city) } : {}),
            ...(input.address?.state !== undefined ? { state: optionalTrim(input.address.state) } : {}),
            ...(input.address?.postalCode !== undefined ? { postalCode: optionalTrim(input.address.postalCode) } : {}),
            ...(input.address?.country !== undefined ? { country: optionalTrim(input.address.country) ?? 'JP' } : {}),
            ...(input.emergencyContact?.name !== undefined ? { emergencyContactName: optionalTrim(input.emergencyContact.name) } : {}),
            ...(input.emergencyContact?.relationship !== undefined
              ? { emergencyContactRelationship: optionalTrim(input.emergencyContact.relationship) }
              : {}),
            ...(input.emergencyContact?.phone !== undefined ? { emergencyContactPhone: optionalTrim(input.emergencyContact.phone) } : {}),
          },
          create: {
            staffId: staff.id,
            employmentType: 'FULL_TIME',
            hireDate: staff.createdAt,
            payoutMethod: 'CASH',
            addressLine1: optionalTrim(input.address?.line1),
            addressLine2: optionalTrim(input.address?.line2),
            city: optionalTrim(input.address?.city),
            state: optionalTrim(input.address?.state),
            postalCode: optionalTrim(input.address?.postalCode),
            country: optionalTrim(input.address?.country) ?? 'JP',
            emergencyContactName: optionalTrim(input.emergencyContact?.name),
            emergencyContactRelationship: optionalTrim(input.emergencyContact?.relationship),
            emergencyContactPhone: optionalTrim(input.emergencyContact?.phone),
          },
        });
      }
    });

    await this.recordAuditEvent(context.user.id, context.user.tenantId, 'StaffSelfContactUpdated', staff.id);
    await this.dispatchUpwardChainNotification(staff, 'StaffSelfContactUpdated', 'Staff member updated contact details');

    return { success: true };
  }

  async uploadStaffIdentityDocument(
    context: SalonOwnerRequestContext,
    staffId: string,
    input: StaffIdentityDocumentInputDto,
  ): Promise<StaffIdentityDocumentModel> {
    const staff = await this.findStaffInScope(context, staffId);
    this.assertStaffPersonalAccess(context.user, staff, { allowSelf: true });

    validateIdentityDocumentUpload(input);

    const doc = await this.prisma.staffIdentityDocument.create({
      data: {
        staffId,
        documentType: input.documentType,
        fileKey: input.fileKey,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        verificationStatus: 'PENDING_VERIFICATION',
      },
    });

    await this.recordAuditEvent(context.user.id, context.user.tenantId, 'StaffIdentityDocumentUploaded', doc.id);

    return this.mapIdentityDocument(doc);
  }

  async listStaffIdentityDocuments(context: SalonOwnerRequestContext, staffId: string): Promise<readonly StaffIdentityDocumentModel[]> {
    const staff = await this.findStaffInScope(context, staffId);
    this.assertStaffPersonalAccess(context.user, staff, { allowSelf: true });

    const docs = await this.prisma.staffIdentityDocument.findMany({
      where: { staffId },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((doc) => this.mapIdentityDocument(doc));
  }

  async verifyStaffIdentityDocument(
    context: SalonOwnerRequestContext,
    staffId: string,
    documentId: string,
    input: VerifyStaffIdentityDocumentInputDto,
  ): Promise<StaffIdentityDocumentModel> {
    const staff = await this.findStaffInScope(context, staffId);
    this.assertStaffPersonalAccess(context.user, staff, { allowSelf: false });

    validateVerifyIdentityDocument(input);

    const existing = await this.prisma.staffIdentityDocument.findFirst({
      where: { id: documentId, staffId },
    });
    if (!existing) {
      throw new NotFoundException(notFoundMessage);
    }

    const updated = await this.prisma.staffIdentityDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: input.verificationStatus,
        verifiedByUserId: context.user.id,
        verifiedAt: new Date(),
        rejectionReason: input.verificationStatus === 'REJECTED' ? input.rejectionReason?.trim() : null,
      },
    });

    await this.recordAuditEvent(context.user.id, context.user.tenantId, 'StaffIdentityDocumentVerified', documentId);

    return this.mapIdentityDocument(updated);
  }

  private requireTenantId(context: SalonOwnerRequestContext): string {
    if (!context.user.tenantId) {
      throw new ForbiddenException(forbiddenMessage);
    }
    return context.user.tenantId;
  }

  private async resolveBusinessInScope(context: SalonOwnerRequestContext, requestedBusinessId?: string): Promise<BusinessRecord> {
    const tenantId = this.requireTenantId(context);
    const effectiveBusinessId = requestedBusinessId;

    if (effectiveBusinessId) {
      const business = await this.prisma.salonBusiness.findFirst({
        where: { id: effectiveBusinessId, tenantId },
      });
      if (!business) {
        throw new NotFoundException(notFoundMessage);
      }
      return business;
    }

    const businesses = await this.prisma.salonBusiness.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    if (businesses.length !== 1) {
      throw new ForbiddenException(forbiddenMessage);
    }
    return businesses[0];
  }

  private async findBranchInScope(context: SalonOwnerRequestContext, branchId: string): Promise<BranchRecord> {
    const tenantId = this.requireTenantId(context);
    const branch = await this.prisma.salonBranch.findFirst({
      where: { id: branchId, business: { tenantId } },
    });
    if (!branch) {
      throw new NotFoundException(notFoundMessage);
    }
    return branch;
  }

  private async findBranchesInScope(context: SalonOwnerRequestContext, branchIds: readonly string[]): Promise<BranchRecord[]> {
    const ids = unique(branchIds);
    if (ids.length === 0) {
      throw new UnprocessableEntityException(validationMessage);
    }
    const tenantId = this.requireTenantId(context);
    const branches = await this.prisma.salonBranch.findMany({
      where: { id: { in: ids }, business: { tenantId } },
    });
    if (branches.length !== ids.length) {
      throw new NotFoundException(notFoundMessage);
    }
    return branches;
  }

  private async findStaffInScope(context: SalonOwnerRequestContext, staffId: string): Promise<StaffRecord> {
    const tenantId = this.requireTenantId(context);
    const staff = await this.prisma.salonOwnerStaff.findFirst({
      where: { id: staffId, business: { tenantId } },
      include: staffInclude,
    });
    if (!staff) {
      throw new NotFoundException(notFoundMessage);
    }
    return staff;
  }

  private requireSingleBusiness(branches: readonly BranchRecord[]): string {
    const businessIds = unique(branches.map((branch) => branch.businessId));
    if (businessIds.length !== 1) {
      throw new UnprocessableEntityException(validationMessage);
    }
    return businessIds[0];
  }

  private requireBusinessMatch(branches: readonly BranchRecord[], businessId: string): void {
    if (branches.some((branch) => branch.businessId !== businessId)) {
      throw new UnprocessableEntityException(validationMessage);
    }
  }

  private async assertRemainingActiveOwner(businessId: string, currentStaffId: string): Promise<void> {
    const activeStaff = await this.prisma.salonOwnerStaff.findMany({
      where: {
        businessId,
        status: 'ACTIVE',
        id: { not: currentStaffId },
      },
      include: {
        roleAssignments: {
          include: { businessRole: true },
        },
      },
    });

    const hasOtherActiveOwner = (activeStaff ?? []).some(
      (s) =>
        (s.roleAssignments ?? []).some((ra) => ra.businessRole?.roleCode === 'OWNER' || ra.businessRole?.name?.toUpperCase() === 'OWNER') ||
        s.roles.includes('OWNER'),
    );

    if (!hasOtherActiveOwner) {
      throw new ConflictException(finalOwnerConflictMessage);
    }
  }

  private assertStaffPersonalAccess(user: AuthenticatedUser, staff: StaffRecord, options: { allowSelf: boolean }): void {
    if (isUserOwnerOrAdmin(user) || Boolean(user['canManageStaffPersonalDetails'])) {
      return;
    }
    const staffBranchIds = (staff.branches ?? []).map((b) => b.branchId);
    if (isUserAssignedBranchManager(user, staffBranchIds)) {
      return;
    }
    if (options.allowSelf && isUserSelf(user, staff)) {
      return;
    }
    throw new ForbiddenException(forbiddenMessage);
  }

  private mapStaff(staff: StaffRecord): StaffModel {
    const roleAssignments = staff.roleAssignments ?? [];
    const roleNames =
      roleAssignments.length > 0 ? roleAssignments.map((ra) => ra.businessRole?.roleCode ?? ra.businessRole?.name ?? '') : staff.roles;

    const roleIds = roleAssignments.map((ra) => ra.businessRoleId);

    return {
      id: staff.id,
      displayName: staff.displayName,
      phone: staff.phone,
      email: staff.email ?? undefined,
      status: staff.status,
      roles: roleNames,
      roleIds,
      branchIds: staff.branches.map((branch) => branch.branchId).sort(),
      skillServiceIds: staff.skills.map((skill) => skill.serviceId).sort(),
      createdAt: toIso(staff.createdAt),
      updatedAt: toIso(staff.updatedAt),
    };
  }

  private mapLeaveBlock(block: StaffLeaveBlockRecord): StaffLeaveBlockModel {
    return {
      id: block.id,
      staffId: block.staffId,
      branchId: block.branchId,
      startsAt: toIso(block.startsAt),
      endsAt: toIso(block.endsAt),
      reason: block.reason,
    };
  }

  private mapPersonalProfile(
    staffId: string,
    profile: Prisma.StaffPersonalProfileGetPayload<object> | null,
    defaultHireDate?: Date,
  ): StaffPersonalProfileModel {
    if (!profile) {
      return {
        staffId,
        legalName: null,
        dateOfBirth: null,
        gender: null,
        employmentType: 'FULL_TIME',
        hireDate: defaultHireDate ? defaultHireDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        terminationDate: null,
        payoutMethod: 'CASH',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const hasAddress = Boolean(profile.addressLine1 || profile.city || profile.state || profile.postalCode);
    const address = hasAddress
      ? {
          line1: profile.addressLine1 ?? undefined,
          line2: profile.addressLine2 ?? undefined,
          city: profile.city ?? undefined,
          state: profile.state ?? undefined,
          postalCode: profile.postalCode ?? undefined,
          country: profile.country ?? 'JP',
        }
      : undefined;

    const hasEmergency = Boolean(profile.emergencyContactName || profile.emergencyContactPhone);
    const emergencyContact = hasEmergency
      ? {
          name: profile.emergencyContactName ?? undefined,
          relationship: profile.emergencyContactRelationship ?? undefined,
          phone: profile.emergencyContactPhone ?? undefined,
        }
      : undefined;

    const hasBank = profile.payoutMethod === 'BANK_TRANSFER' && Boolean(profile.bankName || profile.accountNumber);
    const bankDetails = hasBank
      ? {
          bankName: profile.bankName ?? undefined,
          branchName: profile.branchName ?? undefined,
          branchCode: profile.branchCode ?? undefined,
          accountType: (profile.accountType as (typeof staffBankAccountTypeValues)[number]) ?? undefined,
          accountNumber: profile.accountNumber ?? undefined,
          accountHolder: profile.accountHolderName ?? undefined,
        }
      : undefined;

    return {
      staffId: profile.staffId,
      legalName: profile.legalName,
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
      gender: profile.gender,
      address,
      emergencyContact,
      employmentType: profile.employmentType,
      hireDate: profile.hireDate.toISOString().slice(0, 10),
      terminationDate: profile.terminationDate ? profile.terminationDate.toISOString().slice(0, 10) : null,
      payoutMethod: profile.payoutMethod,
      bankDetails,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private mapIdentityDocument(doc: Prisma.StaffIdentityDocumentGetPayload<object>): StaffIdentityDocumentModel {
    return {
      id: doc.id,
      staffId: doc.staffId,
      documentType: doc.documentType,
      fileKey: doc.fileKey,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      verificationStatus: doc.verificationStatus,
      verifiedByUserId: doc.verifiedByUserId,
      verifiedAt: doc.verifiedAt ? doc.verifiedAt.toISOString() : null,
      rejectionReason: doc.rejectionReason,
      downloadUrl: `/api/partner/staff/${doc.staffId}/documents/${doc.id}/download?token=mock_signed_token`,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private async recordAuditEvent(
    userId: string | undefined,
    tenantId: string | undefined,
    action: string,
    targetId: string,
    reason?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditEvent.create({
        data: {
          userId: userId ?? null,
          tenantId: tenantId ?? null,
          action,
          targetId,
          reason: reason ?? null,
        },
      });
    } catch (error) {
      // Non-blocking error handling for audit log writes
      console.warn(`[AuditEvent] Failed to persist audit event ${action}:`, error);
    }
  }

  private async dispatchUpwardChainNotification(staff: StaffRecord, action: string, message: string): Promise<void> {
    await Promise.resolve();
    console.log(`[Notification] Upward chain alert dispatched for staff ${staff.displayName} (${staff.id}) on ${action}: ${message}`);
  }

  private page<T>(items: readonly T[], pagination?: { page: number; pageSize: number; total: number }): PagedResult<T> {
    return {
      items,
      page: {
        limit: pagination?.pageSize ?? items.length,
        nextCursor: null,
        hasMore: pagination ? pagination.page * pagination.pageSize < pagination.total : false,
        ...(pagination ? { page: pagination.page, pageSize: pagination.pageSize, total: pagination.total } : {}),
      },
    };
  }
}
