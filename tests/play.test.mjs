import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, playThrough } from "./helpers.mjs";

const ENDINGS = ["Level complete", "Nivel superado", "Game over", "Fin del juego"];
const plays = [
  { level: "random", lang: "en" },
  { level: "pandemic", lang: "es", hard: true, advisor: 0, qe: 2 },
  { level: "crisis", lang: "en", choice: 1, qa: 1 },
  { level: "oil", lang: "es", hard: true, qa: 2 },
  { level: "random", lang: "en", em: true, fx: 1 },
  { level: "crisis", lang: "es", em: true, fx: -1, advisor: 0 }
];

for (const p of plays) {
  test(`plays ${p.level} (${p.lang}${p.hard ? ", hard" : ""}) to the end screen without errors`, () => {
    const { d, errors } = boot();
    const r = playThrough(d, p);
    assert.deepEqual(errors, []);
    assert.ok(ENDINGS.includes(r.end), r.end);
    if (/complete|superado/.test(r.end)) {
      assert.equal(r.quarters, 18);
      assert.equal(r.fronts, 18);
      assert.equal(r.reactions, 18);
      assert.equal(r.fans, 18, "the staff forecast should appear at every decision");
      assert.equal(r.maps, 18, "the economy map briefing should appear every quarter");
      assert.equal(r.budgets, 5, "a budget meeting should open each of the five years");
      assert.ok(r.buys >= 5, `only ${r.buys} upgrades bought`);
      assert.equal(r.boards, 18, "the board vote should appear at every decision");
      if (p.em) assert.equal(r.fxRows, 18, "emerging markets always have the currency tool");
    }
  });
}

test("restores a saved game mid-level", () => {
  const snap = { screen: "game", cfg: { scenario: "crisis", seed: "ABCDE", hard: true },
    inputs: [{ move: -0.5, tone: "neutral", choice: null, qa: 0 }, { move: -0.5, tone: "dovish", choice: 0, qa: 2 }], lang: "en" };
  const { d, errors } = boot(`<script>window.claude={hot:{data:${JSON.stringify(snap)}}}</script>`);
  assert.deepEqual(errors, []);
  assert.equal(d.querySelector("#overlay .big-title").textContent, "Quarter 3 of 18");
  assert.ok(d.querySelector("#hud .hard-tag"));
});

test("an unfinished game can be continued from the title screen", () => {
  const save = { cfg: { scenario: "pandemic", seed: "SAVE1", hard: false }, inputs: [{ move: -1, tone: "dovish", choice: null, qa: 0, qe: 0 }] };
  const { d, errors } = boot(`<script>localStorage.setItem("holdtheline.save", ${JSON.stringify(JSON.stringify(save))})</script>`);
  const btn = d.getElementById("tCont");
  assert.ok(btn, "continue button missing");
  assert.match(btn.textContent, /The Pandemic, quarter 2/);
  btn.click();
  assert.equal(d.querySelector("#overlay .big-title").textContent, "Quarter 2 of 18");
  assert.deepEqual(errors, []);
});

test("charts and pause menu open mid-game", () => {
  const { d, errors } = boot();
  d.getElementById("tStart").click();
  d.querySelector('[data-level="oil"]').click();
  d.getElementById("skipBtn").click();
  for (let k = 0; k < 60 && !d.querySelector("#panel .decide"); k++) {
    const ov = d.getElementById("overlay");
    if (!ov.hidden) ov.querySelector("[data-hot]").click();
    else {
      const P = d.getElementById("panel");
      if (P.querySelector(".choices")) P.querySelector('[data-choice="0"]').click();
      d.getElementById("contBtn").click();
    }
  }
  d.getElementById("bMap").click();
  for (const layer of ["prices", "activity", "jobs", "credit"]) {
    d.querySelector(`#mapOv [data-layer="${layer}"]`).click();
    assert.equal(d.querySelector("#mapOv .emap").dataset.map, layer);
    assert.ok(!/NaN|undefined/.test(d.getElementById("mapOv").innerHTML), `bad value on the ${layer} layer`);
  }
  d.getElementById("mapClose").click();
  d.getElementById("bCharts").click();
  assert.equal(d.querySelectorAll("#overlay svg.chart").length, 6);
  d.getElementById("chClose").click();
  d.getElementById("bMenu").click();
  assert.ok(d.getElementById("mResume"));
  assert.deepEqual(errors, []);
});

test("career mode: four eras, reappointment, carry-over and the hall of fame", () => {
  const { d, w, errors } = boot();
  const r = playThrough(d, { career: true, lang: "en", gov: "Ada Rate" });
  assert.deepEqual(errors, []);
  assert.ok(r.terms.length >= 1 && r.terms.length <= 4, `terms: ${r.terms.length}`);
  assert.match(r.summary, /Ada Rate/);
  assert.match(r.hall, /Hall of fame/);
  assert.match(r.hall, /Ada Rate/);
  const store = JSON.parse(w.localStorage.getItem("holdtheline.v1"));
  assert.equal(store.career, undefined, "a finished career is cleared");
  assert.equal(store.hall.careers.length, 1);
  assert.ok(store.hall.governors.length >= 1);
});

test("dual mandate: the tag shows and a level still plays to the end", () => {
  const { d, errors } = boot();
  const r = playThrough(d, { level: "oil", lang: "es", dual: true });
  assert.deepEqual(errors, []);
  assert.ok(ENDINGS.includes(r.end), r.end);
});
