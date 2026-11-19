// GET /api/admin/audit  — histórico de ações (últimas 200).

import { json, fail } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const guard = await requireAdmin(request, env);
  if (guard) return guard;
  if (!env.DB) return fail("Banco de dados não configurado.", 500);

  const { results } = await env.DB.prepare(
    "SELECT id, action, detail, created_at FROM audit_log ORDER BY id DESC LIMIT 200"
  ).all();
  return json({ ok: true, log: results || [] });
}
