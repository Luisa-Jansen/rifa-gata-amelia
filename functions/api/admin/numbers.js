// POST /api/admin/numbers  — ações manuais sobre números específicos.
// Body: { action, numbers: number[], name?, whatsapp? }
//   action: "bloquear" | "desbloquear" | "liberar" | "reservar" | "pago"

import { ok, fail, readBody } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";
import { getSetting } from "../../_lib/settings.js";

export async function onRequestPost({ request, env }) {
  const guard = await requireAdmin(request, env);
  if (guard) return guard;

  const db = env.DB;
  const body = await readBody(request);
  const action = String(body.action || "");
  const nums = [...new Set((Array.isArray(body.numbers) ? body.numbers : []).map((n) => parseInt(n, 10)).filter(Number.isInteger))];
  if (nums.length === 0) return fail("Selecione pelo menos um número.");
  const ph = nums.map(() => "?").join(",");

  if (action === "bloquear") {
    await db.prepare(`UPDATE numbers SET status = 'bloqueado', participant_id = NULL, reserved_at = NULL, paid_at = NULL WHERE n IN (${ph})`).bind(...nums).run();
    await log(db, "numeros_bloqueados", nums.join(", "));
    return ok({ message: `${nums.length} número(s) bloqueado(s).` });
  }

  if (action === "desbloquear" || action === "liberar") {
    await db.prepare(`UPDATE numbers SET status = 'disponivel', participant_id = NULL, reserved_at = NULL, paid_at = NULL WHERE n IN (${ph})`).bind(...nums).run();
    await log(db, "numeros_liberados", nums.join(", "));
    return ok({ message: `${nums.length} número(s) liberado(s).` });
  }

  if (action === "reservar" || action === "pago") {
    const name = String(body.name || "").trim().slice(0, 120);
    const whatsapp = String(body.whatsapp || "").trim().slice(0, 40);
    if (name.length < 2) return fail("Informe o nome do participante.");

    // Confere disponibilidade.
    const { results: taken } = await db
      .prepare(`SELECT n FROM numbers WHERE n IN (${ph}) AND status NOT IN ('disponivel','bloqueado')`)
      .bind(...nums)
      .all();
    if (taken && taken.length) {
      return fail(`Números já ocupados: ${taken.map((t) => t.n).join(", ")}`, 409);
    }

    const raffle = (await getSetting(db, "raffle")) || { price_cents: 3000 };
    const total = nums.length * Number(raffle.price_cents || 0);
    const paid = action === "pago";

    const ins = await db
      .prepare(
        `INSERT INTO participants (name, whatsapp, total_cents, status, confirmed_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(name, whatsapp, total, paid ? "pago" : "pendente", paid ? new Date().toISOString() : null)
      .run();
    const pid = ins.meta.last_row_id;

    await db
      .prepare(
        `UPDATE numbers SET status = ?, participant_id = ?, reserved_at = datetime('now'), paid_at = NULL
         WHERE n IN (${ph})`
      )
      .bind(paid ? "pago" : "reservado", pid, ...nums)
      .run();

    if (paid) {
      await db.prepare(`UPDATE numbers SET paid_at = datetime('now') WHERE participant_id = ?`).bind(pid).run();
    }

    await log(db, paid ? "numeros_pagos_manual" : "numeros_reservados_manual", `${name}: ${nums.join(", ")}`);
    return ok({ message: `${nums.length} número(s) ${paid ? "marcados como pagos" : "reservados"} para ${name}.`, participantId: pid });
  }

  return fail("Ação desconhecida.");
}

async function log(db, action, detail) {
  await db.prepare(`INSERT INTO audit_log (action, detail) VALUES (?, ?)`).bind(action, detail).run();
}
