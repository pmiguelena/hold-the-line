/* ═══════════════ GAME STATE ═══════════════ */
let game = null, draft = null, screen = "title";
const cur = () => game.hist[game.hist.length - 1];
const over = () => cur().t >= M.turns || !!cur().lost;
const lastReport = () => game.reports[game.reports.length - 1];
const QA_EFF = {
  q_pressure: [{ cred: 0.03, pop: -2 }, { cred: 0.01 }, { cred: -0.02 }],
  q_infl: [{ cred: 0.02, pop: -1.5 }, { cred: -0.03, pop: 2 }, { cred: -0.01 }],
  q_jobs: [{ cred: 0.02, pop: -2 }, s => (s.pi > 3 ? { cred: -0.02, pop: 2 } : { cred: 0.01, pop: 1 }), { pop: -2 }],
  q_trust: [{ cred: 0.02 }, { cred: -0.02 }, { cred: -0.03, pop: -1 }],
  q_guidance: [{ cred: 0.02 }, { cred: -0.02 }, {}],
  q_election: [{ cred: 0.03, pop: -1 }, { cred: -0.03, pop: 1 }, {}],
  q_generic: [{ cred: 0.01 }, { cred: -0.02, pop: 1.5 }, { pop: -1 }],
  q_rift: [{ cred: 0.02 }, { cred: -0.02, pop: 1 }, {}],
  q_markets: [{ cred: 0.03, pop: -2 }, { cred: -0.02, pop: 2 }, { cred: -0.01, pop: -1 }]
};
function qaId(s, prep, inp) {
  if (prep.pressure === "cut") return "q_pressure";
  if (drawdown(s) >= 10) return "q_markets";
  if (s.heat >= 60) return "q_rift";
  if (s.pi > 3.5) return "q_infl";
  if (s.x < -1.5) return "q_jobs";
  if (s.cred < 0.5) return "q_trust";
  if (inp.tone !== "neutral") return "q_guidance";
  if (prep.toElection >= 0 && prep.toElection <= 3) return "q_election";
  return "q_generic";
}
function qaEffect(s, prep, inp) { const e = QA_EFF[qaId(s, prep, inp)][inp.qa] || {}; return typeof e === "function" ? e(s) : e; }
/*FIN-START*/
M.turns = 18; M.election = 12;                      // a four-and-a-half year term, election two thirds in
const EQ_TREND = 1.012, Y10_NEUTRAL = 3.5, QE_RATE = 1.25, CRASH_DD = 18;
// Asset purchases: only near the zero bound. Same-quarter demand, softer long yields, cheaper for the Treasury.
const QE = [{ d: 0, s: 0, eq: 0, y: 0, heat: 0, cred: 0 },
            { d: 0.35, s: 0.04, eq: 1, y: 0.35, heat: -3, cred: -0.02 },
            { d: 0.8, s: 0.1, eq: 2.2, y: 0.8, heat: -7, cred: -0.05 }];
const CRASH = [{ d: 0.5, eq: 4, cred: 0.01, heat: -2 }, { d: -0.4, eq: -3, cred: 0.03, pop: -3, heat: 2 }];
// Financial conditions at the start of a quarter feed demand and prices.
function finFeed(s, sc) {
  // Households and firms judge markets against what they have got used to, so swings bite hard and then fade.
  const em = !!(sc && sc.em);
  const eqGap = clamp(100 * (s.eq / s.eqA - 1), -40, 40);   // stocks vs the accustomed level: wealth and confidence
  const fxDev = clamp(100 * (s.fx / s.fxA - 1), -40, 40);   // + = currency stronger than people are used to
  const yGap = s.y10 - Y10_NEUTRAL;                          // long rates the Bank does not set directly
  const bustD = -(s.bustSize || 0) * [0, 0.3, 0.6, 1][s.bust || 0];                       // a credit bust drags demand for three quarters
  const crunch = (s.bankCap ?? 100) < 75 ? -0.03 * (75 - s.bankCap) : 0;                 // thin bank capital means rationed credit
  // In an emerging market a weaker currency raises prices much more, and hurts demand through dollar debts.
  const d = clamp(0.03 * eqGap - 0.25 * yGap + (em ? 0.02 : -0.03) * fxDev + 0.04 * (s.lev || 0), -1.8, 1.2) + bustD + crunch;   // a credit boom feels good while it lasts
  return { d, s: clamp((em ? -0.12 : -0.05) * fxDev, -2.5, 2.5), eqGap, fxDev, yGap, bustD, crunch };
}
// Markets reprice the moment the decision lands.
function finStep(s, n, prep, inp, sc, t, gdT, qe, ext = {}) {
  const ts = inp.tone === "hawkish" ? 1 : inp.tone === "dovish" ? -1 : 0, em = !!sc.em;
  const h = (inp.move - prep.advisors.taylor + 0.25 * ts) * (inp.hDamp || 1), dcred = n.cred - s.cred;   // a good markets desk means smaller surprises
  const iwNow = ext.iwNow ?? 2.5, iwPrev = ext.iwPrev ?? 2.5, iw0 = sc.iw ? sc.iw[0] : 2.5;
  const eqRet = 1.2 - 2.5 * h + 1.4 * (n.x - s.x) - 0.8 * Math.max(0, n.pi - 3) + 12 * dcred
    + 4 * (sc.d[t] || 0) * ((sc.d[t] || 0) < 0 ? inp.eqDamp || 1 : 1) - 1.2 * (sc.s[t] || 0) + qe.eq + (gdT.eq || 0)
    - (ext.bustOnset ? 6 : 0) - (ext.ss ? 4 : 0);
  // Currency: surprises, credibility, the rate gap with the world, intervention and, in emerging markets, capital flight.
  const fxRet = 1.6 * h + 25 * dcred - 0.3 * (n.pi - s.pi) - 1.2 * qe.eq
    + 1.0 * ((n.i - iwNow) - (s.i - iwPrev)) - (em ? 1.0 * Math.max(0, iwNow - iwPrev) : 0) + (ext.fxI || 0) - (ext.ss ? 9 : 0);
  const yTarget = 1 + n.pe + 0.4 * (n.i - 1 - n.pi) + 3 * (0.8 - n.cred) + 0.015 * n.heat - qe.y
    + (em ? 0.35 : 0.25) * (iwNow - iw0) + (ext.ss ? 1.2 : 0);                             // world rates spill into long yields
  const eq = Math.max(20, s.eq * (1 + eqRet / 100)), fx = Math.max(30, s.fx * (1 + fxRet / 100));
  const eqA = s.eqA * EQ_TREND + 0.25 * (eq - s.eqA * EQ_TREND), fxA = s.fxA + 0.25 * (fx - s.fxA);
  return { eq, fx, eqA, fxA, y10: clamp(s.y10 + 0.55 * (yTarget - s.y10) + 0.35 * h, 0.1, 18),
    eqPeak: Math.max(s.eqPeak, eq), eqRet, fxRet };
}
const drawdown = s => 100 * (1 - (s.eq || 100) / (s.eqPeak || 100));
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
    credit: s.cg ?? (6 + 1.5 * s.x - 1.2 * (s.i - 3) - 0.15 * dd + 0.3 * (s.hpg || 0)), lev: s.lev || 0, bankCap: s.bankCap ?? 100,
    bank: clamp((s.bankCap ?? 100) - 20 - 1.2 * dd - 6 * Math.max(0, y - 5) - 4 * Math.max(0, -s.x - 1) + 40 * ((s.cred || 0.8) - 0.75) + (s.macro ? 8 : 0) + 5 * ((s.dept || {}).supervision || 0), 5, 100) };
}
// Data fog: inflation and growth arrive as first estimates, get revised a quarter later, and are final after two.
// Financial markets are observed in real time.
const FOG = { pi: 0.3, x: 0.6 };
function seenOf(h, sc, now) {
  const age = now - h.t, f = (age <= 0 ? 1 : age === 1 ? 0.4 : 0) * (h.fogM ?? 1);   // a stronger statistics office publishes better first estimates
  if (!f || !sc.errPi) return h;
  return Object.assign({}, h, { pi: h.pi + f * (sc.errPi[h.t] || 0), x: h.x + f * (sc.errX[h.t] || 0) });
}
// Staff forecast: projects from the data the Bank sees, with no new shocks, this move now and the rate held after.
function staffForecast(s, sc, inp, h = 4) {
  const z = () => new Array(M.turns + h + 3).fill(0), [fNow, fNext] = FORESIGHT[(s.dept || initDept()).research];
  const fs = { key: sc.key, year: sc.year, q: sc.q, cred: sc.cred, d: z(), s: z(), noiseD: z(), noiseS: z(), news: {}, dilemmas: {}, em: sc.em,
    iw: z().map((_, k) => (sc.iw ? sc.iw[Math.min(k, sc.iw.length - 1)] : 2.5)) };
  const t0 = s.t + 1;                                   // research lets staff see part of the shocks in the news, and later the ones coming
  [[t0, fNow], [t0 + 1, fNext]].forEach(([t, f]) => { fs.d[t] = f * (sc.d[t] || 0); fs.s[t] = f * (sc.s[t] || 0); });
  let st = seenOf(s, sc, s.t);
  const out = [];
  for (let k = 0; k < h; k++) {
    const p = prepGame(st, fs); p.gd = null;
    st = stepGame(st, fs, p, { move: k ? 0 : inp.move, tone: k ? "neutral" : inp.tone || "neutral", choice: null, qa: null, qe: k ? 0 : inp.qe || 0, macro: inp.macro, noVote: true }).state;
    out.push({ pi: st.pi, x: st.x });
  }
  return out;
}
// The historical shock arrays stop at quarter 12: extend them so the longer term stays alive.
function extendScenario(sc, seed) {
  const rng = rngFrom("ext:" + sc.key + ":" + seed), n = M.turns + 1;
  if (sc.key === "crisis" || sc.key === "pandemic") sc.d = sc.d.map(v => (v < 0 ? v * 1.5 : v));   // deep enough to hit the floor, as 2008 and 2020 did
  sc.news = Object.assign({}, sc.news); sc.dilemmas = Object.assign({}, sc.dilemmas);
  while (sc.d.length < n) sc.d.push(0);
  while (sc.s.length < n) sc.s.push(0);
  while (sc.noiseD.length < n) sc.noiseD.push(gauss(rng) * M.sdD);
  while (sc.noiseS.length < n) sc.noiseS.push(gauss(rng) * M.sdS);
  const frng = rngFrom("fog:" + sc.key + ":" + seed);          // first-estimate errors, drawn separately so events are unchanged
  sc.errPi = Array.from({ length: n }, (_, k) => (k ? gauss(frng) * FOG.pi : 0));
  sc.errX = Array.from({ length: n }, (_, k) => (k ? gauss(frng) * FOG.x : 0));
  const used = new Set(Object.keys(sc.news).map(Number)), fixed = SCEN[sc.key] && SCEN[sc.key].fixed;   // a teacher's scenario can switch surprises off
  for (let k = 0; k < (fixed ? 0 : 3); k++) {
    let t = 0, tries = 0;
    do { t = 9 + Math.floor(rng() * (M.turns - 9)); tries++; } while (tries < 40 && (used.has(t) || used.has(t - 1) || used.has(t + 1)));
    used.add(t);
    const ev = EVENT_POOL[Math.floor(rng() * EVENT_POOL.length)], mag = 0.9 + rng() * 0.8;
    [1, 0.6, 0.3].forEach((w, j) => { if (t + j <= M.turns) sc[ev.kind][t + j] += ev.sign * mag * w; });
    sc.news[t] = ev.id;
  }
  // The world interest rate: each era has its own global cycle. Big moves make the news.
  const wrng = rngFrom("world:" + sc.key + ":" + seed), IW = {
    pandemic: t => (t < 1 ? 1.75 : t < 9 ? 0.25 : Math.min(5.25, 0.25 + 1.25 * (t - 8))),     // near zero, then the 2022 hiking cycle
    crisis: t => (t < 2 ? 5 : t < 5 ? 5 - 1.5 * (t - 1) : 0.25),                              // global rates collapse after 2008
    oil: t => (t < 9 ? 6 + 0.2 * t : t < 13 ? 7.6 + 1.2 * (t - 8) : 12.4 - 0.8 * (t - 12))     // the late-1970s Volcker shock
  };
  sc.iw = [];
  for (let t = 0, w = 2.5; t <= M.turns + 8; t++) {
    if (IW[sc.key]) sc.iw.push(IW[sc.key](t));
    else { if (t && wrng() < 0.4) w = clamp(w + (wrng() < 0.5 ? -0.25 : 0.25), 0.25, 5); sc.iw.push(w); }
  }
  for (let t = 2; t <= M.turns; t++) { const dw = sc.iw[t] - sc.iw[t - 1]; if (Math.abs(dw) >= 0.75 && !sc.news[t]) sc.news[t] = dw > 0 ? "gl_up" : "gl_down"; }
  sc.bustRoll = Array.from({ length: n }, () => wrng());                                        // fixed dice for credit busts and sudden stops
  sc.ssRoll = Array.from({ length: n }, () => wrng());
  const free = Object.keys(DILEMMAS).filter(id => !Object.values(sc.dilemmas).includes(id)).sort(() => rng() - 0.5);
  if (!fixed) [12 + Math.floor(rng() * 2), 15 + Math.floor(rng() * 3)].forEach((t, k) => { if (!sc.dilemmas[t] && free[k]) sc.dilemmas[t] = free[k]; });
  return sc;
}
// A teacher's own scenario: each event [quarter, "d"|"s", size, duration, headline, details] becomes a fading shock path.
function customScenario(spec) {
  const n = M.turns, d = Array(n).fill(0), s = Array(n).fill(0), news = {}, dilemmas = {};
  (spec.ev || []).forEach(([t, kind, size, dur, head]) => {
    t = clamp(Math.round(+t || 1), 1, n); dur = clamp(Math.round(+dur || 1), 1, 6); size = clamp(+size || 0, -4, 4);
    for (let j = 0; j < dur && t + j <= n; j++) (kind === "s" ? s : d)[t + j - 1] += size * (1 - j / dur);
    if (head && !news[t]) news[t] = "cu" + t;
  });
  (spec.dl || []).forEach(([t, id]) => { if (DILEMMAS[id]) dilemmas[clamp(Math.round(+t || 1), 1, n)] = id; });
  SCEN.custom = { year: clamp(Math.round(+spec.y || 2027), 1900, 2100), q: clamp(Math.round(+spec.q || 1), 1, 4), cred: clamp(spec.c ?? 0.75, 0.3, 0.9), d, s, news, dilemmas, fixed: !spec.x };
  return SCEN.custom;
}
// Mandates: what the Bank is legally asked to deliver. The score weight on jobs, the credibility band and the government's patience differ.
const MANDATE = { price: { lam: 0.5, band: 1, gain: 0.02, slope: 0.05, heat: 0 }, dual: { lam: 1.0, band: 1.5, gain: 0.015, slope: 0.04, heat: -4 } };
const scoreGame = s => {
  if (s.lost) return { macro: 0, cred: 0, pop: 0, total: 0 };
  const lam = s.lam ?? 0.5, L = s.Lm ?? s.L;
  const macro = Math.round(550 * Math.exp(-L / (25 * (M.turns / 12) * (0.5 + lam))));
  return { macro, cred: Math.round(300 * s.cred), pop: Math.round(150 * Math.min(1, s.pop / 60)), total: macro + Math.round(300 * s.cred) + Math.round(150 * Math.min(1, s.pop / 60)) };
};
// Difficulty and economy type, applied after the scenario is built.
function applyMode(sc, hard, em, mandate, carry) {
  if (hard) { const f = sc.key === "oil" ? 1.15 : 1.3; ["d", "s"].forEach(k => (sc[k] = sc[k].map(v => v * f))); ["noiseD", "noiseS"].forEach(k => (sc[k] = sc[k].map(v => v * 1.4))); sc.cred = Math.max(0.3, sc.cred - 0.05); }
  if (em) { sc.em = true; sc.cred = Math.max(0.3, sc.cred - 0.08); }                           // emerging-market central banks start less trusted
  sc.mandate = mandate === "dual" ? "dual" : "price";
  if (carry) { sc.cred = clamp(carry.cred ?? sc.cred, 0.3, 0.9); sc.dept0 = carry.dept; sc.points0 = carry.points; }   // a career: the institution carries forward
  return sc;
}
/*FIN-END*/
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
/*INST-END*/
/*HEAT-START*/
// Political heat: how close the government is to removing the Governor (game layer, on top of the shared model).
const HEAT0 = 15;
const DIL_HEAT = { financing: [18, -10], hearing: [10, -8], bank: [0, 0], leak: [4, 0], currency: [0, 0], office: [0, 6], wages: [6, -6] };
const QA_HEAT = { q_markets: [0, -2, 0], q_pressure: [3, 0, -1], q_election: [4, -2, 0], q_jobs: [0, -2, 3], q_infl: [0, -2, 0], q_rift: [4, -4, 2], q_generic: [0, -1, 0] };
const TRUCE = [{ cred: 0.02, heat: 5 }, { cred: -0.05, pop: 2, heat: -25 }];
const GD = { truce: TRUCE, crash: CRASH };
const initGame = sc => Object.assign(initState(sc), { heat: HEAT0, heatPeak: HEAT0, eq: 100, eqA: 100, eqPeak: 100, fx: 100, fxA: 100, y10: Y10_NEUTRAL, crashUsed: false, catP: {}, hp: 100, hpg: 0.8, dept: sc.dept0 ? Object.assign(initDept(), sc.dept0) : initDept(), points: sc.points0 ?? BUDGET_START, board: BOARD0.slice(),
  Lm: 0, lam: (MANDATE[sc.mandate] || MANDATE.price).lam, mandate: sc.mandate || "price", macro: false, fogM: 1,
  lev: 0, cg: 6, bust: 0, bustSize: 0, bankCap: 100, reserves: sc.em ? 6 : 12, ssHit: false });
function prepGame(s, sc) {
  const p = prepare(seenOf(s, sc, s.t), sc), dept = s.dept || initDept();   // advisors, the government and the press all read the published data
  p.gd = p.dilemma ? null : drawdown(s) >= CRASH_DD + 4 * dept.supervision && !s.crashUsed ? "crash" : s.heat >= 55 ? "truce" : null;
  p.qe = s.i <= QE_RATE;
  p.budget = budgetQuarter(p.t); p.canMacro = dept.supervision >= 2;
  p.fxTool = !!sc.em || dept.markets >= 2; p.bustNow = s.bust === 3; p.ssLast = !!s.ssHit;
  return p;
}
function stepGame(s, sc, prep, inp) {
  const t = prep.t, dept = s.dept || initDept();
  const vote = inp.noVote ? null : boardVote(s, sc, prep, inp.move);
  const macro = !!inp.macro && dept.supervision >= 2;
  const fxL = sc.em || dept.markets >= 2 ? inp.fx || 0 : 0;                      // -1 buy reserves, 0 float, 1 sell, 2 sell heavily
  const iwNow = sc.iw ? sc.iw[t] : 2.5, iwPrev = sc.iw ? sc.iw[t - 1] : 2.5;
  const pSS = sc.em ? clamp(0.02 + 0.2 * Math.max(0, iwNow - iwPrev) + 0.4 * Math.max(0, 0.55 - s.cred) + ((s.reserves ?? 6) < 3 ? 0.08 : 0), 0, 0.6) : 0;
  const ss = !!(sc.ssRoll && sc.ssRoll[t] < pSS);                               // sudden stop: capital flees an emerging market
  inp = Object.assign({}, inp, { move: vote && !vote.passed ? vote.implemented : inp.move, toneK: TONEK[dept.comms],
    hDamp: 1 - 0.1 * dept.markets, eqDamp: 1 - 0.15 * dept.supervision - (macro ? 0.15 : 0) });
  const gdT = prep.gd && inp.choice != null ? GD[prep.gd][inp.choice] || {} : {};
  const q0 = QE[(prep.qe ? inp.qe : 0) || 0], qe = Object.assign({}, q0, { d: q0.d * QEK[dept.markets], y: q0.y * QEK[dept.markets] }), ff = finFeed(s, sc);
  const dSave = sc.d[t], sSave = sc.s[t];                       // financial conditions enter as demand and price shocks
  sc.d[t] = dSave + ff.d + (gdT.d || 0) + qe.d - (macro ? 0.15 : 0) - (ss ? 0.4 : 0);
  sc.s[t] = sSave + ff.s + qe.s;
  const res = resolve(s, sc, prep, inp);
  sc.d[t] = dSave; sc.s[t] = sSave;
  const n = res.state, hp = [], has = k => res.credParts.some(q => q[0] === k);
  const bump = (cred, pop, key) => {
    if (cred) { res.credParts.push([key, cred]); n.cred = clamp(n.cred + cred, 0.05, 0.95); }
    if (pop) { res.popParts.push([key, pop]); n.pop = clamp(n.pop + pop, 0, 100); }
  };
  const md = MANDATE[sc.mandate] || MANDATE.price, ci = res.credParts.findIndex(q => q[0] === "onTarget" || q[0] === "offTarget");
  if (ci >= 0 && md !== MANDATE.price) {                                                     // the mandate decides what counts as "on target"
    const old = res.credParts[ci][1], miss = Math.abs(n.pi - 2), nv = miss < md.band ? md.gain : -Math.min(0.15, md.slope * (miss - md.band));
    res.credParts[ci] = [nv >= 0 ? "onTarget" : "offTarget", nv]; n.cred = clamp(n.cred - old + nv, 0.05, 0.95);
  }
  n.lam = md.lam; n.Lm = (s.Lm || 0) + (n.pi - 2) ** 2 + md.lam * n.x ** 2; n.mandate = sc.mandate || "price";
  if (inp.qa != null) { const e = qaEffect(s, prep, inp); bump(e.cred, e.pop, "presser"); const h = (QA_HEAT[qaId(s, prep, inp)] || [])[inp.qa]; if (h) hp.push(["presser", h]); }
  if (prep.gd && inp.choice != null) { bump(gdT.cred, gdT.pop, "dilemma"); if (gdT.heat) hp.push([prep.gd, gdT.heat]); }
  if (qe.cred) bump(n.pi > 3 ? qe.cred : qe.cred * 0.3, 0, "qe");
  if (qe.heat) hp.push(["qe", qe.heat]);
  if (vote) { if (!vote.passed) bump(-0.04, 0, "outvoted"); else if (vote.no >= 2) bump(-0.01, 0, "divided"); else if (vote.no === 0) bump(0.005, 0, "united"); }
  if (macro) bump(0, -0.5, "macro");
  hp.push(["drift", ((s.pop >= 50 ? 10 : 20) + md.heat - s.heat) * 0.2]);
  if (prep.pressure === "cut" && inp.move > 0) hp.push(["defied", 5 * prep.level + (n.pop < 38 && prep.level >= 2 ? 10 : 0)]);
  else if (has("resisted")) hp.push(["resisted", 3 * prep.level]);
  if (has("caved")) hp.push(["caved", -10]);
  if (prep.dilemma && inp.choice != null) { const h = (DIL_HEAT[prep.dilemma] || [])[inp.choice]; if (h) hp.push(["dilemma", h]); }
  if (n.pop < 40 && inp.move >= 0) hp.push(["unpopular", 3]);
  if (res.election === "reelected") hp.push(["election", -15]);
  let heat = clamp(s.heat + hp.reduce((a, p) => a + p[1], 0), 0, 100);
  if (res.election === "defeated") { hp.push(["newGov", 12 - heat]); heat = 12; }
  n.heat = heat; n.heatPeak = Math.max(s.heatPeak || 0, heat);
  // The credit cycle: easy money and rising house prices push credit above trend; a big gap can burst.
  const cap0 = s.bankCap ?? 100;
  const cg = 6 + 1.2 * n.x - 1.5 * (n.i - n.pe - M.rStar) + 0.3 * (s.hpg || 0) + 1.5 * Math.max(0, dSave || 0) - 0.15 * drawdown(s)
    - (macro ? 2.5 : 0) - (cap0 < 75 ? 0.1 * (75 - cap0) : 0);                      // cheap real money, rising house prices and demand booms feed credit
  const lev = 0.92 * (s.lev || 0) + 0.3 * (cg - 6);
  const pBust = (s.bust || 0) > 0 || lev < 4 ? 0 : (1 - 0.2 * dept.supervision) / (1 + Math.exp(-(0.45 * (lev - 10) + 1.5 * Math.max(0, n.i - s.i) + 0.05 * drawdown(s))));
  const bustOnset = !!(sc.bustRoll && sc.bustRoll[t] < pBust);
  const bankLoss = bustOnset ? (10 + lev) * (1 - 0.2 * dept.supervision) : 0;
  n.cg = cg; n.lev = bustOnset ? lev * 0.5 : lev;
  n.bust = bustOnset ? 3 : Math.max(0, (s.bust || 0) - 1); n.bustSize = bustOnset ? 0.9 + 0.08 * lev : s.bustSize || 0;
  const FXI = { "-1": [-1.5, 0.8], 0: [0, 0], 1: [2.2, -1], 2: [4, -2] }[fxL] || [0, 0], resv0 = s.reserves ?? (sc.em ? 6 : 12);
  if (fxL > 0 && resv0 < 3) bump(-0.02, 0, "lastReserves");
  Object.assign(n, finStep(s, n, prep, inp, sc, t, gdT, qe, { fxI: FXI[0] * (1 + 0.15 * dept.markets), ss, bustOnset, iwNow, iwPrev }));
  n.bankCap = clamp(cap0 + (n.x > -1 ? 1.5 : 0.5) - 20 * Math.max(0, n.y10 - s.y10 - 0.5) - bankLoss, 30, 130);   // profits rebuild capital; busts and bond losses eat it
  n.reserves = Math.max(0, resv0 + FXI[1] + (sc.em ? 0.1 : 0)); n.ssHit = ss;
  res.bust = bustOnset; res.ss = ss;
  const shock = (sSave || 0) + (sc.noiseS[t] || 0), mix = supplyMix(sc, t), P0 = s.catP || {};
  n.catP = {};
  for (const c of ["food", "energy", "goods"]) n.catP[c] = 0.2 * (P0[c] || 0) + shock * (mix[c] || 0);
  n.hpg = clamp(0.8 + 1.0 * n.x - 0.9 * (n.y10 - Y10_NEUTRAL) + 1.5 * (dSave || 0) + 0.5 * (n.x - s.x) - (macro ? 1.5 : 0) - (n.bust > 0 ? 2.5 : 0) + 0.12 * (s.lev || 0), -8, 8);   // credit feeds house prices, which feed credit   // house prices, % a quarter
  n.hp = (s.hp || 100) * (1 + n.hpg / 100);
  n.crashUsed = s.crashUsed || prep.gd === "crash";
  const buys = budgetQuarter(t) ? inp.buy || [] : [], cost = buyCost(dept, buys);
  n.dept = Object.assign({}, dept); n.points = s.points ?? BUDGET_START;          // upgrades bought now work from next quarter
  if (buys.length && cost <= n.points) { for (const k of buys) n.dept[k]++; n.points -= cost; }
  if (t % 4 === 0) n.points += BUDGET_YEAR + (n.cred >= 0.8 ? 1 : 0) - (n.heat >= 60 ? 1 : 0);
  n.fogM = FOGM[dept.stats]; n.macro = macro;
  n.board = (s.board || BOARD0).slice();
  if (res.election === "defeated") n.board = n.board.map(id => (id === "rubio" ? "vane" : id));
  else if (n.heat >= 75 && !n.board.includes("rubio")) { n.board = n.board.map(id => (id === "vane" ? "rubio" : id)); res.stacked = true; }
  res.vote = vote;
  if (n.lost === "fired" && n.pop >= M.popFire) n.lost = null;               // the model's instant firing becomes heat instead
  if (!n.lost && n.cred < M.credLose) n.lost = "cred";
  if (!n.lost && (n.pop < M.popFire || heat >= 100 || (heat >= 80 && n.pop < 35))) n.lost = "fired";
  if (!n.lost && ss && resv0 < 1) n.lost = "fxcrisis";                              // capital fled and there was nothing left to defend with
  res.heatParts = hp; res.ff = ff;
  return res;
}
function ruleBoundGame(sc) {
  let s = initGame(sc);
  while (s.t < M.turns && !s.lost) { const p = prepGame(s, sc); s = stepGame(s, sc, p, { move: p.advisors.taylor, tone: "neutral", choice: 0, qa: null, qe: p.qe && s.x < -0.5 ? 2 : 0, buy: p.budget ? ruleBuys(s) : [] }).state; }
  return s;
}
/*HEAT-END*/
/*TEACH-START*/
// US federal funds rate, quarterly averages (approximate), from each era's first quarter: 1973 Q3, 2007 Q3, 2020 Q1.
const FED_PATH = {
  oil: [10.56, 10.0, 9.32, 11.25, 12.09, 9.35, 6.3, 5.42, 6.16, 5.41, 4.83, 5.2, 5.28, 4.87, 4.66, 5.16, 5.82, 6.51, 6.76],
  crisis: [5.07, 4.5, 3.18, 2.09, 1.94, 0.51, 0.18, 0.18, 0.16, 0.12, 0.13, 0.19, 0.19, 0.19, 0.16, 0.09, 0.08, 0.07, 0.1],
  pandemic: [1.26, 0.06, 0.09, 0.09, 0.08, 0.07, 0.09, 0.08, 0.12, 0.77, 2.19, 3.65, 4.52, 4.99, 5.26, 5.33, 5.33, 5.33, 5.26]
};
const ruleInput = (s, p) => ({ move: p.advisors.taylor, tone: "neutral", choice: 0, qa: null, qe: p.qe && s.x < -0.5 ? 2 : 0, buy: p.budget ? ruleBuys(s) : [] });
function rulePath(sc) {
  let s = initGame(sc); const H = [s];
  while (s.t < M.turns && !s.lost) { const p = prepGame(s, sc); s = stepGame(s, sc, p, ruleInput(s, p)).state; H.push(s); }
  return H;
}
// Replays the player's own inputs with quarter k's rate move replaced: "what if you had followed the rule just then?"
// With `levels` (your actual rate path), the rate is forced from quarter k on (no board vote), so later quarters return to
// your rates. Comparing two such replays (your move vs the rule's) isolates that single decision.
function replayGame(sc, inputs, k, move, levels) {
  let s = initGame(sc);
  for (let j = 0; j < inputs.length && s.t < M.turns && !s.lost; j++) {
    const p = prepGame(s, sc), force = levels && j >= k;
    const inp = Object.assign({}, inputs[j], j === k ? { move } : {}, force ? { noVote: true } : {}, force && j > k ? { move: levels[j] - s.i } : {});
    if ((p.dilemma || p.gd) && inp.choice == null) inp.choice = 0;
    s = stepGame(s, sc, p, inp).state;
  }
  return s;
}
function debriefData(sc, inputs, reports) {
  const s0 = initGame(sc), last = reports.length ? reports[reports.length - 1].state : s0;
  const levels = reports.map(r => r.state.i);
  const devs = reports.map((r, k) => ({ k, t: r.prep.t, you: +(r.state.i - r.prev.i).toFixed(2), asked: r.inp.move, rule: r.prep.advisors.taylor }))
    .filter(c => Math.abs(c.you - c.rule) > 0.01);                                         // judged on the move carried out, after the board vote
  const moments = devs.map(c => {
    const r = reports[c.k], seen = seenOf(r.prev, sc, r.prev.t);
    const mine = replayGame(sc, inputs, c.k, c.you, levels), alt = replayGame(sc, inputs, c.k, c.rule, levels);
    const impact = Math.round(scoreGame(mine).total - scoreGame(alt).total);
    const kind = c.you < c.rule ? (seen.pi >= 2.5 ? "easeHigh" : "ease") : (seen.x < -0.5 || seen.pi < 1.5 ? "tightLow" : "tight");
    const lesson = alt.lost && !mine.lost ? "ruleLost" : mine.lost && !alt.lost ? "youLost" : Math.abs(impact) < 3 ? "same" : kind + (impact > 0 ? "Help" : "Hurt");
    return { ...c, impact, pi: seen.pi, x: seen.x, lesson, overruled: Math.abs(c.asked - c.you) > 0.01, caved: r.credParts.some(q => q[0] === "caved") };
  }).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 3).sort((a, b) => a.k - b.k);
  return { moments, deviations: devs.length, N: reports.length, onTarget: reports.filter(r => Math.abs(r.state.pi - 2) < 1).length, cred0: s0.cred, cred1: last.cred, score: scoreGame(last).total };
}
/*TEACH-END*/
function advance(inp) {
  const s = cur(), prep = prepGame(s, game.sc), res = stepGame(s, game.sc, prep, inp);
  game.inputs.push(inp); game.hist.push(res.state);
  game.reports.push({ prep, inp, prev: s, ...res });
  saveGame();
}
const seenNow = () => seenOf(cur(), game.sc, cur().t);
const SAVE_KEY = "holdtheline.save";
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ cfg: game.cfg, inputs: game.inputs })); } catch {} }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }
function loadSave() {
  try {
    const sv = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (sv && sv.cfg && sv.cfg.scenario === "custom" && sv.cfg.cs) installCustom(sv.cfg.cs);
    return sv && sv.cfg && SCEN[sv.cfg.scenario] && Array.isArray(sv.inputs) && sv.inputs.length < M.turns ? sv : null;
  } catch { return null; }
}
function spark(vals, color, ref) {
  if (vals.length < 2) return `<svg class="spark" viewBox="0 0 64 18" aria-hidden="true"></svg>`;
  const lo = Math.min(...vals, ref), hi = Math.max(...vals, ref), span = hi - lo || 1;
  const X = k => 2 + (k * 60) / M.turns, Y = v => 16 - ((v - lo) / span) * 14, pts = vals.map((v, k) => [X(k), Y(v)]), e = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 64 18" aria-hidden="true"><line x1="2" x2="62" y1="${Y(ref).toFixed(1)}" y2="${Y(ref).toFixed(1)}" stroke="#fff" stroke-opacity=".2"/><path d="${smoothPath(pts)}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/><circle cx="${e[0].toFixed(1)}" cy="${e[1].toFixed(1)}" r="2" fill="${color}"/></svg>`;
}
function confetti() {
  const cols = ["#F2B650", "#E5484D", "#3FB68B", "#5B9BD5", "#F5EFE3"], f = $("frame");
  for (let k = 0; k < 90; k++) {
    const p = document.createElement("i"); p.className = "confetti";
    p.style.left = `${Math.random() * 100}%`; p.style.background = cols[k % cols.length];
    p.style.setProperty("--d", `${2.2 + Math.random() * 2}s`); p.style.animationDelay = `${Math.random() * 0.8}s`;
    f.appendChild(p); setTimeout(() => p.remove(), 5400);
  }
}
function quarterLabel(k) { const z = game.sc.q - 1 + k; return `${game.sc.year + Math.floor(z / 4)} Q${(z % 4) + 1}`; }

