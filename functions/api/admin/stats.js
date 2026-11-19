// GET /api/admin/stats  — números do dashboard administrativo.

import { json, fail } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";
import { computeStats, expireReservations } from "../../_lib/raffle.js";

export async function onRequestGet({ request, env }) {
  const guard = await requireAdmin(request, env);
  if (guard) return guard;

  const db = env.DB;
  if (!db) return fail("Banco de dados não configurado.", 500);

  await expireReservations(db, env.RESERVA_EXPIRA_MINUTOS);
  const stats = await computeStats(db);
  return json({ ok: true, stats });
}
