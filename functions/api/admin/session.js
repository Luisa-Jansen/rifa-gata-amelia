// GET /api/admin/session  — informa se há sessão ativa e se o setup inicial já foi feito.

import { json } from "../../_lib/http.js";
import { getAdmin } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const admin = await getAdmin(request, env);
  let configured = false;
  if (env.DB) {
    const row = await env.DB.prepare("SELECT password_hash FROM admin WHERE id = 1").first();
    configured = !!(row && row.password_hash);
  }
  return json({ ok: true, authenticated: !!admin, configured });
}
