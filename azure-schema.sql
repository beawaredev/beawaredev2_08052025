-- Azure SQL Database Schema for BeAware
-- Drop existing tables if they exist
IF OBJECT_ID('scam_comments', 'U') IS NOT NULL DROP TABLE scam_comments;
IF OBJECT_ID('scam_reports', 'U') IS NOT NULL DROP TABLE scam_reports;
IF OBJECT_ID('password_resets', 'U') IS NOT NULL DROP TABLE password_resets;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;

-- Create Users table
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255),
    display_name NVARCHAR(255),
    beaware_username NVARCHAR(100) UNIQUE,
    role NVARCHAR(50) NOT NULL DEFAULT 'user',
    auth_provider NVARCHAR(50) NOT NULL DEFAULT 'local',
    google_id NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Create Scam Reports table
CREATE TABLE scam_reports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    scam_type NVARCHAR(50) NOT NULL,
    scam_phone_number NVARCHAR(50),
    scam_email NVARCHAR(255),
    scam_business_name NVARCHAR(255),
    incident_date DATE NOT NULL,
    country NVARCHAR(100) NOT NULL,
    city NVARCHAR(100),
    state NVARCHAR(100),
    zip_code NVARCHAR(20),
    description NTEXT NOT NULL,
    is_verified BIT NOT NULL DEFAULT 0,
    is_published BIT NOT NULL DEFAULT 0,
    reported_at DATETIME2 DEFAULT GETDATE(),
    verified_by INT,
    published_by INT,
    verified_at DATETIME2,
    published_at DATETIME2,
    has_proof_document BIT DEFAULT 0,
    proof_file_path NVARCHAR(500),
    proof_file_name NVARCHAR(255),
    proof_file_type NVARCHAR(50),
    proof_file_size INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (published_by) REFERENCES users(id)
);

-- Create Password Resets table
CREATE TABLE password_resets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    reset_token NVARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    used BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Scam Comments table
CREATE TABLE scam_comments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    scam_report_id INT NOT NULL,
    user_id INT NOT NULL,
    comment NTEXT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (scam_report_id) REFERENCES scam_reports(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert admin user
INSERT INTO users (email, password, display_name, role, auth_provider)
VALUES ('admin@beaware.fyi', 'admin123', 'Administrator', 'admin', 'local');

-- Create Security Checklist Items table
CREATE TABLE security_checklist_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NTEXT NOT NULL,
    category NVARCHAR(100) NOT NULL,
    priority NVARCHAR(50) NOT NULL DEFAULT 'medium',
    recommendation_text NTEXT,
    help_url NVARCHAR(500),
    estimated_time_minutes INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Create User Security Progress table
CREATE TABLE user_security_progress (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    checklist_item_id INT NOT NULL,
    is_completed BIT DEFAULT 0,
    completed_at DATETIME2,
    notes NTEXT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (checklist_item_id) REFERENCES security_checklist_items(id),
    UNIQUE(user_id, checklist_item_id)
);

-- Insert security checklist items
INSERT INTO security_checklist_items (title, description, category, priority, recommendation_text, help_url, estimated_time_minutes, sort_order)
VALUES 
('Freeze Your Credit Reports', 'Place security freezes on your credit reports at all three major credit bureaus', 'financial_security', 'high', 'Contact Equifax, Experian, and TransUnion to place free security freezes on your credit reports. This prevents new accounts from being opened in your name.', 'https://www.consumer.ftc.gov/articles/0497-credit-freeze-faqs', 45, 1),
('Enable Two-Factor Authentication', 'Secure your most important accounts with 2FA', 'account_security', 'high', 'Set up 2FA on your email, banking, and social media accounts using an authenticator app like Google Authenticator or Authy.', 'https://authy.com/what-is-2fa/', 15, 2),
('Use a Password Manager', 'Generate and store strong, unique passwords', 'password_security', 'high', 'Install a reputable password manager like Bitwarden, 1Password, or LastPass to create unique passwords for every account.', 'https://bitwarden.com/help/getting-started-webvault/', 30, 3),
('Review Bank and Credit Card Statements', 'Monitor your financial accounts for unauthorized transactions', 'financial_security', 'high', 'Check your bank and credit card statements weekly for suspicious activity. Set up account alerts for transactions over a certain amount.', 'https://www.consumer.ftc.gov/articles/0213-lost-or-stolen-credit-atm-and-debit-cards', 20, 4),
('Update Software and Operating Systems', 'Keep your devices secure with the latest updates', 'device_security', 'medium', 'Enable automatic updates for your operating system, web browsers, and important software to protect against security vulnerabilities.', 'https://www.cisa.gov/tips/st04-006', 10, 5),
('Secure Your Wi-Fi Network', 'Protect your home internet connection', 'network_security', 'medium', 'Use WPA3 encryption, change default router passwords, and regularly update router firmware.', 'https://www.fcc.gov/consumers/guides/how-protect-yourself-online', 25, 6),
('Be Cautious with Public Wi-Fi', 'Protect your data on public networks', 'network_security', 'medium', 'Avoid accessing sensitive information on public Wi-Fi. Use a VPN when necessary and ensure websites use HTTPS.', 'https://www.cisa.gov/tips/st05-017', 5, 7),
('Review Privacy Settings on Social Media', 'Control what information you share online', 'privacy_settings', 'medium', 'Regularly review and update privacy settings on social media platforms to limit who can see your personal information.', 'https://www.ftc.gov/tips-advice/business-center/privacy-and-security/social-media', 30, 8),
('Use Secure Email Practices', 'Protect yourself from email-based threats', 'communication_security', 'medium', 'Be suspicious of unexpected emails, verify sender identity, and never click links or download attachments from unknown sources.', 'https://www.cisa.gov/tips/st04-014', 10, 9),
('Backup Important Data', 'Protect your data from loss or ransomware', 'data_protection', 'high', 'Regularly backup important files to multiple locations including cloud storage and external drives using the 3-2-1 backup rule.', 'https://www.cisa.gov/tips/st05-012', 60, 10),
('Install Antivirus Software', 'Protect your devices from malware', 'device_security', 'medium', 'Install reputable antivirus software and keep it updated. Enable real-time protection and regular system scans.', 'https://www.cisa.gov/tips/st04-005', 20, 11),
('Monitor Your Credit Reports', 'Watch for signs of identity theft', 'financial_security', 'high', 'Check your credit reports from all three bureaus annually at annualcreditreport.com and dispute any errors immediately.', 'https://www.annualcreditreport.com/', 30, 12),
('Use Encrypted Communication Apps', 'Protect your private conversations', 'communication_security', 'low', 'Use encrypted messaging apps like Signal or WhatsApp for sensitive communications instead of regular SMS.', 'https://signal.org/', 15, 13);

-- Insert sample scam reports
INSERT INTO scam_reports (user_id, scam_type, scam_phone_number, incident_date, country, description, is_verified, is_published)
VALUES 
(1, 'phone', '+1-555-0123', '2024-01-15', 'United States', 'Caller claimed to be from IRS demanding immediate payment', 0, 1),
(1, 'email', NULL, '2024-01-20', 'United States', 'Phishing email pretending to be from bank asking for login credentials', 0, 0),
(1, 'phone', '+1-555-0456', '2024-01-25', 'United States', 'Robocall about extended car warranty', 0, 0);

-- Set the scam_email for the email scam
UPDATE scam_reports SET scam_email = 'fake@phishing.com' WHERE scam_type = 'email';