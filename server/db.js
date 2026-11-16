import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: new URL("./.env", import.meta.url) });

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    });

pool.on("error", (err) => {
  console.error("Database error:", err);
});

export default pool;