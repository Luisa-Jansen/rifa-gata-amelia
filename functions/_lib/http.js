// Helpers de resposta HTTP para as Functions.

export function json(data, init = {}) {
  const headers = { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) };
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function ok(data = {}) {
  return json({ ok: true, ...data });
}

export function fail(message, status = 400, extra = {}) {
  return json({ ok: false, error: message, ...extra }, { status });
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// Formata centavos como "1.234,56" (sem o "R$").
export function formatBRL(cents) {
  const v = (Number(cents || 0) / 100).toFixed(2);
  const [int, dec] = v.split(".");
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots},${dec}`;
}
