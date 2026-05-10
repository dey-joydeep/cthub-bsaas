import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SocialModule } from '../social.module';
import { SocialService } from '../services/social.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { SocialResponseDto } from '../dto/responses/social-response.dto';

describe('SocialController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  // Mock data
  const testSocialId = 'test-social-id';
  const testUserId = 'test-user-id';
  const testSocial: SocialResponseDto = {
    id: testSocialId,
    userId: testUserId,
    platform: 'instagram',
    handle: '@testuser',
    url: 'https://instagram.com/testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock the SocialService with all required methods
  const mockSocialService = {
    getSocials: jest.fn(),
    getSocialsForUser: jest.fn(),
    getSocialById: jest.fn(),
    createSocial: jest.fn(),
    updateSocial: jest.fn(),
    deleteSocial: jest.fn(),
  };

  // Mock the guards
  const mockJwtGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [SocialModule],
    })
      .overrideProvider(SocialService)
      .useValue(mockSocialService)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /social', () => {
    it('should return an array of socials', async () => {
      mockSocialService.getSocials.mockResolvedValue([testSocial]);

      const response = await request(app.getHttpServer()).get('/social').expect(200);

      expect(response.body).toEqual([
        {
          ...testSocial,
          createdAt: testSocial.createdAt.toISOString(),
          updatedAt: testSocial.updatedAt.toISOString(),
        },
      ]);
      expect(mockSocialService.getSocials).toHaveBeenCalled();
    });
  });

  describe('GET /social/:id', () => {
    it('should return a social by id', async () => {
      mockSocialService.getSocialById.mockResolvedValue(testSocial);

      const response = await request(app.getHttpServer()).get(`/social/${testSocialId}`).expect(200);

      expect(response.body).toEqual({
        ...testSocial,
        createdAt: testSocial.createdAt.toISOString(),
        updatedAt: testSocial.updatedAt.toISOString(),
      });
      expect(mockSocialService.getSocialById).toHaveBeenCalledWith(testSocialId);
    });

    it('should return 404 if social not found', async () => {
      mockSocialService.getSocialById.mockResolvedValue(null);

      await request(app.getHttpServer()).get(`/social/non-existent-id`).expect(404);
    });
  });

  describe('GET /user/:userId/social', () => {
    it('should return socials for a user', async () => {
      mockSocialService.getSocialsForUser.mockResolvedValue([testSocial]);

      const response = await request(app.getHttpServer()).get(`/user/${testUserId}/social`).expect(200);

      expect(response.body).toEqual([
        {
          ...testSocial,
          createdAt: testSocial.createdAt.toISOString(),
          updatedAt: testSocial.updatedAt.toISOString(),
        },
      ]);
      expect(mockSocialService.getSocialsForUser).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('POST /social', () => {
    const createDto = {
      platform: 'instagram',
      handle: '@testuser',
      url: 'https://instagram.com/testuser',
    };

    it('should create a social', async () => {
      mockSocialService.createSocial.mockResolvedValue(testSocial);

      const response = await request(app.getHttpServer()).post('/social').send(createDto).expect(201);

      expect(response.body).toEqual({
        ...testSocial,
        createdAt: testSocial.createdAt.toISOString(),
        updatedAt: testSocial.updatedAt.toISOString(),
      });
      expect(mockSocialService.createSocial).toHaveBeenCalledWith(createDto);
    });
  });

  describe('PATCH /social/:id', () => {
    const updateDto = { handle: '@updateduser' };
    const updatedSocial = {
      ...testSocial,
      ...updateDto,
      updatedAt: new Date(),
    };

    it('should update a social', async () => {
      mockSocialService.updateSocial.mockResolvedValue(updatedSocial);

      const response = await request(app.getHttpServer()).patch(`/social/${testSocialId}`).send(updateDto).expect(200);

      expect(response.body).toEqual({
        ...updatedSocial,
        createdAt: updatedSocial.createdAt.toISOString(),
        updatedAt: updatedSocial.updatedAt.toISOString(),
      });
      expect(mockSocialService.updateSocial).toHaveBeenCalledWith(testSocialId, updateDto);
    });
  });

  describe('DELETE /social/:id', () => {
    it('should delete a social', async () => {
      mockSocialService.deleteSocial.mockResolvedValue(testSocial);

      await request(app.getHttpServer()).delete(`/social/${testSocialId}`).expect(200);

      expect(mockSocialService.deleteSocial).toHaveBeenCalledWith(testSocialId);
    });
  });
});
