# Invite-Only Access for Stackwise

## Goal

Disable all public sign-up. Only an existing admin can bring new users in, by email invitation with a pre-assigned role (Admin / Manager / Requestor). The demo mode is removed; the app requires sign-in for everything past the landing page.

## What changes for users

- Landing page keeps a **Sign in** button only — no public sign-up, no "Try demo".
- A **hidden setup page** (`/setup-admin`) allows creating the very first admin account. It is removed (or permanently disabled) as soon as that first admin exists.
- Signed-in admins get a **User Management** area in Settings where they invite people by email and pick a role.
- Invited users receive an email, set their password, and land in the app with their assigned role.
- Non-signed-in visitors hitting any `/app/*` URL are redirected to sign-in.

## Implementation steps

1. **Enable Lovable Cloud** — provisions the database, auth, and email delivery.
2. **Database schema** (migration):
   - `profiles` table (id → auth.users, display name) with RLS + trigger on signup.
   - `app_role` enum + `user_roles` table with `has_role()` security-definer function, per the standard roles pattern (roles never on the profile table).
   - `invites` table (email, role, token, invited_by, status, expiry) with admin-only RLS policies and GRANTs.
3. **Auth pages**:
   - `/auth` — sign-in only (email + password, forgot-password link). No sign-up form.
   - `/reset-password` — public recovery page (required for the reset flow).
   - `/setup-admin` — hidden one-time page: server function creates the first admin only when zero admins exist; afterwards it refuses.
   - `/accept-invite?token=...` — invited user sets name + password; server function validates the token, creates the account, assigns the role, marks the invite used.
4. **Route protection**: move the `/app` tree behind the integration-managed `_authenticated/` gate (`ssr: false`, redirect to `/auth`). Remove the demo guard, `useDemo`, `DemoBanner`, and the demo "Try demo" CTA on the landing page.
5. **Role-aware UI**: replace demo `useRole` with a real role lookup (server function reading `user_roles` for the current user); keep the existing `canAccessRoute` guard, now driven by the real role.
6. **Invite flow**: `inviteUser` server function (admin-only, verified via `has_role`) generates a token, stores the invite, and sends the invitation email via Lovable Cloud's email service. Resend / revoke actions in Settings.
7. **Sign-in state in header**: user menu with sign-out (proper cache teardown + replace navigation to `/auth`).
8. **Head/SEO**: each new route gets its own `head()` title/description; `/auth`, `/setup-admin`, `/accept-invite`, `/reset-password` marked `noindex`.
9. **Verify**: build check + Playwright walkthrough of first-admin setup → invite → accept → sign-in → role-gated access, and confirm public sign-up is impossible.

## Technical details

- No `VITE_`-prefixed secrets; privileged work (creating users, validating invites) runs in server functions using the admin client loaded inside handlers after role verification.
- Email/password auth via Lovable Cloud; email confirmation stays on for invited users.
- Migration includes GRANTs on every new table alongside RLS policies.

## Bootstrap sequence (after build)

1. You open `/setup-admin` once and create your admin account.
2. I verify the admin exists, then remove/disable the setup page.
3. You invite everyone else from Settings → User Management.
