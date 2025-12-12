/**
 * Test Midtrans Connection
 * 
 * Run with: npx ts-node src/scripts/test-midtrans.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

async function testMidtrans() {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    console.log('\n=== Midtrans Configuration ===');
    console.log('Server Key exists:', !!serverKey);
    console.log('Server Key length:', serverKey?.length || 0);
    console.log('Server Key prefix:', serverKey?.substring(0, 15) || 'N/A');
    console.log('Is Production:', isProduction);

    if (!serverKey) {
        console.error('\n❌ ERROR: MIDTRANS_SERVER_KEY is not set in .env');
        process.exit(1);
    }

    // Check if key has correct format
    if (isProduction) {
        if (!serverKey.startsWith('Mid-server-')) {
            console.error('\n❌ ERROR: Production server key should start with "Mid-server-"');
            console.error('   Your key starts with:', serverKey.substring(0, 15));
        }
    } else {
        if (!serverKey.startsWith('SB-Mid-server-')) {
            console.error('\n❌ ERROR: Sandbox server key should start with "SB-Mid-server-"');
            console.error('   Your key starts with:', serverKey.substring(0, 15));
            console.error('\n   Please get your sandbox key from:');
            console.error('   https://dashboard.sandbox.midtrans.com/settings/config_info');
        }
    }

    const baseUrl = isProduction
        ? 'https://api.midtrans.com'
        : 'https://api.sandbox.midtrans.com';

    console.log('\n=== Testing API Connection ===');
    console.log('Base URL:', baseUrl);

    // Test a simple charge to verify API key
    const testPayload = {
        transaction_details: {
            order_id: `test-${Date.now()}`,
            gross_amount: 10000,
        },
        payment_type: 'bank_transfer',
        bank_transfer: {
            bank: 'bca',
        },
    };

    try {
        const fetchMod = await import('node-fetch');
        const auth = Buffer.from(`${serverKey}:`).toString('base64');

        console.log('Authorization header:', `Basic ${auth.substring(0, 20)}...`);

        const res = await fetchMod.default(`${baseUrl}/v2/charge`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
        });

        const json = await res.json() as Record<string, unknown>;

        console.log('\nResponse Status:', res.status);
        console.log('Response:', JSON.stringify(json, null, 2));

        if (res.status === 401) {
            console.error('\n❌ ERROR 401: Invalid Server Key');
            console.error('   The server key is not recognized by Midtrans.');
            console.error('   Please verify your key at:');
            console.error('   - Sandbox: https://dashboard.sandbox.midtrans.com/settings/config_info');
            console.error('   - Production: https://dashboard.midtrans.com/settings/config_info');
        } else if (res.status === 200 || res.status === 201) {
            console.log('\n✅ SUCCESS: Midtrans API connection is working!');
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error);
    }
}

testMidtrans();
