import { Body, Controller, Post } from '@nestjs/common';
import { Review } from '../../domain/entities/review.entity';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  submit(@Body() body: SubmitReviewDto): Promise<Review> {
    return this.reviewService.submitReview(body);
  }
}
