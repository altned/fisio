/**
 * Script to check session dates
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
});

async function run() {
    await dataSource.initialize();

    // Get sessions with their scheduled dates
    const sessions = await dataSource.query(`
    SELECT 
      s.id, 
      s.status, 
      s.scheduled_at,
      b.id as booking_id,
      b.status as booking_status,
      b.therapist_accepted_at
    FROM sessions s
    JOIN bookings b ON s.booking_id = b.id
    WHERE b.status = 'PAID'
    ORDER BY s.scheduled_at ASC
  `);

    console.log('Sessions for PAID bookings:');
    sessions.forEach((s: any) => {
        const date = new Date(s.scheduled_at);
        console.log(`  Session ${s.id}:`);
        console.log(`    - scheduled_at: ${s.scheduled_at} (${date.toLocaleDateString('id-ID')})`);
        console.log(`    - session_status: ${s.status}`);
        console.log(`    - therapist_accepted: ${s.therapist_accepted_at ? 'YES' : 'NO'}`);
    });

    // Check today's date
    const now = new Date();
    console.log(`\nToday (server): ${now.toISOString()}`);
    console.log(`Today (local): ${now.toLocaleDateString('id-ID')}`);

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
