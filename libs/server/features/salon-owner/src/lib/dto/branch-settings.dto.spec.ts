import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { BranchProfileInputDto } from './branch-settings.dto';

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
});
