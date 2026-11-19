// Lógica da rifa: expiração de reservas, estatísticas e reserva concorrente-segura.

import { getSetting } from "./settings.js";

// Libera números cuja reserva expirou (status reservado há mais tempo que o limite).
// O participante correspondente, se continuar pendente, é marcado como cancelado.
export async function expireReservations(db, minutes) {
  const m = Math.max(1, parseInt(minutes, 10) || 120);
  const modifier = `-${m} minutes`;

  // Participantes que terão reservas expiradas.
  const { results: expiring } = await db
    .prepare(
      `SELECT DISTINCT participant_id AS id FROM numbers
       WHERE status = 'reservado' AND reserved_at IS NOT NULL
         AND reserved_at < datetime('now', ?) AND participant_id IS NOT NULL`
    )
    .bind(modifier)
    .all();

  if (!expiring || expiring.length === 0) return 0;

  await db
    .prepare(
      `UPDATE numbers SET status = 'disponivel', participant_id = NULL, reserved_at = NULL
       WHERE status = 'reservado' AND reserved_at IS NOT NULL AND reserved_at < datetime('now', ?)`
    )
    .bind(modifier)
    .run();

  for (const p of expiring) {
    await db
      .prepare(`UPDATE participants SET status = 'cancelado' WHERE id = ? AND status = 'pendente'`)
      .bind(p.id)
      .run();
  }
  return expiring.length;
}

// Estatísticas agregadas da campanha.
export async function computeStats(db) {
  const goal = (await getSetting(db, "goal")) || { target_cents: 0 };
  const raffle = (await getSetting(db, "raffle")) || { total: 500, price_cents: 3000 };
  const prizes = (await getSetting(db, "prizes")) || { items: [] };

  const counts = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) AS disponivel,
         SUM(CASE WHEN status = 'reservado'  THEN 1 ELSE 0 END) AS reservado,
         SUM(CASE WHEN status = 'pago'       THEN 1 ELSE 0 END) AS pago,
         SUM(CASE WHEN status = 'bloqueado'  THEN 1 ELSE 0 END) AS bloqueado,
         COUNT(*) AS total
       FROM numbers`
    )
    .first();

  const price = Number(raffle.price_cents || 0);
  const paidCount = Number(counts?.pago || 0);
  const reservedCount = Number(counts?.reservado || 0);

  const arrecadadoConfirmado = paidCount * price; // apenas pagamentos confirmados
  const pendente = reservedCount * price;
  const target = Number(goal.target_cents || 0);
  const prizesTotal = (prizes.items || []).reduce((s, p) => s + Number(p.value_cents || 0), 0);

  const participantsCount = await db
    .prepare(`SELECT COUNT(*) AS c FROM participants WHERE status != 'cancelado'`)
    .first();

  return {
    total: Number(counts?.total || 0),
    disponivel: Number(counts?.disponivel || 0),
    reservado: reservedCount,
    pago: paidCount,
    bloqueado: Number(counts?.bloqueado || 0),
    price_cents: price,
    arrecadado_cents: arrecadadoConfirmado,
    pendente_cents: pendente,
    target_cents: target,
    restante_cents: Math.max(0, target - arrecadadoConfirmado),
    percent: target > 0 ? Math.min(100, Math.round((arrecadadoConfirmado / target) * 100)) : 0,
    prizes_total_cents: prizesTotal,
    saldo_estimado_cents: arrecadadoConfirmado - prizesTotal,
    participantes: Number(participantsCount?.c || 0),
  };
}

// Reserva um conjunto de números de forma concorrente-segura.
// Retorna { ok, participantId } ou { ok:false, conflito:[...] }.
export async function reserveNumbers(db, { name, whatsapp, numbers, priceCents }) {
  const nums = [...new Set(numbers.map((n) => parseInt(n, 10)).filter((n) => Number.isInteger(n) && n > 0))];
  if (nums.length === 0) return { ok: false, error: "Nenhum número válido selecionado." };

  const total = nums.length * Number(priceCents || 0);

  // Cria o participante (pendente).
  const inserted = await db
    .prepare(
      `INSERT INTO participants (name, whatsapp, total_cents, status) VALUES (?, ?, ?, 'pendente')`
    )
    .bind(name, whatsapp, total)
    .run();
  const participantId = inserted.meta.last_row_id;

  // Reserva apenas os números ainda disponíveis (guarda atômica por statement).
  const placeholders = nums.map(() => "?").join(",");
  const upd = await db
    .prepare(
      `UPDATE numbers SET status = 'reservado', participant_id = ?, reserved_at = datetime('now')
       WHERE n IN (${placeholders}) AND status = 'disponivel'`
    )
    .bind(participantId, ...nums)
    .run();

  const changed = upd.meta.changes || 0;
  if (changed !== nums.length) {
    // Conflito: algum número já havia sido pego. Desfaz esta reserva parcial.
    await db
      .prepare(
        `UPDATE numbers SET status = 'disponivel', participant_id = NULL, reserved_at = NULL
         WHERE participant_id = ? AND status = 'reservado'`
      )
      .bind(participantId)
      .run();
    await db.prepare(`DELETE FROM participants WHERE id = ?`).bind(participantId).run();

    // Descobre quais números não estão mais disponíveis.
    const { results } = await db
      .prepare(`SELECT n FROM numbers WHERE n IN (${placeholders}) AND status != 'disponivel'`)
      .bind(...nums)
      .all();
    return { ok: false, conflito: (results || []).map((r) => r.n) };
  }

  return { ok: true, participantId, total_cents: total, numbers: nums };
}
