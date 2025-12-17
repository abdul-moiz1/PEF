import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// PostgreSQL is optional - this app primarily uses Firebase/Firestore
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  db = drizzle(pool, { schema });
} else {
  console.log("DATABASE_URL not set - PostgreSQL features disabled, using Firebase/Firestore");
}

export { db };
