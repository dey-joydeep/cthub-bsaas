import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';

// Mock data
const mockReview = {
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

describe('ReviewService', () => {
  let service: ReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewService],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a review', async () => {
      const createReviewDto: CreateReviewDto = {
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        tenantId: '123e4567-e89b-12d3-a456-426614174003',
        salonServiceId: '123e4567-e89b-12d3-a456-426614174002',
        rating: 5,
        comment: 'Great service!',
      };

      const result = await service.create(createReviewDto);
      expect(result).toBeDefined();
      expect(result.rating).toBe(createReviewDto.rating);
      expect(result.comment).toBe(createReviewDto.comment);
      expect(result.customer.id).toBe(createReviewDto.customerId);
    });
  });

  describe('findAll', () => {
    it('should return an array of reviews', async () => {
      const result = await service.findAll({});
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('rating');
    });
  });

  describe('update', () => {
    it('should update a review', async () => {
      const updateReviewDto: UpdateReviewDto = {
        rating: 4,
        comment: 'Updated review',
      };

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateReviewDto);
      expect(result).toBeDefined();
      expect(result.rating).toBe(updateReviewDto.rating);
      expect(result.comment).toBe(updateReviewDto.comment);
    });
  });

  describe('remove', () => {
    it('should delete a review', async () => {
      const result = await service.remove('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('respondToReview', () => {
    it('should add a response to a review', async () => {
      const response = 'Thank you for your feedback!';
      const result = await service.respondToReview('123e4567-e89b-12d3-a456-426614174000', response);

      expect(result).toBeDefined();
      expect(result.response).toBe(response);
    });
  });
});
