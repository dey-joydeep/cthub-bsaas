import { Module } from '@nestjs/common';
import { ReviewController } from './controllers/review.controller.ts.bk';
import { ReviewService } from './services/review.service.ts.bk';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, PrismaService],
  exports: [ReviewService],
})
export class ReviewModule {}
