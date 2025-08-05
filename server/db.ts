import sql from 'mssql';

// Azure SQL Database configuration using environment variables
const config: sql.config = {
  server: process.env.AZURE_SQL_SERVER || 'beawaredevdbserver.database.windows.net',
  port: parseInt(process.env.AZURE_SQL_PORT || '1433'),
  database: process.env.AZURE_SQL_DATABASE || 'Beawaredevdb',
  user: process.env.AZURE_SQL_USER || 'beawaredevadmin',
  password: process.env.AZURE_SQL_PASSWORD || 'Getmeup81$',
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

// Create connection pool
export const pool = new sql.ConnectionPool(config);

// Initialize connection
let connectionPromise: Promise<void> | null = null;

const connectToDatabase = async (): Promise<void> => {
  if (!connectionPromise) {
    connectionPromise = pool.connect().then(() => {
      console.log('Connected to Azure SQL Database');
    }).catch((err: any) => {
      console.error('Azure SQL Database connection error:', err);
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
};

// Don't initialize connection on module load to prevent startup blocking
// Connection will be established on first use

// Export raw SQL connection for direct queries
export const db = pool;

// Export connection function for manual connection if needed
export { connectToDatabase };