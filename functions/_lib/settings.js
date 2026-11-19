// Acesso às configurações editáveis (tabela settings, valores em JSON).

export async function getSetting(db, key, fallback = null) {
  const row = await db.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export async function getAllSettings(db) {
  const { results } = await db.prepare("SELECT key, value FROM settings").all();
  const out = {};
  for (const row of results || []) {
    try {
      out[row.key] = JSON.parse(row.value);
    } catch {
      out[row.key] = null;
    }
  }
  return out;
}

export async function setSetting(db, key, value) {
  const json = JSON.stringify(value);
  await db
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    )
    .bind(key, json)
    .run();
}
