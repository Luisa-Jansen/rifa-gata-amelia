// Sessão administrativa baseada em cookie HttpOnly assinado.

import { signSession, verifySession } from "./crypto.js";
import { fail } from "./http.js";

const COOKIE = "rifa_admin";

export function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export async function createSessionCookie(env, isSecure) {
  const secret = env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não configurado.");
  const token = await signSession({ sub: "admin" }, secret, 60 * 60 * 8);
  const attrs = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    "Max-Age=28800",
  ];
  if (isSecure) attrs.push("Secure");
  return attrs.join("; ");
}

export function clearSessionCookie(isSecure) {
  const attrs = [`${COOKIE}=`, "HttpOnly", "Path=/", "SameSite=Strict", "Max-Age=0"];
  if (isSecure) attrs.push("Secure");
  return attrs.join("; ");
}

// Verifica a sessão. Retorna o payload ou null.
export async function getAdmin(request, env) {
  const secret = env.SESSION_SECRET;
  if (!secret) return null;
  const token = getCookie(request, COOKIE);
  if (!token) return null;
  return verifySession(token, secret);
}

// Guarda de rota: retorna uma Response de erro se não autenticado, ou null se ok.
export async function requireAdmin(request, env) {
  const admin = await getAdmin(request, env);
  if (!admin) return fail("Não autorizado.", 401);
  return null;
}

export function isSecureRequest(request) {
  return new URL(request.url).protocol === "https:";
}
