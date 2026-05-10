import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ReviewModule } from '../review.module';
import { ReviewService } from '../services/review.service';
import { ReviewResponseDto } from '../dto/responses/review-response.dto';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';

describe('ReviewController (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  const mockReview: ReviewResponseDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    rating: 5,
    comment: 'Great service!',
    response: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'John Doe',
      avatarUrl: null,
    },
    tenantService: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      isActive: true,
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ReviewModule],
    })
      .overrideProvider(ReviewService)
      .useValue({
        create: jest.fn().mockResolvedValue(mockReview),
        findAll: jest.fn().mockResolvedValue({ data: [mockReview], total: 1 }),
        update: jest.fn().mockResolvedValue(mockReview),
        remove: jest.fn().mockResolvedValue({ success: true }),
        respondToReview: jest.fn().mockResolvedValue({
          ...mockReview,
          response: 'Thank you for your feedback!',
        }),
      })
      .compile();

    // Create and initialize the NestJS application
    app = moduleFixture.createNestApplication();
    await app.init();

    // Get HTTP server instance
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // Helper function to create a request
  const createRequest = (method: 'get' | 'post' | 'put' | 'delete', url: string) => {
    const req = (request as any).default || request;
    const reqInstance = req(httpServer);

    switch (method) {
      case 'get':
        return reqInstance.get(url);
      case 'post':
        return reqInstance.post(url);
      case 'put':
        return reqInstance.put(url);
      case 'delete':
        return reqInstance.delete(url);
    }
  };

  describe('POST /reviews', () => {
    it('should create a review', async () => {
      const createDto: CreateReviewDto = {
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        tenantId: '123e4567-e89b-12d3-a456-426614174003',
        salonServiceId: '123e4567-e89b-12d3-a456-426614174002',
        rating: 5,
        comment: 'Great service!',
      };

      const response = await createRequest('post', '/reviews').send(createDto).expect(201);

      expect(response.body.rating).toBe(createDto.rating);
      expect(response.body.comment).toBe(createDto.comment);
      expect(response.body.customer.id).toBe(createDto.customerId);
    });
  });

  describe('GET /reviews', () => {
    it('should return an array of reviews', async () => {
      const response = await createRequest('get', '/reviews').expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].id).toBeDefined();
      expect(response.body.total).toBeDefined();
    });
  });

  describe('GET /reviews/:id', () => {
    it('should return a review by ID', async () => {
      const response = await createRequest('get', `/reviews/${mockReview.id}`).expect(200);

      expect(response.body.id).toBe(mockReview.id);
      expect(response.body.rating).toBe(mockReview.rating);
    });
  });

  describe('PUT /reviews/:id', () => {
    it('should update a review', async () => {
      const updateDto: UpdateReviewDto = {
        rating: 4,
        comment: 'Updated review',
      };

      const response = await createRequest('put', `/reviews/${mockReview.id}`).send(updateDto).expect(200);

      expect(response.body.rating).toBe(updateDto.rating);
      expect(response.body.comment).toBe(updateDto.comment);
    });
  });

  describe('DELETE /reviews/:id', () => {
    it('should delete a review', async () => {
      const response = await createRequest('delete', `/reviews/${mockReview.id}`).expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /reviews/:id/respond', () => {
    it('should add a response to a review', async () => {
      const responseText = 'Thank you for your feedback!';

      const response = await createRequest('post', `/reviews/${mockReview.id}/respond`).send({ response: responseText }).expect(201);

      expect(response.body.response).toBe(responseText);
    });
  });
});
