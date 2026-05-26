import { defineConfig } from "@prisma/config";
import fs from "fs";
import path from "path";

// Extract DATABASE_URL or DB_URL directly from process.env or parse the local .env file
let databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;

if (!databaseUrl) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      // Match DATABASE_URL or DB_URL keys in the .env file
      const matchDbUrl = envContent.match(/DATABASE_URL=["']?([^"\n\r']+)["']?/) ||
                         envContent.match(/DB_URL=["']?([^"\n\r']+)["']?/);
      if (matchDbUrl && matchDbUrl[1]) {
        databaseUrl = matchDbUrl[1].trim();
      }
    }
  } catch (err) {
    console.error("Warning: Could not parse local .env file in Prisma config:", err);
  }
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});
