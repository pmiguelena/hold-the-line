# One-off source patch: sector and price-category detail, economy map beat and HUD button.
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

patch('js/045-econ-map.js', [('<div class="emap" data-layer="${layer}">', '<div class="emap" data-map="${layer}">')])

patch('js/05-game-model.js', [
('''const drawdown = s => 100 * (1 - (s.eq || 100) / (s.eqPeak || 100));''',
'''const drawdown = s => 100 * (1 - (s.eq || 100) / (s.eqPeak || 100));
// Inside the aggregates: price categories and sectors. A decomposition for the map; it never feeds back into the core model.
const CPI_W = { food: 0.2, energy: 0.1, housing: 0.25, goods: 0.2, services: 0.25 };
const SEC_W = { farms: 0.12, construction: 0.1, industry: 0.2, shops: 0.48, finance: 0.1 };
const SEC_U = { farms: 6.2, construction: 6.5, industry: 5.4, shops: 4.8, finance: 3.4 };
const NEWS_CAT = { oil1: "energy", oil2: "energy", oil4: "energy", pa3: "goods", pa4: "energy", pa5: "goods",
  ev_drought: "food", ev_oil: "energy", ev_tech: "goods", ev_commod: "energy" };
function supplyMix(sc, t) {
  for (let k = t; k >= Math.max(1, t - 3); k--) { const c = NEWS_CAT[sc.news[k]]; if (c) return { [c]: 1 }; }
  return { energy: 0.4, food: 0.3, goods: 0.3 };
}
function econDetail(s) {
  const P = s.catP || {}, fxDev = 100 * ((s.fx || 100) / (s.fxA || 100) - 1), eqGap = 100 * ((s.eq || 100) / (s.eqA || 100) - 1);
  const dev = {
    food: (P.food || 0) / CPI_W.food,
    energy: (P.energy || 0) / CPI_W.energy - 0.15 * fxDev,          // a weaker currency makes imported energy dearer
    housing: 0.35 * s.x + 0.12 * (s.hpg || 0),
    goods: (P.goods || 0) / CPI_W.goods - 0.1 * fxDev,
    services: 0.45 * s.x + 0.3 * (s.pe - 2)                          // wages: tight labour markets and expectations
  };
  const dm = Object.keys(CPI_W).reduce((a, c) => a + CPI_W[c] * dev[c], 0), cat = {};
  for (const c in CPI_W) cat[c] = s.pi + dev[c] - dm;                 // weighted categories average back to headline inflation
  const y = s.y10 || Y10_NEUTRAL, gap = {
    farms: 0.5 * s.x - 3 * (P.food || 0),
    construction: 1.6 * s.x - 0.9 * (y - Y10_NEUTRAL) + 0.25 * (s.hpg || 0),
    industry: s.x - 0.12 * fxDev,
    shops: s.x + 0.015 * eqGap,
    finance: eqGap / 6
  };
  const gm = Object.keys(SEC_W).reduce((a, k) => a + SEC_W[k] * gap[k], 0), sec = {}, jobs = {};
  for (const k in SEC_W) { sec[k] = s.x + gap[k] - gm; jobs[k] = Math.max(1, SEC_U[k] - 0.5 * sec[k]); }
  const dd = drawdown(s);
  return { cat, sec, jobs, fxDev, eqGap, hpYoY: 4 * (s.hpg || 0),
    credit: 6 + 1.5 * s.x - 1.2 * (s.i - 3) - 0.15 * dd + 0.3 * (s.hpg || 0),
    bank: clamp(80 - 1.2 * dd - 6 * Math.max(0, y - 5) - 4 * Math.max(0, -s.x - 1) + 40 * ((s.cred || 0.8) - 0.75), 5, 100) };
}'''),
('y10: Y10_NEUTRAL, crashUsed: false });', 'y10: Y10_NEUTRAL, crashUsed: false, catP: {}, hp: 100, hpg: 0.8 });'),
('''  Object.assign(n, finStep(s, n, prep, inp, sc, t, gdT, qe));''',
'''  Object.assign(n, finStep(s, n, prep, inp, sc, t, gdT, qe));
  const shock = (sSave || 0) + (sc.noiseS[t] || 0), mix = supplyMix(sc, t), P0 = s.catP || {};
  n.catP = {};
  for (const c of ["food", "energy", "goods"]) n.catP[c] = 0.2 * (P0[c] || 0) + shock * (mix[c] || 0);
  n.hpg = clamp(0.8 + 1.0 * n.x - 0.9 * (n.y10 - Y10_NEUTRAL) + 1.5 * (dSave || 0) + 0.5 * (n.x - s.x), -8, 8);   // house prices, % a quarter
  n.hp = (s.hp || 100) * (1 + n.hpg / 100);'''),
])

EN_MAP = '''  map: {
    title: "The economy", role: "Staff briefing", rateChip: "Policy rate", hudBtn: "Economy map",
    layers: { prices: "Prices", activity: "Activity", jobs: "Jobs", credit: "Credit" },
    dist: { farms: "Farms", housing: "Housing", shops: "Shops & services", finance: "Financial district", industry: "Industry & port", energy: "Energy", gov: "Bank & Palace" },
    sub: { housing: "House prices, a year", shops: "Lending growth", industry: "Lending growth", finance: "Bank health" },
    cat: { food: "Food", energy: "Energy", housing: "Housing", goods: "Goods", services: "Services" },
    secName: { farms: "Farming", construction: "Construction", industry: "Industry", shops: "Retail and services", finance: "Finance" },
    legend: {
      prices: [["cold", "below 1%"], ["good", "1–3%"], ["warn", "3–5%"], ["bad", "above 5%"]],
      activity: [["bad", "deep slump or overheating"], ["warn", "slack or running hot"], ["good", "close to normal"]],
      jobs: [["good", "unemployment below 5%"], ["warn", "5–6.5%"], ["bad", "above 6.5%"]],
      credit: [["good", "healthy"], ["warn", "slow or frothy"], ["bad", "crunch, bust or boom"]]
    },
    drivers: (c, v) => `${c} is driving inflation, running at ${v}.`,
    drag: (c, v) => `${c} prices are holding inflation down, at ${v}.`,
    broadCalm: "Price pressures are broad and moderate.",
    broad: v => `Price pressures are broad: inflation is ${v} across most of the basket.`,
    weak: (sec, v) => `${sec} is contracting (activity ${v}).`,
    hot: (sec, v) => `${sec} is overheating (activity ${v}).`,
    bankStress: v => `Banks are under stress: health index ${v}.`,
    housingBoom: v => `House prices are booming, ${v} over a year.`,
    housingBust: v => `House prices are falling, ${v} over a year.`
  },
'''
ES_MAP = '''  map: {
    title: "La economía", role: "Informe del staff", rateChip: "Tasa de política", hudBtn: "Mapa de la economía",
    layers: { prices: "Precios", activity: "Actividad", jobs: "Empleo", credit: "Crédito" },
    dist: { farms: "Campo", housing: "Vivienda", shops: "Comercio y servicios", finance: "Distrito financiero", industry: "Industria y puerto", energy: "Energía", gov: "Banco y Palacio" },
    sub: { housing: "Precio de viviendas, anual", shops: "Crecimiento del crédito", industry: "Crecimiento del crédito", finance: "Salud bancaria" },
    cat: { food: "Alimentos", energy: "Energía", housing: "Vivienda", goods: "Bienes", services: "Servicios" },
    secName: { farms: "El agro", construction: "La construcción", industry: "La industria", shops: "El comercio y los servicios", finance: "Las finanzas" },
    legend: {
      prices: [["cold", "menos de 1%"], ["good", "1–3%"], ["warn", "3–5%"], ["bad", "más de 5%"]],
      activity: [["bad", "recesión profunda o recalentamiento"], ["warn", "holgura o ritmo alto"], ["good", "cerca de lo normal"]],
      jobs: [["good", "desempleo bajo 5%"], ["warn", "5–6,5%"], ["bad", "más de 6,5%"]],
      credit: [["good", "sano"], ["warn", "lento o espumoso"], ["bad", "sequía, desplome o burbuja"]]
    },
    drivers: (c, v) => `${c} empuja la inflación: corre a ${v}.`,
    drag: (c, v) => `Los precios de ${c.toLowerCase()} contienen la inflación, en ${v}.`,
    broadCalm: "Las presiones de precios son generales y moderadas.",
    broad: v => `Las presiones son generales: la inflación ronda ${v} en casi toda la canasta.`,
    weak: (sec, v) => `${sec} se contrae (actividad ${v}).`,
    hot: (sec, v) => `${sec} se recalienta (actividad ${v}).`,
    bankStress: v => `Los bancos están bajo tensión: índice de salud ${v}.`,
    housingBoom: v => `Los precios de las viviendas se disparan: ${v} en un año.`,
    housingBust: v => `Los precios de las viviendas caen: ${v} en un año.`
  },
'''
patch('js/02-text-game.js', [
('  diff: { normal: "Normal", hard: "Hard" },', EN_MAP + '  diff: { normal: "Normal", hard: "Hard" },'),
('  diff: { normal: "Normal", hard: "Difícil" },', ES_MAP + '  diff: { normal: "Normal", hard: "Difícil" },'),
])

patch('js/04-art.js', [
('const ICON = {', '''const ICON = {
  map: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z M9 4v13.5 M15 6.5V20"/></svg>`,'''),
])

patch('js/07-stage-hud.js', [
('<div class="hud-btns"><button class="icon-btn" id="bCharts"', '<div class="hud-btns"><button class="icon-btn" id="bMap" aria-label="${esc(gg.map.hudBtn)}" title="${esc(gg.map.hudBtn)}">${ICON.map}</button><button class="icon-btn" id="bCharts"'),
('  $("bMenu").onclick = openMenu;', '  $("bMenu").onclick = openMenu;\n  $("bMap").onclick = openMap;'),
])

patch('js/09-quarter.js', [
('  const list = [quarterCard, newsBeat, frontPageBeat];', '  const list = [quarterCard, newsBeat, frontPageBeat, mapBeat];'),
('function frontPageBeat() {', '''function mapBeat() {
  const s = seenNow(), gg = g();
  const layer = game.mapLayer || (Math.abs(s.pi - 2) > 1 ? "prices" : "activity");
  say({ cast: [], name: gg.map.title, role: `${gg.map.role} · ${quarterLabel(game.prep.t)}`, extra: `<div id="mapBox"></div>` });
  mountMap($("mapBox"), s, layer);
}

function frontPageBeat() {'''),
])

patch('js/10-end-menu.js', [
('function resume() {', '''function openMap() {
  if (!game) return;
  cardToken = null;
  const gg = g(), s = seenOf(cur(), game.sc, cur().t);
  openOverlay(`<div class="scr"><h2 class="scr-title">${esc(gg.map.title)}</h2><div id="mapOv" class="map-ov"></div>
    <button class="btn big" id="mapClose" data-hot>${esc(gg.close)}</button></div>`);
  mountMap($("mapOv"), s, game.mapLayer || "prices");
  $("mapClose").onclick = resume;
}
function resume() {'''),
("if ($(\"mResume\") || $(\"chClose\")) resume();", "if ($(\"mResume\") || $(\"chClose\") || $(\"mapClose\")) resume();") if False else ('function openCharts() {', 'function openCharts() {'),
])

patch('js/11-boot.js', [
('if ($("mResume") || $("chClose")) resume();', 'if ($("mResume") || $("chClose") || $("mapClose")) resume();'),
])

p = os.path.join(ROOT, 'styles', '30-hud-extras.css')
s = open(p, encoding='utf-8').read()
s += '''.emap{display:grid;gap:10px;min-width:0}
.emap-tabs{display:flex;flex-wrap:wrap;gap:6px}
.emap-tabs button{border:0;border-radius:99px;padding:7px 14px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px var(--line);color:var(--muted);font:700 13px var(--f-ui);letter-spacing:.04em}
.emap-tabs button:hover{background:rgba(255,255,255,.11);color:var(--text)}
.emap-tabs button[aria-pressed="true"]{background:var(--text);color:#0E1526}
.emap-sum{margin:0;font:400 16.5px/1.45 var(--f-news);color:#D5DAE6}
.emap-svg{border-radius:14px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--line);animation:fade .35s both}
.emap-svg svg{display:block;width:100%;height:auto}
.emap-list{display:none;flex-wrap:wrap;gap:6px}
.emap-item{display:inline-flex;gap:6px;align-items:baseline;padding:5px 10px;border-radius:99px;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1.5px var(--c);font:500 13px var(--f-ui);color:var(--muted)}
.emap-item b{color:var(--text);font-weight:800}
@media (max-width:640px){.emap-list{display:flex}}
.emap-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font:500 12.5px var(--f-ui);color:var(--muted)}
.emap-legend span::before{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px;background:var(--c)}
.map-ov{width:100%;text-align:left}
'''
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('patched styles')
