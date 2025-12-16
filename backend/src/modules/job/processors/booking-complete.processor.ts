import { Processor, WorkerHost } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';
import { Booking } from '../../../domain/entities/booking.entity';

/**
 * Processor to automatically mark bookings as COMPLETED
 * when all sessions are finished (COMPLETED, FORFEITED, or EXPIRED)
 */
@Processor('booking-complete')
export class BookingCompleteProcessor extends WorkerHost {
    constructor(private readonly dataSource: DataSource) {
        super();
    }

    async process(): Promise<void> {
        const bookingRepo = this.dataSource.getRepository(Booking);

        // Find PAID bookings where all sessions are finished
        const bookingsToComplete = await this.dataSource.query(`
      SELECT b.id
      FROM bookings b
      WHERE b.status = 'PAID'
      AND NOT EXISTS (
        SELECT 1 FROM sessions s 
        WHERE s.booking_id = b.id 
        AND s.status IN ('SCHEDULED', 'PENDING_SCHEDULING')
      )
      AND EXISTS (
        SELECT 1 FROM sessions s 
        WHERE s.booking_id = b.id
      )
    `);

        if (bookingsToComplete.length > 0) {
            const ids = bookingsToComplete.map((b: { id: string }) => b.id);

            await bookingRepo
                .createQueryBuilder()
                .update()
                .set({ status: 'COMPLETED' })
                .whereInIds(ids)
                .execute();

            // eslint-disable-next-line no-console
            console.log(`[Cron] Booking complete processed, completed: ${ids.length}`);
        } else {
            // eslint-disable-next-line no-console
            console.log(`[Cron] Booking complete processed, completed: 0`);
        }
    }
}
