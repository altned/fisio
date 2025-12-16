/**
 * Script to add city column to therapists table
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
});

async function run() {
    await dataSource.initialize();

    await dataSource.query(`
    ALTER TABLE therapists
    ADD COLUMN IF NOT EXISTS city VARCHAR(100)
  `);

    console.log('Added city column to therapists table');

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
