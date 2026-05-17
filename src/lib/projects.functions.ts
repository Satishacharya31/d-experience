import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";

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

async function requireAdmin(supabaseClient: ReturnType<typeof import("@supabase/supabase-js").createClient>, userId: string) {
  const { data, error } = await supabaseClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export async function fetchProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectRow[];
}

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => projectInput.parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase as never, context.userId);
    const { data: row, error } = await context.supabase
      .from("projects")
      .upsert(data, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as ProjectRow;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase as never, context.userId);
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
