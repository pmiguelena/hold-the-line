/* ═══════════════ TEACHING: STAFF NOTES, GLOSSARY, DEBRIEF ═══════════════ */
// Text may carry glossary links written as [[term|label]]; they become buttons that open the term's card.
const richText = str => esc(str).replace(/\[\[(\w+)\|([^\]]+)\]\]/g, (m, k, label) => `<button type="button" class="term" data-term="${k}">${label}</button>`);
const tipsToggle = () => `<button class="btn ghost small" id="tipsBtn" aria-pressed="${store.tips !== false}">${esc(g().coach.toggle)}: ${esc(store.tips !== false ? g().on : g().off)}</button>`;
const BULB = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.7.5 1.1 1.3 1.1 2.1V17h5.4v-.6c0-.8.4-1.6 1.1-2.1A6.5 6.5 0 0 0 12 2.5Z" fill="#F2B650"/><path d="M9.5 19h5M10.3 21.5h3.4" stroke="#F2B650" stroke-width="1.8" stroke-linecap="round"/></svg>`;

// Shows the first staff note in `keys` the player has not seen yet (one per screen, so systems arrive one at a time).
function coach(keys) {
  if (store.tips === false || !game) return;
  const host = $("panel").querySelector(".dlg, .decide");
  if (!host) return;
  store.tipsSeen = store.tipsSeen || {};
  const again = game.tipNow && game.tipNow.b === beatIdx && keys.includes(game.tipNow.key);   // same screen redrawn (e.g. language switch)
  const key = again ? game.tipNow.key : keys.find(k => k && !store.tipsSeen[k]);
  if (!key || !g().coach.tips[key]) return;
  store.tipsSeen[key] = 1; persist();
  game.tipNow = { key, b: beatIdx };
  const gg = g(), el = document.createElement("aside");
  el.className = "coach"; el.setAttribute("role", "note");
  el.innerHTML = `<span class="coach-ic">${BULB}</span><div class="coach-body"><b>${esc(gg.coach.label)}</b><p>${richText(gg.coach.tips[key])}</p></div>
    <div class="coach-btns"><button class="btn small" data-coach="ok">${esc(gg.coach.ok)}</button><button class="btn ghost small" data-coach="off">${esc(gg.coach.off)}</button></div>`;
  host.prepend(el);
  el.querySelector('[data-coach="ok"]').onclick = () => { game.tipNow = null; el.remove(); };
  el.querySelector('[data-coach="off"]').onclick = () => { store.tips = false; persist(); game.tipNow = null; el.remove(); };
}
function coachFor(fn, r) {
  const prep = game.prep, s = cur();
  const at = fn === newsBeat ? ["news"] : fn === frontPageBeat ? ["front"] : fn === mapBeat ? ["map", s.t >= 2 && "fog"] : fn === budgetBeat ? ["budget"]
    : fn === dilemmaBeat ? ["dilemma"] : fn === advisorsBeat ? ["advisors"]
    : fn === decideBeat ? ["decide", prep.qe && "qe", prep.qt && "qt", prep.fxTool && "fx", prep.canMacro && "macro", "fan", "board", "tone"]
    : fn === reactionBeat ? ["react", "groups"] : fn === falloutBeat ? [r.dominance && "dominance", (r.state.debt || 0) >= debtLim(game.sc.em).heat && "debt", (r.state.heat || 0) >= 40 && "heat", (r.state.lev || 0) >= 3 && "credit", "ledger"] : [];
  coach(at);
}

// Glossary: a small card over everything, opened from any [[term]] link.
function hideTerm() { const p = document.getElementById("termPop"); if (p) p.remove(); }
function showTerm(k) {
  hideTerm();
  const e = g().gloss.terms[k];
  if (!e) return;
  const p = document.createElement("div");
  p.id = "termPop"; p.className = "term-pop"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", e[0]);
  p.innerHTML = `<header><b>${esc(e[0])}</b><button type="button" class="term-x" aria-label="${esc(g().gloss.close)}">×</button></header><p>${richText(e[1])}</p>`;
  document.body.appendChild(p);
  p.querySelector(".term-x").onclick = hideTerm;
  p.querySelector(".term-x").focus();
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest(".term");
  if (b) { e.preventDefault(); e.stopPropagation(); Sound.select(); showTerm(b.dataset.term); return; }
  if (!(e.target.closest && e.target.closest(".term-pop"))) hideTerm();
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("termPop")) { e.stopImmediatePropagation(); hideTerm(); } });

function openGlossary(back) {
  if (game) cardToken = null;
  const G_ = g().gloss, terms = Object.entries(G_.terms).sort((a, b) => a[1][0].localeCompare(b[1][0], lang));
  openOverlay(`<div class="scr"><h2 class="scr-title">${esc(G_.title)}</h2><p class="credits">${esc(G_.sub)}</p>
    <dl class="gloss">${terms.map(([k, [name, def]]) => `<div id="gl-${k}"><dt>${esc(name)}</dt><dd>${richText(def)}</dd></div>`).join("")}</dl>
    <button class="btn big" id="glBack" data-hot>← ${esc(g().back)}</button></div>`);
  $("glBack").onclick = back;
}

// Debrief: your term against the rule, the decisions that mattered, and what history did.
function openDebrief(o = {}) {
  const back = o.back || (() => endLevel(true));
  const gg = g(), D = gg.debrief, t = tr(), H = game.hist, key = game.cfg.scenario;
  const R = rulePath(game.sc), data = debriefData(game.sc, game.inputs, game.reports), fed = FED_PATH[key];
  const qL = k => quarterLabel(k).replace(" ", "");
  const card = (title, keys, spec) => `<div class="chart-card"><header><h4>${esc(title)}</h4><span class="keys">${keys.map(([n, c]) => `<span style="--c:${c}">${esc(n)}</span>`).join("")}</span></header>${chartSVG(spec, qL)}</div>`;
  const rate = card(D.rateTitle, [[D.you, "#3FB68B"], [D.rule, "#9AA4BD"]], { title: D.rateTitle, series: [{ values: R.map(h => h.i), color: "#9AA4BD", dash: true }, { values: H.map(h => h.i), color: "#3FB68B", step: true }], include: [0, 5] });
  const infl = card(D.inflTitle, [[D.you, "#E5484D"], [D.rule, "#9AA4BD"]], { title: D.inflTitle, series: [{ values: R.map(h => h.pi), color: "#9AA4BD", dash: true }, { values: H.map(h => h.pi), color: "#E5484D", area: true }], band: [1, 3], include: [0, 4] });
  const hist = fed ? card(D.histChart, [[D.you, "#3FB68B"], [D.fedKey, "#F2B650"]], { title: D.histChart,
    series: [{ values: fed.map(v => v - fed[0]), color: "#F2B650", dash: true }, { values: H.map(h => h.i - H[0].i), color: "#3FB68B", step: true }], include: [-3, 3], refs: [0] }) : "";
  const moment = m => {
    const cls = m.lesson === "same" ? "" : m.lesson === "ruleLost" || m.impact > 0 ? "pos" : "neg";
    return `<article class="moment ${cls}"><header><span class="q-date">${esc(quarterLabel(m.t))}</span><span class="pill ${cls}">${esc(m.lesson === "same" ? D.impactSame : m.lesson === "ruleLost" ? D.keptJob : m.lesson === "youLost" ? D.lostJob : D.impact(m.impact))}</span></header>
      <b>${esc(D.moment(t.moveName(m.you), t.moveName(m.rule)))}</b><small>${esc(D.saw(pc(m.pi, 1), sgn(m.x, 1)))}</small>${m.overruled ? `<small>${esc(D.overruled(t.moveName(m.asked)))}</small>` : ""}
      <p>${richText(D.lessons[m.lesson] + (m.caved ? D.caved : ""))}</p></article>`;
  };
  openOverlay(`<div class="scr debrief">
    <span class="q-date">${esc(gg.levels[key][0])} · ${esc(game.cfg.seed)}</span>
    <h2 class="scr-title">${esc(D.title)}</h2>
    ${o.who || game.cfg.student ? `<p class="report-who">${esc(o.who || gg.cls.report.who(game.cfg.student, game.cfg.klass && game.cfg.klass.cl, new Date().toISOString().slice(0, 10)))}</p>` : ""}
    <p class="credits">${esc(D.sub)}</p>
    <div class="db-stats"><span>${esc(D.stats.onTarget(data.onTarget, data.N))}</span><span>${esc(D.stats.followed(data.N - data.deviations, data.N))}</span><span>${esc(D.stats.cred(Math.round(data.cred0 * 100), Math.round(data.cred1 * 100)))}</span></div>
    <div class="chart-grid db-charts">${rate}${infl}</div>
    <section class="db-sec"><span class="sec-lab">${esc(D.momentsTitle)}</span>
      ${data.moments.length ? `<div class="moments">${data.moments.map(moment).join("")}</div><p class="note">${esc(D.momentsNote)}</p>` : `<p class="note">${esc(D.noMoments)}</p>`}</section>
    ${fed ? `<section class="db-sec"><span class="sec-lab">${esc(D.histTitle)}</span><div class="db-hist">${hist}<p class="interlude">${esc(D.hist[key])}</p></div><p class="note">${esc(D.histCaveat)}</p></section>` : ""}
    <div class="btns"><button class="btn big" id="dbBack" data-hot>← ${esc(D.back)}</button><button class="btn ghost" id="dbPrint">${esc(gg.cls.report.print)}</button><button class="btn ghost" id="dbGloss">${esc(gg.gloss.title)}</button></div>
  </div>`);
  $("dbBack").onclick = back;
  $("dbPrint").onclick = () => window.print();
  $("dbGloss").onclick = () => openGlossary(() => openDebrief(o));
}
