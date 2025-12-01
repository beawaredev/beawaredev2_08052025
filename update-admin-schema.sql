
-- Update users table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active')
BEGIN
    ALTER TABLE users ADD is_active BIT DEFAULT 1;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at')
BEGIN
    ALTER TABLE users ADD last_login_at DATETIME2;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_visited_page')
BEGIN
    ALTER TABLE users ADD last_visited_page NVARCHAR(255);
END

-- Create site_stats table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'site_stats')
BEGIN
    CREATE TABLE site_stats (
        id INT IDENTITY(1,1) PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        guest_visits INT DEFAULT 0,
        user_visits INT DEFAULT 0,
        total_visits INT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END

-- Create page_visits table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'page_visits')
BEGIN
    CREATE TABLE page_visits (
        id INT IDENTITY(1,1) PRIMARY KEY,
        page_path NVARCHAR(255) NOT NULL UNIQUE,
        visit_count INT DEFAULT 0,
        last_visited_at DATETIME2 DEFAULT GETDATE()
    );
END
