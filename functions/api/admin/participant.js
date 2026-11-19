// POST /api/admin/participant  — ações sobre um participante.
// Body: { id, action, ...campos }
//   action: "confirmar" | "cancelar" | "reabrir" | "atualizar" | "excluir"

import { ok, fail, readBody } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const guard = await requireAdmin(request, env);
  if (guard) return guard;

  const db = env.DB;
  const body = await readBody(request);
  const id = parseInt(body.id, 10);
  const action = String(body.action || "");
  if (!Number.isInteger(id)) return fail("Participante inválido.");

  const p = await db.prepare("SELECT * FROM participants WHERE id = ?").bind(id).first();
  if (!p) return fail("Participante não encontrado.", 404);

  if (action === "confirmar") {
    // Marca todos os números do participante como pagos.
    await db
      .prepare(
        `UPDATE numbers SET status = 'pago', paid_at = datetime('now')
         WHERE participant_id = ? AND status IN ('reservado', 'disponivel')`
      )
      .bind(id)
      .run();
    await db
      .prepare(`UPDATE participants SET status = 'pago', confirmed_at = datetime('now') WHERE id = ?`)
      .bind(id)
      .run();
    await log(db, "pagamento_confirmado", `Participante #${id} (${p.name}) confirmado`);
    return ok({ message: "Pagamento confirmado." });
  }

  if (action === "cancelar") {
    // Libera os números e marca o participante como cancelado.
    await db
      .prepare(
        `UPDATE numbers SET status = 'disponivel', participant_id = NULL, reserved_at = NULL, paid_at = NULL
         WHERE participant_id = ?`
      )
      .bind(id)
      .run();
    await db.prepare(`UPDATE participants SET status = 'cancelado', confirmed_at = NULL WHERE id = ?`).bind(id).run();
    await log(db, "participante_cancelado", `Participante #${id} (${p.name}) cancelado; números liberados`);
    return ok({ message: "Reserva cancelada e números liberados." });
  }

  if (action === "reabrir") {
    // Volta para pendente, mantendo os números como reservados.
    await db
      .prepare(
        `UPDATE numbers SET status = 'reservado', paid_at = NULL, reserved_at = datetime('now')
         WHERE participant_id = ? AND status = 'pago'`
      )
      .bind(id)
      .run();
    await db.prepare(`UPDATE participants SET status = 'pendente', confirmed_at = NULL WHERE id = ?`).bind(id).run();
    await log(db, "participante_reaberto", `Participante #${id} (${p.name}) voltou para pendente`);
    return ok({ message: "Participante reaberto como pendente." });
  }

  if (action === "atualizar") {
    const name = body.name != null ? String(body.name).trim().slice(0, 120) : p.name;
    const whatsapp = body.whatsapp != null ? String(body.whatsapp).trim().slice(0, 40) : p.whatsapp;
    const note = body.note != null ? String(body.note).slice(0, 500) : p.note;
    if (name.length < 2) return fail("Nome inválido.");
    await db
      .prepare("UPDATE participants SET name = ?, whatsapp = ?, note = ? WHERE id = ?")
      .bind(name, whatsapp, note, id)
      .run();
    await log(db, "participante_atualizado", `Participante #${id} atualizado`);
    return ok({ message: "Participante atualizado." });
  }

  if (action === "excluir") {
    await db
      .prepare(
        `UPDATE numbers SET status = 'disponivel', participant_id = NULL, reserved_at = NULL, paid_at = NULL
         WHERE participant_id = ?`
      )
      .bind(id)
      .run();
    await db.prepare("DELETE FROM participants WHERE id = ?").bind(id).run();
    await log(db, "participante_excluido", `Participante #${id} (${p.name}) excluído; números liberados`);
    return ok({ message: "Participante excluído e números liberados." });
  }

  return fail("Ação desconhecida.");
}

async function log(db, action, detail) {
  await db.prepare(`INSERT INTO audit_log (action, detail) VALUES (?, ?)`).bind(action, detail).run();
}
