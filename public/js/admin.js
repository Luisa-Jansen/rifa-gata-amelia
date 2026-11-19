/* Painel administrativo — Rifa da Amélia */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function toast(msg, type = "") {
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.textContent = msg;
    $("#toastArea").appendChild(t);
    setTimeout(() => t.remove(), 3800);
  }
  function brl(cents) {
    return (Number(cents || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function moneyToCents(str) {
    if (typeof str === "number") return Math.round(str * 100);
    let s = String(str).trim().replace(/[R$\s.]/g, "").replace(",", ".");
    const v = parseFloat(s);
    return Number.isFinite(v) ? Math.round(v * 100) : 0;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function pad(n, p) { return String(n).padStart(p || 3, "0"); }

  async function api(path, options) {
    const res = await fetch(path, { credentials: "same-origin", headers: { "content-type": "application/json" }, ...options });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) throw Object.assign(new Error(data.error || "Erro"), { data, status: res.status });
    return data;
  }

  const state = { settings: {}, numbers: [], numSel: new Set(), pad: 3 };

  // ---------- Autenticação ----------
  async function init() {
    try {
      const s = await api("/api/admin/session");
      if (s.authenticated) return showPanel();
      $("#authScreen").style.display = "";
      if (!s.configured) {
        $("#loginBox").style.display = "none";
        $("#setupBox").style.display = "";
        $("#authSub").textContent = "Configure a senha inicial para começar.";
      }
    } catch {
      $("#authScreen").style.display = "";
    }
  }

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#loginBtn");
    btn.disabled = true; btn.textContent = "Entrando...";
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: $("#loginPass").value }) });
      showPanel();
    } catch (err) {
      toast(err.message || "Falha no login.", "erro");
      btn.disabled = false; btn.textContent = "Entrar";
    }
  });

  $("#setupBtn").addEventListener("click", async () => {
    try {
      const r = await api("/api/admin/setup", { method: "POST" });
      toast(r.message || "Senha configurada.", "ok");
      $("#loginBox").style.display = "";
      $("#setupBox").style.display = "none";
      $("#authSub").textContent = "Entre para gerenciar a campanha.";
    } catch (err) {
      toast(err.message || "Não foi possível configurar.", "erro");
    }
  });

  $("#logoutBtn").addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    location.reload();
  });

  function showPanel() {
    $("#authScreen").style.display = "none";
    $("#panel").style.display = "";
    loadDashboard();
    loadConfig();
  }

  // ---------- Abas ----------
  $$(".tab-btn").forEach((b) =>
    b.addEventListener("click", () => {
      $$(".tab-btn").forEach((x) => x.classList.remove("active"));
      $$(".tab-panel").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      const tab = b.dataset.tab;
      $(`.tab-panel[data-panel="${tab}"]`).classList.add("active");
      if (tab === "dashboard") loadDashboard();
      if (tab === "numeros") loadAdminNumbers();
      if (tab === "participantes") loadParticipants();
      if (tab === "historico") loadAudit();
    })
  );

  // ---------- Dashboard ----------
  async function loadDashboard() {
    try {
      const { stats } = await api("/api/admin/stats");
      const cards = [
        { label: "Arrecadado (confirmado)", value: "R$ " + brl(stats.arrecadado_cents), accent: true },
        { label: "Pendente (reservado)", value: "R$ " + brl(stats.pendente_cents) },
        { label: "Meta", value: "R$ " + brl(stats.target_cents) },
        { label: "Falta para a meta", value: "R$ " + brl(stats.restante_cents) },
        { label: "Números vendidos", value: stats.pago },
        { label: "Reservados", value: stats.reservado },
        { label: "Disponíveis", value: stats.disponivel },
        { label: "Bloqueados", value: stats.bloqueado },
        { label: "Participantes", value: stats.participantes },
        { label: "Total de prêmios", value: "R$ " + brl(stats.prizes_total_cents) },
        { label: "Saldo estimado após prêmios", value: "R$ " + brl(stats.saldo_estimado_cents) },
      ];
      $("#statGrid").innerHTML = cards
        .map((c) => `<div class="stat-card ${c.accent ? "accent" : ""}"><div class="label">${esc(c.label)}</div><div class="value">${esc(c.value)}</div></div>`)
        .join("");
      $("#adminProgress").style.width = stats.percent + "%";
      $("#adminProgressText").textContent = `${stats.percent}% da meta atingida · ${stats.pago} de ${stats.total} números pagos.`;
    } catch (err) {
      toast(err.message || "Erro ao carregar dashboard.", "erro");
    }
  }

  // ---------- Números ----------
  async function loadAdminNumbers() {
    try {
      const data = await api("/api/numbers");
      state.numbers = data.numbers || [];
      state.pad = Number((state.settings.raffle || {}).pad || 3);
      renderAdminNumbers();
    } catch (err) {
      toast("Erro ao carregar números.", "erro");
    }
  }
  function renderAdminNumbers() {
    const q = ($("#adminNumSearch").value || "").trim();
    const grid = $("#adminNumGrid");
    grid.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const { n, status } of state.numbers) {
      if (q && !pad(n, state.pad).includes(q) && String(n) !== q) continue;
      const b = document.createElement("button");
      b.className = "num-admin " + status + (state.numSel.has(n) ? " sel" : "");
      b.textContent = pad(n, state.pad);
      b.dataset.n = n;
      frag.appendChild(b);
    }
    grid.appendChild(frag);
    $("#adminNumSelCount").textContent = state.numSel.size + " selecionado(s)";
  }
  $("#adminNumGrid").addEventListener("click", (e) => {
    const b = e.target.closest(".num-admin");
    if (!b) return;
    const n = parseInt(b.dataset.n, 10);
    if (state.numSel.has(n)) state.numSel.delete(n); else state.numSel.add(n);
    renderAdminNumbers();
  });
  $("#adminNumSearch").addEventListener("input", renderAdminNumbers);
  $("#adminNumClear").addEventListener("click", () => { state.numSel.clear(); renderAdminNumbers(); });

  $$("[data-numaction]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const action = btn.dataset.numaction;
      const numbers = [...state.numSel];
      if (numbers.length === 0) return toast("Selecione ao menos um número.", "erro");
      const body = { action, numbers };
      if (action === "reservar" || action === "pago") {
        body.name = $("#adminNumName").value.trim();
        body.whatsapp = $("#adminNumWhats").value.trim();
        if (body.name.length < 2) return toast("Informe o nome do participante.", "erro");
      } else {
        if (!confirm(`Confirmar "${action}" em ${numbers.length} número(s)?`)) return;
      }
      try {
        const r = await api("/api/admin/numbers", { method: "POST", body: JSON.stringify(body) });
        toast(r.message || "Feito.", "ok");
        state.numSel.clear();
        $("#adminNumName").value = ""; $("#adminNumWhats").value = "";
        await loadAdminNumbers();
      } catch (err) {
        toast(err.message || "Erro na ação.", "erro");
      }
    })
  );

  // ---------- Participantes ----------
  let lastParticipants = [];
  async function loadParticipants() {
    try {
      const q = encodeURIComponent($("#partSearch").value.trim());
      const status = $("#partStatus").value;
      const data = await api(`/api/admin/participants?q=${q}&status=${status}`);
      lastParticipants = data.participants || [];
      renderParticipants(lastParticipants);
    } catch (err) {
      toast("Erro ao carregar participantes.", "erro");
    }
  }
  function renderParticipants(list) {
    const body = $("#partBody");
    if (!list.length) { body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--texto-suave)">Nenhum participante.</td></tr>'; return; }
    body.innerHTML = list
      .map((p) => {
        const nums = p.numeros.map((n) => pad(n, state.pad)).join(", ");
        const when = (p.created_at || "").replace("T", " ").slice(0, 16);
        const acts = [];
        if (p.status !== "pago") acts.push(`<button class="mini-btn ok" data-act="confirmar" data-id="${p.id}">Confirmar</button>`);
        if (p.status === "pago") acts.push(`<button class="mini-btn" data-act="reabrir" data-id="${p.id}">Reabrir</button>`);
        if (p.status !== "cancelado") acts.push(`<button class="mini-btn" data-act="cancelar" data-id="${p.id}">Cancelar</button>`);
        acts.push(`<button class="mini-btn" data-act="editar" data-id="${p.id}">Editar</button>`);
        acts.push(`<button class="mini-btn danger" data-act="excluir" data-id="${p.id}">Excluir</button>`);
        return `<tr>
          <td>${esc(p.name)}</td>
          <td>${esc(p.whatsapp)}</td>
          <td style="white-space:normal;max-width:260px">${esc(nums)}</td>
          <td>${p.qtd}</td>
          <td>R$ ${brl(p.total_cents)}</td>
          <td><span class="badge ${esc(p.status)}">${esc(p.status)}</span></td>
          <td>${esc(when)}</td>
          <td><div class="row-actions">${acts.join("")}</div></td>
        </tr>`;
      })
      .join("");
  }
  $("#partBody").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    const act = btn.dataset.act;
    if (act === "editar") return editParticipant(id);
    const labels = { confirmar: "confirmar o pagamento", cancelar: "cancelar (libera os números)", reabrir: "reabrir como pendente", excluir: "excluir (libera os números)" };
    if (!confirm(`Deseja ${labels[act]} deste participante?`)) return;
    try {
      const r = await api("/api/admin/participant", { method: "POST", body: JSON.stringify({ id, action: act }) });
      toast(r.message || "Feito.", "ok");
      loadParticipants();
      loadDashboard();
    } catch (err) {
      toast(err.message || "Erro.", "erro");
    }
  });
  function editParticipant(id) {
    const p = lastParticipants.find((x) => x.id === id);
    if (!p) return;
    const name = prompt("Nome:", p.name);
    if (name === null) return;
    const whatsapp = prompt("WhatsApp:", p.whatsapp);
    if (whatsapp === null) return;
    const note = prompt("Observação:", p.note || "");
    api("/api/admin/participant", { method: "POST", body: JSON.stringify({ id, action: "atualizar", name, whatsapp, note: note || "" }) })
      .then((r) => { toast(r.message || "Atualizado.", "ok"); loadParticipants(); })
      .catch((err) => toast(err.message || "Erro.", "erro"));
  }
  $("#partRefresh").addEventListener("click", loadParticipants);
  $("#partSearch").addEventListener("input", debounce(loadParticipants, 300));
  $("#partStatus").addEventListener("change", loadParticipants);
  $("#partExport").addEventListener("click", exportCSV);

  function exportCSV() {
    const rows = [["Nome", "WhatsApp", "Numeros", "Quantidade", "Valor", "Status", "Reserva", "Confirmacao"]];
    for (const p of lastParticipants) {
      rows.push([
        p.name, p.whatsapp, p.numeros.map((n) => pad(n, state.pad)).join(" "),
        p.qtd, brl(p.total_cents), p.status, p.created_at || "", p.confirmed_at || "",
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "participantes-rifa-amelia.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---------- Histórico ----------
  async function loadAudit() {
    try {
      const { log } = await api("/api/admin/audit");
      $("#auditList").innerHTML = (log || [])
        .map((l) => `<div class="audit-item"><b>${esc(l.action)}</b> — ${esc(l.detail || "")}<div class="when">${esc((l.created_at || "").replace("T", " "))}</div></div>`)
        .join("") || '<p style="color:var(--texto-suave)">Sem registros ainda.</p>';
    } catch (err) {
      toast("Erro ao carregar histórico.", "erro");
    }
  }

  // ---------- Senha ----------
  $("#passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const r = await api("/api/admin/password", { method: "POST", body: JSON.stringify({ current: $("#curPass").value, next: $("#newPass").value }) });
      toast(r.message || "Senha alterada.", "ok");
      $("#curPass").value = ""; $("#newPass").value = "";
    } catch (err) {
      toast(err.message || "Erro ao trocar senha.", "erro");
    }
  });

  // ---------- Configurações ----------
  async function loadConfig() {
    try {
      const { settings } = await api("/api/admin/settings");
      state.settings = settings || {};
      buildConfigForms();
    } catch (err) {
      toast("Erro ao carregar configurações.", "erro");
    }
  }

  function saveKey(key, value) {
    return api("/api/admin/settings", { method: "PUT", body: JSON.stringify({ key, value }) })
      .then((r) => { toast(r.message || "Salvo.", "ok"); loadDashboard(); })
      .catch((err) => toast(err.message || "Erro ao salvar.", "erro"));
  }

  function field(label, id, value, opts = {}) {
    const type = opts.textarea ? "textarea" : "input";
    const input = opts.textarea
      ? `<textarea id="${id}">${esc(value)}</textarea>`
      : `<input id="${id}" type="${opts.type || "text"}" value="${esc(value)}" />`;
    return `<div class="cfg-field"><label for="${id}">${esc(label)}</label>${input}${opts.hint ? `<div class="cfg-hint">${esc(opts.hint)}</div>` : ""}</div>`;
  }
  function group(title, inner, onSave) {
    const wrap = document.createElement("div");
    wrap.className = "cfg-group card";
    wrap.innerHTML = `<h3>${esc(title)}</h3>${inner}<button class="btn btn-primary" style="margin-top:8px">Salvar ${esc(title)}</button>`;
    wrap.querySelector("button").addEventListener("click", onSave);
    return wrap;
  }
  const val = (id) => { const n = document.getElementById(id); return n ? n.value : ""; };
  const lines = (id) => val(id).split("\n").map((s) => s.trim()).filter(Boolean);

  function buildConfigForms() {
    const c = state.settings;
    const root = $("#configForms");
    root.innerHTML = "";

    // Campanha
    const camp = c.campaign || {};
    root.appendChild(group("Campanha",
      field("Título (linha 1)", "c_t1", camp.titleLine1) +
      field("Título (linha 2)", "c_t2", camp.titleLine2) +
      field("Subtítulo", "c_sub", camp.subtitle, { textarea: true }) +
      field("Botão principal (texto)", "c_cta1", camp.ctaPrimary) +
      field("Botão secundário (texto)", "c_cta2", camp.ctaSecondary) +
      field("Frase de encerramento", "c_close", camp.closingLine, { textarea: true }),
      () => saveKey("campaign", {
        titleLine1: val("c_t1"), titleLine2: val("c_t2"), subtitle: val("c_sub"),
        ctaPrimary: val("c_cta1"), ctaSecondary: val("c_cta2"), closingLine: val("c_close"),
      })
    ));

    // História
    const story = c.story || {};
    root.appendChild(group("História da Amélia",
      field("Título da seção", "s_h", story.heading) +
      field("Parágrafos (um por linha)", "s_p", (story.paragraphs || []).join("\n"), { textarea: true }),
      () => saveKey("story", { heading: val("s_h"), paragraphs: lines("s_p") })
    ));

    // Diagnósticos
    const diag = c.diagnoses || {};
    let diagCards = "";
    (diag.cards || []).forEach((card, i) => {
      diagCards += `<div style="border:1px solid var(--borda);border-radius:10px;padding:12px;margin-bottom:10px">
        ${field("Título", "d_t_" + i, card.title)}
        ${field("Ícone (ribbon/liver/kidney/intestine)", "d_i_" + i, card.icon)}
        ${field("Texto (deixe vazio se usar lista)", "d_x_" + i, card.text || "", { textarea: true })}
        ${field("Itens de lista (um por linha)", "d_l_" + i, (card.items || []).join("\n"), { textarea: true })}
      </div>`;
    });
    root.appendChild(group("Diagnósticos exibidos",
      field("Título", "d_h", diag.heading) +
      field("Introdução", "d_intro", diag.intro, { textarea: true }) +
      diagCards,
      () => {
        const cards = (diag.cards || []).map((_, i) => {
          const items = lines("d_l_" + i);
          const text = val("d_x_" + i).trim();
          const card = { title: val("d_t_" + i), icon: val("d_i_" + i) };
          if (items.length) card.items = items; else card.text = text;
          return card;
        });
        saveKey("diagnoses", { heading: val("d_h"), intro: val("d_intro"), cards });
      }
    ));

    // Meta
    const goal = c.goal || {};
    root.appendChild(group("Meta financeira",
      field("Título", "g_h", goal.heading) +
      field("Valor da meta (R$)", "g_t", brl(goal.target_cents), { hint: "Ex.: 15000,00" }) +
      field("Observação", "g_n", goal.note, { textarea: true }),
      () => saveKey("goal", { heading: val("g_h"), target_cents: moneyToCents(val("g_t")), note: val("g_n") })
    ));

    // Prêmios
    const prizes = c.prizes || {};
    let prizeRows = "";
    [0, 1, 2].forEach((i) => {
      const it = (prizes.items || [])[i] || {};
      prizeRows += `<div class="two-col">${field("Prêmio " + (i + 1) + " (rótulo)", "pz_p_" + i, it.place || "")}${field("Valor (R$)", "pz_v_" + i, it.value_cents != null ? brl(it.value_cents) : "")}</div>`;
    });
    root.appendChild(group("Premiação",
      prizeRows + field("Observação", "pz_n", prizes.note, { textarea: true }),
      () => {
        const items = [0, 1, 2].map((i) => ({ place: val("pz_p_" + i), value_cents: moneyToCents(val("pz_v_" + i)) })).filter((x) => x.place);
        saveKey("prizes", { heading: prizes.heading || "PRÊMIOS DA RIFA", items, note: val("pz_n") });
      }
    ));

    // Rifa (números)
    const raffle = c.raffle || {};
    root.appendChild(group("Números da rifa",
      `<div class="two-col">${field("Quantidade de números", "r_total", raffle.total, { type: "number", hint: "Cuidado: alterar afeta a grade." })}${field("Valor por número (R$)", "r_price", brl(raffle.price_cents))}</div>` +
      field("Dígitos (zeros à esquerda)", "r_pad", raffle.pad || 3, { type: "number" }),
      () => saveKey("raffle", { total: parseInt(val("r_total"), 10), price_cents: moneyToCents(val("r_price")), pad: parseInt(val("r_pad"), 10) || 3 })
    ));

    // PIX
    const pix = c.pix || {};
    root.appendChild(group("PIX",
      field("Chave PIX", "px_k", pix.key) +
      field("Titular", "px_h", pix.holder) +
      field("PIX Copia e Cola (código do banco)", "px_cc", pix.copia_cola, { textarea: true, hint: "Cole aqui o código Copia e Cola gerado pelo seu banco. O QR Code é gerado a partir dele." }) +
      field("Instruções de pagamento", "px_i", pix.instructions, { textarea: true }),
      () => saveKey("pix", { key: val("px_k"), holder: val("px_h"), copia_cola: val("px_cc"), instructions: val("px_i") })
    ));

    // WhatsApp
    const wa = c.whatsapp || {};
    root.appendChild(group("WhatsApp de comprovantes",
      field("Número para envio", "wa_n", wa.receipt_number) +
      field("Mensagem automática", "wa_m", wa.message_template, { textarea: true, hint: "Use {numeros}, {valor} e {nome} como marcadores." }),
      () => saveKey("whatsapp", { receipt_number: val("wa_n"), message_template: val("wa_m") })
    ));

    // Transparência
    const tr = c.transparency || {};
    let trRows = "";
    (tr.items || []).forEach((it, i) => {
      trRows += `<div style="border:1px solid var(--borda);border-radius:10px;padding:12px;margin-bottom:10px">${field("Pergunta " + (i + 1), "tr_q_" + i, it.q)}${field("Resposta", "tr_a_" + i, it.a, { textarea: true })}</div>`;
    });
    root.appendChild(group("Transparência",
      field("Título", "tr_h", tr.heading) + trRows +
      field("Data do sorteio (texto livre)", "tr_d", tr.draw_date, { hint: "Deixe vazio enquanto não houver data. Não invente data." }) +
      field("Texto quando sem data", "tr_dl", tr.draw_date_label),
      () => {
        const items = (tr.items || []).map((_, i) => ({ q: val("tr_q_" + i), a: val("tr_a_" + i) }));
        saveKey("transparency", { heading: val("tr_h"), items, draw_date: val("tr_d"), draw_date_label: val("tr_dl") });
      }
    ));

    // Fotos
    const photos = c.photos || {};
    root.appendChild(group("Fotografias",
      field("Foto principal (URL)", "ph_hero", photos.hero, { hint: "Ex.: /img/amelia-2.jpeg" }) +
      field("Galeria (uma URL por linha)", "ph_g", (photos.gallery || []).join("\n"), { textarea: true }),
      () => saveKey("photos", { hero: val("ph_hero"), gallery: lines("ph_g") })
    ));
  }

  function debounce(fn, ms) {
    let t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  init();
})();
