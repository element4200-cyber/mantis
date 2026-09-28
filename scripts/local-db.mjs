import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
export function localDb(filename = ':memory:') {
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true });
  const sqlite = new DatabaseSync(filename);
  // Local previews only. Production migrations are applied by Sites before deployment.
  if (!sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'token_settings'").get()) sqlite.exec(readFileSync(new URL('../drizzle/0000_glorious_madame_hydra.sql', import.meta.url), 'utf8'));
  return { prepare(sql) { const stmt = sqlite.prepare(sql); let values = []; return { bind(...args) { values = args; return this; }, async first() { return stmt.get(...values) || null; } }; } };
}
