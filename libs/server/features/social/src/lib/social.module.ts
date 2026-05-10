import { Module } from '@nestjs/common';
import { SocialController } from './controllers/social.controller';
import { SocialService } from './services/social.service';

@Module({
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
