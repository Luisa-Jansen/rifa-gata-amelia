// GET /api/admin/participants?q=&status=  — lista de participantes com seus números.

import { json, fail } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const guard = await requireAdmin(request, env);
  if (guard) return guard;

  const db = env.DB;
  if (!db) return fail("Banco de dados não configurado.", 500);

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = (url.searchParams.get("status") || "todos").trim();
  const like = `%${q}%`;

  const { results } = await db
    .prepare(
      `SELECT p.id, p.name, p.whatsapp, p.total_cents, p.status, p.note, p.created_at, p.confirmed_at,
         (SELECT GROUP_CONCAT(n) FROM numbers WHERE participant_id = p.id) AS numeros,
         (SELECT COUNT(*)        FROM numbers WHERE participant_id = p.id) AS qtd
       FROM participants p
       WHERE (?1 = '' OR p.name LIKE ?2 OR p.whatsapp LIKE ?2)
         AND (?3 = 'todos' OR p.status = ?3)
       ORDER BY p.created_at DESC`
    )
    .bind(q, like, status)
    .all();

  const participants = (results || []).map((r) => ({
    ...r,
    numeros: r.numeros
      ? r.numeros
          .split(",")
          .map((n) => parseInt(n, 10))
          .sort((a, b) => a - b)
      : [],
  }));

  return json({ ok: true, participants });
}
