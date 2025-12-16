/**
 * Script to check and fix booking status
 * Marks bookings as COMPLETED if all sessions are finished
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
});

async function run() {
    await dataSource.initialize();

    // Find all PAID bookings
    const paidBookings = await dataSource.query(`
    SELECT 
      b.id,
      b.status,
      b.payment_status,
      u.full_name as patient_name,
      (SELECT COUNT(*) FROM sessions s WHERE s.booking_id = b.id) as total_sessions,
      (SELECT COUNT(*) FROM sessions s WHERE s.booking_id = b.id AND s.status IN ('COMPLETED', 'FORFEITED', 'EXPIRED')) as finished_sessions,
      (SELECT COUNT(*) FROM sessions s WHERE s.booking_id = b.id AND s.status IN ('SCHEDULED', 'PENDING_SCHEDULING')) as pending_sessions
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.status = 'PAID'
    ORDER BY b.created_at DESC
  `);

    console.log(`Found ${paidBookings.length} PAID bookings:\n`);

    const toFix: string[] = [];

    for (const b of paidBookings) {
        console.log(`📦 Booking: ${b.id.substring(0, 8)}...`);
        console.log(`   Patient: ${b.patient_name}`);
        console.log(`   Sessions: ${b.finished_sessions}/${b.total_sessions} finished, ${b.pending_sessions} pending`);

        if (Number(b.pending_sessions) === 0 && Number(b.total_sessions) > 0) {
            console.log(`   ✅ Should be COMPLETED (all sessions finished)`);
            toFix.push(b.id);
        } else {
            console.log(`   ⏳ Still has pending sessions`);
        }
        console.log();
    }

    if (toFix.length > 0) {
        console.log(`\n🔧 Fixing ${toFix.length} bookings to COMPLETED status...`);

        await dataSource.query(`
      UPDATE bookings 
      SET status = 'COMPLETED' 
      WHERE id IN (${toFix.map(id => `'${id}'`).join(',')})
    `);

        console.log('✅ Done! Bookings updated to COMPLETED.');
    } else {
        console.log('\n✅ No bookings need fixing.');
    }

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
