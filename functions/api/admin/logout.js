// POST /api/admin/logout  — encerra a sessão.

import { clearSessionCookie, isSecureRequest } from "../../_lib/auth.js";

export async function onRequestPost({ request }) {
  const cookie = clearSessionCookie(isSecureRequest(request));
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json; charset=utf-8", "Set-Cookie": cookie },
  });
}
