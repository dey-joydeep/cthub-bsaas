import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { ReviewService } from '../services/review.service';
import { ReviewResponseDto } from '../dto/responses/review-response.dto';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';

// Use dynamic import for supertest to handle both ESM and CommonJS
const request = (await import('supertest')).default;

describe('ReviewController (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let reviewService: ReviewService;

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
      name: 'Haircut',
      price: 30,
      duration: 30,
    },
    staff: {
      id: '123e4567-e89b-12d3-a456-426614174003',
      name: 'Jane Smith',
      title: 'Senior Stylist',
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ReviewService)
      .useValue({
        create: jest.fn().mockResolvedValue(mockReview),
        findAll: jest.fn().mockResolvedValue({ data: [mockReview], total: 1 }),
        findOne: jest.fn().mockResolvedValue(mockReview),
        update: jest.fn().mockImplementation((id, updateDto) => ({
          ...mockReview,
          ...updateDto,
        })),
        remove: jest.fn().mockResolvedValue({ success: true }),
        respondToReview: jest.fn().mockImplementation((id, response) => ({
          ...mockReview,
          response,
        })),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
    reviewService = moduleFixture.get<ReviewService>(ReviewService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /reviews', () => {
    it('should create a review', async () => {
      const createDto: CreateReviewDto = {
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        tenantId: '123e4567-e89b-12d3-a456-426614174003',
        salonServiceId: '123e4567-e89b-12d3-a456-426614174002',
        rating: 5,
        comment: 'Great service!',
      };

      const response = await request(httpServer).post('/reviews').send(createDto).expect(201);

      expect(response.body.rating).toBe(createDto.rating);
      expect(response.body.comment).toBe(createDto.comment);
      expect(response.body.customer.id).toBe(createDto.customerId);
    });
  });

  describe('GET /reviews', () => {
    it('should return an array of reviews', async () => {
      const response = await request(httpServer).get('/reviews').expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].id).toBeDefined();
      expect(response.body.total).toBeDefined();
    });
  });

  describe('GET /reviews/:id', () => {
    it('should return a review by ID', async () => {
      const response = await request(httpServer).get(`/reviews/${mockReview.id}`).expect(200);

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

      const response = await request(httpServer).put(`/reviews/${mockReview.id}`).send(updateDto).expect(200);

      expect(response.body.rating).toBe(updateDto.rating);
      expect(response.body.comment).toBe(updateDto.comment);
    });
  });

  describe('DELETE /reviews/:id', () => {
    it('should delete a review', async () => {
      const response = await request(httpServer).delete(`/reviews/${mockReview.id}`).expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /reviews/:id/respond', () => {
    it('should add a response to a review', async () => {
      const responseText = 'Thank you for your feedback!';

      const response = await request(httpServer).post(`/reviews/${mockReview.id}/respond`).send({ response: responseText }).expect(201);

      expect(response.body.response).toBe(responseText);
    });
  });
});
