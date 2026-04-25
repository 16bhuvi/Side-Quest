import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/sidequest/Logo";
import { DAYS, DAY_LABELS, type Weekday } from "@/lib/xp";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
  head: () => ({
    meta: [{ title: "Onboarding — Side Quest" }],
  }),
});

const DIFFICULTIES = [
  { id: "easy" as const, label: "Easy", desc: "Gentle nudges. 5–15 minutes. Build the habit.", xp: "+25 XP" },
  { id: "medium" as const, label: "Medium", desc: "Real effort. 15–60 minutes. Get out of your comfort zone.", xp: "+60 XP" },
  { id: "hard" as const, label: "Hard", desc: "Significant challenges. 1+ hour. Forge yourself.", xp: "+120 XP" },
];

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [selectedDays, setSelectedDays] = useState<Weekday[]>(["mon", "wed", "fri"]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [loading, user, navigate]);

  const toggleDay = (d: Weekday) => {
    setSelectedDays((curr) => (curr.includes(d) ? curr.filter((x) => x !== d) : [...curr, d]));
  };

  const finish = async () => {
    if (!user) return;
    if (selectedDays.length === 0) {
      toast.error("Pick at least one day");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          days_per_week: daysPerWeek,
          preferred_days: selectedDays,
          difficulty,
          onboarded: true,
        }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Your path is set.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 py-12">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute left-6 top-6 z-10"><Logo /></div>

      <div className="relative z-10 mx-auto max-w-xl pt-16">
        <div className="mb-8 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 w-12 rounded-full transition-colors ${
                i <= step ? "bg-rune" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="rune-border rounded-2xl p-8 shadow-elevated"
        >
          {step === 0 && (
            <>
              <h1 className="font-display text-3xl font-semibold">How often do you want quests?</h1>
              <p className="mt-2 text-sm text-muted-foreground">Pick how many days per week.</p>
              <div className="mt-8 grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => setDaysPerWeek(n)}
                    className={`aspect-square rounded-lg border text-lg font-medium transition-all ${
                      daysPerWeek === n
                        ? "border-rune gradient-rune text-primary-foreground shadow-rune"
                        : "border-border bg-card/50 hover:border-rune/40"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="mt-8 w-full rounded-md gradient-rune py-2.5 text-sm font-medium text-primary-foreground shadow-rune"
              >
                Continue
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-display text-3xl font-semibold">Which days?</h1>
              <p className="mt-2 text-sm text-muted-foreground">Pick the days you want quests delivered.</p>
              <div className="mt-8 grid grid-cols-7 gap-2">
                {DAYS.map((d) => {
                  const active = selectedDays.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      className={`rounded-lg border py-3 text-sm font-medium transition-all ${
                        active
                          ? "border-rune gradient-rune text-primary-foreground shadow-rune"
                          : "border-border bg-card/50 hover:border-rune/40"
                      }`}
                    >
                      {DAY_LABELS[d]}
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(0)} className="rounded-md border border-border px-4 py-2.5 text-sm">
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-md gradient-rune py-2.5 text-sm font-medium text-primary-foreground shadow-rune"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-3xl font-semibold">Choose your difficulty</h1>
              <p className="mt-2 text-sm text-muted-foreground">You can adjust this anytime.</p>
              <div className="mt-8 space-y-3">
                {DIFFICULTIES.map((d) => {
                  const active = difficulty === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        active
                          ? "border-rune bg-rune/5 shadow-rune"
                          : "border-border bg-card/50 hover:border-rune/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xl font-semibold">{d.label}</span>
                        <span className="text-xs text-rune">{d.xp}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{d.desc}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(1)} className="rounded-md border border-border px-4 py-2.5 text-sm">
                  Back
                </button>
                <button
                  onClick={finish}
                  disabled={saving}
                  className="flex-1 rounded-md gradient-rune py-2.5 text-sm font-medium text-primary-foreground shadow-rune disabled:opacity-60"
                >
                  {saving ? "..." : "Receive my first quest"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
