/**
 * Script to force payment PAID for a booking
 * Run with: npx ts-node scripts/force-paid.ts <bookingId>
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

const bookingId = process.argv[2];
if (!bookingId) {
    console.error('Usage: npx ts-node scripts/force-paid.ts <bookingId>');
    process.exit(1);
}

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
});

async function run() {
    await dataSource.initialize();

    // Update booking to PAID
    const result = await dataSource.query(`
    UPDATE bookings 
    SET 
      status = 'PAID', 
      payment_status = 'PAID'
    WHERE id = $1
    RETURNING id, status, payment_status
  `, [bookingId]);

    if (result.length === 0) {
        console.error('Booking not found with id:', bookingId);
    } else {
        console.log('✅ Booking updated to PAID:', result[0]);
    }

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
