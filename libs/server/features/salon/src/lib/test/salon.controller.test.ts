// Inline Salon type to avoid namespace/type import issues
// and match project-wide camelCase convention
type Salon = {
  id: string;
  name: string;
  address: string;
  zipCode: string;
  city: string;
  latitude: number;
  longitude: number;
  services: any[];
  ownerId: string;
  imageUrl: string | undefined;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

// moved from __tests__/salon/salon.controller.test.ts
import request from 'supertest';
import app from '../../../app';
import prisma from '../../../prismaTestClient';
import { SalonService } from '../../salon.service';
jest.mock('../../salon.service');

const mockedService = SalonService as jest.MockedClass<typeof SalonService>;
(mockedService.prototype as any).createSalon = jest.fn();
(mockedService.prototype as any).getSalonById = jest.fn();
(mockedService.prototype as any).updateSalon = jest.fn();
(mockedService.prototype as any).deleteSalon = jest.fn();
(mockedService.prototype as any).getAllSalons = jest.fn();
(mockedService.prototype as any).searchSalons = jest.fn();
(mockedService.prototype as any).getTopSalons = jest.fn();
(mockedService.prototype as any).getAverageRatingForSalon = jest.fn();

const testSalonId = 'testSalonId';

const mockSalon: Salon = {
  id: 'salon1',
  name: 'Test Salon',
  address: '123 Main St',
  zipCode: '12345',
  city: 'Testville',
  latitude: 0,
  longitude: 0,
  services: [],
  ownerId: 'owner1',
  imageUrl: undefined,
  phone: '123-456-7890',
  email: 'test@example.com',
  createdAt: '2022-01-01T00:00:00.000Z',
  updatedAt: '2022-01-01T00:00:00.000Z',
};

describe('Salon Controller', () => {
  describe('GET /salon/search', () => {
    it('should return salons', async () => {
      (mockedService.prototype as any).searchSalons.mockResolvedValueOnce({
        results: [mockSalon],
        total: 1,
      });
      const res = await request(app).get('/api/salon/search?q=Salon');
      expect(res.status).toBe(200);
      expect((res.body.results[0] as Salon).id).toBe('salon1');
    });
    it('should return 400 on error', async () => {
      (mockedService.prototype as any).searchSalons.mockRejectedValueOnce(new Error('fail'));
      const res = await request(app).get('/api/salon/search?q=Salon');
      expect(res.status).toBe(400);
    });
  });
  // ...rest of the test code for all endpoints, using camelCase for all model/interface members...
});
