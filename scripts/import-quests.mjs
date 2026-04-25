import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const rootDir = process.cwd();
const questsPath = path.join(rootDir, 'public', 'quests.json');

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const equalsIndex = line.indexOf('=');
      if (equalsIndex === -1) continue;
      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Ignore missing env files.
  }
}

await loadEnvFile(path.join(rootDir, '.env'));
await loadEnvFile(path.join(rootDir, '.env.local'));

function escapeSql(value) {
  return String(value).replaceAll("'", "''");
}

function normalizeQuest(input) {
  const title = String(input.title ?? '').trim();
  const description = String(input.description ?? '').trim();
  const category = String(input.category ?? 'general').trim() || 'general';
  const difficulty = ['easy', 'medium', 'hard'].includes(input.difficulty) ? input.difficulty : 'medium';
  const effortMinutes = Number(input.effort_minutes);

  if (!title) throw new Error('Quest title is required');
  if (!description) throw new Error(`Quest description is required for "${title}"`);
  if (!Number.isFinite(effortMinutes) || effortMinutes < 1) {
    throw new Error(`Invalid effort_minutes for "${title}"`);
  }

  return {
    title,
    description,
    effort_minutes: Math.floor(effortMinutes),
    difficulty,
    category,
    is_screen_free: input.is_screen_free !== false,
    approved: input.approved !== false,
  };
}

function buildSqlInsert(rows) {
  const values = rows
    .map(
      (row) =>
        `('${escapeSql(row.title)}', '${escapeSql(row.description)}', ${row.effort_minutes}, '${row.difficulty}', '${escapeSql(row.category)}', ${row.is_screen_free}, ${row.approved})`,
    )
    .join(',\n  ');

  return `insert into public.quests (title, description, effort_minutes, difficulty, category, is_screen_free, approved) values\n  ${values};`;
}

async function main() {
  const raw = await fs.readFile(questsPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('public/quests.json must contain an array of quests');
  }

  const quests = parsed.map(normalizeQuest);
  if (quests.length === 0) {
    console.log('No quests found in public/quests.json');
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('SUPABASE_URL or VITE_SUPABASE_URL is required');
  }

  if (!serviceRoleKey) {
    console.log('SUPABASE_SERVICE_ROLE_KEY is not set, so no database write will happen.');
    console.log('Use the SQL below in the Supabase SQL editor:');
    console.log('');
    console.log(buildSqlInsert(quests));
    return;
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await client.from('quests').insert(quests).select('id, title, difficulty');
  if (error) {
    throw error;
  }

  console.log(`Inserted ${data?.length ?? 0} quests.`);
  for (const quest of data ?? []) {
    console.log(`- ${quest.title} (${quest.difficulty})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
