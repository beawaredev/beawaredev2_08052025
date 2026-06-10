-- Add books table for the "Books" feature
-- Admins can publish books (with title, author, description, link, cover image)
-- which are shown publicly without requiring login.

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'books')
BEGIN
    CREATE TABLE books (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        author NVARCHAR(255),
        description NVARCHAR(MAX),
        link NVARCHAR(2048) NOT NULL,
        cover_image_url NVARCHAR(2048),
        is_published BIT NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_by INT NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
    PRINT 'Created books table';
END
ELSE
BEGIN
    PRINT 'books table already exists';
END
