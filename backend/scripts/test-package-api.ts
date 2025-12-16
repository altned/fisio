/**
 * Script to test package API response
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Package } from '../src/domain/entities/package.entity';

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Package],
});

async function run() {
    await dataSource.initialize();

    // Use TypeORM repository to fetch packages (same as the service)
    const repo = dataSource.getRepository(Package);
    const packages = await repo.find({
        order: { createdAt: 'DESC' },
    });

    console.log('Packages via TypeORM:');
    packages.forEach(p => {
        console.log(`- ${p.name}:`);
        console.log(`  sessionCount: ${p.sessionCount}`);
        console.log(`  commissionRate: ${p.commissionRate}`);
        console.log(`  totalPrice: ${p.totalPrice}`);
    });

    await dataSource.destroy();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
