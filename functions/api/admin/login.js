// POST /api/admin/login  — autenticação do administrador, com limite de tentativas.
// Body: { password }

import { fail, readBody } from "../../_lib/http.js";
import { verifyPassword } from "../../_lib/crypto.js";
import { createSessionCookie, isSecureRequest } from "../../_lib/auth.js";

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return fail("Banco de dados não configurado.", 500);
  if (!env.SESSION_SECRET) return fail("SESSION_SECRET não configurado no servidor.", 500);

  const body = await readBody(request);
  const password = String(body.password || "");

  const admin = await db
    .prepare("SELECT password_hash, failed_count, locked_until FROM admin WHERE id = 1")
    .first();

  if (!admin || !admin.password_hash) {
    return fail("Senha ainda não configurada. Execute o setup inicial.", 409);
  }

  // Verifica bloqueio temporário.
  if (admin.locked_until) {
    const locked = await db
      .prepare("SELECT (locked_until > datetime('now')) AS ativo, locked_until FROM admin WHERE id = 1")
      .first();
    if (locked && locked.ativo) {
      return fail("Muitas tentativas. Tente novamente mais tarde.", 429);
    }
  }

  const valid = await verifyPassword(password, admin.password_hash);

  if (!valid) {
    const nextCount = (admin.failed_count || 0) + 1;
    if (nextCount >= MAX_TENTATIVAS) {
      await db
        .prepare(
          `UPDATE admin SET failed_count = ?, locked_until = datetime('now', ?) WHERE id = 1`
        )
        .bind(nextCount, `+${BLOQUEIO_MINUTOS} minutes`)
        .run();
    } else {
      await db.prepare("UPDATE admin SET failed_count = ? WHERE id = 1").bind(nextCount).run();
    }
    return fail("Senha incorreta.", 401);
  }

  // Sucesso: zera contador e emite cookie de sessão.
  await db.prepare("UPDATE admin SET failed_count = 0, locked_until = NULL WHERE id = 1").run();
  const cookie = await createSessionCookie(env, isSecureRequest(request));

  return ok({ message: "Autenticado." }, { headers: { "Set-Cookie": cookie } });
}

function ok(data, init) {
  // pequeno wrapper para incluir headers personalizados
  const headers = { "content-type": "application/json; charset=utf-8", ...(init?.headers || {}) };
  return new Response(JSON.stringify({ ok: true, ...data }), { ...init, headers });
}
