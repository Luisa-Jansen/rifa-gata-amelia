// POST /api/reserve  — reserva os números escolhidos e cria o participante (pendente).
// Body: { name, whatsapp, numbers: number[] }

import { ok, fail, readBody } from "../_lib/http.js";
import { getSetting } from "../_lib/settings.js";
import { expireReservations, reserveNumbers } from "../_lib/raffle.js";

const MAX_POR_COMPRA = 100;

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return fail("Banco de dados não configurado.", 500);

  const body = await readBody(request);
  const name = String(body.name || "").trim().slice(0, 120);
  const whatsapp = String(body.whatsapp || "").trim().slice(0, 40);
  const numbers = Array.isArray(body.numbers) ? body.numbers : [];

  if (name.length < 2) return fail("Informe seu nome completo.");
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return fail("Informe um WhatsApp válido com DDD.");
  if (numbers.length === 0) return fail("Selecione pelo menos um número.");
  if (numbers.length > MAX_POR_COMPRA) return fail(`Máximo de ${MAX_POR_COMPRA} números por compra.`);

  await expireReservations(db, env.RESERVA_EXPIRA_MINUTOS);

  const raffle = (await getSetting(db, "raffle")) || { price_cents: 3000 };
  const priceCents = Number(raffle.price_cents || 0);

  const result = await reserveNumbers(db, { name, whatsapp, numbers, priceCents });

  if (!result.ok) {
    if (result.conflito) {
      return fail(
        "Alguns números que você escolheu acabaram de ser reservados por outra pessoa. Atualize a grade e tente novamente.",
        409,
        { conflito: result.conflito }
      );
    }
    return fail(result.error || "Não foi possível reservar os números.", 400);
  }

  await db
    .prepare(`INSERT INTO audit_log (action, detail) VALUES ('reserva', ?)`)
    .bind(`Participante #${result.participantId} reservou ${result.numbers.length} número(s): ${result.numbers.join(", ")}`)
    .run();

  return ok({
    participantId: result.participantId,
    numbers: result.numbers,
    total_cents: result.total_cents,
  });
}
