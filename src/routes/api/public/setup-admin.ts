import { createFileRoute } from "@tanstack/react-router";
import { sql } from "@/lib/db.server";
import { hashPassword } from "@/lib/auth.server";

const ADMIN_EMAIL = "admin@satish.com.np";
const ADMIN_PASSWORD = "satish@com";

export const Route = createFileRoute("/api/public/setup-admin")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Idempotent check: bail if any admin already exists in the Neon DB admins table
          const countRes = await sql`SELECT COUNT(*)::int as count FROM admins`;
          const count = countRes[0]?.count ?? 0;

          if (count > 0) {
            return Response.json({ ok: true, status: "already-initialized" });
          }

          // Hash the default credentials securely using the custom PBKDF2 function
          const hashedPassword = await hashPassword(ADMIN_PASSWORD);

          // Insert direct SQL query into Neon
          const insertRes = await sql`
            INSERT INTO admins (email, password_hash)
            VALUES (${ADMIN_EMAIL}, ${hashedPassword})
            RETURNING id
          `;

          const userId = insertRes[0]?.id;

          return Response.json({ ok: true, status: "initialized", userId });
        } catch (error) {
          console.error("Error setting up admin:", error);
          return Response.json(
            { ok: false, error: (error as Error).message },
            { status: 500 }
          );
        }
      },
    },
  },
});
