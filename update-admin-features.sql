-- Add columns to users table for admin features
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'is_active')
BEGIN
    ALTER TABLE users ADD is_active BIT DEFAULT 1 WITH VALUES;
    PRINT 'Added is_active column to users table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_login_at')
BEGIN
    ALTER TABLE users ADD last_login_at DATETIME2 NULL;
    PRINT 'Added last_login_at column to users table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_visited_page')
BEGIN
    ALTER TABLE users ADD last_visited_page NVARCHAR(255) NULL;
    PRINT 'Added last_visited_page column to users table';
END

-- Create site_stats table for daily analytics
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'site_stats')
BEGIN
    CREATE TABLE site_stats (
        id INT IDENTITY(1,1) PRIMARY KEY,
        date DATE NOT NULL,
        guest_visits INT DEFAULT 0,
        user_visits INT DEFAULT 0,
        total_visits INT DEFAULT 0,
        updated_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT UQ_site_stats_date UNIQUE (date)
    );
    PRINT 'Created site_stats table';
END

-- Create page_visits table for page popularity tracking
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'page_visits')
BEGIN
    CREATE TABLE page_visits (
        id INT IDENTITY(1,1) PRIMARY KEY,
        page_path NVARCHAR(255) NOT NULL,
        visit_count INT DEFAULT 0,
        last_visited_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT UQ_page_visits_path UNIQUE (page_path)
    );
    PRINT 'Created page_visits table';
END
