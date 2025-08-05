-- Update security_checklist_items table to add new columns for admin editing functionality
-- This script adds tool_launch_url and youtube_video_url columns

-- Check if columns exist before adding them
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'security_checklist_items' AND COLUMN_NAME = 'tool_launch_url')
BEGIN
    ALTER TABLE security_checklist_items ADD tool_launch_url NVARCHAR(500) NULL;
    PRINT 'Added tool_launch_url column to security_checklist_items table';
END
ELSE
BEGIN
    PRINT 'tool_launch_url column already exists in security_checklist_items table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'security_checklist_items' AND COLUMN_NAME = 'youtube_video_url')  
BEGIN
    ALTER TABLE security_checklist_items ADD youtube_video_url NVARCHAR(500) NULL;
    PRINT 'Added youtube_video_url column to security_checklist_items table';
END
ELSE
BEGIN
    PRINT 'youtube_video_url column already exists in security_checklist_items table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'security_checklist_items' AND COLUMN_NAME = 'updated_at')
BEGIN
    ALTER TABLE security_checklist_items ADD updated_at DATETIME2 DEFAULT GETDATE();
    PRINT 'Added updated_at column to security_checklist_items table';
END
ELSE
BEGIN
    PRINT 'updated_at column already exists in security_checklist_items table';
END

-- Update some existing items with sample tool launch URLs for testing
UPDATE security_checklist_items 
SET tool_launch_url = 'https://www.freeze.equifax.com/Freeze/jsp/SFF_PersonalIDInfo.jsp',
    updated_at = GETDATE()
WHERE title = 'Freeze Your Credit Reports' AND tool_launch_url IS NULL;

UPDATE security_checklist_items 
SET tool_launch_url = 'https://bitwarden.com/pricing/',
    updated_at = GETDATE()
WHERE title = 'Use a Password Manager' AND tool_launch_url IS NULL;

UPDATE security_checklist_items 
SET tool_launch_url = 'https://authy.com/download/',
    updated_at = GETDATE()
WHERE title = 'Enable Two-Factor Authentication' AND tool_launch_url IS NULL;

PRINT 'Schema update completed successfully';