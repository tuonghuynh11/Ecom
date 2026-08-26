import { Module } from '@nestjs/common'
import { ReviewController } from './review.controller'
import { ReviewRepository } from './review.repo'
import { ReviewService } from './review.service'

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
