import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Signing in… · Stackwise" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Invite links carry tokens in the URL hash; the Supabase client parses
    // them automatically (detectSessionInUrl) and fires SIGNED_IN.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        navigate({ to: "/app/dashboard", replace: true });
      }
    });

    // Fallback: session may already be established by the time we mount.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app/dashboard", replace: true });
    });

    const t = setTimeout(() => setFailed(true), 6000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      {failed ? (
        <>
          <p className="text-sm text-muted-foreground">
            We couldn't complete your sign-in. The invite link may have expired — ask your admin to resend it.
          </p>
          <Button variant="outline" asChild>
            <Link to="/auth">Go to sign in</Link>
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Completing sign-in…</p>
        </>
      )}
    </div>
  );
}
