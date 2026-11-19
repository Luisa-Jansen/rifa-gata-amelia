// GET  /api/admin/settings          — todas as configurações.
// PUT  /api/admin/settings          — atualiza uma chave. Body: { key, value }

import { ok, json, fail, readBody } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";
import { getAllSettings, setSetting } from "../../_lib/settings.js";

const CHAVES_VALIDAS = new Set([
  "campaign",
  "story",
  "diagnoses",
  "goal",
  "prizes",
  "raffle",
  "pix",
  "whatsapp",
  "transparency",
  "photos",
]);

export async function onRequestGet({ request, env }) {
  const guard = await requireAdmin(request, env);
  if (guard) return guard;
  const settings = await getAllSettings(env.DB);
  return json({ ok: true, settings });
}

export async function onRequestPut({ request, env }) {
  const guard = await requireAdmin(request, env);
  if (guard) return guard;

  const db = env.DB;
  const body = await readBody(request);
  const key = String(body.key || "");
  const value = body.value;

  if (!CHAVES_VALIDAS.has(key)) return fail("Chave de configuração inválida.");
  if (value === undefined || value === null || typeof value !== "object") {
    return fail("Valor inválido.");
  }

  // Caso especial: alterar a quantidade de números ajusta a grade.
  if (key === "raffle") {
    const total = parseInt(value.total, 10);
    if (!Number.isInteger(total) || total < 1 || total > 100000) {
      return fail("Quantidade de números inválida (1 a 100000).");
    }
    const r = await adjustGrid(db, total);
    if (r.error) return fail(r.error, 409);
  }

  await setSetting(db, key, value);
  await db.prepare(`INSERT INTO audit_log (action, detail) VALUES ('config_alterada', ?)`).bind(`Chave: ${key}`).run();
  return ok({ message: "Configuração salva." });
}

// Ajusta a tabela de números para o novo total (sem apagar números já vendidos/reservados).
async function adjustGrid(db, total) {
  const cur = await db.prepare("SELECT MAX(n) AS max, COUNT(*) AS c FROM numbers").first();
  const currentMax = Number(cur?.max || 0);

  if (total > currentMax) {
    // Adiciona os números que faltam.
    await db
      .prepare(
        `INSERT OR IGNORE INTO numbers (n, status)
         WITH RECURSIVE seq(n) AS (
           SELECT ?1 UNION ALL SELECT n + 1 FROM seq WHERE n < ?2
         )
         SELECT n, 'disponivel' FROM seq`
      )
      .bind(currentMax + 1, total)
      .run();
  } else if (total < currentMax) {
    // Só remove números acima do novo total se estiverem livres.
    const ocupados = await db
      .prepare(`SELECT COUNT(*) AS c FROM numbers WHERE n > ? AND status NOT IN ('disponivel','bloqueado')`)
      .bind(total)
      .first();
    if (Number(ocupados?.c || 0) > 0) {
      return { error: "Não é possível reduzir: existem números vendidos/reservados acima do novo total." };
    }
    await db.prepare(`DELETE FROM numbers WHERE n > ?`).bind(total).run();
  }
  return { ok: true };
}
