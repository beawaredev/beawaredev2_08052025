"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = exports.db = exports.pool = void 0;
const mssql_1 = require("mssql");
// Azure SQL Database configuration using environment variables
const config = {
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
exports.pool = new mssql_1.default.ConnectionPool(config);
// Initialize connection
let connectionPromise = null;
const connectToDatabase = async () => {
    if (!connectionPromise) {
        connectionPromise = exports.pool.connect().then(() => {
            console.log('Connected to Azure SQL Database');
        }).catch((err) => {
            console.error('Azure SQL Database connection error:', err);
            connectionPromise = null;
            throw err;
        });
    }
    return connectionPromise;
};
exports.connectToDatabase = connectToDatabase;
// Don't initialize connection on module load to prevent startup blocking
// Connection will be established on first use
// Export raw SQL connection for direct queries
exports.db = exports.pool;
