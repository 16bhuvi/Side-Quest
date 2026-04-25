import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Target, Calendar } from "lucide-react";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth-context";
import { levelProgress, DAY_LABELS, type Weekday } from "@/lib/xp";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Side Quest" }] }),
});

type Profile = {
  username: string;
  display_name: string | null;
  level: number;
  xp: number;
  current_streak: number;
  longest_streak: number;
};

type Prefs = {
  days_per_week: number;
  preferred_days: Weekday[];
  difficulty: "easy" | "medium" | "hard";
};

type Stat = {
  completed: number;
  skipped: number;
};

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [stats, setStats] = useState<Stat>({ completed: 0, skipped: 0 });
  const [recent, setRecent] = useState<Array<{ id: string; assigned_date: string; status: string; xp_earned: number; quests: { title: string } | null }>>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: pr }, { data: dq }] = await Promise.all([
        supabase.from("profiles").select("username, display_name, level, xp, current_streak, longest_streak").eq("id", user.id).maybeSingle(),
        supabase.from("user_preferences").select("days_per_week, preferred_days, difficulty").eq("user_id", user.id).maybeSingle(),
        supabase.from("daily_quests").select("id, assigned_date, status, xp_earned, quests(title)").eq("user_id", user.id).order("assigned_date", { ascending: false }).limit(20),
      ]);
      setProfile(p as Profile | null);
      setPrefs(pr as Prefs | null);
      const list = (dq ?? []) as typeof recent;
      setRecent(list);
      setStats({
        completed: list.filter((x) => x.status === "completed").length,
        skipped: list.filter((x) => x.status === "skipped").length,
      });
    })();
  }, [user]);

  if (!profile || !prefs) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/2 gradient-rune animate-pulse" />
        </div>
      </div>
    );
  }

  const progress = levelProgress(profile.xp);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rune-border rounded-2xl p-8 shadow-elevated">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Adventurer</div>
              <h1 className="mt-1 font-display text-4xl font-semibold">{profile.display_name || profile.username}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
            <div className="text-right">
              <div className="font-display text-5xl text-rune text-glow">Lv {progress.level}</div>
              <div className="mt-1 text-sm text-muted-foreground">{profile.xp.toLocaleString()} XP total</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Progress to Lv {progress.level + 1}</span>
              <span>{progress.intoLevel} / {progress.spanLevel}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.8 }} className="h-full gradient-rune shadow-glow" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard icon={<Flame className="h-4 w-4" />} label="Current streak" value={`${profile.current_streak}d`} />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Longest streak" value={`${profile.longest_streak}d`} />
        <StatCard icon={<Target className="h-4 w-4" />} label="Completed" value={stats.completed.toString()} />
        <StatCard icon={<Calendar className="h-4 w-4" />} label="Difficulty" value={prefs.difficulty} className="capitalize" />
      </div>

      <div className="mt-6 rune-border rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold">Your schedule</h2>
        <p className="mt-1 text-sm text-muted-foreground">{prefs.days_per_week} days a week</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["mon","tue","wed","thu","fri","sat","sun"] as Weekday[]).map((d) => {
            const active = prefs.preferred_days.includes(d);
            return (
              <span key={d} className={`rounded-full px-3 py-1 text-xs ${active ? "gradient-rune text-primary-foreground" : "border border-border text-muted-foreground"}`}>
                {DAY_LABELS[d]}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rune-border rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold">Recent quests</h2>
        <div className="mt-4 divide-y divide-border/40">
          {recent.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No quests yet. Today's the day.</div>}
          {recent.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium">{r.quests?.title ?? "Unknown"}</div>
                <div className="text-xs text-muted-foreground">{r.assigned_date}</div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className={`rounded-full px-2 py-0.5 capitalize ${
                  r.status === "completed" ? "bg-rune/20 text-rune" :
                  r.status === "skipped" ? "bg-secondary text-muted-foreground" :
                  "bg-accent/20 text-accent"
                }`}>{r.status}</span>
                {r.xp_earned > 0 && <span className="text-rune">+{r.xp_earned}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, className = "" }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">{icon}{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold ${className}`}>{value}</div>
    </div>
  );
}
