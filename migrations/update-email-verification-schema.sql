IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'is_email_verified')
BEGIN
    ALTER TABLE users ADD is_email_verified BIT DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'email_verification_token')
BEGIN
    ALTER TABLE users ADD email_verification_token NVARCHAR(255) NULL;
END
