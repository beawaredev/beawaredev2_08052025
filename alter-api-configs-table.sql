-- Add new columns to api_configs table if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_configs') AND name = 'parameter_mapping')
BEGIN
    ALTER TABLE api_configs ADD parameter_mapping NVARCHAR(MAX);
    PRINT 'Added parameter_mapping column to api_configs table';
END
ELSE
BEGIN
    PRINT 'parameter_mapping column already exists in api_configs table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_configs') AND name = 'headers')
BEGIN
    ALTER TABLE api_configs ADD headers NVARCHAR(MAX);
    PRINT 'Added headers column to api_configs table';
END
ELSE
BEGIN
    PRINT 'headers column already exists in api_configs table';
END

-- Update existing records with default parameter mappings
UPDATE api_configs
SET parameter_mapping = 
    CASE 
        WHEN type = 'phone' THEN '{"phone": "{{input}}", "key": "{{apiKey}}"}'
        WHEN type = 'email' THEN '{"email": "{{input}}", "key": "{{apiKey}}"}'
        WHEN type = 'url' THEN '{"url": "{{input}}", "key": "{{apiKey}}"}'
        WHEN type = 'ip' THEN '{"ip": "{{input}}", "key": "{{apiKey}}"}'
        WHEN type = 'domain' THEN '{"domain": "{{input}}", "key": "{{apiKey}}"}'
        ELSE '{"input": "{{input}}", "key": "{{apiKey}}"}'
    END
WHERE parameter_mapping IS NULL;

-- Update existing records with default headers
UPDATE api_configs
SET headers = '{"Content-Type": "application/json"}'
WHERE headers IS NULL;

PRINT 'API configs table schema updated successfully';