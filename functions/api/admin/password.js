// POST /api/admin/password  — troca a senha do administrador (requer sessão).
// Body: { current, next }

import { ok, fail, readBody } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";
import { hashPassword, verifyPassword } from "../../_lib/crypto.js";

export async function onRequestPost({ request, env }) {
  const guard = await requireAdmin(request, env);
  if (guard) return guard;

  const db = env.DB;
  const body = await readBody(request);
  const current = String(body.current || "");
  const next = String(body.next || "");

  if (next.length < 8) return fail("A nova senha deve ter pelo menos 8 caracteres.");

  const row = await db.prepare("SELECT password_hash FROM admin WHERE id = 1").first();
  const valid = await verifyPassword(current, row?.password_hash);
  if (!valid) return fail("Senha atual incorreta.", 401);

  const hash = await hashPassword(next);
  await db.prepare("UPDATE admin SET password_hash = ?, updated_at = datetime('now') WHERE id = 1").bind(hash).run();
  await db.prepare(`INSERT INTO audit_log (action, detail) VALUES ('senha_alterada', 'Senha do admin alterada')`).run();

  return ok({ message: "Senha alterada com sucesso." });
}
