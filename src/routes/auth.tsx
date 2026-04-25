import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/sidequest/Logo";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).catch("signup"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Side Quest" },
      { name: "description", content: "Sign in or create your Side Quest account." },
    ],
  }),
});

const credSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be 6+ characters").max(72),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const isSignUp = mode === "signup";
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [authLoading, user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNeedsEmailConfirmation(false);
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/dashboard`;
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;

        // If email confirmation is enabled, Supabase returns no session until user verifies email.
        if (!data.session) {
          toast.success("Account created. Check your inbox to confirm your email before signing in.");
          setNeedsEmailConfirmation(true);
          navigate({ to: "/auth", search: { mode: "signin" } });
          return;
        }

        toast.success("Account created. Welcome, traveler.");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (typeof msg === "string" && msg.toLowerCase().includes("email not confirmed")) {
        setNeedsEmailConfirmation(true);
        toast.error("Email not confirmed. Please check your inbox or resend confirmation.");
        return;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResendConfirmation = async () => {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }

    setResendingConfirmation(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success("Confirmation email sent. Check inbox and spam.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resend confirmation email";
      toast.error(msg);
    } finally {
      setResendingConfirmation(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute left-6 top-6 z-10"><Logo /></div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rune-border rounded-2xl p-8 shadow-elevated">
          <h1 className="font-display text-3xl font-semibold">
            {isSignUp ? "Begin your journey" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp
              ? "Create an account to receive your first side quest."
              : "Sign in to claim today's quest."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-md border border-border bg-input/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-rune"
                placeholder="seeker@quest.app"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="w-full rounded-md border border-border bg-input/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-rune"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md gradient-rune py-2.5 text-sm font-medium text-primary-foreground shadow-rune transition-all hover:shadow-glow disabled:opacity-60"
            >
              {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
            </button>

            {!isSignUp && needsEmailConfirmation && (
              <button
                type="button"
                onClick={onResendConfirmation}
                disabled={resendingConfirmation}
                className="w-full rounded-md border border-border bg-background/40 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
              >
                {resendingConfirmation ? "Resending..." : "Resend confirmation email"}
              </button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already enlisted? " : "New here? "}
            <Link
              to="/auth"
              search={{ mode: isSignUp ? "signin" : "signup" }}
              className="text-rune hover:underline"
            >
              {isSignUp ? "Sign in" : "Create account"}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
