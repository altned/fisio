require('dotenv').config();
const { Client } = require('pg');

async function cleanDatabase() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        console.log('Connected to database!');

        console.log('\n=== Cleaning Database ===\n');

        // Delete in correct order (foreign key dependencies)
        console.log('1. Deleting sessions...');
        const s = await client.query('DELETE FROM sessions');
        console.log('   Sessions deleted:', s.rowCount);

        console.log('2. Deleting wallet_transactions...');
        const wt = await client.query('DELETE FROM wallet_transactions');
        console.log('   Wallet transactions deleted:', wt.rowCount);

        console.log('3. Deleting reviews...');
        const r = await client.query('DELETE FROM reviews');
        console.log('   Reviews deleted:', r.rowCount);

        console.log('4. Deleting admin_action_logs...');
        const al = await client.query('DELETE FROM admin_action_logs');
        console.log('   Admin logs deleted:', al.rowCount);

        console.log('5. Deleting midtrans_webhook_logs...');
        try {
            const mw = await client.query('DELETE FROM midtrans_webhook_logs');
            console.log('   Midtrans logs deleted:', mw.rowCount);
        } catch (e) {
            console.log('   No midtrans_webhook_logs table');
        }

        console.log('6. Deleting bookings...');
        const b = await client.query('DELETE FROM bookings');
        console.log('   Bookings deleted:', b.rowCount);

        console.log('7. Resetting wallet balances to 0...');
        const w = await client.query("UPDATE wallets SET balance = '0'");
        console.log('   Wallets reset:', w.rowCount);

        // Verify
        const verify = await client.query(`
            SELECT 
                (SELECT count(*) FROM bookings) as bookings,
                (SELECT count(*) FROM sessions) as sessions,
                (SELECT count(*) FROM wallet_transactions) as transactions,
                (SELECT count(*) FROM reviews) as reviews
        `);

        console.log('\n=== After Cleanup ===');
        console.log(verify.rows[0]);
        console.log('\nDone!');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

cleanDatabase();
