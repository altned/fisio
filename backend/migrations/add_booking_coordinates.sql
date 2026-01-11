-- Migration: Add latitude and longitude columns to bookings table
-- Run this in your PostgreSQL database

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS latitude numeric(10,7);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS longitude numeric(10,7);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name IN ('latitude', 'longitude');
