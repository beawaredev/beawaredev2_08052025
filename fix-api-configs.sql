
-- Check if api_configs table exists, create if not
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='api_configs' AND xtype='U')
BEGIN
    CREATE TABLE api_configs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        type NVARCHAR(50) NOT NULL,
        url NVARCHAR(500) NOT NULL,
        api_key NVARCHAR(255) NOT NULL,
        enabled BIT NOT NULL DEFAULT 1,
        description NVARCHAR(500),
        rate_limit INT DEFAULT 100,
        timeout INT DEFAULT 30,
        parameter_mapping NVARCHAR(MAX),
        headers NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Created api_configs table';
END
ELSE
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_configs') AND name = 'parameter_mapping')
    BEGIN
        ALTER TABLE api_configs ADD parameter_mapping NVARCHAR(MAX);
        PRINT 'Added parameter_mapping column';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_configs') AND name = 'headers')
    BEGIN
        ALTER TABLE api_configs ADD headers NVARCHAR(MAX);
        PRINT 'Added headers column';
    END
    
    PRINT 'api_configs table updated';
END
