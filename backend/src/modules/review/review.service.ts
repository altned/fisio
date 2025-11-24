import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Review } from '../../domain/entities/review.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { SubmitReviewDto } from './dto/submit-review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly dataSource: DataSource) {}

  async submitReview(dto: SubmitReviewDto): Promise<Review> {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating harus 1-5');
    }

    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const reviewRepo = manager.getRepository(Review);
      const therapistRepo = manager.getRepository(Therapist);

      const booking = await bookingRepo.findOne({
        where: { id: dto.bookingId },
        relations: ['therapist'],
      });
      if (!booking) throw new BadRequestException('Booking tidak ditemukan');
      if (booking.therapist.id !== dto.therapistId) {
        throw new BadRequestException('Therapist tidak sesuai');
      }

      const existing = await reviewRepo.findOne({ where: { booking: { id: dto.bookingId } } });
      if (existing) throw new BadRequestException('Review sudah ada untuk booking ini');

      const therapist = await therapistRepo.findOne({ where: { id: dto.therapistId } });
      if (!therapist) throw new BadRequestException('Therapist tidak ditemukan');

      const review = reviewRepo.create({
        booking,
        therapist,
        rating: dto.rating,
      });
      await reviewRepo.save(review);

      // Recalculate cached rating atomik
      const aggregate = await reviewRepo
        .createQueryBuilder('r')
        .select('AVG(r.rating)', 'avg')
        .addSelect('COUNT(r.id)', 'total')
        .where('r.therapist_id = :tid', { tid: therapist.id })
        .getRawOne<{ avg: string; total: string } | undefined>();

      const avg = aggregate?.avg ?? '0';
      const total = aggregate?.total ?? '0';

      therapist.averageRating = Number(avg ?? 0).toFixed(2);
      therapist.totalReviews = Number(total ?? 0);
      await therapistRepo.save(therapist);

      return review;
    });
  }
}
