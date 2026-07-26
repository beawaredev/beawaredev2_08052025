import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema.js";

// Separate from db.ts (mssql) on purpose: AzureStorage.ts and routes.worries.ts
// still depend on the mssql pool exported there. This file is the seam for the
// Postgres cutover — once PgStorage.ts replaces AzureStorage.ts, db.ts (mssql)
// and this file's name can be reconciled.
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

export const pgDb = drizzle(pgPool, { schema });
