import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Loader2, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { adminExists, bootstrapFirstAdmin } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/setup-admin")({
  head: () => ({
    meta: [
      { title: "Workspace setup · Stackwise" },
      { name: "description", content: "Create the first admin account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SetupAdminPage,
});

function SetupAdminPage() {
  const checkAdminExists = useServerFn(adminExists);
  const bootstrap = useServerFn(bootstrapFirstAdmin);

  const [available, setAvailable] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    checkAdminExists().then(({ exists }) => setAvailable(!exists)).catch(() => setAvailable(false));
  }, [checkAdminExists]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await bootstrap({ data: { email, password, displayName: name } });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Setup failed.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Workspace setup</h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {available === null ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !available ? (
            <div className="text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Setup is complete</p>
              <p className="mt-1 text-sm text-muted-foreground">
                An admin account already exists. New users join by invitation only.
              </p>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link to="/auth">Go to sign in</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
              <p className="text-sm font-medium">Admin account created</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in with your new credentials, then invite your team from Settings → Users.
              </p>
              <Button className="mt-4 w-full" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create the first admin account. This page becomes unavailable as soon as an admin exists.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alice Andersson" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create admin account
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
