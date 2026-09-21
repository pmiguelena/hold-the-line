# One-off source patch: save/continue, data fog with revisions, staff forecast fan chart.
import os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'src')
def patch(rel, pairs):
    p = os.path.join(ROOT, rel)
    s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        c = s.count(old)
        assert c == 1, (rel, c, old[:80])
        s = s.replace(old, new)
    open(p, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', rel)

# ───────── model: fog, forecast, save ─────────
patch('js/05-game-model.js', [
('''  while (sc.noiseS.length < n) sc.noiseS.push(gauss(rng) * M.sdS);''',
'''  while (sc.noiseS.length < n) sc.noiseS.push(gauss(rng) * M.sdS);
  const frng = rngFrom("fog:" + sc.key + ":" + seed);          // first-estimate errors, drawn separately so events are unchanged
  sc.errPi = Array.from({ length: n }, (_, k) => (k ? gauss(frng) * FOG.pi : 0));
  sc.errX = Array.from({ length: n }, (_, k) => (k ? gauss(frng) * FOG.x : 0));'''),
('''const drawdown = s => 100 * (1 - (s.eq || 100) / (s.eqPeak || 100));''',
'''const drawdown = s => 100 * (1 - (s.eq || 100) / (s.eqPeak || 100));
// Data fog: inflation and growth arrive as first estimates, get revised a quarter later, and are final after two.
// Financial markets are observed in real time.
const FOG = { pi: 0.3, x: 0.6 };
function seenOf(h, sc, now) {
  const age = now - h.t, f = age <= 0 ? 1 : age === 1 ? 0.4 : 0;
  if (!f || !sc.errPi) return h;
  return Object.assign({}, h, { pi: h.pi + f * (sc.errPi[h.t] || 0), x: h.x + f * (sc.errX[h.t] || 0) });
}
// Staff forecast: projects from the data the Bank sees, with no new shocks, this move now and the rate held after.
function staffForecast(s, sc, inp, h = 4) {
  const z = () => new Array(M.turns + h + 3).fill(0);
  const fs = { key: sc.key, year: sc.year, q: sc.q, cred: sc.cred, d: z(), s: z(), noiseD: z(), noiseS: z(), news: {}, dilemmas: {} };
  let st = seenOf(s, sc, s.t);
  const out = [];
  for (let k = 0; k < h; k++) {
    const p = prepGame(st, fs); p.gd = null;
    st = stepGame(st, fs, p, { move: k ? 0 : inp.move, tone: k ? "neutral" : inp.tone || "neutral", choice: null, qa: null, qe: k ? 0 : inp.qe || 0 }).state;
    out.push({ pi: st.pi, x: st.x });
  }
  return out;
}'''),
('''  const p = prepare(s, sc);
  p.gd = p.dilemma ? null''', '''  const p = prepare(seenOf(s, sc, s.t), sc);        // advisors, the government and the press all read the published data
  p.gd = p.dilemma ? null'''),
('''  game.reports.push({ prep, inp, prev: s, ...res });
}''', '''  game.reports.push({ prep, inp, prev: s, ...res });
  saveGame();
}
const seenNow = () => seenOf(cur(), game.sc, cur().t);
const SAVE_KEY = "holdtheline.save";
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ cfg: game.cfg, inputs: game.inputs })); } catch {} }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }
function loadSave() {
  try {
    const sv = JSON.parse(localStorage.getItem(SAVE_KEY));
    return sv && sv.cfg && SCEN[sv.cfg.scenario] && Array.isArray(sv.inputs) && sv.inputs.length < M.turns ? sv : null;
  } catch { return null; }
}'''),
])

# ───────── text ─────────
patch('js/02-text-game.js', [
('  diff: { normal: "Normal", hard: "Hard" },', '''  diff: { normal: "Normal", hard: "Hard" },
  continueGame: (name, q) => `Continue: ${name}, quarter ${q}`,
  estTip: "First estimate: the statistics office will revise it next quarter.",
  fanTitle: "Staff forecast", fanHold: "If you hold the rate. Shaded bands show the likely range.",
  fanMove: m => `If you ${m.toLowerCase()} now and then hold. Shaded bands show the likely range.`, nowLabel: "now",
  revUp: q => `Statistics office revises ${q} growth up`, revDown: q => `Statistics office revises ${q} growth down`,'''),
('  diff: { normal: "Normal", hard: "Difícil" },', '''  diff: { normal: "Normal", hard: "Difícil" },
  continueGame: (name, q) => `Continuar: ${name}, trimestre ${q}`,
  estTip: "Primera estimación: el instituto de estadística la revisará el próximo trimestre.",
  fanTitle: "Pronóstico del staff", fanHold: "Si mantienes la tasa. Las bandas muestran el rango probable.",
  fanMove: m => `Si decides ${m.toLowerCase()} ahora y luego mantener. Las bandas muestran el rango probable.`, nowLabel: "hoy",
  revUp: q => `El instituto de estadística revisa al alza el crecimiento de ${q}`, revDown: q => `El instituto de estadística revisa a la baja el crecimiento de ${q}`,'''),
('mkt: "Stocks and currency", eq: "stocks", fx: "currency", y10: "10-year yield" }', 'mkt: "Stocks and currency", eq: "stocks", fx: "currency", y10: "10-year yield", first: "first estimate" }'),
('mkt: "Bolsa y moneda", eq: "bolsa", fx: "moneda", y10: "bono a 10 años" }', 'mkt: "Bolsa y moneda", eq: "bolsa", fx: "moneda", y10: "bono a 10 años", first: "primera estimación" }'),
('["okafor", "neutral", "Watch the stock index, the currency and the 10-year yield. Markets move the moment you speak, and their mood feeds back into the economy a quarter later."]',
 '["okafor", "neutral", "Watch the stock index, the currency and the 10-year yield. Markets move the moment you speak, and their mood feeds back into the economy a quarter later."],\n      ["weiss", "neutral", "And remember: inflation and growth figures are first estimates, marked with ≈. They arrive late and get revised. Markets, at least, move in real time."]'),
('["okafor", "neutral", "Mira la bolsa, la moneda y el bono a 10 años. Los mercados se mueven apenas hablas, y su humor vuelve a la economía un trimestre después."]',
 '["okafor", "neutral", "Mira la bolsa, la moneda y el bono a 10 años. Los mercados se mueven apenas hablas, y su humor vuelve a la economía un trimestre después."],\n      ["weiss", "neutral", "Y recuerda: las cifras de inflación y crecimiento son primeras estimaciones, marcadas con ≈. Llegan tarde y se revisan. Los mercados, al menos, se mueven en tiempo real."]'),
])

# ───────── fan chart ─────────
patch('js/04-art.js', [
('function chartSVG(o, qLabel) {', '''const FAN_SD = { pi: [0.45, 0.65, 0.8, 0.9], x: [0.8, 1.1, 1.3, 1.45] };
function fanSVG(hist, path, sd, o) {
  const W = 300, H = 124, ml = 30, mr = 8, mt = 20, mb = 8, n = hist.length + path.length, h0 = hist.length - 1;
  const lo0 = Math.min(o.ref, ...hist, ...path.map((v, k) => v - 1.64 * sd[k])), hi0 = Math.max(o.ref, ...hist, ...path.map((v, k) => v + 1.64 * sd[k]));
  const ticks = niceTicks(lo0, hi0, 3), lo = ticks[0], hi = ticks[ticks.length - 1];
  const X = k => ml + (k * (W - ml - mr)) / Math.max(1, n - 1), Y = v => mt + ((hi - v) * (H - mt - mb)) / (hi - lo);
  const f = v => v.toFixed(1);
  const band = z => `M${f(X(h0))} ${f(Y(hist[h0]))} ` + path.map((v, k) => `L${f(X(h0 + 1 + k))} ${f(Y(v + z * sd[k]))}`).join(" ") + " "
    + path.map((v, k) => `L${f(X(h0 + 1 + k))} ${f(Y(v - z * sd[k]))}`).reverse().join(" ") + " Z";
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title)}">`;
  s += `<text x="${ml}" y="12" font-size="10.5" font-weight="700" letter-spacing=".06em" fill="#9AA4BD" font-family="Archivo, sans-serif">${esc(o.title.toUpperCase())}</text>`;
  ticks.forEach(v => { s += `<line x1="${ml}" x2="${W - mr}" y1="${f(Y(v))}" y2="${f(Y(v))}" stroke="#fff" stroke-opacity=".07"/><text x="${ml - 5}" y="${f(Y(v) + 3.5)}" text-anchor="end" font-size="10" fill="#9AA4BD" font-family="Archivo, sans-serif">${+v.toFixed(1)}</text>`; });
  s += `<rect x="${f(X(h0))}" y="${mt}" width="${f(W - mr - X(h0))}" height="${H - mt - mb}" fill="#fff" opacity=".035"/>`;
  s += `<line x1="${ml}" x2="${W - mr}" y1="${f(Y(o.ref))}" y2="${f(Y(o.ref))}" stroke="#fff" stroke-opacity=".35" stroke-dasharray="3 4"/>`;
  s += `<path d="${band(1.64)}" fill="${o.color}" opacity=".16"/><path d="${band(0.67)}" fill="${o.color}" opacity=".3"/>`;
  if (hist.length > 1) s += `<path d="${smoothPath(hist.map((v, k) => [X(k), Y(v)]))}" fill="none" stroke="${o.color}" stroke-width="2.4" stroke-linecap="round"/>`;
  s += `<path d="${smoothPath([[X(h0), Y(hist[h0])], ...path.map((v, k) => [X(h0 + 1 + k), Y(v)])])}" fill="none" stroke="${o.color}" stroke-width="2" stroke-dasharray="5 4"/>`;
  s += `<circle cx="${f(X(h0))}" cy="${f(Y(hist[h0]))}" r="4" fill="${o.color}" stroke="#0F1627" stroke-width="2"/>`;
  s += `<text x="${f(X(h0) + 4)}" y="${mt + 10}" font-size="10" fill="#9AA4BD" font-family="Archivo, sans-serif">${esc(o.nowLabel)}</text>`;
  return s + `</svg>`;
}
function chartSVG(o, qLabel) {'''),
])

# ───────── HUD shows published data ─────────
patch('js/07-stage-hud.js', [
('''function renderHUD(s, prev, turn) {
  const gg = g(), from = prev || s;
  game.hud = { s, prev, turn };''', '''function renderHUD(s, prev, turn) {
  game.hud = { s, prev, turn };
  const now = s.t;
  s = seenOf(s, game.sc, now); if (prev) prev = seenOf(prev, game.sc, now);
  const gg = g(), from = prev || s;'''),
('const toE = M.election - turn, H = game.hist;', 'const toE = M.election - turn, H = game.hist.slice(0, now + 1).map(h => seenOf(h, game.sc, now));'),
('<span class="t-val ${piCls}">${pc(s.pi, 1)}', '<span class="t-val ${piCls}" title="${esc(gg.estTip)}">≈${pc(s.pi, 1)}'),
('<span class="t-val ${xCls}">${pc(s.x, 1)}', '<span class="t-val ${xCls}" title="${esc(gg.estTip)}">≈${pc(s.x, 1)}'),
('<span class="t-val ${uCls}">${pc(u, 1)}', '<span class="t-val ${uCls}" title="${esc(gg.estTip)}">≈${pc(u, 1)}'),
])

# ───────── revisions make the news ─────────
patch('js/06-world.js', [
('  const P = tr().press, r = lastReport(), out = [], lastMove = r ? r.inp.move : 0;',
 '''  const P = tr().press, r = lastReport(), out = [], lastMove = r ? r.inp.move : 0;
  const rk = prep.t - 2, rev = rk >= 1 && game.sc.errX ? -0.6 * (game.sc.errX[rk] || 0) : 0;   // last quarter's growth, first estimate -> revised
  if (Math.abs(rev) >= 0.3) out.push(["wire", g()[rev > 0 ? "revUp" : "revDown"](quarterLabel(rk))]);'''),
])

# ───────── the quarter reads published data; the decision screen gets the fan chart ─────────
patch('js/09-quarter.js', [
('const s = cur(), prep = game.prep, t = tr(), gg = g(), lead = leadStory(s, prep);\n  tvOn(',
 'const s = seenNow(), prep = game.prep, t = tr(), gg = g(), lead = leadStory(s, prep);\n  tvOn('),
('() => leadStory(game.hist[prep.t - 1], prepare(game.hist[prep.t - 1], game.sc)).head',
 '() => { const h = seenOf(game.hist[prep.t - 1], game.sc, prep.t - 1); return leadStory(h, prepGame(game.hist[prep.t - 1], game.sc)).head; }'),
('const s = cur(), prep = game.prep, t = tr(), gg = g(), lead = leadStory(s, prep);\n  const side',
 'const s = seenNow(), prep = game.prep, t = tr(), gg = g(), lead = leadStory(s, prep);\n  const side'),
('const s = cur(), prep = game.prep, t = tr(), gg = g(), keys = ["keynes", "friedman", "taylor"];',
 'const s = seenNow(), prep = game.prep, t = tr(), gg = g(), keys = ["keynes", "friedman", "taylor"];'),
('''function decideBeat() {
  const s = cur(), prep = game.prep, t = tr(), gg = g();''', '''function decideBeat() {
  const s = seenNow(), prep = game.prep, t = tr(), gg = g();'''),
('''<small>${pc(s.i + m)}</small></button>`).join("")}</div></div>''',
 '''<small>${pc(s.i + m)}</small></button>`).join("")}</div></div>
    <div class="dec-row"><div class="fan-head"><span class="sec-lab">${esc(gg.fanTitle)}</span><span class="tip" id="fanNote"></span></div><div class="fan-wrap"><div class="fan" id="fanPi"></div><div class="fan" id="fanX"></div></div></div>'''),
('''    $("announce").disabled = draft.move == null;
  };''', '''    $("announce").disabled = draft.move == null;
    const mv = draft.move == null ? 0 : draft.move, now = cur().t;
    const fc = staffForecast(cur(), game.sc, { move: mv, tone: draft.tone, qe: draft.qe || 0 });
    const hist = game.hist.slice(Math.max(0, now - 4), now + 1).map(h => seenOf(h, game.sc, now));
    $("fanPi").innerHTML = fanSVG(hist.map(h => h.pi), fc.map(f => f.pi), FAN_SD.pi, { color: "#E5484D", ref: 2, title: gg.chart.infl, nowLabel: gg.nowLabel });
    $("fanX").innerHTML = fanSVG(hist.map(h => h.x), fc.map(f => f.x), FAN_SD.x, { color: "#5B9BD5", ref: 0, title: gg.chart.gap, nowLabel: gg.nowLabel });
    $("fanNote").textContent = draft.move == null ? gg.fanHold : gg.fanMove(t.moveName(mv));
  };'''),
])

# ───────── charts show what is known now; the end screen reveals first estimates ─────────
patch('js/10-end-menu.js', [
('''function chartSpec(kind) {
  const H = game.hist, c = g().chart;
  if (kind === "infl") return { title: c.infl, keys: [[c.infl, "#E5484D"], [c.exp, "#9AA4BD"]], series: [{ values: H.map(h => h.pe), color: "#9AA4BD", dash: true }, { values: H.map(h => h.pi), color: "#E5484D", area: true }], band: [1, 3], include: [0, 4] };''',
'''function chartSpec(kind, reveal) {
  const now = cur().t, H = reveal ? game.hist : game.hist.map(h => seenOf(h, game.sc, now)), c = g().chart;
  if (kind === "infl" && reveal) return { title: c.infl, keys: [[c.infl, "#E5484D"], [c.first, "#F2B650"]], series: [{ values: game.hist.map(h => h.pi + (game.sc.errPi[h.t] || 0)), color: "#F2B650", dash: true }, { values: H.map(h => h.pi), color: "#E5484D", area: true }], band: [1, 3], include: [0, 4] };
  if (kind === "infl") return { title: c.infl, keys: [[c.infl, "#E5484D"], [c.exp, "#9AA4BD"]], series: [{ values: H.map(h => h.pe), color: "#9AA4BD", dash: true }, { values: H.map(h => h.pi), color: "#E5484D", area: true }], band: [1, 3], include: [0, 4] };'''),
('''function chartCard(kind, qL) {
  const spec = chartSpec(kind);''', '''function chartCard(kind, qL, reveal) {
  const spec = chartSpec(kind, reveal);'''),
('<div class="end-charts">${["infl", "mkt", "pol"].map(k => chartCard(k, qL)).join("")}</div>', '<div class="end-charts">${["infl", "mkt", "pol"].map(k => chartCard(k, qL, true)).join("")}</div>'),
('''  if (!restored) {
    got.forEach(a => (store.ach[a] = true));''', '''  if (!restored) {
    clearSave();
    got.forEach(a => (store.ach[a] = true));'''),
])

# ───────── continue from the title screen ─────────
patch('js/08-screens.js', [
('''function titleScreen() {
  screen = "title"; game = null; resetStage(); $("hud").hidden = true; drawRoom(); renderTicker();
  const gg = g();''', '''function titleScreen() {
  screen = "title"; game = null; resetStage(); $("hud").hidden = true; drawRoom(); renderTicker();
  const gg = g(), sv = loadSave();'''),
('''    <button class="btn big" id="tStart" data-hot>${esc(gg.play)} →</button>''',
 '''    ${sv ? `<button class="btn big" id="tCont" data-hot>${esc(gg.continueGame(gg.levels[sv.cfg.scenario][0], sv.inputs.length + 1))} →</button>` : ""}
    <button class="btn big ${sv ? "ghost" : ""}" id="tStart" ${sv ? "" : "data-hot"}>${esc(gg.play)} →</button>'''),
('''  $("tStart").onclick = () => { Sound.unlock(); Sound.confirm(); levelSelect(); };''',
 '''  $("tStart").onclick = () => { Sound.unlock(); Sound.confirm(); levelSelect(); };
  if (sv) $("tCont").onclick = () => { Sound.unlock(); Sound.confirm(); startLevel(sv.cfg.scenario, sv.cfg.seed, sv.inputs, !!sv.cfg.hard); };'''),
('''  inputs.forEach(advance);
  drawRoom(); renderTicker();''', '''  inputs.forEach(advance);
  saveGame();
  drawRoom(); renderTicker();'''),
])

# ───────── styles ─────────
p = os.path.join(ROOT, 'styles', '30-hud-extras.css')
s = open(p, encoding='utf-8').read()
s += '''.fan-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:4px 12px}
.fan-wrap{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
@media (max-width:640px){.fan-wrap{grid-template-columns:minmax(0,1fr)}}
.fan{border-radius:12px;background:rgba(255,255,255,.03);box-shadow:inset 0 0 0 1px var(--line);padding:8px 10px 4px}
.fan svg{display:block;width:100%;height:auto}
'''
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('patched styles/30-hud-extras.css')
