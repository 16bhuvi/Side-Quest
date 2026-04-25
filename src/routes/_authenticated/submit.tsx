import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/submit")({
  component: SubmitQuest,
  head: () => ({ meta: [{ title: "Submit a Quest — Side Quest" }] }),
});

const schema = z.object({
  title: z.string().trim().min(4, "Title must be 4+ characters").max(80),
  description: z.string().trim().min(10, "Description must be 10+ characters").max(300),
  effort_minutes: z.number().min(1).max(480),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string().trim().min(2).max(40),
});

function SubmitQuest() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effort, setEffort] = useState(15);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ title, description, effort_minutes: effort, difficulty, category });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const { error } = await supabase.from("quests").insert({
      ...parsed.data,
      is_screen_free: true,
      approved: false,
      created_by: user.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Quest submitted for review.");
    setTitle(""); setDescription(""); setEffort(15); setCategory("general");
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-semibold">Submit a Quest</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share a real-world challenge with the community. No screen-based tasks. Reviewed before publishing.
        </p>

        <form onSubmit={onSubmit} className="mt-8 rune-border space-y-5 rounded-2xl p-8 shadow-elevated">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required
              className="w-full rounded-md border border-border bg-input/40 px-3 py-2.5 text-sm outline-none focus:border-rune"
              placeholder="Climb the tallest hill nearby" />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} required rows={3}
              className="w-full resize-none rounded-md border border-border bg-input/40 px-3 py-2.5 text-sm outline-none focus:border-rune"
              placeholder="What does it involve? Make it specific and screen-free." />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Effort (min)">
              <input type="number" min={1} max={480} value={effort} onChange={(e) => setEffort(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-input/40 px-3 py-2.5 text-sm outline-none focus:border-rune" />
            </Field>
            <Field label="Difficulty">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="w-full rounded-md border border-border bg-input/40 px-3 py-2.5 text-sm outline-none focus:border-rune">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-border bg-input/40 px-3 py-2.5 text-sm outline-none focus:border-rune">
                {["general", "movement", "social", "mindfulness", "craft", "learning", "discipline", "health"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <button type="submit" disabled={saving}
            className="w-full rounded-md gradient-rune py-2.5 text-sm font-medium text-primary-foreground shadow-rune hover:shadow-glow disabled:opacity-60">
            {saving ? "..." : "Submit for review"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
