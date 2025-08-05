const sql = require('mssql');

const config = {
  server: process.env.AZURE_SQL_SERVER || 'beawaredevdbserver.database.windows.net',
  port: parseInt(process.env.AZURE_SQL_PORT || '1433'),
  database: process.env.AZURE_SQL_DATABASE || 'Beawaredevdb',
  user: process.env.AZURE_SQL_USER || 'beawaredevadmin',
  password: process.env.AZURE_SQL_PASSWORD || 'Getmeup81$',
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: false
  }
};

async function createTable() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Connected to Azure SQL Database');

    // Check if table exists
    const checkResult = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'password_resets'
    `);

    if (checkResult.recordset[0].count > 0) {
      console.log('password_resets table already exists');
      return;
    }

    // Create table
    await pool.request().query(`
      CREATE TABLE password_resets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        reset_token NVARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME2 NOT NULL,
        used BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('password_resets table created successfully');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

createTable();