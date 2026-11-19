/* Rifa Solidária da Amélia — lógica do site público */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // Ícones SVG (traço fino, herdam a cor via currentColor).
  const ICONS = {
    paw: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5.5" cy="12.5" r="1.9"/><circle cx="9.3" cy="7.8" r="1.9"/><circle cx="14.7" cy="7.8" r="1.9"/><circle cx="18.5" cy="12.5" r="1.9"/><path d="M12 12.2c-2.3 0-4.3 1.9-4.3 4 0 1.7 1.4 2.6 3 2.6.7 0 .9-.2 1.3-.2s.6.2 1.3.2c1.6 0 3-.9 3-2.6 0-2.1-2-4-4.3-4z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.3S3.5 15 3.5 8.9C3.5 6.1 5.7 4 8.3 4c1.7 0 3 .9 3.7 2.2C12.7 4.9 14 4 15.7 4c2.6 0 4.8 2.1 4.8 4.9 0 6.1-8.5 11.4-8.5 11.4z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5v1a2 2 0 0 0 0 5v1a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5v-1a2 2 0 0 0 0-5z"/><path d="M15 7v10" stroke-dasharray="1.5 2"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.4"/><path d="M6 10v4M18 10v4"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M7 4h10v4.5a5 5 0 0 1-10 0z"/><path d="M7 5.5H4V7a3 3 0 0 0 3 3M17 5.5h3V7a3 3 0 0 1-3 3"/><path d="M9.5 19h5M12 13.5V19"/></svg>',
    medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="15" r="4.5"/><path d="M8.5 11.5 6 3.5M15.5 11.5 18 3.5M9 3.5h6"/></svg>',
    ribbon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M12 12.5c2.3-2.7 3.6-4.7 3.6-6.8A3.6 3.6 0 0 0 8.4 5.7c0 2.1 1.3 4.1 3.6 6.8z"/><path d="M12 12.5 8.8 20M12 12.5 15.2 20M9.8 16.4h4.4"/></svg>',
    droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5s5.5 5.8 5.5 9.5a5.5 5.5 0 0 1-11 0C6.5 9.3 12 3.5 12 3.5z"/></svg>',
    droplets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M8 13c0 1.7 1.2 3 2.6 3s2.6-1.3 2.6-3S10.6 8.5 10.6 8.5 8 11.3 8 13z"/><path d="M15.4 4.5s2.6 2.8 2.6 4.4a2.6 2.6 0 0 1-5.2 0c0-1.6 2.6-4.4 2.6-4.4z"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M3 12h3.2l2.3-6 3.4 12 2.3-6H21"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.477-.655zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.074-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>',
  };

  const state = {
    config: null,
    numbers: [],          // [{n, status}]
    statusByN: new Map(),  // n -> status
    selected: new Set(),
    filter: "todos",
    search: "",
    price: 3000,
    pad: 3,
  };

  // ---- Utilidades ----
  function brl(cents) {
    return (Number(cents || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function padNum(n) {
    return String(n).padStart(state.pad, "0");
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function toast(msg, type = "") {
    const area = $("#toastArea");
    const t = el("div", "toast " + type, escapeHtml(msg));
    area.appendChild(t);
    setTimeout(() => t.remove(), 3800);
  }
  async function api(path, options) {
    const res = await fetch(path, { credentials: "same-origin", ...options });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) throw Object.assign(new Error(data.error || "Erro"), { data, status: res.status });
    return data;
  }

  // ---- Carregamento inicial ----
  async function load() {
    try {
      const cfg = await api("/api/config");
      state.config = cfg.settings || {};
      state.price = Number((state.config.raffle || {}).price_cents || 3000);
      state.pad = Number((state.config.raffle || {}).pad || 3);
      state.reservaMin = cfg.reserva_expira_minutos || 120;
      renderConfig(cfg);
      renderStats(cfg.stats);
    } catch (e) {
      toast("Não foi possível carregar a campanha.", "erro");
    }
    await refreshNumbers();
  }

  async function refreshNumbers() {
    try {
      const data = await api("/api/numbers");
      state.numbers = data.numbers || [];
      state.statusByN = new Map(state.numbers.map((r) => [r.n, r.status]));
      // Remove da seleção números que não estão mais disponíveis.
      for (const n of [...state.selected]) {
        if (state.statusByN.get(n) !== "disponivel") state.selected.delete(n);
      }
      renderStats(data.stats);
      renderGrid();
      renderSelection();
    } catch (e) {
      $("#numbersGrid").innerHTML = '<div class="grid-empty">Não foi possível carregar os números.</div>';
    }
  }

  // ---- Render: textos e seções ----
  function renderConfig(cfg) {
    const c = state.config;
    const campaign = c.campaign || {};
    setText("#heroL1", campaign.titleLine1);
    setText("#heroL2", campaign.titleLine2);
    setText("#heroSub", campaign.subtitle);
    setText("#ctaPrimary", campaign.ctaPrimary);
    setText("#ctaSecondary", campaign.ctaSecondary);
    setText("#closingLine", campaign.closingLine);

    // Fotos
    const photos = c.photos || {};
    if (photos.hero) $("#heroPhoto").src = photos.hero;
    const gallery = (photos.gallery && photos.gallery.length ? photos.gallery : [photos.hero]).filter(Boolean);
    const gWrap = $("#storyGallery");
    gWrap.innerHTML = "";
    gallery.slice(0, 3).forEach((src) => {
      const img = el("img");
      img.src = src; img.alt = "Amélia"; img.loading = "lazy";
      gWrap.appendChild(img);
    });

    // História
    const story = c.story || {};
    setText("#storyHeading", story.heading);
    const st = $("#storyText");
    st.innerHTML = "";
    (story.paragraphs || []).forEach((p, i) => {
      const para = el("p");
      para.innerHTML = i === 0
        ? escapeHtml(p).replace(/^Amélia/, '<span class="lead-name">Amélia</span>')
        : escapeHtml(p);
      st.appendChild(para);
    });

    // Diagnósticos
    const diag = c.diagnoses || {};
    setText("#diagHeading", diag.heading);
    setText("#diagIntro", diag.intro);
    const dg = $("#diagGrid");
    dg.innerHTML = "";
    (diag.cards || []).forEach((card) => {
      const node = el("div", "diag-card");
      const icon = diagIcon(card.icon);
      let body = "";
      if (card.items && card.items.length) {
        body = "<ul>" + card.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("") + "</ul>";
      } else {
        body = `<p>${escapeHtml(card.text || "")}</p>`;
      }
      node.innerHTML = `<h3><span class="diag-ico">${icon}</span>${escapeHtml(card.title || "")}</h3>${body}`;
      dg.appendChild(node);
    });

    // Meta
    const goal = c.goal || {};
    setText("#goalHeading", goal.heading);
    setText("#goalNote", goal.note);

    // Prêmios
    const prizes = c.prizes || {};
    setText("#prizeHeading", prizes.heading);
    const pg = $("#prizeGrid");
    pg.innerHTML = "";
    const medals = ["gold", "silver", "bronze"];
    const prizeIcons = [ICONS.trophy, ICONS.medal, ICONS.medal];
    (prizes.items || []).forEach((item, i) => {
      const node = el("div", "prize-card " + (medals[i] || ""));
      node.innerHTML = `<div class="trophy">${prizeIcons[i] || ICONS.trophy}</div>
        <div class="prize-place">${escapeHtml(item.place || "")}</div>
        <div class="prize-value">R$ ${brl(item.value_cents)}</div>`;
      pg.appendChild(node);
    });
    const total = (prizes.items || []).reduce((s, p) => s + Number(p.value_cents || 0), 0);
    setHTML("#prizeTotal", `Valor total dos prêmios: <b>R$ ${brl(total)}</b>`);

    // Resumo da rifa
    const raffle = c.raffle || {};
    $("#raffleSummary").innerHTML = `
      <div class="summary-pill">${ICONS.ticket} <span><b>${raffle.total || 0}</b> números</span></div>
      <div class="summary-pill">${ICONS.money} <span>R$ <b>${brl(raffle.price_cents)}</b> cada</span></div>
      <div class="summary-pill">${ICONS.trophy} <span>Prêmios de <b>R$ ${brl(total)}</b></span></div>`;

    // Pagamento PIX
    const pix = c.pix || {};
    setText("#pixKey", pix.key);
    setText("#pixHolder", pix.holder);
    setText("#payInstructions", pix.instructions);
    if (pix.copia_cola && pix.copia_cola.trim()) {
      $("#copiaColaWrap").style.display = "";
      $("#pixCopiaCola").value = pix.copia_cola.trim();
      renderQR(pix.copia_cola.trim());
    } else {
      $("#copiaColaWrap").style.display = "none";
    }

    // WhatsApp
    state.whatsapp = c.whatsapp || {};
    updateWhatsAppLink();

    // Transparência
    const transp = c.transparency || {};
    setText("#transpHeading", transp.heading);
    const faq = $("#faq");
    faq.innerHTML = "";
    (transp.items || []).forEach((item) => {
      const it = el("div", "faq-item");
      it.innerHTML = `<button class="faq-q">${escapeHtml(item.q)} <span class="chev">${ICONS.chevron}</span></button>
        <div class="faq-a"><p>${escapeHtml(item.a)}</p></div>`;
      it.querySelector(".faq-q").addEventListener("click", () => it.classList.toggle("open"));
      faq.appendChild(it);
    });
    const dd = $("#drawDate");
    if (transp.draw_date && transp.draw_date.trim()) {
      dd.innerHTML = `<div class="pill">${ICONS.calendar} Sorteio: <b>${escapeHtml(transp.draw_date)}</b></div>`;
    } else {
      dd.innerHTML = `<div class="pill">${ICONS.calendar} ${escapeHtml(transp.draw_date_label || "Data do sorteio a definir")}</div>`;
    }

    // Rodapé contato
    $("#footContact").innerHTML = `
      <span>PIX: <b>${escapeHtml(pix.key || "")}</b></span>
      <span>Comprovantes: <b>${escapeHtml((c.whatsapp || {}).receipt_number || "")}</b></span>`;
  }

  function renderStats(stats) {
    if (!stats) return;
    setText("#metaTarget", brl(stats.target_cents));
    setText("#metaArrecadado", brl(stats.arrecadado_cents));
    setText("#metaRestante", brl(stats.restante_cents));
    setText("#metaVendidos", stats.pago);
    setText("#metaDisponiveis", stats.disponivel);
    setText("#metaPct", stats.percent);
    $("#progressBar").style.width = stats.percent + "%";
  }

  function diagIcon(name) {
    const map = {
      ribbon: ICONS.ribbon, liver: ICONS.droplet, kidney: ICONS.droplets, intestine: ICONS.activity,
    };
    return map[name] || ICONS.paw;
  }

  function setText(sel, val) { const n = $(sel); if (n && val != null) n.textContent = val; }
  function setHTML(sel, val) { const n = $(sel); if (n && val != null) n.innerHTML = val; }

  // ---- Render: grade de números ----
  function renderGrid() {
    const grid = $("#numbersGrid");
    const frag = document.createDocumentFragment();
    let shown = 0;
    for (const { n, status } of state.numbers) {
      const isSel = state.selected.has(n);
      const effective = isSel ? "selecionado" : status;
      if (!matchesFilter(effective)) continue;
      if (state.search && !padNum(n).includes(state.search) && String(n) !== state.search) continue;
      const btn = el("button", "num " + (isSel ? "selecionado" : status));
      btn.textContent = padNum(n);
      btn.dataset.n = n;
      if (status !== "disponivel" && !isSel) btn.disabled = true;
      btn.setAttribute("aria-pressed", isSel ? "true" : "false");
      frag.appendChild(btn);
      shown++;
    }
    grid.innerHTML = "";
    if (shown === 0) {
      grid.innerHTML = '<div class="grid-empty">Nenhum número encontrado com esse filtro.</div>';
    } else {
      grid.appendChild(frag);
    }
  }

  function matchesFilter(effective) {
    if (state.filter === "todos") return true;
    return effective === state.filter;
  }

  function toggleNumber(n) {
    const status = state.statusByN.get(n);
    if (status !== "disponivel") {
      if (status === "reservado") toast("Número " + padNum(n) + " já está reservado.", "erro");
      else if (status === "pago") toast("Número " + padNum(n) + " já foi pago.", "erro");
      return;
    }
    if (state.selected.has(n)) state.selected.delete(n);
    else state.selected.add(n);
    renderGrid();
    renderSelection();
  }

  function renderSelection() {
    const bar = $("#selectionBar");
    const count = state.selected.size;
    if (count === 0) { bar.style.display = "none"; return; }
    bar.style.display = "";
    setText("#selCountBig", count);
    setText("#selTotal", brl(count * state.price));
    const list = [...state.selected].sort((a, b) => a - b).map(padNum).join(", ");
    $("#selList").textContent = "Números: " + list;
  }

  // ---- Fluxo de participação (modal) ----
  function openModal(html) {
    $("#modalBody").innerHTML = html;
    $("#modal").classList.add("open");
  }
  function closeModal() { $("#modal").classList.remove("open"); }

  function startParticipation() {
    if (state.selected.size === 0) { toast("Selecione pelo menos um número.", "erro"); return; }
    const nums = [...state.selected].sort((a, b) => a - b);
    const total = nums.length * state.price;
    $("#modalTitle").textContent = "Seus dados";
    openModal(`
      <div class="alert info">Você está reservando <b>${nums.length}</b> número(s) no valor de <b>R$ ${brl(total)}</b>.</div>
      <div class="selected-chips">${nums.map((n) => `<span class="chip">${padNum(n)}</span>`).join("")}</div>
      <form id="participantForm" style="margin-top:14px">
        <div class="field">
          <label for="pName">Nome completo</label>
          <input id="pName" name="name" required autocomplete="name" placeholder="Seu nome" />
        </div>
        <div class="field">
          <label for="pWhats">WhatsApp (com DDD)</label>
          <input id="pWhats" name="whatsapp" required inputmode="tel" placeholder="(62) 99999-9999" />
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" id="confirmReserve">
          Reservar e ir para o pagamento
        </button>
        <p style="font-size:.82rem;color:var(--texto-suave);text-align:center;margin-top:10px">
          A reserva fica guardada por ${state.reservaMin} minutos até a confirmação do pagamento.
        </p>
      </form>`);
    $("#participantForm").addEventListener("submit", submitReservation);
  }

  async function submitReservation(e) {
    e.preventDefault();
    const btn = $("#confirmReserve");
    const name = $("#pName").value.trim();
    const whatsapp = $("#pWhats").value.trim();
    const nums = [...state.selected].sort((a, b) => a - b);
    if (name.length < 2) { toast("Informe seu nome.", "erro"); return; }
    if (whatsapp.replace(/\D/g, "").length < 10) { toast("Informe um WhatsApp válido.", "erro"); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Reservando...';
    try {
      const data = await api("/api/reserve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, whatsapp, numbers: nums }),
      });
      state.lastReservation = { name, whatsapp, numbers: data.numbers, total_cents: data.total_cents };
      state.selected.clear();
      await refreshNumbers();
      showPaymentStep();
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = "Reservar e ir para o pagamento";
      if (err.status === 409 && err.data && err.data.conflito) {
        toast("Alguns números acabaram de ser reservados. Atualizamos a grade.", "erro");
        await refreshNumbers();
        closeModal();
      } else {
        toast(err.message || "Não foi possível reservar.", "erro");
      }
    }
  }

  function showPaymentStep() {
    const r = state.lastReservation;
    const c = state.config;
    const pix = c.pix || {};
    const nums = r.numbers.map(padNum).join(", ");
    const totalStr = brl(r.total_cents);

    $("#modalTitle").textContent = "Pagamento";
    const copiaCola = (pix.copia_cola || "").trim();
    openModal(`
      <div class="alert info">Reserva feita! Agora faça o PIX de <b>R$ ${totalStr}</b> e envie o comprovante.</div>
      <div class="review-row"><span>Seus números</span><b>${nums}</b></div>
      <div class="review-total"><span>Total</span><span>R$ ${totalStr}</span></div>

      <div style="margin-top:18px">
        <label style="font-weight:600;font-size:.9rem">Chave PIX</label>
        <div class="pix-key-box">
          <span class="k" id="mPixKey">${escapeHtml(pix.key || "")}</span>
          <button class="btn btn-ghost" id="mCopyKey" type="button">Copiar</button>
        </div>
        <p class="pix-holder">Titular: <b>${escapeHtml(pix.holder || "")}</b></p>
        ${copiaCola ? `
          <label style="font-weight:600;font-size:.9rem">PIX Copia e Cola</label>
          <textarea class="copia-cola" id="mCopiaCola" readonly>${escapeHtml(copiaCola)}</textarea>
          <button class="btn btn-outline btn-block" id="mCopyCC" type="button" style="margin-top:8px">Copiar código Copia e Cola</button>
          <div class="qr-wrap" id="mQr"></div>` : ""}
      </div>

      <a class="btn btn-whatsapp btn-block btn-lg" id="mSendReceipt" target="_blank" rel="noopener" style="margin-top:16px">
        <span class="btn-ico">${ICONS.whatsapp}</span> Enviar comprovante pelo WhatsApp
      </a>
      <div class="alert warn" style="margin-top:14px">O envio do comprovante não confirma o pagamento automaticamente. A organização irá verificar e marcar seus números como pagos.</div>
    `);

    $("#mCopyKey").addEventListener("click", () => copyText(pix.key, "Chave PIX copiada!"));
    if (copiaCola) {
      $("#mCopyCC").addEventListener("click", () => copyText(copiaCola, "Código copiado!"));
      renderQR(copiaCola, "#mQr");
    }
    $("#mSendReceipt").href = buildWhatsAppLink(r.name, r.numbers, r.total_cents);
  }

  // ---- PIX / WhatsApp ----
  function renderQR(text, selector) {
    const wrap = selector ? $(selector) : $("#qrWrap");
    if (!wrap || !window.QRCode) return;
    wrap.innerHTML = "";
    try {
      const canvas = document.createElement("canvas");
      window.QRCode.draw(canvas, text, { scale: 5, border: 3, dark: "#2f4a2b", light: "#ffffff" });
      canvas.style.maxWidth = "220px";
      const cap = el("p", null, '<span style="font-size:.82rem;color:var(--texto-suave)">Aponte a câmera do seu banco</span>');
      wrap.appendChild(canvas);
      wrap.appendChild(cap);
    } catch (e) {
      // QR é um extra; se falhar, o Copia e Cola continua funcionando.
      wrap.innerHTML = "";
    }
  }

  function buildWhatsAppLink(name, numbers, totalCents) {
    const w = state.whatsapp || {};
    const phone = (w.receipt_number || "").replace(/\D/g, "");
    const tpl = w.message_template || "Olá! Enviando meu comprovante da Rifa da Amélia. Números: {numeros}. Valor: R$ {valor}. Nome: {nome}.";
    const msg = tpl
      .replace("{numeros}", numbers.map(padNum).join(", "))
      .replace("{valor}", brl(totalCents))
      .replace("{nome}", name || "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  function updateWhatsAppLink() {
    // Botão geral da seção de pagamento (sem reserva específica).
    const w = state.whatsapp || {};
    const phone = (w.receipt_number || "").replace(/\D/g, "");
    const tpl = w.message_template || "";
    const msg = tpl.replace("{numeros}", "[meus números]").replace("{valor}", "[valor]").replace("{nome}", "");
    $("#sendReceipt").href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  async function copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg || "Copiado!", "ok");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast(okMsg || "Copiado!", "ok"); } catch { toast("Não foi possível copiar.", "erro"); }
      ta.remove();
    }
  }

  // ---- Eventos ----
  function bind() {
    $("#numbersGrid").addEventListener("click", (e) => {
      const btn = e.target.closest(".num");
      if (btn && !btn.disabled) toggleNumber(parseInt(btn.dataset.n, 10));
    });
    $("#filters").addEventListener("click", (e) => {
      const b = e.target.closest(".filter-btn");
      if (!b) return;
      document.querySelectorAll(".filter-btn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      state.filter = b.dataset.filter;
      renderGrid();
    });
    $("#searchNumber").addEventListener("input", (e) => {
      state.search = e.target.value.trim();
      renderGrid();
    });
    $("#clearSelection").addEventListener("click", () => {
      state.selected.clear(); renderGrid(); renderSelection();
    });
    $("#goParticipate").addEventListener("click", startParticipation);
    $("#modalClose").addEventListener("click", closeModal);
    $("#modal").addEventListener("click", (e) => { if (e.target === $("#modal")) closeModal(); });
    $("#copyPixKey").addEventListener("click", () => copyText(($("#pixKey").textContent || "").trim(), "Chave PIX copiada!"));
    $("#copyCopiaCola").addEventListener("click", () => copyText($("#pixCopiaCola").value, "Código copiado!"));

    // Menu mobile
    $("#navToggle").addEventListener("click", () => $("#navLinks").classList.toggle("open"));
    document.querySelectorAll(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => $("#navLinks").classList.remove("open"))
    );

    // Atualiza números periodicamente (reflete reservas de outras pessoas).
    setInterval(refreshNumbers, 30000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshNumbers(); });
  }

  bind();
  load();
})();
