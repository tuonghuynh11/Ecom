import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import {
  CreateReviewBodyDTO,
  CreateReviewResDTO,
  GetReviewDetailParamsDTO,
  GetReviewsDTO,
  GetReviewsParamsDTO,
  UpdateReviewBodyDTO,
  UpdateReviewResDTO,
} from 'src/routes/review/review.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'
import { ReviewService } from './review.service'

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @IsPublic()
  @Get('/products/:productId')
  @ApiParam({ name: 'productId', type: Number })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ZodResponse({ type: GetReviewsDTO })
  getReviews(@Param() params: GetReviewsParamsDTO, @Query() pagination: PaginationQueryDTO) {
    return this.reviewService.list(params.productId, pagination)
  }

  @Post()
  @ApiBearerAuth()
  @ZodResponse({ type: CreateReviewResDTO })
  createReview(@Body() body: CreateReviewBodyDTO, @ActiveUser('userId') userId: number) {
    return this.reviewService.create(userId, body)
  }

  @Put(':reviewId')
  @ApiBearerAuth()
  @ApiParam({ name: 'reviewId', type: Number })
  @ZodResponse({ type: UpdateReviewResDTO })
  changeReview(
    @Body() body: UpdateReviewBodyDTO,
    @ActiveUser('userId') userId: number,
    @Param() params: GetReviewDetailParamsDTO,
  ) {
    return this.reviewService.update({
      userId,
      body,
      reviewId: params.reviewId,
    })
  }
}
