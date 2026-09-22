# One-off source patch: Phase 3, the institution — departments and budget, the board, macroprudential rules.
import os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'src')
def patch(rel, pairs):
    p = os.path.join(ROOT, rel)
    s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        c = s.count(old)
        assert c == 1, (rel, c, old[:90])
        s = s.replace(old, new)
    open(p, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', rel)

# ───────── core: statement strength depends on the communications department ─────────
patch('js/00-model-core.js', [
('  const pe = s.cred * 2 + (1 - s.cred) * s.pi + toneSign * M.tonePe * s.cred + peExtra;',
 '  const tk = inp.toneK || 1;                                          // communications capacity scales how far words move expectations\n  const pe = s.cred * 2 + (1 - s.cred) * s.pi + toneSign * M.tonePe * tk * s.cred + peExtra;'),
('+ toneSign * M.toneX', '+ toneSign * M.toneX * tk'),
])

# ───────── game model ─────────
patch('js/05-game-model.js', [
('  const h = inp.move - prep.advisors.taylor + 0.25 * ts, dcred = n.cred - s.cred;',
 '  const h = (inp.move - prep.advisors.taylor + 0.25 * ts) * (inp.hDamp || 1), dcred = n.cred - s.cred;   // a good markets desk means smaller surprises'),
('    + 4 * (sc.d[t] || 0) - 1.2 * (sc.s[t] || 0) + qe.eq + (gdT.eq || 0);',
 '    + 4 * (sc.d[t] || 0) * ((sc.d[t] || 0) < 0 ? inp.eqDamp || 1 : 1) - 1.2 * (sc.s[t] || 0) + qe.eq + (gdT.eq || 0);'),
('+ 40 * ((s.cred || 0.8) - 0.75), 5, 100) };',
 '+ 40 * ((s.cred || 0.8) - 0.75) + (s.macro ? 8 : 0) + 5 * ((s.dept || {}).supervision || 0), 5, 100) };'),
('  const age = now - h.t, f = age <= 0 ? 1 : age === 1 ? 0.4 : 0;',
 '  const age = now - h.t, f = (age <= 0 ? 1 : age === 1 ? 0.4 : 0) * (h.fogM ?? 1);   // a stronger statistics office publishes better first estimates'),
('''function staffForecast(s, sc, inp, h = 4) {
  const z = () => new Array(M.turns + h + 3).fill(0);
  const fs = { key: sc.key, year: sc.year, q: sc.q, cred: sc.cred, d: z(), s: z(), noiseD: z(), noiseS: z(), news: {}, dilemmas: {} };
  let st = seenOf(s, sc, s.t);
  const out = [];
  for (let k = 0; k < h; k++) {
    const p = prepGame(st, fs); p.gd = null;
    st = stepGame(st, fs, p, { move: k ? 0 : inp.move, tone: k ? "neutral" : inp.tone || "neutral", choice: null, qa: null, qe: k ? 0 : inp.qe || 0 }).state;''',
'''function staffForecast(s, sc, inp, h = 4) {
  const z = () => new Array(M.turns + h + 3).fill(0), [fNow, fNext] = FORESIGHT[(s.dept || initDept()).research];
  const fs = { key: sc.key, year: sc.year, q: sc.q, cred: sc.cred, d: z(), s: z(), noiseD: z(), noiseS: z(), news: {}, dilemmas: {} };
  const t0 = s.t + 1;                                   // research lets staff see part of the shocks in the news, and later the ones coming
  [[t0, fNow], [t0 + 1, fNext]].forEach(([t, f]) => { fs.d[t] = f * (sc.d[t] || 0); fs.s[t] = f * (sc.s[t] || 0); });
  let st = seenOf(s, sc, s.t);
  const out = [];
  for (let k = 0; k < h; k++) {
    const p = prepGame(st, fs); p.gd = null;
    st = stepGame(st, fs, p, { move: k ? 0 : inp.move, tone: k ? "neutral" : inp.tone || "neutral", choice: null, qa: null, qe: k ? 0 : inp.qe || 0, macro: inp.macro, noVote: true }).state;'''),
('''/*FIN-END*/''', '''/*FIN-END*/
/*INST-START*/
// Phase 3: the institution. Departments you fund once a year, a board that votes, and macroprudential rules.
const DEPTS = ["stats", "research", "comms", "supervision", "markets"], DEPT_MAX = 3, BUDGET_START = 3, BUDGET_YEAR = 3;
const deptCost = lvl => lvl + 1;                                   // level 1 costs 1 point, level 2 costs 2, level 3 costs 3
const FOGM = [1, 0.7, 0.45, 0.2], FANM = [1, 0.85, 0.7, 0.55], TONEK = [1, 1.25, 1.5, 1.75], QEK = [1, 1.2, 1.4, 1.6];
const FORESIGHT = [[0.5, 0], [0.7, 0], [0.9, 0.4], [1, 0.7]];     // share of this quarter's and next quarter's scripted shocks staff can see
const initDept = () => ({ stats: 0, research: 0, comms: 0, supervision: 0, markets: 0 });
const budgetQuarter = t => (t - 1) % 4 === 0;                     // quarters 1, 5, 9, 13 and 17 open with a budget meeting
function buyCost(dept, buys) {
  const d = Object.assign({}, dept); let c = 0;
  for (const k of buys || []) { if (!(k in d) || d[k] >= DEPT_MAX) return Infinity; c += deptCost(d[k]); d[k]++; }
  return c;
}
const RULE_BUILD = ["stats", "research", "comms", "supervision", "stats", "research", "markets", "comms", "supervision", "stats", "research", "markets", "comms", "supervision", "markets"];
function ruleBuys(s) {                                             // the benchmark governor's fixed, sensible build order
  const d = Object.assign({}, s.dept || initDept()), buys = [];
  let pts = s.points ?? BUDGET_START;
  for (const k of RULE_BUILD) { if (d[k] >= DEPT_MAX) continue; const c = deptCost(d[k]); if (c > pts) break; buys.push(k); d[k]++; pts -= c; }
  return buys;
}
// The board: four members plus the Governor. A proposal needs three votes.
const BOARD0 = ["vane", "lind", "mensah", "ortiz"];
const BOARD_STYLE = { vane: "hawk", lind: "dove", mensah: "centrist", ortiz: "gradualist", rubio: "loyalist" };
function boardPrefs(seen, prep) {
  const out = {};
  for (const id of seen.board || BOARD0) {
    const st = BOARD_STYLE[id];
    out[id] = st === "hawk" ? prep.advisors.friedman : st === "dove" ? prep.advisors.keynes : st === "centrist" ? prep.advisors.taylor
      : st === "gradualist" ? bandMove(seen, seen.i + 0.5 * (Math.max(0, r25(taylorRate(seen))) - seen.i))
      : prep.pressure === "cut" ? bandMove(seen, seen.i - 0.5) : prep.advisors.keynes;       // the loyalist reads the Palace
  }
  return out;
}
function boardVote(s, sc, prep, move) {
  const prefs = boardPrefs(seenOf(s, sc, s.t), prep);
  const votes = Object.entries(prefs).map(([id, pref]) => ({ id, pref, yes: Math.abs(pref - move) <= (BOARD_STYLE[id] === "gradualist" ? 0.5 : 0.25) + 1e-9 }));
  const yes = 1 + votes.filter(v => v.yes).length, passed = yes >= 3;
  const all = [move, ...votes.map(v => v.pref)].sort((a, b) => a - b);
  return { votes, yes, no: 5 - yes, passed, implemented: passed ? move : all[2] };   // if you lose, the median member decides
}
/*INST-END*/'''),
('y10: Y10_NEUTRAL, crashUsed: false, catP: {}, hp: 100, hpg: 0.8 });',
 'y10: Y10_NEUTRAL, crashUsed: false, catP: {}, hp: 100, hpg: 0.8, dept: initDept(), points: BUDGET_START, board: BOARD0.slice(), macro: false, fogM: 1 });'),
('''  const p = prepare(seenOf(s, sc, s.t), sc);        // advisors, the government and the press all read the published data
  p.gd = p.dilemma ? null : drawdown(s) >= CRASH_DD && !s.crashUsed ? "crash" : s.heat >= 55 ? "truce" : null;
  p.qe = s.i <= QE_RATE;''', '''  const p = prepare(seenOf(s, sc, s.t), sc), dept = s.dept || initDept();   // advisors, the government and the press all read the published data
  p.gd = p.dilemma ? null : drawdown(s) >= CRASH_DD + 4 * dept.supervision && !s.crashUsed ? "crash" : s.heat >= 55 ? "truce" : null;
  p.qe = s.i <= QE_RATE;
  p.budget = budgetQuarter(p.t); p.canMacro = dept.supervision >= 2;'''),
('''function stepGame(s, sc, prep, inp) {
  const t = prep.t;
  const gdT = prep.gd && inp.choice != null ? GD[prep.gd][inp.choice] || {} : {};
  const qe = QE[(prep.qe ? inp.qe : 0) || 0], ff = finFeed(s);
  const dSave = sc.d[t], sSave = sc.s[t];                       // financial conditions enter as demand and price shocks
  sc.d[t] = dSave + ff.d + (gdT.d || 0) + qe.d;''', '''function stepGame(s, sc, prep, inp) {
  const t = prep.t, dept = s.dept || initDept();
  const vote = inp.noVote ? null : boardVote(s, sc, prep, inp.move);
  const macro = !!inp.macro && dept.supervision >= 2;
  inp = Object.assign({}, inp, { move: vote && !vote.passed ? vote.implemented : inp.move, toneK: TONEK[dept.comms],
    hDamp: 1 - 0.1 * dept.markets, eqDamp: 1 - 0.15 * dept.supervision - (macro ? 0.15 : 0) });
  const gdT = prep.gd && inp.choice != null ? GD[prep.gd][inp.choice] || {} : {};
  const q0 = QE[(prep.qe ? inp.qe : 0) || 0], qe = Object.assign({}, q0, { d: q0.d * QEK[dept.markets], y: q0.y * QEK[dept.markets] }), ff = finFeed(s);
  const dSave = sc.d[t], sSave = sc.s[t];                       // financial conditions enter as demand and price shocks
  sc.d[t] = dSave + ff.d + (gdT.d || 0) + qe.d - (macro ? 0.15 : 0);'''),
('''  if (qe.heat) hp.push(["qe", qe.heat]);''', '''  if (qe.heat) hp.push(["qe", qe.heat]);
  if (vote) { if (!vote.passed) bump(-0.04, 0, "outvoted"); else if (vote.no >= 2) bump(-0.01, 0, "divided"); else if (vote.no === 0) bump(0.005, 0, "united"); }
  if (macro) bump(0, -0.5, "macro");'''),
('+ 0.5 * (n.x - s.x), -8, 8);', '+ 0.5 * (n.x - s.x) - (macro ? 1.5 : 0), -8, 8);'),
('''  n.crashUsed = s.crashUsed || prep.gd === "crash";''', '''  n.crashUsed = s.crashUsed || prep.gd === "crash";
  const buys = budgetQuarter(t) ? inp.buy || [] : [], cost = buyCost(dept, buys);
  n.dept = Object.assign({}, dept); n.points = s.points ?? BUDGET_START;          // upgrades bought now work from next quarter
  if (buys.length && cost <= n.points) { for (const k of buys) n.dept[k]++; n.points -= cost; }
  if (t % 4 === 0) n.points += BUDGET_YEAR + (n.cred >= 0.8 ? 1 : 0) - (n.heat >= 60 ? 1 : 0);
  n.fogM = FOGM[dept.stats]; n.macro = macro;
  n.board = (s.board || BOARD0).slice();
  if (res.election === "defeated") n.board = n.board.map(id => (id === "rubio" ? "vane" : id));
  else if (n.heat >= 70 && !n.board.includes("rubio")) { n.board = n.board.map(id => (id === "vane" ? "rubio" : id)); res.stacked = true; }
  res.vote = vote;'''),
('{ move: p.advisors.taylor, tone: "neutral", choice: 0, qa: null, qe: p.qe && s.x < -0.5 ? 2 : 0 }',
 '{ move: p.advisors.taylor, tone: "neutral", choice: 0, qa: null, qe: p.qe && s.x < -0.5 ? 2 : 0, buy: p.budget ? ruleBuys(s) : [] }'),
])

# ───────── text ─────────
EN = '''  board: {
    title: "Board vote", youShort: "You", noMove: "Pick a move to see how the board would vote.",
    wants: m => `wants: ${m.toLowerCase()}`, pass: (y, n) => `Passes ${y}–${n}`,
    fail: (y, n, m) => `You would lose ${y}–${n}: the board would impose “${m.toLowerCase()}”`,
    overruled: "The board has voted down my proposal.", voteTag: (y, n) => `vote ${y}–${n}`, kickerOutvoted: "Governor outvoted",
    stackCall: nm => `I have appointed ${nm} to the Bank's board. I trust the Bank will now see reason.`,
    stackNews: nm => `President appoints loyalist ${nm} to the central bank's board`,
    names: { vane: ["Helena Vane", "External member · hawk"], lind: ["Arturo Lind", "External member · dove"], mensah: ["Kofi Mensah", "Deputy Governor"],
      ortiz: ["Ana Ortiz", "Chief Economist · gradualist"], rubio: ["Julián Rubio", "Government appointee"] }
  },
  budgetTitle: "Budget meeting", budgetRole: y => `Year ${y} of the term`,
  points: n => `${n} budget point${n === 1 ? "" : "s"} to invest`,
  budgetTip: "Upgrades work from next quarter. You earn 3 points a year, plus 1 with credibility of 80 or more, minus 1 if removal risk is above 60.",
  invest: c => `Invest · ${c} pt${c === 1 ? "" : "s"}`, maxed: "Fully built", undo: "Undo last", nextLvl: l => `Next: ${l}`, instBuilt: "Institution built",
  depts: {
    stats: ["Statistics", ["First estimates are rough", "Data fog cut by 30%", "Data fog cut by 55%", "Data fog cut by 80%"]],
    research: ["Research", ["Forecasts see half of today's shock", "Narrower fan; sees most of today's shock", "Sees next quarter's shocks coming", "The sharpest forecasts around"]],
    comms: ["Communications", ["Statements at normal strength", "Statements 25% more powerful", "Statements 50% more powerful", "Statements 75% more powerful"]],
    supervision: ["Supervision", ["Standard bank oversight", "Banks sturdier in a crash", "Unlocks mortgage rules", "Market crashes much rarer"]],
    markets: ["Markets desk", ["Standard operations", "Asset purchases 20% stronger; calmer markets", "Asset purchases 40% stronger", "Asset purchases 60% stronger"]]
  },
  macro: { label: "Mortgage rules", off: ["Normal", "standard lending limits"], on: ["Tight", "cap loans against home values"],
    tip: "Tight rules cool house prices and construction and make banks sturdier, at a small cost in popularity." },
'''
ES = '''  board: {
    title: "Votación del directorio", youShort: "Tú", noMove: "Elige un movimiento para ver cómo votaría el directorio.",
    wants: m => `quiere: ${m.toLowerCase()}`, pass: (y, n) => `Se aprueba ${y}–${n}`,
    fail: (y, n, m) => `Perderías ${y}–${n}: el directorio impondría “${m.toLowerCase()}”`,
    overruled: "El directorio rechazó mi propuesta.", voteTag: (y, n) => `votación ${y}–${n}`, kickerOutvoted: "El directorio derrota a la autoridad",
    stackCall: nm => `Nombré a ${nm} en el directorio del Banco. Confío en que ahora el Banco entrará en razón.`,
    stackNews: nm => `El Presidente nombra a su leal ${nm} en el directorio del Banco Central`,
    names: { vane: ["Helena Vane", "Miembro externo · halcón"], lind: ["Arturo Lind", "Miembro externo · paloma"], mensah: ["Kofi Mensah", "Vicepresidente del Banco"],
      ortiz: ["Ana Ortiz", "Economista jefe · gradualista"], rubio: ["Julián Rubio", "Designado por el gobierno"] }
  },
  budgetTitle: "Reunión de presupuesto", budgetRole: y => `Año ${y} del mandato`,
  points: n => `${n} punto${n === 1 ? "" : "s"} de presupuesto para invertir`,
  budgetTip: "Las mejoras rigen desde el próximo trimestre. Ganas 3 puntos por año, 1 más con credibilidad de 80 o más, 1 menos si el riesgo de destitución supera 60.",
  invest: c => `Invertir · ${c} pt${c === 1 ? "" : "s"}`, maxed: "Completo", undo: "Deshacer", nextLvl: l => `Siguiente: ${l}`, instBuilt: "Institución construida",
  depts: {
    stats: ["Estadística", ["Las primeras estimaciones son toscas", "Niebla de datos −30%", "Niebla de datos −55%", "Niebla de datos −80%"]],
    research: ["Investigación", ["Los pronósticos ven la mitad del shock de hoy", "Abanico más angosto; ve casi todo el shock de hoy", "Anticipa los shocks del próximo trimestre", "Los pronósticos más finos de la región"]],
    comms: ["Comunicación", ["Comunicados con fuerza normal", "Comunicados 25% más potentes", "Comunicados 50% más potentes", "Comunicados 75% más potentes"]],
    supervision: ["Supervisión", ["Supervisión bancaria estándar", "Bancos más firmes ante un desplome", "Habilita reglas hipotecarias", "Desplomes mucho más raros"]],
    markets: ["Mesa de mercados", ["Operaciones estándar", "Compras de activos 20% más fuertes; mercados más calmos", "Compras de activos 40% más fuertes", "Compras de activos 60% más fuertes"]]
  },
  macro: { label: "Reglas hipotecarias", off: ["Normales", "límites de crédito estándar"], on: ["Estrictas", "tope al crédito según el valor de la vivienda"],
    tip: "Las reglas estrictas enfrían los precios de las viviendas y la construcción y fortalecen a los bancos, con un pequeño costo en popularidad." },
'''
patch('js/02-text-game.js', [
('  continueGame: (name, q) => `Continue: ${name}, quarter ${q}`,', EN + '  continueGame: (name, q) => `Continue: ${name}, quarter ${q}`,'),
('  continueGame: (name, q) => `Continuar: ${name}, trimestre ${q}`,', ES + '  continueGame: (name, q) => `Continuar: ${name}, trimestre ${q}`,'),
('whyExtra: { presser: "Press conference answer", qe: "Large asset purchases with inflation high" },',
 'whyExtra: { presser: "Press conference answer", qe: "Large asset purchases with inflation high", outvoted: "Outvoted by your own board", divided: "A divided board (3–2)", united: "A united board", macro: "Stricter mortgage rules annoy buyers" },'),
('whyExtra: { presser: "Respuesta en la conferencia de prensa", qe: "Compras masivas de activos con inflación alta" },',
 'whyExtra: { presser: "Respuesta en la conferencia de prensa", qe: "Compras masivas de activos con inflación alta", outvoted: "Tu propio directorio te derrotó", divided: "Un directorio dividido (3–2)", united: "Un directorio unido", macro: "Las reglas hipotecarias estrictas molestan a los compradores" },'),
('["weiss", "neutral", "And remember: inflation and growth figures are first estimates, marked with ≈. They arrive late and get revised. Markets, at least, move in real time."]',
 '["weiss", "neutral", "And remember: inflation and growth figures are first estimates, marked with ≈. They arrive late and get revised. Markets, at least, move in real time."],\n      ["okafor", "neutral", "Two more things. Once a year you set the Bank\'s budget and build its departments. And every quarter the board votes on your proposal: lose the vote and the board decides for you."]'),
('["weiss", "neutral", "Y recuerda: las cifras de inflación y crecimiento son primeras estimaciones, marcadas con ≈. Llegan tarde y se revisan. Los mercados, al menos, se mueven en tiempo real."]',
 '["weiss", "neutral", "Y recuerda: las cifras de inflación y crecimiento son primeras estimaciones, marcadas con ≈. Llegan tarde y se revisan. Los mercados, al menos, se mueven en tiempo real."],\n      ["okafor", "neutral", "Dos cosas más. Una vez por año fijas el presupuesto del Banco y construyes sus departamentos. Y cada trimestre el directorio vota tu propuesta: si pierdes, decide el directorio."]'),
])

# ───────── the world reacts: stacking the board, reactions use the implemented move ─────────
patch('js/06-world.js', [
('const R = g().rx, inp = r.inp, p = r.prev, out = [], has = k => r.credParts.some(q => q[0] === k);',
 'const R = g().rx, inp = Object.assign({}, r.inp, { move: r.state.move }), p = r.prev, out = [], has = k => r.credParts.some(q => q[0] === k);'),
('  if (Math.abs(rev) >= 0.3) out.push(["wire", g()[rev > 0 ? "revUp" : "revDown"](quarterLabel(rk))]);',
 '  if (Math.abs(rev) >= 0.3) out.push(["wire", g()[rev > 0 ? "revUp" : "revDown"](quarterLabel(rk))]);\n  if (r && r.stacked) out.unshift(["ledger", g().board.stackNews(g().board.names.rubio[0])]);'),
('  if (s.heat >= 60) out.push({ id: fin, role: finRole, text: g().threatFin[s.heat >= 85 ? 1 : 0], mood: "sad" });',
 '  if (s.heat >= 60) out.push({ id: fin, role: finRole, text: g().threatFin[s.heat >= 85 ? 1 : 0], mood: "sad" });\n  if (r && r.stacked) out.unshift({ id: pres, role: presRole, text: g().board.stackCall(g().board.names.rubio[0]), mood: "happy", pres: true });'),
])

# ───────── the quarter: budget meeting, board row, mortgage rules, overruled press conference ─────────
patch('js/09-quarter.js', [
('  draft = { move: null, tone: "neutral", choice: null, qe: 0 };', '  draft = { move: null, tone: "neutral", choice: null, qe: 0, buy: [], macro: !!s.macro };'),
('  const list = [quarterCard, newsBeat, frontPageBeat, mapBeat];', '  const list = [quarterCard, newsBeat, frontPageBeat, mapBeat];\n  if (prep.budget) list.push(budgetBeat);'),
('function mapBeat() {', '''const BOARD_COL = { vane: "#B5473A", lind: "#2F8C7A", mensah: "#2E6FA8", ortiz: "#C98A2C", rubio: "#7A62C9" };
function budgetBeat() {
  const s = cur(), gg = g(), prep = game.prep, dept = s.dept || initDept(), pts = s.points ?? BUDGET_START;
  const render = () => {
    const left = pts - buyCost(dept, draft.buy), d = Object.assign({}, dept);
    draft.buy.forEach(k => d[k]++);
    $("budgetBox").innerHTML = `<div class="budget-head"><span class="budget-pts">${esc(gg.points(left))}</span><span class="tip">${esc(gg.budgetTip)}</span></div>
      <div class="depts">${DEPTS.map(k => {
        const [name, lines] = gg.depts[k], lv = d[k], cost = lv < DEPT_MAX ? deptCost(lv) : null;
        return `<article class="dept"><header><b>${esc(name)}</b><span class="pips">${[0, 1, 2].map(q => `<i class="${q < dept[k] ? "on" : q < lv ? "new" : ""}"></i>`).join("")}</span></header>
          <p>${esc(lines[lv])}</p><p class="next">${lv < DEPT_MAX ? esc(gg.nextLvl(lines[lv + 1])) : ""}</p>
          <footer>${cost == null ? `<span class="tip">${esc(gg.maxed)}</span>` : `<button class="btn small ${cost <= left ? "" : "ghost"}" data-buy="${k}" ${cost <= left ? "" : "disabled"}>${esc(gg.invest(cost))}</button>`}</footer></article>`;
      }).join("")}</div>
      ${draft.buy.length ? `<button class="btn ghost small" id="buyUndo">${esc(gg.undo)}</button>` : ""}`;
    $("budgetBox").querySelectorAll("[data-buy]").forEach(b => (b.onclick = () => { draft.buy.push(b.dataset.buy); Sound.confirm(); render(); }));
    if ($("buyUndo")) $("buyUndo").onclick = () => { draft.buy.pop(); Sound.select(); render(); };
  };
  say({ cast: [], name: gg.budgetTitle, role: gg.budgetRole(Math.floor((prep.t - 1) / 4) + 1), extra: `<div id="budgetBox"></div>` });
  render();
}

function mapBeat() {'''),
('    <div class="dec-row"><div class="fan-head"><span class="sec-lab">${esc(gg.fanTitle)}</span>',
 '    <div class="dec-row"><div class="fan-head"><span class="sec-lab">${esc(gg.board.title)}</span><span class="tip" id="boardTally"></span></div><div class="board" id="boardRow"></div></div>\n    <div class="dec-row"><div class="fan-head"><span class="sec-lab">${esc(gg.fanTitle)}</span>'),
('    <div class="dec-foot"><div class="recs"><span class="sec-lab">${esc(gg.recsLabel)}</span>',
 '''    ${prep.canMacro ? `<div class="dec-row"><span class="sec-lab">${esc(gg.macro.label)}</span><div class="tones" role="group">${["off", "on"].map(k => `<button class="tone ${k === "on" ? "qe2" : "qe0"}" data-macro="${k}" aria-pressed="false"><b><i></i>${esc(gg.macro[k][0])}</b><small>${esc(gg.macro[k][1])}</small></button>`).join("")}</div><p class="tip">${esc(gg.macro.tip)}</p></div>` : ""}
    <div class="dec-foot"><div class="recs"><span class="sec-lab">${esc(gg.recsLabel)}</span>'''),
('    $("fanPi").innerHTML = fanSVG(hist.map(h => h.pi), fc.map(f => f.pi), FAN_SD.pi,', '    const fm = FANM[(cur().dept || initDept()).research];\n    $("fanPi").innerHTML = fanSVG(hist.map(h => h.pi), fc.map(f => f.pi), FAN_SD.pi.map(v => v * fm),'),
('    $("fanX").innerHTML = fanSVG(hist.map(h => h.x), fc.map(f => f.x), FAN_SD.x,', '    $("fanX").innerHTML = fanSVG(hist.map(h => h.x), fc.map(f => f.x), FAN_SD.x.map(v => v * fm),'),
('const fc = staffForecast(cur(), game.sc, { move: mv, tone: draft.tone, qe: draft.qe || 0 });', 'const fc = staffForecast(cur(), game.sc, { move: mv, tone: draft.tone, qe: draft.qe || 0, macro: prep.canMacro && draft.macro });'),
('''    $("fanNote").textContent = draft.move == null ? gg.fanHold : gg.fanMove(t.moveName(mv));''', '''    $("fanNote").textContent = draft.move == null ? gg.fanHold : gg.fanMove(t.moveName(mv));
    P.querySelectorAll("[data-macro]").forEach(b => b.setAttribute("aria-pressed", !!draft.macro === (b.dataset.macro === "on")));
    const B = gg.board, bv = draft.move == null ? null : boardVote(cur(), game.sc, prep, draft.move), prefs = boardPrefs(seenOf(cur(), game.sc, cur().t), prep);
    $("boardRow").innerHTML = `<div class="bm you ${bv ? "yes" : ""}"><span class="avatar" style="--c:#F2B650">${esc(B.youShort)}</span><span><b>${esc(gg.you)}</b><small>${esc(bv ? t.moveName(draft.move) : "—")}</small></span><i>${bv ? "✓" : ""}</i></div>`
      + (cur().board || BOARD0).map(id => {
        const v = bv && bv.votes.find(q => q.id === id), [nm, role] = B.names[id];
        return `<div class="bm ${v ? (v.yes ? "yes" : "no") : ""}" title="${esc(role)}"><span class="avatar" style="--c:${BOARD_COL[id]}">${esc(initials(nm))}</span><span><b>${esc(nm)}</b><small>${esc(B.wants(t.moveName(prefs[id])))}</small></span><i>${v ? (v.yes ? "✓" : "✗") : ""}</i></div>`;
      }).join("");
    $("boardTally").textContent = !bv ? B.noMove : bv.passed ? B.pass(bv.yes, bv.no) : B.fail(bv.yes, bv.no, t.moveName(bv.implemented));
    $("boardTally").className = "tip " + (!bv ? "" : bv.passed ? "tally-pass" : "tally-fail");'''),
('  P.querySelectorAll("[data-qe]").forEach(b => (b.onclick = () => { draft.qe = +b.dataset.qe; Sound.select(); sync(); }));',
 '  P.querySelectorAll("[data-qe]").forEach(b => (b.onclick = () => { draft.qe = +b.dataset.qe; Sound.select(); sync(); }));\n  P.querySelectorAll("[data-macro]").forEach(b => (b.onclick = () => { draft.macro = b.dataset.macro === "on"; Sound.stamp(); sync(); }));'),
('qe: prep.qe ? draft.qe || 0 : 0, qa: null };', 'qe: prep.qe ? draft.qe || 0 : 0, qa: null, buy: prep.budget ? draft.buy.slice() : [], macro: prep.canMacro ? !!draft.macro : false };'),
('''function presserBeat(inp) {
  const gg = g(), s = cur();
  flash(3);
  say({ cast: [{ prop: "podium" }], name: gg.you, role: gg.youRole, text: `${gg.speech.move(inp.move, pc(clamp(s.i + inp.move, M.iMin, M.iMax)))} ${gg.speech[inp.tone]}${inp.qe ? " " + gg.qeSpeech[inp.qe] : ""}` });
}''', '''function presserBeat(inp) {
  const gg = g(), s = cur(), bv = boardVote(s, game.sc, game.prep, inp.move), mv = bv.passed ? inp.move : bv.implemented;
  flash(3);
  say({ cast: [{ prop: "podium" }], name: gg.you, role: gg.youRole, text: `${bv.passed ? "" : gg.board.overruled + " "}${gg.speech.move(mv, pc(clamp(s.i + mv, M.iMin, M.iMax)))} ${gg.speech[inp.tone]}${inp.qe ? " " + gg.qeSpeech[inp.qe] : ""}` });
  if (!bv.passed) { shake(); Sound.bad(); }
}'''),
('function decisionHeadline(r) { return g().decisionHead(r.inp.move, pc(r.state.i), r.inp.tone); }',
 'function decisionHeadline(r) { return g().decisionHead(r.state.move, pc(r.state.i), r.inp.tone) + (r.vote ? ` (${g().board.voteTag(r.vote.yes, r.vote.no)})` : ""); }'),
('  const kicker = r.credParts.some(q => q[0] === "caved") ? gg.kicker.pressure :', '  const kicker = r.vote && !r.vote.passed ? gg.board.kickerOutvoted : r.credParts.some(q => q[0] === "caved") ? gg.kicker.pressure :'),
])

patch('js/10-end-menu.js', [
('<dt>${esc(gg.peakHeat)}</dt>', '<dt>${esc(gg.instBuilt)}</dt><dd style="white-space:normal">${esc(DEPTS.map(k => `${gg.depts[k][0]} ${(s.dept || initDept())[k]}`).join(" · "))}</dd>\n      <dt>${esc(gg.peakHeat)}</dt>'),
])

p = os.path.join(ROOT, 'styles', '30-hud-extras.css')
s = open(p, encoding='utf-8').read()
s += '''.board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
@media (max-width:760px){.board{grid-template-columns:repeat(2,minmax(0,1fr))}}
.bm{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);min-width:0}
.bm .avatar{width:30px;height:30px;font-size:11px}
.bm b{display:block;font:700 13px var(--f-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bm small{display:block;font:500 12px var(--f-ui);color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bm i{font:800 15px var(--f-ui);font-style:normal}
.bm.yes{box-shadow:inset 0 0 0 1.5px rgba(63,182,139,.65)} .bm.yes i{color:var(--green)}
.bm.no{box-shadow:inset 0 0 0 1.5px rgba(229,72,77,.65)} .bm.no i{color:var(--red)}
.bm.you{background:rgba(242,182,80,.08)}
.tip.tally-pass{color:#8FE3C0;font-weight:600} .tip.tally-fail{color:#FF9A9D;font-weight:600}
.budget-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:6px 16px}
.budget-pts{font:800 22px var(--f-ui);color:var(--amber)}
.depts{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
@media (max-width:900px){.depts{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:520px){.depts{grid-template-columns:minmax(0,1fr)}}
.dept{border-radius:14px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);padding:12px;display:grid;gap:8px;grid-template-rows:auto auto 1fr auto;animation:enter .4s both}
.dept header{display:flex;justify-content:space-between;align-items:center;gap:8px}
.dept header b{font:800 15px var(--f-ui)}
.pips{display:flex;gap:4px}
.pips i{width:16px;height:6px;border-radius:3px;background:rgba(255,255,255,.12)}
.pips i.on{background:var(--amber)} .pips i.new{background:var(--green)}
.dept p{margin:0;font:400 14px/1.4 var(--f-ui);color:#D5DAE6}
.dept p.next{color:var(--muted);font-size:13px}
'''
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('patched styles')
