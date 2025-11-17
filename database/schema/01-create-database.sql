-- ============================================================================
-- DATABASE CREATION SCRIPT
-- Creates the pmis_tetouan database with proper configuration
-- ============================================================================

-- Create database
CREATE DATABASE IF NOT EXISTS pmis_tetouan 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE pmis_tetouan;

-- Enable strict mode for data integrity
SET GLOBAL sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Set timezone to Morocco (UTC+1)
SET GLOBAL time_zone = '+01:00';

-- Display configuration
SELECT 
    'Database created successfully' AS status,
    DATABASE() AS current_database,
    @@character_set_database AS charset,
    @@collation_database AS collation,
    @@time_zone AS timezone;
