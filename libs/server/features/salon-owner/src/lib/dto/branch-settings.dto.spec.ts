import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { BranchPolicyInputDto, BranchProfileInputDto, WeeklyHoursInputDto } from './branch-settings.dto';

const validBranchProfile = {
  businessId: '11111111-1111-4111-8111-111111111111',
  name: 'Main Branch',
  timezone: 'Asia/Tokyo',
  currency: 'JPY',
  status: 'ACTIVE',
  address: {
    line1: '1 Main St',
    city: 'Tokyo',
    state: 'Tokyo',
    postalCode: '1000001',
    country: 'JP',
  },
};

describe('BranchProfileInputDto', () => {
  it('requires a branch status and address object', async () => {
    const dto = plainToInstance(BranchProfileInputDto, {
      ...validBranchProfile,
      status: undefined,
      address: undefined,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['status', 'address']));
  });

  it('accepts a complete branch profile', async () => {
    const dto = plainToInstance(BranchProfileInputDto, validBranchProfile);

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('accepts a nullable email to clear an existing branch email', async () => {
    const dto = plainToInstance(BranchProfileInputDto, {
      ...validBranchProfile,
      email: null,
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });
});

describe('BranchPolicyInputDto', () => {
  it('rejects minute values above PostgreSQL integer range', async () => {
    const dto = plainToInstance(BranchPolicyInputDto, {
      bookingLeadMinutes: 2147483648,
      cancellationCutoffMinutes: 30,
      noShowGraceMinutes: 15,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('bookingLeadMinutes');
  });
});

describe('WeeklyHoursInputDto', () => {
  it('accepts an optional acknowledgement flag for outside-hours appointments', async () => {
    const dto = plainToInstance(WeeklyHoursInputDto, {
      timezone: 'Asia/Tokyo',
      acknowledgeExistingAppointmentsOutsideHours: true,
      days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        open: dayOfWeek !== 0,
        intervals: dayOfWeek === 0 ? [] : [{ start: '09:00', end: '17:00' }],
      })),
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects a non-boolean acknowledgement flag', async () => {
    const dto = plainToInstance(WeeklyHoursInputDto, {
      timezone: 'Asia/Tokyo',
      acknowledgeExistingAppointmentsOutsideHours: 'yes',
      days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        open: dayOfWeek !== 0,
        intervals: dayOfWeek === 0 ? [] : [{ start: '09:00', end: '17:00' }],
      })),
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('acknowledgeExistingAppointmentsOutsideHours');
  });
});
