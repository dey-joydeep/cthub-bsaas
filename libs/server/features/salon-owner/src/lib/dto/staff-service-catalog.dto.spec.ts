import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import {
  StaffIdentityDocumentInputDto,
  StaffInputDto,
  StaffLeaveBlockInputDto,
  StaffListQueryDto,
  StaffPersonalDetailsInputDto,
  StaffSelfContactInputDto,
  VerifyStaffIdentityDocumentInputDto,
} from './staff-service-catalog.dto';

describe('staff and service catalog DTOs', () => {
  it('rejects whitespace-only staff display names', async () => {
    const dto = plainToInstance(StaffInputDto, {
      branchIds: ['11111111-1111-4111-8111-111111111111'],
      displayName: '   ',
      phone: '09000000001',
      status: 'ACTIVE',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('displayName');
  });

  it('requires UTC instants for leave block bounds', async () => {
    const dto = plainToInstance(StaffLeaveBlockInputDto, {
      branchId: '11111111-1111-4111-8111-111111111111',
      startsAt: '2026-06-01T09:00:00',
      endsAt: '2026-06-01T10:00:00',
      reason: 'Personal',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['startsAt', 'endsAt']));
  });

  it('accepts documented staff list query parameters', async () => {
    const dto = plainToInstance(StaffListQueryDto, {
      branchId: '11111111-1111-4111-8111-111111111111',
      q: 'Ann',
      page: '2',
      pageSize: '25',
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(25);
  });

  it('validates StaffPersonalDetailsInputDto required fields and formats', async () => {
    const invalidDto = plainToInstance(StaffPersonalDetailsInputDto, {
      employmentType: 'INVALID_TYPE',
      hireDate: 'not-a-date',
      payoutMethod: 'INVALID_PAYOUT',
    });
    const errors = await validate(invalidDto);
    expect(errors.map((e) => e.property)).toEqual(expect.arrayContaining(['employmentType', 'hireDate', 'payoutMethod']));

    const validDto = plainToInstance(StaffPersonalDetailsInputDto, {
      legalName: 'Elena Vance',
      dateOfBirth: '1990-05-15',
      gender: 'FEMALE',
      employmentType: 'FULL_TIME',
      hireDate: '2020-01-10',
      payoutMethod: 'BANK_TRANSFER',
      address: { line1: '1-2-3 Shibuya', city: 'Tokyo', postalCode: '150-0002' },
      emergencyContact: { name: 'Marcus Vance', relationship: 'Spouse', phone: '09099990001' },
      bankDetails: {
        bankName: 'Mizuho Bank',
        branchName: 'Shibuya',
        accountType: 'ORDINARY',
        accountNumber: '1234567',
        accountHolder: 'ELENA VANCE',
      },
    });
    await expect(validate(validDto)).resolves.toEqual([]);
  });

  it('validates StaffSelfContactInputDto fields', async () => {
    const validSelfDto = plainToInstance(StaffSelfContactInputDto, {
      phone: '09012345678',
      address: { line1: 'Apt 1' },
      emergencyContact: { name: 'Emergency', phone: '09011112222' },
    });
    await expect(validate(validSelfDto)).resolves.toEqual([]);
  });

  it('validates StaffIdentityDocumentInputDto constraints', async () => {
    const invalidDoc = plainToInstance(StaffIdentityDocumentInputDto, {
      documentType: 'INVALID_DOC',
      fileKey: 'key',
      mimeType: 'text/html',
      fileSizeBytes: 20000000,
    });
    const errors = await validate(invalidDoc);
    expect(errors.map((e) => e.property)).toEqual(expect.arrayContaining(['documentType', 'mimeType', 'fileSizeBytes']));

    const validDoc = plainToInstance(StaffIdentityDocumentInputDto, {
      documentType: 'DRIVERS_LICENSE',
      fileKey: 'secure/key.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1048576,
    });
    await expect(validate(validDoc)).resolves.toEqual([]);
  });

  it('validates VerifyStaffIdentityDocumentInputDto', async () => {
    const invalidVerify = plainToInstance(VerifyStaffIdentityDocumentInputDto, {
      verificationStatus: 'UNKNOWN',
    });
    const errors = await validate(invalidVerify);
    expect(errors.map((e) => e.property)).toContain('verificationStatus');

    const validVerify = plainToInstance(VerifyStaffIdentityDocumentInputDto, {
      verificationStatus: 'VERIFIED',
    });
    await expect(validate(validVerify)).resolves.toEqual([]);
  });
});
