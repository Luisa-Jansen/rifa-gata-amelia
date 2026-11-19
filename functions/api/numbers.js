// GET /api/numbers  — estado de todos os números + estatísticas.

import { json, fail } from "../_lib/http.js";
import { computeStats, expireReservations } from "../_lib/raffle.js";

export async function onRequestGet({ env }) {
  const db = env.DB;
  if (!db) return fail("Banco de dados não configurado.", 500);

  await expireReservations(db, env.RESERVA_EXPIRA_MINUTOS);

  const { results } = await db.prepare("SELECT n, status FROM numbers ORDER BY n").all();
  const stats = await computeStats(db);

  return json(
    { ok: true, numbers: results || [], stats },
    { headers: { "cache-control": "no-store" } }
  );
}
