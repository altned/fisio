import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Review } from '../../domain/entities/review.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { RolesGuard, JwtGuard } from '../../common/auth';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Booking, Therapist])],
  controllers: [ReviewController],
  providers: [ReviewService, RolesGuard, JwtGuard],
})
export class ReviewModule {}
