import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: Leaderboard,
  head: () => ({ meta: [{ title: "Leaderboard — Side Quest" }] }),
});

type Row = { id: string; username: string; display_name: string | null; level: number; xp: number; current_streak: number };

function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, username, display_name, level, xp, current_streak")
      .order("xp", { ascending: false })
      .limit(50)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold">The Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Top adventurers by total XP. Globally.</p>
      </div>

      <div className="rune-border overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[3rem_1fr_4rem_5rem_4rem] gap-3 border-b border-border/40 bg-card/40 px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground md:grid-cols-[3rem_1fr_5rem_6rem_5rem]">
          <div>#</div>
          <div>Adventurer</div>
          <div className="text-right">Lv</div>
          <div className="text-right">XP</div>
          <div className="text-right">Streak</div>
        </div>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No adventurers yet.</div>}
        {rows.map((r, i) => {
          const isMe = user?.id === r.id;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`grid grid-cols-[3rem_1fr_4rem_5rem_4rem] items-center gap-3 border-b border-border/20 px-5 py-3 text-sm last:border-b-0 md:grid-cols-[3rem_1fr_5rem_6rem_5rem] ${isMe ? "bg-rune/10" : ""}`}
            >
              <div className="flex items-center gap-1 text-muted-foreground">
                {i === 0 && <Crown className="h-3.5 w-3.5 text-accent" />}
                <span className={i < 3 ? "font-display text-base text-foreground" : ""}>{i + 1}</span>
              </div>
              <div className="truncate">
                <span className="font-medium">{r.display_name || r.username}</span>
                {isMe && <span className="ml-2 text-xs text-rune">you</span>}
                <div className="text-xs text-muted-foreground">@{r.username}</div>
              </div>
              <div className="text-right font-display text-lg">{r.level}</div>
              <div className="text-right text-rune">{r.xp.toLocaleString()}</div>
              <div className="text-right text-muted-foreground">{r.current_streak}d</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
