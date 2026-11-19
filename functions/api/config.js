// GET /api/config  — configuração pública da campanha + estatísticas.

import { json, fail } from "../_lib/http.js";
import { getAllSettings } from "../_lib/settings.js";
import { computeStats, expireReservations } from "../_lib/raffle.js";

export async function onRequestGet({ env }) {
  const db = env.DB;
  if (!db) return fail("Banco de dados não configurado.", 500);

  await expireReservations(db, env.RESERVA_EXPIRA_MINUTOS);

  const settings = await getAllSettings(db);
  const stats = await computeStats(db);

  // Todos esses campos são públicos por natureza (chave PIX e WhatsApp são divulgados na campanha).
  return json({
    ok: true,
    settings,
    stats,
    reserva_expira_minutos: parseInt(env.RESERVA_EXPIRA_MINUTOS, 10) || 120,
  });
}
