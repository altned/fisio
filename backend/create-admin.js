const bcrypt = require('bcrypt');
const { DataSource } = require('typeorm');

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
});

async function main() {
    await dataSource.initialize();

    const hash = await bcrypt.hash('admin123', 10);
    console.log('Password hash:', hash);

    // Check if admin exists - table is 'users' not 'user'
    const existing = await dataSource.query(`SELECT id, email, role FROM users WHERE email = $1`, ['admin@example.com']);

    if (existing.length > 0) {
        console.log('Admin exists, updating password...');
        await dataSource.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hash, 'admin@example.com']);
    } else {
        console.log('Creating admin user...');
        await dataSource.query(`
      INSERT INTO users (id, email, full_name, role, password_hash, is_profile_complete, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
    `, ['admin@example.com', 'Admin Fisio', 'ADMIN', hash]);
    }

    console.log('Done! Login with admin@example.com / admin123');
    await dataSource.destroy();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
