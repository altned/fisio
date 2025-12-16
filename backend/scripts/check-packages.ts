/**
 * Script to check packages table data
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
});

async function run() {
    await dataSource.initialize();

    const packages = await dataSource.query(`
    SELECT id, name, session_count, total_price, commission_rate, created_at 
    FROM packages 
    ORDER BY created_at DESC
  `);

    console.log('Packages in database:');
    console.log(JSON.stringify(packages, null, 2));

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
