import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequest } from "@tanstack/react-start/server";

export type AppRole = "admin" | "manager" | "requestor";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requestOrigin(): string {
  const req = getRequest();
  const url = new URL(req.url);
  return url.origin;
}

/** Throws unless the current user is an admin. Returns the admin client. */
async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ─── Current user ────────────────────────────────────────

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ role: AppRole | null }> => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r: { role: AppRole }) => r.role);
    const role = roles.includes("admin") ? "admin" : roles.includes("manager") ? "manager" : roles.includes("requestor") ? "requestor" : null;
    return { role };
  });

// ─── First-admin bootstrap (public, self-closing) ───────

export const adminExists = createServerFn({ method: "GET" }).handler(async (): Promise<{ exists: boolean }> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});

export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string; displayName: string }) => {
    if (!data?.email || !EMAIL_RE.test(data.email)) throw new Error("Valid email required");
    if (!data?.password || data.password.length < 8) throw new Error("Password must be at least 8 characters");
    return data;
  })
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { ok: false, error: "An admin already exists. Sign-ups are invite-only." };

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName?.trim() || data.email.split("@")[0] },
    });
    if (error || !created.user) return { ok: false, error: error?.message ?? "Could not create user" };

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (roleError) return { ok: false, error: roleError.message };

    return { ok: true };
  });

// ─── Team management (admin only) ───────────────────────

export interface TeamUser {
  id: string;
  email: string;
  displayName: string;
  role: AppRole | null;
  createdAt: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: AppRole;
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
}

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ users: TeamUser[]; invites: TeamInvite[] }> => {
    const supabaseAdmin = await requireAdmin(context);

    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, display_name, created_at");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const { data: invites } = await supabaseAdmin.from("invites").select("id, email, role, status, created_at").order("created_at", { ascending: false });

    const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const roleById = new Map<string, AppRole>();
    for (const r of roles ?? []) {
      // admin wins over manager wins over requestor
      const rank = { admin: 3, manager: 2, requestor: 1 } as const;
      const prev = roleById.get(r.user_id);
      if (!prev || rank[r.role as AppRole] > rank[prev]) roleById.set(r.user_id, r.role as AppRole);
    }

    const users: TeamUser[] = (profiles ?? []).map((p) => ({
      id: p.id,
      email: emailById.get(p.id) ?? "",
      displayName: p.display_name ?? "",
      role: roleById.get(p.id) ?? null,
      createdAt: p.created_at,
    }));

    return {
      users,
      invites: (invites ?? []).map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role as AppRole,
        status: i.status as TeamInvite["status"],
        createdAt: i.created_at,
      })),
    };
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string; role: AppRole }) => {
    if (!data?.email || !EMAIL_RE.test(data.email)) throw new Error("Valid email required");
    if (!["admin", "manager", "requestor"].includes(data.role)) throw new Error("Invalid role");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const supabaseAdmin = await requireAdmin(context);
    const email = data.email.trim().toLowerCase();

    const { error: inviteError } = await context.supabase
      .from("invites")
      .insert({ email, role: data.role, invited_by: context.userId });
    if (inviteError) return { ok: false, error: inviteError.message };

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${requestOrigin()}/auth/callback`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string }) => {
    if (!data?.email || !EMAIL_RE.test(data.email)) throw new Error("Valid email required");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const supabaseAdmin = await requireAdmin(context);
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email.trim().toLowerCase(), {
      redirectTo: `${requestOrigin()}/auth/callback`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error("Invite id required");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("invites")
      .update({ status: "revoked" })
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; role: AppRole }) => {
    if (!data?.userId) throw new Error("User id required");
    if (!["admin", "manager", "requestor"].includes(data.role)) throw new Error("Invalid role");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const supabaseAdmin = await requireAdmin(context);

    if (data.role !== "admin") {
      // Prevent demoting the last admin
      const { data: admins } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
      const adminIds = (admins ?? []).map((a) => a.user_id);
      if (adminIds.length <= 1 && adminIds.includes(data.userId)) {
        return { ok: false, error: "You can't demote the last admin." };
      }
    }

    const { error: delError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (delError) return { ok: false, error: delError.message };
    const { error: insError } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (insError) return { ok: false, error: insError.message };
    return { ok: true };
  });
