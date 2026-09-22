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

test("financial variables stay in plausible ranges", () => {
  for (const level of LEVELS) for (const s of run(level, "rule", 40)) {
    assert.ok(s.eq > 30 && s.eq < 300, `${level} stocks ${s.eq}`);
    assert.ok(s.fx > 50 && s.fx < 200, `${level} currency ${s.fx}`);
    assert.ok(s.y10 > 0 && s.y10 < 15, `${level} 10y ${s.y10}`);
  }
});
