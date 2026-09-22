/* ═══════════════ MODEL (pure: no DOM) ═══════════════ */
const M = {
  piStar: 2, rStar: 1, rho: 0.6, sigInv: 0.35, gMult: 0.3, g0: 20,
  kLag: 0.3, kNow: 0.1, sdD: 0.15, sdS: 0.12,
  turns: 12, election: 8, iMin: 0, iMax: 10,
  toneX: 0.2, tonePe: 0.35,
  credLose: 0.12, popFire: 25, popFireDefy: 38
};
const MOVES = [-1, -0.5, -0.25, 0, 0.25, 0.5, 1];

const SCEN = {
  random:   { year: 2027, q: 1, cred: 0.75 },
  oil:      { year: 1973, q: 3, cred: 0.6,
              d: [0, 0, -0.5, -0.3, 0, 0, 0, 0, 0, 0, 0, 0],
              s: [0, 1.6, 1.3, 0.8, 0.5, 0.3, 0, 0, 0, 0, 0, 0],
              news: { 1: "oil1", 2: "oil2", 3: "oil3", 6: "oil4" },
              dilemmas: { 3: "wages", 5: "financing", 9: "hearing" } },
  crisis:   { year: 2007, q: 3, cred: 0.8,
              d: [0, 0, -1.1, -1.6, -1.1, -0.6, -0.3, 0, 0, 0, 0, 0],
              s: [0, 0.3, 0.3, -0.3, -0.3, 0, 0, 0, 0, 0, 0, 0],
              news: { 1: "cr1", 2: "cr2", 3: "cr3", 4: "cr4", 7: "cr5" },
              dilemmas: { 2: "bank", 6: "financing", 10: "leak" } },
  pandemic: { year: 2020, q: 1, cred: 0.8,
              d: [0, -3.5, 1.6, 0.5, 0, 0, 0, 0, 0, 0, 0, 0],
              s: [0, -0.5, 0, 0, 0.8, 1.1, 0.8, 0.5, 0, 0, 0, 0],
              news: { 1: "pa1", 2: "pa2", 4: "pa3", 5: "pa4", 8: "pa5" },
              dilemmas: { 3: "financing", 6: "currency", 10: "office" } }
};
const EVENT_POOL = [
  { id: "ev_house", kind: "d", sign: -1 }, { id: "ev_stocks", kind: "d", sign: -1 },
  { id: "ev_credit", kind: "d", sign: 1 }, { id: "ev_exports", kind: "d", sign: 1 },
  { id: "ev_drought", kind: "s", sign: 1 }, { id: "ev_oil", kind: "s", sign: 1 },
  { id: "ev_tech", kind: "s", sign: -1 }, { id: "ev_commod", kind: "s", sign: -1 }
];
// Option 0 is always the institutional answer; option 1 the politically convenient one.
const DILEMMAS = {
  financing: [{ cred: 0.05, pop: -3 }, { cred: -0.15, pop: 5, g: 1.5, pe: 0.4 }],
  hearing:   [{ cred: 0.04, pop: -2 }, { cred: -0.06, pop: 3 }],
  bank:      [{ cred: 0.02, d: -0.3 }, { cred: 0.01, d: -1.4, pop: -4 }],
  leak:      [{ cred: 0.03 }, { cred: -0.07, pop: 1 }],
  currency:  [{ cred: 0.03, s: 0.6 }, { cred: -0.04 }],
  office:    [{ cred: 0.03 }, { cred: -0.06, pop: 2 }],
  wages:     [{ cred: 0.03, pop: -3 }, { cred: -0.03, pop: 3, pe: 0.5 }]
};

function hashStr(str) {
  let h = 1779033703 ^ str.length;
  for (let k = 0; k < str.length; k++) { h = Math.imul(h ^ str.charCodeAt(k), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0;
}
function rngFrom(seed) {
  let a = hashStr(seed);
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = rng => { let u = 0; while (!u) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r25 = v => Math.round(v * 4) / 4;

function buildScenario(key, seed) {
  const base = SCEN[key], rng = rngFrom(key + ":" + seed);
  const sc = { key, year: base.year, q: base.q, cred: base.cred, d: Array(13).fill(0), s: Array(13).fill(0), news: {}, dilemmas: {} };
  if (key === "random") {
    const used = new Set();
    for (let e = 0; e < 2; e++) {
      let t; do { t = 2 + Math.floor(rng() * 8); } while (used.has(t) || used.has(t - 1) || used.has(t + 1));
      used.add(t);
      const ev = EVENT_POOL[Math.floor(rng() * EVENT_POOL.length)], mag = 0.8 + rng() * 0.7;
      [1, 0.6, 0.3].forEach((w, j) => { if (t + j <= 12) sc[ev.kind][t + j] += ev.sign * mag * w; });
      sc.news[t] = ev.id;
    }
    const ids = Object.keys(DILEMMAS).map(id => [rng(), id]).sort((a, b) => a[0] - b[0]).slice(0, 3).map(p => p[1]);
    [2 + Math.floor(rng() * 3), 5 + Math.floor(rng() * 3), 9 + Math.floor(rng() * 3)].forEach((t, k) => (sc.dilemmas[t] = ids[k]));
  } else {
    base.d.forEach((v, j) => (sc.d[j + 1] = v)); base.s.forEach((v, j) => (sc.s[j + 1] = v));
    sc.news = base.news; sc.dilemmas = base.dilemmas;
  }
  sc.noiseD = Array.from({ length: 13 }, () => gauss(rng) * M.sdD);
  sc.noiseS = Array.from({ length: 13 }, () => gauss(rng) * M.sdS);
  return sc;
}

const initState = sc => ({ t: 0, pi: 2, pe: 2, x: 0, i: 3, g: 20, gExtra: 0, peExtra: 0, cred: sc.cred, pop: 55,
  P: 100, Y: 100, pot: 100, neg: 0, hot: 0, L: 0, lost: null, tone: "neutral", move: 0, govt: "inc", honey: 0 });

const taylorRate = s => M.rStar + s.pi + 0.5 * (s.pi - 2) + 0.5 * s.x;
const bandMove = (s, target) => {
  const raw = clamp(r25(target) - s.i, -1, 1);
  return MOVES.reduce((b, m) => (Math.abs(m - raw) < Math.abs(b - raw) && s.i + m >= 0 ? m : b), 0);
};

// What the government, press and advisors do before the governor decides turn t = s.t + 1
function prepare(s, sc) {
  const t = s.t + 1, toElection = M.election - t;
  let gTarget = s.govt === "opp" ? 19 : 20;
  if (toElection >= 0 && toElection <= 3 && s.pop < 58) gTarget += (4 - toElection) * 0.6;
  if (s.x < -1.5) gTarget += 1.5;
  const g = clamp(s.g + clamp(gTarget - s.g, -1, 1), 16, 26);
  let pressure = null, level = 0;
  if (s.pi > 6) { pressure = "hike"; level = 2; }
  else if (s.i > 0.25 && toElection >= 0 && (toElection <= 3 || s.pop < 45)) { pressure = "cut"; level = toElection <= 1 ? 3 : toElection <= 3 ? 2 : 1; }
  else if (s.i > 0.25 && toElection < 0 && s.pop < 40) { pressure = "cut"; level = 1; }
  const advisors = {
    keynes: bandMove(s, M.rStar + s.pe + 0.25 * (s.pi - 2) + 1.0 * s.x),
    friedman: bandMove(s, M.rStar + s.pe + 1.0 * (s.pi - 2) + 0.1 * s.x + (s.cred < 0.5 ? 0.5 : 0)),
    taylor: bandMove(s, taylorRate(s))
  };
  return { t, g, pressure, level, toElection, dilemma: sc.dilemmas[t] || null, news: sc.news[t] || null, advisors };
}

function resolve(s, sc, prep, inp) {
  const t = prep.t, move = inp.move, i = clamp(s.i + move, M.iMin, M.iMax);
  const eff = prep.dilemma && inp.choice != null ? DILEMMAS[prep.dilemma][inp.choice] : {};
  const toneSign = inp.tone === "hawkish" ? -1 : inp.tone === "dovish" ? 1 : 0;
  const credParts = [], popParts = [];
  const gExtra = s.gExtra * 0.6 + (eff.g || 0), peExtra = s.peExtra * 0.5 + (eff.pe || 0);
  const g = prep.g + gExtra;

  const tk = inp.toneK || 1;                                          // communications capacity scales how far words move expectations
  const pe = s.cred * 2 + (1 - s.cred) * s.pi + toneSign * M.tonePe * tk * s.cred + peExtra;
  const x = M.rho * s.x - M.sigInv * (i - pe - M.rStar) + M.gMult * (g - M.g0) + toneSign * M.toneX * tk
    + sc.d[t] + sc.noiseD[t] + (eff.d || 0);
  const pi = pe + M.kLag * s.x + M.kNow * x + sc.s[t] + sc.noiseS[t] + (eff.s || 0);

  const miss = Math.abs(pi - 2);
  if (miss < 1) credParts.push(["onTarget", 0.02]);
  else credParts.push(["offTarget", -Math.min(0.15, 0.05 * (miss - 1))]);
  if (prep.pressure === "cut" && s.pi > 2.5) credParts.push(move < 0 ? ["caved", -0.06] : ["resisted", 0.02]);
  if (s.tone === "hawkish" && move < 0) credParts.push(["brokeHawk", -0.07]);
  else if (s.tone === "dovish" && move > 0) credParts.push(["brokeDove", -0.07]);
  else if (s.tone !== "neutral") credParts.push(["keptWord", 0.01]);
  if (eff.cred) credParts.push(["dilemma", eff.cred]);
  const cred = clamp(s.cred + credParts.reduce((a, p) => a + p[1], 0), 0.05, 0.95);

  const econTarget = 50 + 5 * x - 3 * Math.max(0, pi - 3) - 4 * Math.max(0, -pi) + s.honey;
  popParts.push(["economy", 0.3 * (econTarget - s.pop)]);
  if (move > 0) popParts.push(["hike", -2.5 * move]);
  if (move < 0) popParts.push(["cut", -1 * move]);
  if (g - s.g > 0.05) popParts.push(["spending", 0.8 * (g - s.g)]);
  if (eff.pop) popParts.push(["dilemma", eff.pop]);
  let pop = clamp(s.pop + popParts.reduce((a, p) => a + p[1], 0), 0, 100);

  let govt = s.govt, honey = Math.max(0, s.honey - 2), election = null;
  if (t === M.election) {
    election = pop >= 50 ? "reelected" : "defeated";
    if (election === "defeated") { govt = "opp"; honey = 8; popParts.push(["newGov", 58 - pop]); pop = 58; }
  }

  const pot = s.pot * 1.005;
  const n = { t, pi, pe, x, i, g, gExtra, peExtra, cred, pop, pot, P: s.P * (1 + pi / 400), Y: pot * (1 + x / 100),
    neg: pi < 0 ? s.neg + 1 : 0, hot: pi > 10 ? s.hot + 1 : 0, L: s.L + (pi - 2) ** 2 + 0.5 * x ** 2,
    tone: inp.tone, move, govt, honey, lost: null };
  const fired = pop < M.popFire || (pop < M.popFireDefy && prep.pressure === "cut" && prep.level >= 2 && move > 0);
  n.lost = n.neg >= 3 ? "defl" : n.hot >= 3 ? "infl" : cred < M.credLose ? "cred" : fired ? "fired" : null;
  return { state: n, credParts, popParts, election, surprise: move - prep.advisors.taylor };
}

const scoreParts = s => {
  if (s.lost) return { macro: 0, cred: 0, pop: 0, total: 0 };
  const macro = Math.round(550 * Math.exp(-s.L / 25)), cred = Math.round(300 * s.cred), pop = Math.round(150 * Math.min(1, s.pop / 60));
  return { macro, cred, pop, total: macro + cred + pop };
};
function ruleBound(sc) {
  let s = initState(sc);
  while (s.t < M.turns && !s.lost) { const p = prepare(s, sc); s = resolve(s, sc, p, { move: p.advisors.taylor, tone: "neutral", choice: 0 }).state; }
  return s;
}
/* ═══════════════ END MODEL ═══════════════ */

