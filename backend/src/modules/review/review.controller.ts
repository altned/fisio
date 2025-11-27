import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Review } from '../../domain/entities/review.entity';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { ReviewService } from './review.service';
import { Roles, RolesGuard, JwtGuard } from '../../common/auth';
import { Throttle } from '@nestjs/throttler';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('PATIENT')
  @Throttle(5, 60)
  submit(@Body() body: SubmitReviewDto): Promise<Review> {
    return this.reviewService.submitReview(body);
  }
}
