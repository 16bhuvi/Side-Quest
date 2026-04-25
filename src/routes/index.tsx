import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Logo } from "@/components/sidequest/Logo";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Side Quest — Real-life challenges that level you up" },
      { name: "description", content: "Daily screen-free challenges. Earn XP. Build streaks. A gamified productivity app for your real life." },
    ],
  }),
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/auth" search={{ mode: "signin" }} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link to="/auth" search={{ mode: "signup" }} className="rounded-md gradient-rune px-4 py-2 text-sm font-medium text-primary-foreground shadow-rune transition-transform hover:scale-105">
            Begin
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-rune pulse-rune" />
            A gamified productivity ritual
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] md:text-7xl">
            Level up your life,<br />
            <span className="text-rune text-glow">one quest at a time.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Side Quest assigns you real-world challenges. No screens, no notifications, no doom-scrolling. Just XP for actually doing the things you keep meaning to do.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="group inline-flex items-center gap-2 rounded-lg gradient-rune px-6 py-3 font-medium text-primary-foreground shadow-rune transition-all hover:shadow-glow"
            >
              Start your first quest
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link to="/auth" search={{ mode: "signin" }} className="rounded-lg border border-border/60 px-6 py-3 text-sm transition-colors hover:bg-secondary">
              I already have an account
            </Link>
          </div>
        </motion.div>

        {/* Quest preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mx-auto mt-20 max-w-md float"
        >
          <div className="rune-border rounded-2xl p-8 shadow-elevated">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span>Today's quest</span>
              <span className="text-rune">+60 XP</span>
            </div>
            <h3 className="mt-4 font-display text-2xl font-semibold">
              Walk 5,000 steps outdoors
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Leave the headphones at home for the first half. Just walk and observe.
            </p>
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span>~ 45 min</span>
              <span className="rounded-full bg-secondary px-2 py-0.5">medium</span>
            </div>
            <div className="mt-6 h-px gradient-rune opacity-40" />
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 rounded-md gradient-rune py-2 text-center text-sm font-medium text-primary-foreground">Start quest</div>
              <div className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground">Skip</div>
            </div>
          </div>
        </motion.div>

        {/* Pillars */}
        <div className="mx-auto mt-24 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            { t: "Screen-free by design", d: "Every quest is something you do in the real world. Walk. Talk. Cook. Build.", emoji: "🌿" },
            { t: "XP that actually counts", d: "Difficulty-weighted XP. Levels. Streaks. Built to be addictive in the right way.", emoji: "⚔️" },
            { t: "Adapts to you", d: "Pick your days. Pick your difficulty. Mark quests too easy or too hard — we recalibrate.", emoji: "🎯" },
          ].map((p, i) => (
            <motion.div
              key={p.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="rounded-xl border border-border/40 bg-card/30 p-6 backdrop-blur"
            >
              <div className="text-2xl">{p.emoji}</div>
              <h3 className="mt-4 font-display text-xl font-semibold">{p.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/30 py-8 text-center text-xs text-muted-foreground">
        Touch grass. Earn XP. © Side Quest
      </footer>
    </div>
  );
}
