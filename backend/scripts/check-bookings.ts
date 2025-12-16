/**
 * Script to check booking and session data
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
});

async function run() {
    await dataSource.initialize();

    const result = await dataSource.query(`
    SELECT 
      b.id, 
      b.status, 
      b.therapist_accepted_at,
      s.id as session_id, 
      s.status as session_status, 
      s.scheduled_at
    FROM bookings b
    LEFT JOIN sessions s ON s.booking_id = b.id
    WHERE b.status = 'PAID'
    ORDER BY s.scheduled_at ASC
    LIMIT 10
  `);

    console.log('PAID Bookings with Sessions:');
    console.log(JSON.stringify(result, null, 2));

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
