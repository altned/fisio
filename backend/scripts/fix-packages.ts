/**
 * Script to fix null session_count and commission_rate in packages table
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
});

async function run() {
    await dataSource.initialize();

    // Check packages with null session_count
    const nullSessionCount = await dataSource.query(`
    SELECT id, name, session_count, commission_rate 
    FROM packages 
    WHERE session_count IS NULL OR commission_rate IS NULL
  `);

    console.log('Packages with NULL values:', nullSessionCount.length);
    if (nullSessionCount.length > 0) {
        console.log(JSON.stringify(nullSessionCount, null, 2));

        // Fix null values
        await dataSource.query(`
      UPDATE packages 
      SET session_count = COALESCE(session_count, 1),
          commission_rate = COALESCE(commission_rate, 30)
      WHERE session_count IS NULL OR commission_rate IS NULL
    `);

        console.log('Fixed! Updated packages with default values.');
    }

    // Show all packages
    const allPackages = await dataSource.query(`
    SELECT id, name, session_count, total_price, commission_rate 
    FROM packages 
    ORDER BY created_at DESC
  `);

    console.log('\nAll packages:');
    allPackages.forEach((p: any) => {
        console.log(`- ${p.name}: ${p.session_count} sesi, ${p.total_price}, komisi ${p.commission_rate}%`);
    });

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
