// POST /api/admin/setup
// Cria o hash da senha do admin a partir do segredo ADMIN_PASSWORD, uma única vez.
// Só funciona enquanto ainda não existe senha definida no banco.

import { ok, fail } from "../../_lib/http.js";
import { hashPassword } from "../../_lib/crypto.js";

export async function onRequestPost({ env }) {
  const db = env.DB;
  if (!db) return fail("Banco de dados não configurado.", 500);

  const row = await db.prepare("SELECT password_hash FROM admin WHERE id = 1").first();
  if (row && row.password_hash) {
    return fail("A senha do administrador já foi configurada. Use 'Trocar senha' no painel.", 409);
  }

  const initial = env.ADMIN_PASSWORD;
  if (!initial || String(initial).length < 6) {
    return fail("Defina o segredo ADMIN_PASSWORD (mínimo 6 caracteres) antes de executar o setup.", 400);
  }

  const hash = await hashPassword(String(initial));
  await db
    .prepare("UPDATE admin SET password_hash = ?, failed_count = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = 1")
    .bind(hash)
    .run();
  await db.prepare(`INSERT INTO audit_log (action, detail) VALUES ('admin_setup', 'Senha inicial configurada')`).run();

  return ok({ message: "Senha do administrador configurada. Você já pode entrar no painel." });
}
