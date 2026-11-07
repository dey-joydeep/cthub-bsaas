import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { StaffInputDto, StaffLeaveBlockInputDto, StaffListQueryDto } from './staff-service-catalog.dto';

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
});
