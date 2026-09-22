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

test("financial variables stay in plausible ranges", () => {
  for (const level of LEVELS) for (const s of run(level, "rule", 40)) {
    assert.ok(s.eq > 30 && s.eq < 300, `${level} stocks ${s.eq}`);
    assert.ok(s.fx > 50 && s.fx < 200, `${level} currency ${s.fx}`);
    assert.ok(s.y10 > 0 && s.y10 < 15, `${level} 10y ${s.y10}`);
  }
});
