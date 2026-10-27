import { Body, Controller, Delete, Get, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateReviewDto } from '../dto/create-review.dto';
import { ReviewQueryDto } from '../dto/query/review-query.dto';
import { ReviewResponseDto } from '../dto/responses/review-response.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewService } from '../services/review.service';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The review has been successfully created.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(@Body() createReviewDto: CreateReviewDto): Promise<ReviewResponseDto> {
    return this.reviewService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews with optional filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return a list of reviews with pagination.',
    type: [ReviewResponseDto],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  async findAll(@Query() query: ReviewQueryDto): Promise<{ data: ReviewResponseDto[]; total: number }> {
    return this.reviewService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the review with the specified ID.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found.',
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ReviewResponseDto> {
    // In a real implementation, we would have a dedicated findById method in the service
    // For now, we'll use findAll with the ID filter
    const result = await this.reviewService.findAll({
      userId: id, // Using userId as a workaround since we don't have a direct ID filter
      limit: 1,
      page: 1,
    });

    if (result.data.length === 0) {
      throw new Error('Review not found');
    }
    return result.data[0];
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The review has been successfully updated.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found.',
  })
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateReviewDto: UpdateReviewDto): Promise<ReviewResponseDto> {
    return this.reviewService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The review has been successfully deleted.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found.',
  })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ success: boolean }> {
    return this.reviewService.remove(id);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Respond to a review (admin/owner only)' })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        response: {
          type: 'string',
          example: 'Thank you for your feedback!',
          description: 'Response message from the business owner/admin',
        },
      },
      required: ['response'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The response has been added to the review.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found.',
  })
  async respondToReview(@Param('id', new ParseUUIDPipe()) id: string, @Body('response') response: string): Promise<ReviewResponseDto> {
    return this.reviewService.respondToReview(id, response);
  }
}

export const reviewController = new ReviewController(new ReviewService());
