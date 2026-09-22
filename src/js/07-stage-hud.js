/* ═══════════════ STAGE HELPERS ═══════════════ */
let beats = [], beatIdx = -1, typing = null, cardToken = null;
function play(list) { beats = list; beatIdx = -1; next(); }
function next() { if (typing) { typing.finish(); return; } beatIdx++; const b = beats[beatIdx]; if (b) b(); }
function rerunBeat() { const b = beats[beatIdx]; if (b) b(); }
function typeInto(el, text) {
  if (typing) typing.cancel();
  if (FAST || !text) { el.textContent = text; return; }
  let k = 0;
  const id = setInterval(() => { k += 2; el.textContent = text.slice(0, k); if (k % 8 === 0) Sound.blip(); if (k >= text.length) finish(); }, 18);
  const finish = () => { clearInterval(id); el.textContent = text; typing = null; };
  typing = { finish, cancel: () => { clearInterval(id); typing = null; } };
}
function openOverlay(html, cls = "") { const o = $("overlay"); o.className = "overlay " + cls; o.innerHTML = html; o.hidden = false; o.scrollTop = 0; }
function closeOverlay() { const o = $("overlay"); o.hidden = true; o.innerHTML = ""; }
function setCast(list = [], row = false) {
  const c = $("cast"); c.className = "cast" + (row ? " row" : "");
  c.innerHTML = list.map((p, k) => {
    if (p.prop) return `<div class="prop ${p.prop}" style="--n:${k}">${PROPS[p.prop](p.label)}</div>`;
    return `<div class="bust${p.call ? " call" : ""}" style="--n:${k}">${p.call ? `<span class="call-pill"><i></i>${esc(g().incoming)}</span>` : ""}${portraitSVG(p.id, p.mood)}</div>`;
  }).join("");
}
function tvOn(head, tag, live) {
  $("tvScreen").innerHTML = `<div class="tv-news"><div class="tv-anchor">${portraitSVG("ferro", "neutral")}</div>
    <div class="tv-bug">9 NEWS <i></i></div>
    <div class="tv-lower"><span class="tv-tag ${live ? "live" : ""}">${esc(tag)}</span><div class="tv-crawl"><span>${esc(head)}</span></div></div></div>`;
}
function tvOff() { $("tvScreen").innerHTML = ""; }
function shake() { if (FAST) return; const f = $("frame"); f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake"); }
function flash(n) { if (FAST) return; for (let k = 0; k < n; k++) setTimeout(() => { const f = document.createElement("div"); f.className = "flash"; $("frame").appendChild(f); Sound.flash(); setTimeout(() => f.remove(), 380); }, 250 + k * 320); }
function floater(anchorId, text, up) {
  const a = $(anchorId); if (!a || FAST) return;
  const fr = $("frame").getBoundingClientRect(), r = a.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "floater " + (up ? "up" : "down"); el.textContent = text;
  el.style.left = `${r.left - fr.left + 14}px`; el.style.top = `${r.bottom - fr.top - 4}px`;
  $("frame").appendChild(el); setTimeout(() => el.remove(), 1900);
}
function say(o) {
  if (typing) typing.cancel();
  if (o.cast) setCast(o.cast, o.row); else setCast(o.speaker ? [{ id: o.speaker, mood: o.mood, call: o.call }] : []);
  let name = o.name, role = o.role;
  if (o.speaker && name == null) [name, role] = speaker(o.speaker);
  const gg = g();
  $("panel").innerHTML = `<div class="dlg">
    ${name ? `<div class="who"><b>${esc(name)}</b>${role ? `<span>${esc(role)}</span>` : ""}</div>` : ""}
    ${o.pre || ""}
    <p class="dlg-text" id="dlgText"></p>
    ${o.extra || ""}
    <div class="dlg-foot">${o.skip ? `<button class="btn ghost small" id="skipBtn">${esc(gg.skip)}</button>` : "<span></span>"}<button class="btn" id="contBtn" data-hot ${o.contDisabled ? "disabled" : ""}>${esc(gg.cont)} →</button></div>
  </div>`;
  typeInto($("dlgText"), o.text || "");
  $("contBtn").onclick = () => next();
  if (o.skip) $("skipBtn").onclick = () => { if (typing) typing.cancel(); beginQuarter(); };
}

/* ═══════════════ HUD & TICKER ═══════════════ */
function renderHUD(s, prev, turn) {
  game.hud = { s, prev, turn };
  const now = s.t;
  s = seenOf(s, game.sc, now); if (prev) prev = seenOf(prev, game.sc, now);
  const gg = g(), from = prev || s;
  const miss = Math.abs(s.pi - 2);
  const piCls = s.pi < 0 || miss >= 3 ? "bad" : miss < 1 ? "good" : "warn";
  const xCls = Math.abs(s.x) < 1 ? "good" : Math.abs(s.x) < 3 ? "warn" : "bad";
  const toE = M.election - turn, H = game.hist.slice(0, now + 1).map(h => seenOf(h, game.sc, now));
  const u = 5 - 0.5 * s.x, uFrom = 5 - 0.5 * from.x, uCls = u < 6 ? "good" : u < 7.5 ? "warn" : "bad";
  const dd = drawdown(s), eqCls = dd > 20 ? "bad" : dd > 10 ? "warn" : "good", iwT = game.sc.iw ? game.sc.iw[Math.min(turn, M.turns)] : 2.5;
  const fxNow = fxRate(s), fxFrom = fxRate(from), fxDev = 100 * (fxNow / FX0 - 1);                       // above 100 means the currency has lost ground
  const fxCls = Math.abs(fxDev) < 8 ? "good" : fxDev > 20 ? "bad" : "warn";
  const resv = s.reserves ?? (game.sc.em ? 6 : 12), resvFrom = from.reserves ?? resv, resvCls = resv < 3 ? "bad" : resv < 5 ? "warn" : "good";
  const d = (a, b, dec) => prev ? `<small class="${Math.abs(a - b) < 0.005 ? "" : a > b ? "up" : "down"}">${sgn(a - b, dec)}</small>` : "";
  $("hud").innerHTML = `
    <div class="hud-row a"><div class="hud-when"><span class="hw-date">${esc(quarterLabel(turn))}${game.cfg.hard ? `<span class="hard-tag">${esc(gg.hardTag)}</span>` : ""}${game.cfg.em ? `<span class="hard-tag em">${esc(gg.econ.em)}</span>` : ""}${game.cfg.mandate === "dual" ? `<span class="hard-tag dual">${esc(gg.mandate.dualShort)}</span>` : ""}${game.cfg.career ? `<span class="hard-tag career">${esc(gg.career.tag)}</span>` : ""}</span><span class="hw-turn">${esc(gg.hudTurn(turn, M.turns))}</span><span class="pill ${toE === 0 ? "hot" : ""}">${esc(gg.hudElection(toE))}</span></div>
    <div id="hInfl"><span class="t-lab">${esc(gg.hud.infl)}</span><span class="t-val ${piCls}" title="${esc(gg.estTip)}">≈${pc(s.pi, 1)}${d(s.pi, from.pi, 1)}</span>${spark(H.map(h => h.pi), "var(--red)", 2)}</div>
    <div id="hGap"><span class="t-lab">${esc(gg.hud.gap)}</span><span class="t-val ${xCls}" title="${esc(gg.estTip)}">≈${pc(s.x, 1)}${d(s.x, from.x, 1)}</span>${spark(H.map(h => h.x), "var(--blue)", 0)}</div>
    <div id="hJobs"><span class="t-lab">${esc(gg.hud.jobs)}</span><span class="t-val ${uCls}" title="${esc(gg.estTip)}">≈${pc(u, 1)}${d(u, uFrom, 1)}</span>${spark(H.map(h => 5 - 0.5 * h.x), "var(--amber)", 5)}</div>
    <div id="hFx"><span class="t-lab">${esc(gg.hud.fx)}</span><span class="t-val ${fxCls}" title="${esc(gg.hud.fxTip)}">${fxNow.toFixed(1)}${d(fxNow, fxFrom, 1)}</span><span class="t-lab">${esc(gg.hud.fxUnit)}</span>${spark(H.map(h => fxRate(h)), "var(--amber)", FX0)}</div>
    <div id="hResv"><span class="t-lab">${esc(gg.hud.reserves)}</span><span class="t-val ${resvCls}">${resv.toFixed(1)}${d(resv, resvFrom, 1)}</span><span class="t-lab">${esc(gg.hud.months)}</span>${spark(H.map(h => h.reserves ?? (game.sc.em ? 6 : 12)), "var(--green)", 3)}</div>
    <div id="hEq"><span class="t-lab">${esc(gg.hud.stocks)}</span><span class="t-val ${eqCls}">${Math.round(s.eq || 100)}${d(s.eq || 100, from.eq || 100, 0)}</span>${spark(H.map(h => h.eq || 100), "var(--blue)", 100)}</div>
    <div><span class="t-lab">${esc(gg.hud.rate)}</span><span class="t-val">${pc(s.i)}</span><span class="t-lab">${esc(gg.hud.y10)} ${pc(s.y10 || Y10_NEUTRAL, 1)} · ${esc(gg.hud.world)} ${pc(iwT, 1)}</span></div></div>
    <div class="hud-row b">
    <div class="meter-tile" id="hCred"><div class="t-row"><span class="t-lab">${esc(gg.hud.cred)}</span><span class="t-num" data-count="${Math.round(from.cred * 100)}|${Math.round(s.cred * 100)}">${Math.round(from.cred * 100)}</span></div><div class="mbar" style="--c:var(--green)"><i style="width:${from.cred * 100}%" data-to="${s.cred * 100}"></i><em class="danger" style="left:12%"></em></div></div>
    <div class="meter-tile" id="hPop"><div class="t-row"><span class="t-lab">${esc(gg.hud.pop)}</span><span class="t-num" data-count="${Math.round(from.pop)}|${Math.round(s.pop)}">${Math.round(from.pop)}</span></div><div class="mbar" style="--c:var(--amber)"><i style="width:${from.pop}%" data-to="${s.pop}"></i><em class="danger" style="left:25%"></em><em style="left:50%"></em></div></div>
    <div class="meter-tile" id="hHeat"><div class="t-row"><span class="t-lab">${esc(gg.hud.heat)}</span><span class="t-num" data-count="${Math.round(from.heat || 0)}|${Math.round(s.heat || 0)}">${Math.round(from.heat || 0)}</span></div><div class="mbar" style="--c:var(--red)"><i style="width:${from.heat || 0}%" data-to="${s.heat || 0}"></i><em class="danger" style="left:80%"></em></div></div>
    <div class="meter-tile" id="hDebt"><div class="t-row"><span class="t-lab">${esc(gg.hud.debt)}</span><span class="t-num" data-count="${Math.round(from.debt || 0)}|${Math.round(s.debt || 0)}">${Math.round(from.debt || 0)}</span></div><div class="mbar" style="--c:var(--purple)"><i style="width:${Math.min(100, (s.debt || 0) / 1.5)}%" data-to="${Math.min(100, (s.debt || 0) / 1.5)}"></i><em class="danger" style="left:${Math.min(96, debtLim(game.sc.em).heat / 1.5)}%"></em></div></div>
    <div class="hud-btns"><button class="icon-btn" id="bMap" aria-label="${esc(gg.map.hudBtn)}" title="${esc(gg.map.hudBtn)}">${ICON.map}</button><button class="icon-btn" id="bPeople" aria-label="${esc(gg.standing.hudBtn)}" title="${esc(gg.standing.hudBtn)}">${ICON.people}</button><button class="icon-btn" id="bCharts" aria-label="${esc(gg.hud.charts)}" title="${esc(gg.hud.charts)}">${ICON.chart}</button><button class="icon-btn" id="bMenu" aria-label="${esc(gg.hud.menu)}" title="${esc(gg.hud.menu)}">${ICON.pause}</button></div></div>`;
  $("hud").hidden = false;
  const settle = () => {
    $("hud").querySelectorAll("[data-to]").forEach(i => (i.style.width = i.dataset.to + "%"));
    $("hud").querySelectorAll("[data-count]").forEach(el => {
      const [a, b] = el.dataset.count.split("|").map(Number);
      if (FAST || a === b) { el.textContent = b; return; }
      const t0 = performance.now();
      const stepF = now => { const f = Math.min(1, (now - t0) / 800); el.textContent = Math.round(a + (b - a) * (1 - (1 - f) ** 3)); if (f < 1) requestAnimationFrame(stepF); };
      requestAnimationFrame(stepF);
    });
  };
  requestAnimationFrame(() => setTimeout(settle, 40));
  $("bCharts").onclick = openCharts;
  $("bMenu").onclick = openMenu;
  $("bMap").onclick = openMap;
  $("bPeople").onclick = openPeople;
}
function pushHeadline(key, src, textFn) {
  if (game.headlines.some(h => h.key === key)) return;
  game.headlines.push({ key, src, textFn });
  renderTicker();
}
function renderTicker() {
  const t = tr(), gg = g();
  const items = game ? game.headlines.slice(-8).map(h => [t.outlets[h.src] || h.src, h.textFn()]) : gg.tickerStart.map(x => [t.outlets.wire, x]);
  if (!items.length) gg.tickerStart.forEach(x => items.push([t.outlets.wire, x]));
  const html = items.map(([src, txt]) => `<span><b>${esc(src)}</b>${esc(txt)}</span>`).join("");
  const el = $("nbMove"); el.innerHTML = html + html;
  el.style.setProperty("--dur", `${Math.max(28, items.reduce((a, [, x]) => a + x.length, 0) * 0.32)}s`);
}
function drawRoom() {
  const qIdx = game ? (game.sc.q - 1 + Math.max(0, game.hist.length - 1)) % 4 : 0;
  if ($("win").dataset.q !== String(qIdx)) { $("win").innerHTML = windowSVG(qIdx); $("win").dataset.q = qIdx; }
  if (!$("shelf").innerHTML) { $("shelf").innerHTML = shelfSVG(); $("lamp").innerHTML = LAMP_SVG; $("phone").innerHTML = PHONE_SVG; }
  $("nameplate").textContent = g().nameplate;
  const sx = game ? cur() : null;
  $("weather").className = "weather" + (sx ? (sx.x < -2 ? " rain" : sx.x > 2 ? " heat" : "") : "");
}


