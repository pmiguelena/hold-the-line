import { test } from "node:test";
import assert from "node:assert/strict";
import { model, simulate, POLICIES } from "./helpers.mjs";

const m = model();
const LEVELS = ["random", "pandemic", "crisis", "oil"];
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const run = (level, pol, n = 120, hard = false) => Array.from({ length: n }, (_, k) => simulate(m, level, "T" + k, POLICIES[pol], hard));

test("term length and election", () => {
  assert.equal(m.M.turns, 18);
  assert.equal(m.M.election, 12);
});

test("same seed, same game", () => {
  const a = simulate(m, "crisis", "SAME", POLICIES.rule), b = simulate(m, "crisis", "SAME", POLICIES.rule);
  assert.equal(a.pi, b.pi);
  assert.equal(a.eq, b.eq);
  assert.equal(a.heat, b.heat);
});

test("scenario extension does not leak into the shared scenario table", () => {
  const before = JSON.stringify(m.SCEN.oil);
  m.extendScenario(m.buildScenario("oil", "X1"), "X1");
  m.extendScenario(m.buildScenario("oil", "X2"), "X2");
  assert.equal(JSON.stringify(m.SCEN.oil), before);
});

for (const level of LEVELS) {
  test(`${level}: a rule-following governor finishes and scores in a sensible band`, () => {
    const games = run(level, "rule");
    const finished = games.filter(s => !s.lost).length / games.length;
    const score = mean(games.map(s => m.scoreGame(s).total));
    assert.ok(finished >= 0.95, `finished only ${(finished * 100).toFixed(0)}%`);
    assert.ok(score >= 500 && score <= 880, `mean score ${score.toFixed(0)}`);
  });
}

test("always giving the government what it wants costs credibility", () => {
  const games = run("oil", "yesMan", 60);
  assert.ok(games.filter(s => s.lost === "cred").length / games.length > 0.5);
});

test("hard mode is harder but still winnable", () => {
  for (const level of LEVELS) {
    const normal = mean(run(level, "rule", 60).map(s => m.scoreGame(s).total));
    const hard = mean(run(level, "rule", 60, true).map(s => m.scoreGame(s).total));
    assert.ok(hard < normal, `${level}: hard ${hard.toFixed(0)} >= normal ${normal.toFixed(0)}`);
    assert.ok(hard > 350, `${level}: hard mean ${hard.toFixed(0)}`);
  }
});

test("data fog: first estimates are off, revisions shrink the error, data is final after two quarters", () => {
  const S = m.extendScenario(m.buildScenario("random", "FOG1"), "FOG1");
  const h = { t: 5, pi: 2, x: 0 };
  assert.equal(m.seenOf(h, S, 5).pi, 2 + S.errPi[5]);
  assert.ok(Math.abs(m.seenOf(h, S, 6).pi - 2) < Math.abs(S.errPi[5]) + 1e-12);
  assert.equal(m.seenOf(h, S, 7).pi, 2);
  const sd = Math.sqrt(S.errX.slice(1).reduce((a, v) => a + v * v, 0) / (S.errX.length - 1));
  assert.ok(sd > 0.25 && sd < 1.2, `output-gap estimate error sd ${sd}`);
});

test("staff forecast: hiking now lowers projected inflation versus holding", () => {
  const S = m.extendScenario(m.buildScenario("random", "FC1"), "FC1");
  const s = m.initGame(S);
  const hold = m.staffForecast(s, S, { move: 0 }), hike = m.staffForecast(s, S, { move: 1 });
  assert.equal(hold.length, 4);
  assert.ok(hike[2].pi < hold[2].pi, `hike ${hike[2].pi} vs hold ${hold[2].pi}`);
  assert.ok(hike[0].x < hold[0].x, "a hike should cool output first");
});

test("price categories always average back to headline inflation", () => {
  for (const level of LEVELS) {
    const S = m.extendScenario(m.buildScenario(level, "CAT"), "CAT");
    let s = m.initGame(S);
    while (s.t < m.M.turns && !s.lost) {
      const p = m.prepGame(s, S); s = m.stepGame(s, S, p, POLICIES.rule(s, p)).state;
      const E = m.econDetail(s), avg = Object.keys(m.CPI_W).reduce((a, c) => a + m.CPI_W[c] * E.cat[c], 0);
      assert.ok(Math.abs(avg - s.pi) < 1e-9, `${level} q${s.t}: basket ${avg} vs headline ${s.pi}`);
    }
  }
});

test("the map tells the right story: energy leads in 1973, construction suffers in 2008", () => {
  const peak = (level, f) => {
    const S = m.extendScenario(m.buildScenario(level, "STORY"), "STORY");
    let s = m.initGame(S), best = -Infinity;
    for (let t = 0; t < 6; t++) { const p = m.prepGame(s, S); s = m.stepGame(s, S, p, POLICIES.rule(s, p)).state; best = Math.max(best, f(m.econDetail(s), s)); }
    return best;
  };
  assert.ok(peak("oil", (E, s) => E.cat.energy - s.pi) > 3, "energy should run well above headline in the oil shock");
  const S = m.extendScenario(m.buildScenario("crisis", "STORY"), "STORY");
  let s = m.initGame(S), worst = Infinity;
  for (let t = 0; t < 6; t++) { const p = m.prepGame(s, S); s = m.stepGame(s, S, p, POLICIES.rule(s, p)).state; const E = m.econDetail(s); worst = Math.min(worst, E.sec.construction - s.x); }
  assert.ok(worst < -0.5, "construction should fall more than the economy in the 2008 crisis");
});

test("budget: upgrades cost points, work from next quarter, and a new year brings new points", () => {
  const S = m.extendScenario(m.buildScenario("random", "BUD"), "BUD");
  let s = m.initGame(S);
  assert.equal(s.points, 3);
  assert.equal(m.buyCost(s.dept, ["stats", "stats"]), 3);        // level 1 costs 1, level 2 costs 2
  assert.equal(m.buyCost(s.dept, ["stats", "stats", "stats", "stats"]), Infinity);
  let p = m.prepGame(s, S);
  assert.ok(p.budget);
  s = m.stepGame(s, S, p, { ...POLICIES.rule(s, p), buy: ["stats", "research", "comms"] }).state;
  assert.deepEqual([s.dept.stats, s.dept.research, s.dept.comms, s.points], [1, 1, 1, 0]);
  assert.equal(s.fogM, 1, "quarter 1 was published before the upgrade");
  for (let k = 0; k < 3; k++) { p = m.prepGame(s, S); assert.ok(!p.budget); s = m.stepGame(s, S, p, { ...POLICIES.rule(s, p), buy: ["markets"] }).state; }
  assert.equal(s.dept.markets, 0, "no shopping outside the budget meeting");
  assert.ok(s.points >= 3 && s.points <= 4, `year-end grant gave ${s.points}`);
  assert.ok(s.fogM < 1, "better statistics should shrink later first estimates");
});

test("board: the rule's move passes, a wild move is overruled by the median member", () => {
  const S = m.extendScenario(m.buildScenario("random", "BRD"), "BRD");
  const s = m.initGame(S), p = m.prepGame(s, S);
  const ok = m.boardVote(s, S, p, p.advisors.taylor);
  assert.ok(ok.passed && ok.yes >= 3, `rule move got ${ok.yes} votes`);
  const wild = m.boardVote(s, S, p, 1);
  assert.ok(!wild.passed, "a one-point hike in calm times should lose");
  const sorted = [1, ...wild.votes.map(v => v.pref)].sort((a, b) => a - b);
  assert.equal(wild.implemented, sorted[2]);
  const r = m.stepGame(s, S, p, { move: 1, tone: "neutral", choice: null, qa: null });
  assert.equal(r.state.move, wild.implemented, "the board's decision is what happens");
  assert.ok(r.credParts.some(q => q[0] === "outvoted"));
});

test("a government at war with the Bank stacks the board with a loyalist", () => {
  const S = m.extendScenario(m.buildScenario("random", "STK"), "STK");
  const s = Object.assign(m.initGame(S), { heat: 99 });
  const r = m.stepGame(s, S, m.prepGame(s, S), { move: 0, tone: "neutral", choice: null, qa: null });
  assert.ok(r.stacked);
  assert.ok(r.state.board.includes("rubio") && !r.state.board.includes("vane"));
});

test("building the institution pays off", () => {
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const builder = (s, p) => ({ ...POLICIES.rule(s, p), buy: p.budget ? m.ruleBuys(s) : [] });
  for (const level of ["random", "crisis"]) {
    const plain = mean(Array.from({ length: 80 }, (_, k) => m.scoreGame(simulate(m, level, "I" + k, POLICIES.rule)).total));
    const built = mean(Array.from({ length: 80 }, (_, k) => m.scoreGame(simulate(m, level, "I" + k, builder)).total));
    assert.ok(built > plain, `${level}: built ${built.toFixed(0)} vs plain ${plain.toFixed(0)}`);
  }
});

const lowBias = (s, p) => { const mv = Math.max(-1, p.advisors.taylor - 0.25); return { move: s.i + mv < 0 ? 0 : mv, tone: "neutral", choice: 0, qa: 0, qe: 0 }; };
const playFrom = (level, seed, policy, setup = s => s, em = false) => {
  const S = m.applyMode(m.extendScenario(m.buildScenario(level, seed), seed), false, em);
  let s = setup(m.initGame(S)), busts = 0;
  while (s.t < m.M.turns && !s.lost) { const p = m.prepGame(s, S); const r = m.stepGame(s, S, p, policy(s, p)); if (r.bust) busts++; s = r.state; }
  return { s, busts };
};

test("cheap money builds a credit boom that busts; mortgage rules prevent it", () => {
  const withRules = s => Object.assign(s, { dept: Object.assign(m.initDept(), { supervision: 2 }) });
  const easy = Array.from({ length: 120 }, (_, k) => playFrom("random", "CR" + k, lowBias));
  const ruled = Array.from({ length: 120 }, (_, k) => playFrom("random", "CR" + k, (s, p) => ({ ...lowBias(s, p), macro: true }), withRules));
  const rate = g => g.reduce((a, r) => a + r.busts, 0) / g.length;
  assert.ok(rate(easy) > 0.3, `busts per game with cheap money: ${rate(easy).toFixed(2)}`);
  assert.ok(rate(ruled) < 0.05, `busts per game with mortgage rules: ${rate(ruled).toFixed(2)}`);
});

test("a credit bust hits stocks and bank capital, then drags demand", () => {
  const S = m.extendScenario(m.buildScenario("random", "BUST"), "BUST");
  const s = Object.assign(m.initGame(S), { lev: 16 });
  S.bustRoll[1] = 0;                                              // force the dice
  const p = m.prepGame(s, S), r = m.stepGame(s, S, p, POLICIES.rule(s, p));
  assert.ok(r.bust && r.state.bust === 3);
  assert.ok(r.state.bankCap < 90, `bank capital ${r.state.bankCap}`);
  assert.ok(r.state.eq < s.eq, "stocks should fall");
  assert.ok(m.finFeed(r.state, S).bustD < -1, "next quarter's demand takes the hit");
});

test("the world interest rate follows each era", () => {
  const iw = level => m.extendScenario(m.buildScenario(level, "W"), "W").iw;
  assert.ok(iw("oil")[12] >= 12, "the Volcker shock");
  assert.ok(iw("pandemic")[5] <= 0.5 && iw("pandemic")[12] >= 4, "zero rates, then the 2022 hikes");
  assert.ok(iw("crisis")[6] <= 0.5, "global rates collapse after 2008");
});

test("emerging markets: a weaker currency raises prices more and hurts demand", () => {
  const S = m.extendScenario(m.buildScenario("random", "EMF"), "EMF"), s = Object.assign(m.initGame(S), { fx: 90, fxA: 100 });
  const adv = m.finFeed(s, S), em = m.finFeed(s, m.applyMode(m.extendScenario(m.buildScenario("random", "EMF"), "EMF"), false, true));
  assert.ok(em.s > 2 * adv.s, `pass-through ${em.s} vs ${adv.s}`);
  assert.ok(em.d < 0 && adv.d > 0, "depreciation contracts an emerging market but helps an advanced one");
});

test("reserves defend the currency; a sudden stop with no reserves breaks it", () => {
  const S = m.applyMode(m.extendScenario(m.buildScenario("random", "FX"), "FX"), false, true);
  const s = m.initGame(S), p = m.prepGame(s, S), base = { move: 0, tone: "neutral", choice: null, qa: null };
  const float = m.stepGame(s, S, p, { ...base, fx: 0 }).state, sell = m.stepGame(s, S, p, { ...base, fx: 2 }).state;
  assert.ok(sell.fx > float.fx && sell.reserves < float.reserves);
  const broke = Object.assign(m.initGame(S), { reserves: 0.5, cred: 0.2 });
  S.ssRoll[1] = 0;
  const r = m.stepGame(broke, S, m.prepGame(broke, S), { ...base, fx: 0 });
  assert.ok(r.ss);
  assert.equal(r.state.lost, "fxcrisis");
});

test("emerging-market mode is harder but winnable", () => {
  for (const level of LEVELS) {
    const adv = Array.from({ length: 80 }, (_, k) => simulate(m, level, "E" + k, POLICIES.rule));
    const em = Array.from({ length: 80 }, (_, k) => simulate(m, level, "E" + k, POLICIES.rule, false, true));
    const sc = g => mean(g.map(s => m.scoreGame(s).total)), fin = g => g.filter(s => !s.lost).length / g.length;
    assert.ok(sc(em) < sc(adv), `${level}: emerging ${sc(em).toFixed(0)} vs advanced ${sc(adv).toFixed(0)}`);
    assert.ok(fin(em) >= (level === "oil" ? 0.75 : 0.95), `${level}: emerging finish rate ${(fin(em) * 100).toFixed(0)}%`);
  }
});

test("financial variables stay in plausible ranges", () => {
  for (const level of LEVELS) for (const s of run(level, "rule", 40)) {
    assert.ok(s.eq > 30 && s.eq < 300, `${level} stocks ${s.eq}`);
    assert.ok(s.fx > 50 && s.fx < 200, `${level} currency ${s.fx}`);
    assert.ok(s.y10 > 0 && s.y10 < 15, `${level} 10y ${s.y10}`);
  }
});

test("dual mandate: a wider credibility band, jobs weigh more in the score, similar scores for good policy", () => {
  const S = m.applyMode(m.extendScenario(m.buildScenario("crisis", "MD1"), "MD1"), false, false, "dual");
  assert.equal(S.mandate, "dual");
  const a = simulate(m, "crisis", "MD1", POLICIES.rule, false, false, "dual");
  assert.equal(a.lam, 1);
  for (const level of LEVELS) {
    const p = mean(Array.from({ length: 60 }, (_, k) => m.scoreGame(simulate(m, level, "M" + k, POLICIES.rule)).total));
    const q = mean(Array.from({ length: 60 }, (_, k) => m.scoreGame(simulate(m, level, "M" + k, POLICIES.rule, false, false, "dual")).total));
    assert.ok(Math.abs(p - q) < 60, `${level}: price ${p.toFixed(0)} vs dual ${q.toFixed(0)}`);
  }
});

test("career carry-over: credibility and departments pass to the next era", () => {
  const dept = Object.fromEntries(Object.keys(m.initDept()).map(k => [k, 2]));
  const S = m.applyMode(m.extendScenario(m.buildScenario("pandemic", "CR1"), "CR1"), false, false, "price", { cred: 0.82, dept, points: 6 });
  const s = m.initGame(S);
  assert.equal(s.cred, 0.82);
  assert.equal(s.points, 6);
  for (const k of Object.keys(dept)) assert.equal(s.dept[k], 2);
  const low = m.initGame(m.applyMode(m.buildScenario("pandemic", "CR1"), false, false, "price", { cred: 0.1, dept: {}, points: 3 }));
  assert.equal(low.cred, 0.3, "carried credibility is floored");
});

// Plays like the game does, keeping the inputs and reports the debrief needs.
function record(level, seed, policy) {
  const S = m.applyMode(m.extendScenario(m.buildScenario(level, seed), seed), false, false);
  let s = m.initGame(S); const inputs = [], reports = [];
  while (s.t < m.M.turns && !s.lost) {
    const p = m.prepGame(s, S), inp = { buy: [], ...policy(s, p) }, res = m.stepGame(s, S, p, inp);
    inputs.push(inp); reports.push({ prep: p, inp, prev: s, ...res }); s = res.state;
  }
  return { S, s, inputs, reports };
}

test("debrief: history data covers every quarter of the historical eras", () => {
  for (const k of ["oil", "crisis", "pandemic"]) assert.equal(m.FED_PATH[k].length, m.M.turns + 1, k);
  assert.equal(m.rulePath(m.applyMode(m.extendScenario(m.buildScenario("oil", "H1"), "H1"), false, false)).length, m.M.turns + 1);
});

test("debrief: replaying your own moves reproduces your game; a rule-follower has nothing to regret", () => {
  const g1 = record("crisis", "DB1", POLICIES.keynes);
  const same = m.replayGame(g1.S, g1.inputs, 0, g1.inputs[0].move);
  assert.equal(same.pi, g1.s.pi); assert.equal(same.cred, g1.s.cred);
  const rule = m.debriefData(...Object.values((({ S, inputs, reports }) => ({ S, inputs, reports }))(record("crisis", "DB1", POLICIES.rule))));
  assert.equal(rule.deviations, 0); assert.equal(rule.moments.length, 0);
});

test("debrief: easing too much every quarter shows up as costly decisions with lessons", () => {
  const dove = (s, p) => ({ ...POLICIES.rule(s, p), move: Math.max(m.M.iMin - s.i, p.advisors.taylor - 0.5) });
  let hurt = 0, total = 0;
  for (let k = 0; k < 20; k++) {
    const g1 = record("random", "YM" + k, dove), d = m.debriefData(g1.S, g1.inputs, g1.reports);
    assert.ok(d.moments.length <= 3);
    d.moments.forEach(x => { total++; if (x.impact < 0) hurt++; assert.ok(/^(same|ruleLost|youLost|(easeHigh|ease|tightLow|tight)(Help|Hurt))$/.test(x.lesson), x.lesson); });
  }
  assert.ok(total > 0 && hurt / total > 0.6, `${hurt}/${total} moments hurt`);
});

test("teacher scenarios: events become fading shocks, and surprises can be switched off", () => {
  const spec = { n: "Boom", y: 1995, q: 2, c: 0.6, x: false, ev: [[4, "d", 2, 3, "Boom"], [10, "s", 1.5, 1, "Drought"]], dl: [[6, "financing"]] };
  const base = m.customScenario(spec);
  assert.deepEqual(base.d.slice(3, 7).map(v => +v.toFixed(2)), [2, 1.33, 0.67, 0]);
  assert.equal(base.s[9], 1.5); assert.equal(base.news[4], "cu4"); assert.equal(base.dilemmas[6], "financing");
  const sc = m.applyMode(m.extendScenario(m.buildScenario("custom", "CU1"), "CU1"), false, false);
  assert.equal(sc.year, 1995); assert.equal(sc.cred, 0.6);
  assert.deepEqual(Object.keys(sc.dilemmas), ["6"], "no surprise desk decisions");
  assert.ok(Object.values(sc.news).every(id => /^cu|^gl_/.test(id)), "no surprise events");
  m.customScenario({ ...spec, x: true });
  const sc2 = m.applyMode(m.extendScenario(m.buildScenario("custom", "CU1"), "CU1"), false, false);
  assert.ok(Object.keys(sc2.dilemmas).length > 1, "surprises add desk decisions");
  const played = simulate(m, "custom", "CU1", POLICIES.rule);
  assert.equal(played.t, m.M.turns);
});

test("public debt: each era starts where history did, and inflation erodes it while slumps pile it up", () => {
  const start = k => m.initGame(m.applyMode(m.extendScenario(m.buildScenario(k, "D1"), "D1"), false, false)).debt;
  assert.equal(start("oil"), m.DEBT0.oil); assert.equal(start("pandemic"), m.DEBT0.pandemic);
  assert.ok(start("oil") < start("crisis") && start("crisis") < start("pandemic"));
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const end = (level, em = false) => mean(Array.from({ length: 40 }, (_, k) => simulate(m, level, "D" + k, POLICIES.rule, false, em).debt - m.initGame(m.applyMode(m.extendScenario(m.buildScenario(level, "D" + k), "D" + k), false, em)).debt));
  assert.ok(end("oil") < 12, `1973 inflation should not leave debt much higher: ${end("oil").toFixed(1)}`);
  assert.ok(end("crisis") > 0, "a deep slump adds debt");
  assert.ok(m.sovSpread(m.debtLim(false).sov - 5, false) === 0, "no premium below the threshold");
  assert.ok(m.sovSpread(120, true) > m.sovSpread(120, false), "emerging markets pay more for the same debt");
});

test("fiscal dominance and the Treasury's grip: high debt plus thin credibility unanchors expectations", () => {
  const sc = m.applyMode(m.extendScenario(m.buildScenario("pandemic", "FD1"), "FD1"), false, false);
  const base = Object.assign(m.initGame(sc), { t: 4, debt: 130, cred: 0.5, i: 4 });
  const calm = Object.assign(m.initGame(sc), { t: 4, debt: 60, cred: 0.5, i: 4 });
  const step = st => { const p = m.prepGame(st, sc); return m.stepGame(st, sc, p, { move: 0, tone: "neutral", choice: 0, qa: null, qe: 0 }); };
  const hi = step(base), lo = step(calm);
  assert.ok(hi.dominance && !lo.dominance);
  assert.ok(hi.state.pe > lo.state.pe, "expectations drift up when debt looks unpayable");
  assert.ok(hi.state.y10 > lo.state.y10, "and long yields carry a risk premium");
  assert.ok(hi.heatParts.some(q => q[0] === "treasury"), "the Treasury leans on the Bank");
  const monet = m.stepGame(Object.assign(m.initGame(sc), { t: 3, debt: 130 }), sc,
    Object.assign(m.prepGame(m.initGame(sc), sc), { t: 3, dilemma: "financing" }), { move: 0, tone: "neutral", choice: 1, qa: null, qe: 0 });
  assert.ok(monet.state.debt < 130, "printing money for the Treasury retires debt");
  assert.ok(monet.state.pe > 2, "and people notice");
});

test("households: a hike helps savers and hurts borrowers; a slump hurts workers", () => {
  const g0 = m.groupMood({ i: 3, pe: 2, pi: 2, x: 0, eq: 100, eqA: 100, hpg: 0 });
  const hike = m.groupMood({ i: 5, pe: 2, pi: 2, x: 0, eq: 100, eqA: 100, hpg: 0 });
  assert.ok(hike.savers > g0.savers && hike.borrowers < g0.borrowers);
  const slump = m.groupMood({ i: 3, pe: 2, pi: 2, x: -3, eq: 100, eqA: 100, hpg: 0 });
  assert.ok(slump.workers < g0.workers - 20);
  const infl = m.groupMood({ i: 3, pe: 2, pi: 8, x: 0, eq: 100, eqA: 100, hpg: 0 });
  assert.ok(infl.retirees < g0.retirees - 30, "inflation hits fixed incomes hardest");
});

test("selling the holdings: only after purchases and off the floor, and it tightens conditions", () => {
  const sc = m.applyMode(m.extendScenario(m.buildScenario("crisis", "QT1"), "QT1"), false, false);
  const held = Object.assign(m.initGame(sc), { t: 6, i: 3, qeStock: 3, pi: 4 });
  assert.equal(m.prepGame(held, sc).qt, true);
  assert.equal(m.prepGame(Object.assign({}, held, { i: 0.5 }), sc).qt, false, "not while the rate is on the floor");
  assert.equal(m.prepGame(Object.assign({}, held, { qeStock: 0 }), sc).qt, false, "not with nothing to sell");
  const p = m.prepGame(held, sc), inp = { move: 0, tone: "neutral", choice: 0, qa: null, qe: 0 };
  const sold = m.stepGame(held, sc, p, { ...inp, qt: true }), kept = m.stepGame(held, sc, p, inp);
  assert.ok(sold.state.y10 > kept.state.y10, "long yields rise");
  assert.ok(sold.state.x < kept.state.x, "and demand cools");
  assert.ok(sold.state.qeStock < kept.state.qeStock);
  assert.ok(sold.heatParts.some(q => q[0] === "qt"), "the Treasury is not pleased");
});
