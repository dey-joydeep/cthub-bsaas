import type { SeedContext } from './seed-context';
import { SEED_IDS } from './seed-ids';

export interface GeoSeedResult {
  readonly countryJapanId: string;
  readonly countryUSAId: string;
  readonly addressShibuyaId: string;
  readonly addressShinjukuId: string;
  readonly addressZenId: string;
}

export async function seedGeoCurrencies(context: SeedContext): Promise<GeoSeedResult> {
  const { prisma } = context;

  console.log('\n[1/7] Seeding Global Master: Geography & Addresses...');

  const countryJapan = await prisma.country.upsert({
    where: { iso2: 'JP' },
    update: { name: 'Japan', iso3: 'JPN', phoneCode: '81', currency: 'JPY' },
    create: {
      name: 'Japan',
      iso2: 'JP',
      iso3: 'JPN',
      phoneCode: '81',
      currency: 'JPY',
      capital: 'Tokyo',
      isActive: true,
    },
  });

  const countryUSA = await prisma.country.upsert({
    where: { iso2: 'US' },
    update: { name: 'United States', iso3: 'USA', phoneCode: '1', currency: 'USD' },
    create: {
      name: 'United States',
      iso2: 'US',
      iso3: 'USA',
      phoneCode: '1',
      currency: 'USD',
      capital: 'Washington, D.C.',
      isActive: true,
    },
  });

  const stateTokyo = await prisma.state.upsert({
    where: { countryId_stateCode: { countryId: countryJapan.id, stateCode: '13' } },
    update: { name: 'Tokyo' },
    create: { countryId: countryJapan.id, stateCode: '13', name: 'Tokyo', isActive: true },
  });

  await prisma.state.upsert({
    where: { countryId_stateCode: { countryId: countryJapan.id, stateCode: '14' } },
    update: { name: 'Kanagawa' },
    create: { countryId: countryJapan.id, stateCode: '14', name: 'Kanagawa', isActive: true },
  });

  const stateCalifornia = await prisma.state.upsert({
    where: { countryId_stateCode: { countryId: countryUSA.id, stateCode: 'CA' } },
    update: { name: 'California' },
    create: { countryId: countryUSA.id, stateCode: 'CA', name: 'California', isActive: true },
  });

  const cityShibuya = await prisma.city.upsert({
    where: { countryId_stateId_name: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Shibuya-ku' } },
    update: {},
    create: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Shibuya-ku', isActive: true },
  });

  const cityShinjuku = await prisma.city.upsert({
    where: { countryId_stateId_name: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Shinjuku-ku' } },
    update: {},
    create: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Shinjuku-ku', isActive: true },
  });

  const cityMinato = await prisma.city.upsert({
    where: { countryId_stateId_name: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Minato-ku' } },
    update: {},
    create: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Minato-ku', isActive: true },
  });

  await prisma.city.upsert({
    where: { countryId_stateId_name: { countryId: countryUSA.id, stateId: stateCalifornia.id, name: 'San Francisco' } },
    update: {},
    create: { countryId: countryUSA.id, stateId: stateCalifornia.id, name: 'San Francisco', isActive: true },
  });

  const addressShibuya = await prisma.businessAddress.upsert({
    where: { id: SEED_IDS.addressLumiereShibuya },
    update: {},
    create: {
      id: SEED_IDS.addressLumiereShibuya,
      countryId: countryJapan.id,
      stateId: stateTokyo.id,
      cityId: cityShibuya.id,
      postalCode: '150-0001',
      line1: 'Jingumae 5-10-1',
      line2: 'Suite 301',
      buildingName: 'Omotesando Hills Annex',
      latitude: 35.6653,
      longitude: 139.7123,
      isActive: true,
    },
  });

  const addressShinjuku = await prisma.businessAddress.upsert({
    where: { id: SEED_IDS.addressLumiereShinjuku },
    update: {},
    create: {
      id: SEED_IDS.addressLumiereShinjuku,
      countryId: countryJapan.id,
      stateId: stateTokyo.id,
      cityId: cityShinjuku.id,
      postalCode: '160-0022',
      line1: 'Shinjuku 3-25-1',
      buildingName: 'Lumiere Shinjuku Studio Bldg',
      latitude: 35.6917,
      longitude: 139.7042,
      isActive: true,
    },
  });

  const addressZen = await prisma.businessAddress.upsert({
    where: { id: SEED_IDS.addressZenRoppongi },
    update: {},
    create: {
      id: SEED_IDS.addressZenRoppongi,
      countryId: countryJapan.id,
      stateId: stateTokyo.id,
      cityId: cityMinato.id,
      postalCode: '106-0032',
      line1: 'Roppongi 6-10-1',
      buildingName: 'Mori Tower Level 4',
      latitude: 35.6605,
      longitude: 139.7292,
      isActive: true,
    },
  });

  console.log('  ✓ Seeded Countries, States, Cities, and Business Addresses');

  return {
    countryJapanId: countryJapan.id,
    countryUSAId: countryUSA.id,
    addressShibuyaId: addressShibuya.id,
    addressShinjukuId: addressShinjuku.id,
    addressZenId: addressZen.id,
  };
}
