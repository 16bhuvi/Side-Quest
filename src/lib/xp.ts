// XP and level math
export const XP_BY_DIFFICULTY = { easy: 25, medium: 60, hard: 120 } as const;

// Level n requires sum from 1..n of (100 * n) total XP
// Total XP for level n: 50 * n * (n + 1)
export function levelFromXp(xp: number): number {
  // Solve 50*n*(n+1) <= xp => n = floor((-1 + sqrt(1 + xp/12.5)) / 2)
  if (xp < 100) return 1;
  const n = Math.floor((-1 + Math.sqrt(1 + xp / 12.5)) / 2);
  return Math.max(1, n);
}

export function xpForLevel(level: number): number {
  return 50 * level * (level + 1);
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const into = xp - currentLevelXp;
  const span = nextLevelXp - currentLevelXp;
  return {
    level,
    xp,
    intoLevel: into,
    spanLevel: span,
    pct: Math.min(100, Math.max(0, (into / span) * 100)),
    nextLevelXp,
  };
}

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof DAYS)[number];
export const DAY_LABELS: Record<Weekday, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

export function todayWeekday(): Weekday {
  // 0 = Sunday in JS, our enum starts mon
  const d = new Date().getDay();
  return (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as Weekday[])[d];
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}