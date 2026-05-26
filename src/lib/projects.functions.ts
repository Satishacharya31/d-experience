import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNeonAdmin, loginAdmin } from "./auth.server";
import { sql } from "./db.server";

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  url: string | null;
  repo: string | null;
  cover_image: string | null;
  status: string;
  year: number | null;
  featured: boolean;
  sort_order: number;
};

const projectInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(120),
  description: z.string().max(2000).default(""),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  url: z.string().url().nullable().optional(),
  repo: z.string().url().nullable().optional(),
  cover_image: z.string().url().nullable().optional(),
  status: z.string().min(1).max(40).default("live"),
  year: z.number().int().min(1990).max(2100).nullable().optional(),
  featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export const fetchProjects = createServerFn({ method: "GET" })
  .handler(async (): Promise<ProjectRow[]> => {
    const data = await sql`
      SELECT * FROM projects 
      ORDER BY sort_order ASC, created_at DESC
    `;
    return (data ?? []) as ProjectRow[];
  });

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireNeonAdmin])
  .inputValidator((data) => projectInput.parse(data))
  .handler(async ({ data }) => {
    let row;
    if (data.id) {
      const rows = await sql`
        INSERT INTO projects (
          id, slug, title, description, tags, url, repo, cover_image, status, year, featured, sort_order
        ) VALUES (
          ${data.id}, ${data.slug}, ${data.title}, ${data.description}, ${data.tags}, ${data.url || null}, ${data.repo || null}, ${data.cover_image || null}, ${data.status}, ${data.year || null}, ${data.featured}, ${data.sort_order}
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          tags = EXCLUDED.tags,
          url = EXCLUDED.url,
          repo = EXCLUDED.repo,
          cover_image = EXCLUDED.cover_image,
          status = EXCLUDED.status,
          year = EXCLUDED.year,
          featured = EXCLUDED.featured,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()
        RETURNING *
      `;
      row = rows[0];
    } else {
      const rows = await sql`
        INSERT INTO projects (
          slug, title, description, tags, url, repo, cover_image, status, year, featured, sort_order
        ) VALUES (
          ${data.slug}, ${data.title}, ${data.description}, ${data.tags}, ${data.url || null}, ${data.repo || null}, ${data.cover_image || null}, ${data.status}, ${data.year || null}, ${data.featured}, ${data.sort_order}
        )
        RETURNING *
      `;
      row = rows[0];
    }
    return row as ProjectRow;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireNeonAdmin])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await sql`DELETE FROM projects WHERE id = ${data.id}`;
    return { ok: true };
  });

export const loginAdminFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const token = await loginAdmin(data.email, data.password);
    return { token };
  });

