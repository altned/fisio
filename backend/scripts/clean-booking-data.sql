-- Clean Database Script
-- Keeps: users, therapists, packages, wallets (structure only)
-- Deletes: bookings, sessions, wallet_transactions, reviews, chat data

-- Disable foreign key checks temporarily (PostgreSQL)
BEGIN;

-- 1. Delete sessions first (depends on bookings)
DELETE FROM sessions;

-- 2. Delete wallet transactions (depends on wallets)
DELETE FROM wallet_transactions;

-- 3. Delete reviews (depends on bookings)
DELETE FROM reviews;

-- 4. Delete admin action logs related to bookings
DELETE FROM admin_action_logs;

-- 5. Delete midtrans webhook logs
DELETE FROM midtrans_webhook_logs WHERE 1=1;

-- 6. Delete chat messages if exists
DELETE FROM chat_messages WHERE 1=1;

-- 7. Delete chat rooms if exists
DELETE FROM chat_rooms WHERE 1=1;

-- 8. Delete bookings (main booking data)
DELETE FROM bookings;

-- 9. Reset wallet balances to zero (keep wallet records)
UPDATE wallets SET balance = '0';

COMMIT;

-- Show summary
SELECT 'Cleanup Complete!' as status;
SELECT 'Bookings' as table_name, count(*) as remaining FROM bookings
UNION ALL SELECT 'Sessions', count(*) FROM sessions
UNION ALL SELECT 'Wallet Transactions', count(*) FROM wallet_transactions
UNION ALL SELECT 'Reviews', count(*) FROM reviews;
