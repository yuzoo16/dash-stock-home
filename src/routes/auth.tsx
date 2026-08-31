import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Stackwise" },
      { name: "description", content: "Sign in to your Stackwise workspace. Access is invite-only." },
      { property: "og:title", content: "Sign in · Stackwise" },
      { property: "og:description", content: "Sign in to your Stackwise workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        navigate({ to: "/app/dashboard", replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
      return;
    }
    navigate({ to: "/app/dashboard" });
  }

  async function handleForgotPassword() {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter your email above, then click “Forgot password”.");
      return;
    }
    setError("");
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setResetSent(true);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-lg font-semibold">Stackwise</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access is invite-only. Contact your admin to get an invitation.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {resetSent ? (
            <div className="text-center">
              <p className="text-sm font-medium">Check your inbox</p>
              <p className="mt-1 text-sm text-muted-foreground">
                If an account exists for {email.trim()}, we've sent a password reset link.
              </p>
              <Button variant="outline" className="mt-4 w-full" onClick={() => setResetSent(false)}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
