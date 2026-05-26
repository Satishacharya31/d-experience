import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || process.env.DB_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DB_URL environment variable is missing!");
}

// Neon HTTP driver connection - works on Cloudflare Workers and handles connection pooling out of the box
export const sql = neon(connectionString);
