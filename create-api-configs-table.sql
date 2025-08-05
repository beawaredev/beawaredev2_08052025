-- Create API configurations table for scam lookup integrations
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='api_configs' AND xtype='U')
BEGIN
    CREATE TABLE api_configs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        type NVARCHAR(50) NOT NULL, -- phone, email, url, ip, domain
        url NVARCHAR(500) NOT NULL,
        api_key NVARCHAR(255) NOT NULL,
        enabled BIT NOT NULL DEFAULT 1,
        description NVARCHAR(500),
        rate_limit INT DEFAULT 100,
        timeout INT DEFAULT 30,
        parameter_mapping NVARCHAR(MAX), -- JSON mapping of parameters with runtime variables
        headers NVARCHAR(MAX), -- JSON object of HTTP headers
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    -- Create index on type for faster lookups
    CREATE INDEX IX_api_configs_type ON api_configs(type);
    CREATE INDEX IX_api_configs_enabled ON api_configs(enabled);
    
    PRINT 'Created api_configs table successfully';
END
ELSE
BEGIN
    PRINT 'api_configs table already exists';
END

-- Insert some sample API configurations for testing
IF NOT EXISTS (SELECT * FROM api_configs WHERE name = 'IPQualityScore Phone')
BEGIN
    INSERT INTO api_configs (name, type, url, api_key, enabled, description, rate_limit, timeout)
    VALUES 
    ('IPQualityScore Phone', 'phone', 'https://ipqualityscore.com/api/json', 'your-ipqs-api-key-here', 0, 'IPQualityScore phone number verification and fraud detection', 100, 30),
    ('IPQualityScore Email', 'email', 'https://ipqualityscore.com/api/json', 'your-ipqs-api-key-here', 0, 'IPQualityScore email validation and reputation checking', 100, 30),
    ('IPQualityScore URL', 'url', 'https://ipqualityscore.com/api/json', 'your-ipqs-api-key-here', 0, 'IPQualityScore URL/domain reputation and malware detection', 100, 30),
    ('VirusTotal URL', 'url', 'https://www.virustotal.com/vtapi/v2/url/report', 'your-virustotal-api-key-here', 0, 'VirusTotal URL scanning and reputation service', 100, 30),
    ('AbuseIPDB IP', 'ip', 'https://api.abuseipdb.com/api/v2/check', 'your-abuseipdb-api-key-here', 0, 'AbuseIPDB IP address reputation checking', 100, 30);
    
    PRINT 'Inserted sample API configurations';
END
ELSE
BEGIN
    PRINT 'Sample API configurations already exist';
END