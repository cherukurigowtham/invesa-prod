-- Migration to add cryptographic recovery key support to users table
ALTER TABLE users ADD COLUMN recovery_key_hash VARCHAR(64) DEFAULT '' NOT NULL;
