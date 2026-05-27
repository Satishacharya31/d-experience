import { neon } from "@neondatabase/serverless";

const isServer = typeof window === "undefined";

const connectionString = isServer
  ? (process.env.DATABASE_URL || process.env.DB_URL)
  : "";

if (isServer && !connectionString) {
  throw new Error("DATABASE_URL or DB_URL environment variable is missing!");
}

// Only instantiate neon on the server
export const sql = isServer && connectionString
  ? neon(connectionString)
  : (() => {
      // Return a dummy function for the client side so it doesn't crash during bundle evaluation
      return () => {
        throw new Error("Database SQL should not be called from the client side!");
      };
    })() as any;

