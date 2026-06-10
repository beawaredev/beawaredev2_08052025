-- Update Azure SQL Database scam_reports table to include missing columns

-- Add proof document columns
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'scam_reports' AND COLUMN_NAME = 'has_proof_document')
BEGIN
    ALTER TABLE scam_reports ADD has_proof_document bit NOT NULL DEFAULT 0;
    PRINT 'Added has_proof_document column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'scam_reports' AND COLUMN_NAME = 'proof_file_path')
BEGIN
    ALTER TABLE scam_reports ADD proof_file_path nvarchar(500) NULL;
    PRINT 'Added proof_file_path column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'scam_reports' AND COLUMN_NAME = 'proof_file_name')
BEGIN
    ALTER TABLE scam_reports ADD proof_file_name nvarchar(255) NULL;
    PRINT 'Added proof_file_name column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'scam_reports' AND COLUMN_NAME = 'proof_file_type')
BEGIN
    ALTER TABLE scam_reports ADD proof_file_type nvarchar(100) NULL;
    PRINT 'Added proof_file_type column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'scam_reports' AND COLUMN_NAME = 'proof_file_size')
BEGIN
    ALTER TABLE scam_reports ADD proof_file_size int NULL;
    PRINT 'Added proof_file_size column';
END

-- Add timestamp columns
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'scam_reports' AND COLUMN_NAME = 'verified_at')
BEGIN
    ALTER TABLE scam_reports ADD verified_at datetime2 NULL;
    PRINT 'Added verified_at column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'scam_reports' AND COLUMN_NAME = 'published_at')
BEGIN
    ALTER TABLE scam_reports ADD published_at datetime2 NULL;
    PRINT 'Added published_at column';
END

-- Verify final structure
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'scam_reports' 
ORDER BY ORDINAL_POSITION;