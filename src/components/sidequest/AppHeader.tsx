import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { LogOut } from "lucide-react";

const navLinks = [
  { to: "/dashboard", label: "Today" },
  { to: "/profile", label: "Profile" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/submit", label: "Submit" },
] as const;

export function AppHeader() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-1.5 text-sm text-foreground bg-secondary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/30 px-6 py-2 md:hidden">
        {navLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-xs bg-secondary text-foreground" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}