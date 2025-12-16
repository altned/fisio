/**
 * Script to add promo banner fields to packages table
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
    ALTER TABLE packages
    ADD COLUMN IF NOT EXISTS promo_image_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS show_on_dashboard BOOLEAN DEFAULT false
  `);

    console.log('Added promo_image_url and show_on_dashboard columns to packages table');

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
