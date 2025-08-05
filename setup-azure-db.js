const sql = require('mssql');

// Azure SQL Database configuration
const config = {
  server: 'beawaredevdbserver.database.windows.net',
  port: 1433,
  database: 'Beawaredevdb',
  user: 'beawaredevadmin',
  password: 'Getmeup81$',
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: false,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function setupAzureDatabase() {
  let pool;
  
  try {
    console.log('Connecting to Azure SQL Database...');
    pool = await sql.connect(config);
    console.log('Connected successfully!');

    // Drop existing tables if they exist
    console.log('Dropping existing tables...');
    await pool.request().query(`
      IF OBJECT_ID('scam_comments', 'U') IS NOT NULL DROP TABLE scam_comments;
      IF OBJECT_ID('scam_reports', 'U') IS NOT NULL DROP TABLE scam_reports;
      IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
    `);

    // Create Users table
    console.log('Creating users table...');
    await pool.request().query(`
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
    `);

    // Create Scam Reports table
    console.log('Creating scam_reports table...');
    await pool.request().query(`
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
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (verified_by) REFERENCES users(id),
          FOREIGN KEY (published_by) REFERENCES users(id)
      );
    `);

    // Create Scam Comments table
    console.log('Creating scam_comments table...');
    await pool.request().query(`
      CREATE TABLE scam_comments (
          id INT IDENTITY(1,1) PRIMARY KEY,
          scam_report_id INT NOT NULL,
          user_id INT NOT NULL,
          comment NTEXT NOT NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (scam_report_id) REFERENCES scam_reports(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Insert admin user
    console.log('Creating admin user...');
    await pool.request().query(`
      INSERT INTO users (email, password, display_name, role, auth_provider)
      VALUES ('admin@beaware.fyi', 'admin123', 'Administrator', 'admin', 'local');
    `);

    // Insert sample scam reports
    console.log('Creating sample scam reports...');
    await pool.request().query(`
      INSERT INTO scam_reports (user_id, scam_type, scam_phone_number, scam_email, incident_date, country, description, is_verified, is_published)
      VALUES 
      (1, 'phone', '+1-555-0123', NULL, '2024-01-15', 'United States', 'Caller claimed to be from IRS demanding immediate payment', 0, 1),
      (1, 'email', NULL, 'fake@phishing.com', '2024-01-20', 'United States', 'Phishing email pretending to be from bank asking for login credentials', 0, 0),
      (1, 'phone', '+1-555-0456', NULL, '2024-01-25', 'United States', 'Robocall about extended car warranty', 0, 0);
    `);

    console.log('Azure SQL Database setup completed successfully!');
    
    // Verify the data
    console.log('\nVerifying data...');
    const userResult = await pool.request().query('SELECT * FROM users');
    console.log('Users:', userResult.recordset);
    
    const reportsResult = await pool.request().query('SELECT * FROM scam_reports');
    console.log('Scam Reports:', reportsResult.recordset);

  } catch (error) {
    console.error('Error setting up Azure SQL Database:', error);
  } finally {
    if (pool) {
      await pool.close();
      console.log('Database connection closed.');
    }
  }
}

setupAzureDatabase();