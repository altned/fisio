/**
 * Script to set session to today for testing
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
});

async function run() {
    await dataSource.initialize();

    // Set all SCHEDULED sessions to today at 10:00 AM
    const today = new Date();
    today.setHours(10, 0, 0, 0);

    const result = await dataSource.query(`
    UPDATE sessions 
    SET scheduled_at = $1 
    WHERE status = 'SCHEDULED' 
    RETURNING id, status, scheduled_at
  `, [today.toISOString()]);

    console.log('Updated sessions to today:');
    result.forEach((s: any) => {
        console.log(`  - Session ${s.id}: ${s.scheduled_at}`);
    });

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
