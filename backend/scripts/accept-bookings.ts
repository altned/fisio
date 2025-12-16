/**
 * Script to accept all PAID bookings for therapist
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
    UPDATE bookings 
    SET therapist_accepted_at = NOW() 
    WHERE status = 'PAID' AND therapist_accepted_at IS NULL 
    RETURNING id, status, therapist_accepted_at
  `);

    if (result.length === 0) {
        console.log('No bookings to update');
    } else {
        console.log('Updated bookings:');
        result.forEach((b: any) => console.log(`  - ${b.id}: accepted at ${b.therapist_accepted_at}`));
    }

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
