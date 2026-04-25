import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Flame, Zap, SkipForward, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth-context";
import { XP_BY_DIFFICULTY, levelProgress, todayISO } from "@/lib/xp";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Today's Quest — Side Quest" }] }),
});

type Quest = {
  id: string;
  title: string;
  description: string;
  effort_minutes: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
};

type DailyQuest = {
  id: string;
  status: "assigned" | "started" | "completed" | "skipped";
  quest_id: string;
  xp_earned: number;
  quests: Quest;
};

type Profile = {
  id: string;
  username: string;
  level: number;
  xp: number;
  current_streak: number;
  longest_streak: number;
  last_quest_date: string | null;
};

type Prefs = {
  difficulty: "easy" | "medium" | "hard";
  onboarded: boolean;
};

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [daily, setDaily] = useState<DailyQuest | null>(null);
  const [working, setWorking] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const pickRandomQuest = useCallback(
    async (difficulty: "easy" | "medium" | "hard", excludeId?: string): Promise<Quest | null> => {
      const { data, error } = await supabase
        .from("quests")
        .select("id, title, description, effort_minutes, difficulty, category")
        .eq("approved", true)
        .eq("difficulty", difficulty)
        .eq("is_screen_free", true);
      if (error || !data || data.length === 0) return null;
      const pool = excludeId ? data.filter((q) => q.id !== excludeId) : data;
      const choice = pool.length > 0 ? pool : data;
      return choice[Math.floor(Math.random() * choice.length)] as Quest;
    },
    [],
  );

  const ensureDaily = useCallback(
    async (uid: string, difficulty: "easy" | "medium" | "hard") => {
      const today = todayISO();
      const { data: existing } = await supabase
        .from("daily_quests")
        .select("id, status, quest_id, xp_earned, quests(id, title, description, effort_minutes, difficulty, category)")
        .eq("user_id", uid)
        .eq("assigned_date", today)
        .neq("status", "skipped")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing && existing.quests) {
        setDaily(existing as unknown as DailyQuest);
        return;
      }

      const quest = await pickRandomQuest(difficulty);
      if (!quest) {
        toast.error("No quests available for this difficulty");
        return;
      }
      const { data: inserted, error } = await supabase
        .from("daily_quests")
        .insert({ user_id: uid, quest_id: quest.id, assigned_date: today, status: "assigned" })
        .select("id, status, quest_id, xp_earned, quests(id, title, description, effort_minutes, difficulty, category)")
        .single();
      if (error) { toast.error(error.message); return; }
      setDaily(inserted as unknown as DailyQuest);
    },
    [pickRandomQuest],
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    const [{ data: p }, { data: pr }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_preferences").select("difficulty, onboarded").eq("user_id", user.id).maybeSingle(),
    ]);
    setProfile(p as Profile | null);
    setPrefs(pr as Prefs | null);
    if (!pr?.onboarded) {
      navigate({ to: "/onboarding" });
      return;
    }
    await ensureDaily(user.id, pr.difficulty);
    setLoading(false);
  }, [user, navigate, ensureDaily]);

  useEffect(() => { refresh(); }, [refresh]);

  const onStart = async () => {
    if (!daily) return;
    setWorking(true);
    const { error } = await supabase
      .from("daily_quests")
      .update({ status: "started", started_at: new Date().toISOString() })
      .eq("id", daily.id);
    setWorking(false);
    if (error) { toast.error(error.message); return; }
    setDaily({ ...daily, status: "started" });
    toast.success("Quest started. Go.");
  };

  const onComplete = async () => {
    if (!daily || !user || !profile) return;
    setWorking(true);
    const xp = XP_BY_DIFFICULTY[daily.quests.difficulty];

    // Update daily quest
    const { error: dqErr } = await supabase
      .from("daily_quests")
      .update({ status: "completed", xp_earned: xp, completed_at: new Date().toISOString() })
      .eq("id", daily.id);
    if (dqErr) { toast.error(dqErr.message); setWorking(false); return; }

    // Streak math
    const today = todayISO();
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    let newStreak = 1;
    if (profile.last_quest_date === today) newStreak = profile.current_streak;
    else if (profile.last_quest_date === yesterday) newStreak = profile.current_streak + 1;
    const newXp = profile.xp + xp;
    const newProgress = levelProgress(newXp);
    const longestStreak = Math.max(profile.longest_streak, newStreak);

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        xp: newXp,
        level: newProgress.level,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_quest_date: today,
      })
      .eq("id", user.id);
    if (pErr) { toast.error(pErr.message); setWorking(false); return; }

    setProfile({ ...profile, xp: newXp, level: newProgress.level, current_streak: newStreak, longest_streak: longestStreak, last_quest_date: today });
    setDaily({ ...daily, status: "completed", xp_earned: xp });
    setCelebrate(true);
    toast.success(`+${xp} XP earned!`);
    setWorking(false);
    setTimeout(() => setCelebrate(false), 3000);
  };

  const onSkip = async () => {
    if (!daily || !user || !prefs) return;
    setWorking(true);
    await supabase.from("daily_quests").update({ status: "skipped" }).eq("id", daily.id);
    setDaily(null);
    await ensureDaily(user.id, prefs.difficulty);
    setWorking(false);
    toast("New quest assigned");
  };

  const onFeedback = async (feedback: "too_easy" | "too_hard") => {
    if (!daily || !user || !prefs) return;
    await supabase.from("daily_quests").update({ feedback }).eq("id", daily.id);
    // Adapt: bump difficulty up/down
    const order = ["easy", "medium", "hard"] as const;
    const idx = order.indexOf(prefs.difficulty);
    const next = feedback === "too_easy" ? order[Math.min(2, idx + 1)] : order[Math.max(0, idx - 1)];
    if (next !== prefs.difficulty) {
      await supabase.from("user_preferences").update({ difficulty: next }).eq("user_id", user.id);
      setPrefs({ ...prefs, difficulty: next });
      toast.success(`Difficulty adjusted to ${next}`);
    } else {
      toast.success("Noted");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/2 gradient-rune animate-pulse" />
        </div>
      </div>
    );
  }

  const progress = profile ? levelProgress(profile.xp) : null;
  const isCompleted = daily?.status === "completed";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Stats strip */}
      {profile && progress && (
        <div className="mb-8 grid grid-cols-3 gap-3 text-center md:gap-4">
          <StatTile label="Level" value={progress.level.toString()} icon={<Sparkles className="h-3.5 w-3.5" />} />
          <StatTile label="Total XP" value={profile.xp.toLocaleString()} icon={<Zap className="h-3.5 w-3.5" />} accent="amber" />
          <StatTile label="Streak" value={`${profile.current_streak}d`} icon={<Flame className="h-3.5 w-3.5" />} />
        </div>
      )}

      {/* XP bar */}
      {progress && (
        <div className="mb-10">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Level {progress.level}</span>
            <span>{progress.intoLevel} / {progress.spanLevel} XP</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full gradient-rune shadow-glow"
            />
          </div>
        </div>
      )}

      {/* Quest card */}
      <AnimatePresence mode="wait">
        {daily && (
          <motion.div
            key={daily.id + daily.status}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="rune-border rounded-2xl p-8 shadow-elevated"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span>Today's quest · {daily.quests.category}</span>
              <span className="text-rune">+{XP_BY_DIFFICULTY[daily.quests.difficulty]} XP</span>
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">{daily.quests.title}</h2>
            <p className="mt-3 text-muted-foreground">{daily.quests.description}</p>
            <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-secondary px-2.5 py-1">~ {daily.quests.effort_minutes} min</span>
              <span className="rounded-full bg-secondary px-2.5 py-1 capitalize">{daily.quests.difficulty}</span>
            </div>

            <div className="mt-8 h-px gradient-rune opacity-40" />

            {!isCompleted ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {daily.status === "assigned" && (
                  <button
                    onClick={onStart}
                    disabled={working}
                    className="flex-1 rounded-md gradient-rune py-3 text-sm font-medium text-primary-foreground shadow-rune transition-all hover:shadow-glow disabled:opacity-60"
                  >
                    Start quest
                  </button>
                )}
                {daily.status === "started" && (
                  <button
                    onClick={onComplete}
                    disabled={working}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md gradient-rune py-3 text-sm font-medium text-primary-foreground shadow-rune transition-all hover:shadow-glow disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> Mark complete
                  </button>
                )}
                <button
                  onClick={onSkip}
                  disabled={working}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-60"
                >
                  <SkipForward className="h-4 w-4" /> Skip
                </button>
              </div>
            ) : (
              <div className="mt-8">
                <div className="rounded-lg border border-rune/30 bg-rune/5 p-4 text-center">
                  <div className="font-display text-xl text-rune">Quest complete</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    +{daily.xp_earned} XP earned. Return tomorrow for a new challenge.
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>How was that?</span>
                  <button onClick={() => onFeedback("too_easy")} className="rounded-full border border-border px-3 py-1 hover:border-rune/40">Too easy</button>
                  <button onClick={() => onFeedback("too_hard")} className="rounded-full border border-border px-3 py-1 hover:border-rune/40">Too hard</button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="font-display text-7xl text-rune text-glow md:text-9xl"
            >
              +{daily ? XP_BY_DIFFICULTY[daily.quests.difficulty] : 0} XP
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: "amber" }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur">
      <div className={`flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest ${accent === "amber" ? "text-accent" : "text-muted-foreground"}`}>
        {icon}{label}
      </div>
      <div className="mt-1 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}
