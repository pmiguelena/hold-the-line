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
  for (const layer of ["prices", "activity", "jobs", "credit", "public"]) {
    d.querySelector(`#mapOv [data-layer="${layer}"]`).click();
    assert.equal(d.querySelector("#mapOv .emap").dataset.map, layer);
    assert.ok(!/NaN|undefined/.test(d.getElementById("mapOv").innerHTML), `bad value on the ${layer} layer`);
  }
  d.getElementById("mapClose").click();
  d.getElementById("bCharts").click();
  assert.equal(d.querySelectorAll("#overlay svg.chart").length, 7);
  d.getElementById("chClose").click();
  d.getElementById("bMenu").click();
  assert.ok(d.getElementById("mResume"));
  assert.deepEqual(errors, []);
});

test("the panel shows the exchange rate and the reserves", () => {
  const { d, errors } = boot();
  playThrough(d, { level: "crisis", lang: "es", em: true });
  const hud = d.getElementById("hud");
  assert.ok(hud.querySelector("#hFx"), "exchange rate tile");
  assert.ok(hud.querySelector("#hResv"), "reserves tile");
  assert.match(d.querySelector("#hFx .t-val").textContent, /^[0-9]+\.[0-9]/, "a rate, not an index");
  assert.match(d.querySelector("#hFx").textContent, /ML por US\$1/);
  assert.match(d.querySelector("#hResv").textContent, /Reservas/);
  assert.ok(!/NaN/.test(hud.textContent));
  assert.deepEqual(errors, []);
});

test("phase 8 on screen: debt meter, household panel and the sell-holdings control", () => {
  const { d, errors } = boot();
  const r = playThrough(d, { level: "crisis", lang: "en", qe: 2 });
  assert.ok(r.qtRows >= 1, "the sell-holdings control should appear after purchases, once rates rise");
  assert.ok(r.groups >= 18, `the household panel appeared ${r.groups} times`);
  assert.deepEqual(errors, []);
  d.getElementById("eDebrief").click();
  assert.ok(!/NaN|undefined/.test(d.getElementById("overlay").textContent));
});

test("people on screen: standing, a hearing, an advisor's whisper and the memoir", () => {
  const { d, errors } = boot();
  const r = playThrough(d, { level: "oil", lang: "en", advisor: 2, qa: 0 });
  assert.ok([6, 9].includes(r.hearQs), `hearings of three questions each, got ${r.hearQs} questions`);   // a third is called if the politics get hot
  assert.ok(d.querySelector(".memoir"), "the end screen closes with a memoir");
  assert.deepEqual(errors, []);
});

test("the standing screen opens mid-game with every character", () => {
  const { d, errors } = boot();
  d.getElementById("tStart").click();
  d.querySelector('[data-level="crisis"]').click();
  d.getElementById("skipBtn").click();
  for (let k = 0; k < 40 && !d.querySelector("#panel .decide"); k++) {
    const ov = d.getElementById("overlay");
    if (!ov.hidden) ov.querySelector("[data-hot]").click();
    else { const P = d.getElementById("panel"); if (P.querySelector(".choices")) P.querySelector('[data-choice="0"]').click(); d.getElementById("contBtn").click(); }
  }
  d.getElementById("bPeople").click();
  assert.equal(d.querySelectorAll("#overlay .rel").length, 6);
  assert.ok(!/NaN|undefined/.test(d.getElementById("overlay").textContent));
  d.getElementById("pplClose").click();
  assert.deepEqual(errors, []);
});

test("career mode: four eras, reappointment, carry-over and the hall of fame", () => {
  const { d, w, errors } = boot();
  const r = playThrough(d, { career: true, lang: "en", gov: "Ada Rate" });
  assert.deepEqual(errors, []);
  assert.ok(r.terms.length >= 1 && r.terms.length <= 4, `terms: ${r.terms.length}`);
  assert.match(r.summary, /Ada Rate/);
  assert.match(r.summary, /memoirs|Chapter/i, "the career summary closes with memoir chapters");
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

test("teaching: staff notes appear, glossary terms open, and the debrief explains the term", () => {
  const { d, errors } = boot();
  const r = playThrough(d, { level: "pandemic", lang: "en", advisor: 0 });
  assert.ok(r.coach >= 15, `only ${r.coach} staff notes`);
  d.getElementById("eDebrief").click();
  const ov = d.getElementById("overlay");
  assert.equal(ov.querySelectorAll("svg.chart").length, 3, "rate, inflation and history charts");
  assert.ok(ov.querySelector(".moment"), "at least one decision that mattered");
  assert.ok(!/NaN|undefined|\[object/.test(ov.textContent), "bad text in the debrief");
  ov.querySelector(".term").click();
  assert.ok(d.getElementById("termPop"), "a term card opens");
  d.body.click();
  assert.equal(d.getElementById("termPop"), null, "clicking away closes it");
  d.getElementById("dbGloss").click();
  assert.ok(ov.querySelectorAll("dl.gloss > div").length >= 25);
  d.getElementById("glBack").click();
  d.getElementById("dbBack").click();
  assert.ok(d.getElementById("eRetry"), "back on the results screen");
  assert.deepEqual(errors, []);
});

test("teaching: every glossary link points to a real term, in both languages", () => {
  const { w, d, errors } = boot();
  for (const L of ["en", "es"]) {
    d.querySelector(`#overlay [data-lang="${L}"]`).click();
    d.getElementById("tStart").click();
    d.getElementById("lGloss").click();
    const ids = new Set([...d.querySelectorAll("dl.gloss > div")].map(x => x.id.slice(3)));
    d.querySelectorAll("dl.gloss .term").forEach(t => assert.ok(ids.has(t.dataset.term), `${L}: ${t.dataset.term}`));
    d.getElementById("glBack").click();
    d.getElementById("lBack").click();
  }
  assert.deepEqual(errors, []);
});

// Teacher desk helpers
function makeAssignment(d, { cl = "Macro 101", level = "crisis", hard = false } = {}) {
  d.getElementById("tTeach").click();
  d.querySelector('[data-tab="0"]').click();
  const cls = d.getElementById("aCl"); cls.value = cl; cls.dispatchEvent(new d.defaultView.Event("input"));
  const lv = d.getElementById("aLv"); lv.value = level; lv.dispatchEvent(new d.defaultView.Event("change"));
  if (hard) d.querySelector('[data-ah="1"]').click();
  return { code: d.getElementById("aCode").value, link: d.getElementById("aLink").value };
}
const joinAndStart = (code, name) => d => {
  d.getElementById("tJoin").click();
  d.getElementById("joinIn").value = code; d.getElementById("joinGo").click();
  d.getElementById("stName").value = name; d.getElementById("caGo").click();
};
function checkCodes(d, text) {
  d.getElementById("tTeach").click();
  d.querySelector('[data-tab="2"]').click();
  d.getElementById("rIn").value = text; d.getElementById("rGo").click();
  return [...d.querySelectorAll(".res-tbl tbody tr")].map(tr => [...tr.children].map(td => td.textContent.trim()));
}

test("classroom: assignment link, a student's result code, and the teacher's verified table and report", () => {
  const t1 = boot(), a = makeAssignment(t1.d, { cl: "Macro 101", level: "crisis", hard: true });
  assert.match(a.code, /^HTLC1\./); assert.match(a.link, /\?class=HTLC1\./);
  assert.deepEqual(t1.errors, []);

  const st = boot(), r = playThrough(st.d, { lang: "en", start: joinAndStart(a.code, "Ana Pérez"), advisor: 0 });
  const result = st.d.getElementById("hiCode").value;
  assert.match(result, /^HTLR1\./);
  assert.ok(!st.d.getElementById("eFresh"), "no new shocks inside a class assignment");
  assert.deepEqual(st.errors, []);

  const t2 = boot(), rows = checkCodes(t2.d, `Hi teacher, here is mine:
${result}
thanks`);
  assert.equal(rows.length, 1);
  assert.equal(rows[0][0], "Ana Pérez"); assert.equal(rows[0][1], "Macro 101");
  assert.equal(+rows[0][3], r.score, "the replayed score matches the student's screen");
  assert.equal(rows[0][10], "Verified");
  t2.d.querySelector("[data-rep]").click();
  assert.match(t2.d.querySelector(".report-who").textContent, /Ana Pérez · Macro 101/);
  assert.ok(t2.d.getElementById("dbPrint"));
  t2.d.getElementById("dbBack").click();
  assert.ok(t2.d.querySelector(".res-tbl"), "back on the results table");
  assert.deepEqual(t2.errors, []);
});

test("classroom: an altered result code is flagged; junk is reported, not crashed on", () => {
  const st = boot(), r = playThrough(st.d, { level: "random", lang: "en" });
  const code = st.d.getElementById("hiCode").value;
  const body = JSON.parse(Buffer.from(code.slice(6).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  body.nm = "Someone else";
  const forged = "HTLR1." + Buffer.from(JSON.stringify(body)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const t = boot(), rows = checkCodes(t.d, forged + "\nHTLR1.garbage");
  assert.equal(rows[0][10], "Code altered");
  assert.match(rows[1][0], /Unreadable/);
  assert.ok(r.score >= 0);
  assert.deepEqual(t.errors, []);
});

test("classroom: a class link in the URL shows the assignment; a teacher's own scenario plays end to end", () => {
  const t = boot(), d = t.d;
  d.getElementById("tTeach").click();
  d.querySelector('[data-tab="1"]').click();
  const set = (el, v, ev = "input") => { el.value = v; el.dispatchEvent(new d.defaultView.Event(ev)); };
  set(d.getElementById("bN"), "Copper boom");
  set(d.querySelector('.ev [data-f="4"]'), "Copper hits a record");
  d.getElementById("bAdd").click();
  set(d.querySelectorAll(".ev")[1].querySelector('[data-f="4"]'), "Drought hits farms");
  d.getElementById("bAddD").click();
  assert.ok(d.querySelector("#bPrev svg.chart"), "shock preview");
  d.getElementById("bUse").click();
  assert.equal(d.getElementById("aLv").value, "custom");
  const code = d.getElementById("aCode").value;
  assert.deepEqual(t.errors, []);

  const st = boot("", "https://example.org/game.html?class=" + code);
  assert.match(st.d.querySelector(".class-card").textContent, /Copper boom/);
  const r = playThrough(st.d, { lang: "es", start: dd => { dd.getElementById("stName").value = "Luis"; dd.getElementById("caGo").click(); } });
  assert.ok(ENDINGS.includes(r.end), r.end);
  assert.deepEqual(st.errors, []);
});

test("profile: asked once on the first run, then it rides along to the teacher's table and CSV", () => {
  const { d, w, errors } = boot("", "https://example.org/", true);
  assert.ok(d.getElementById("pfGo"), "the profile page opens first");
  const set = (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new w.Event(id === "pfProf" ? "change" : "input")); };
  set("pfNick", "Rivera"); set("pfAge", "21"); set("pfGen", "f"); set("pfEdu", "under"); set("pfProf", "student");
  d.getElementById("pfGo").click();
  assert.ok(d.getElementById("tStart"), "then the title screen");
  assert.deepEqual(JSON.parse(w.localStorage.getItem("holdtheline.v1")).profile, { nick: "Rivera", age: 21, gen: "f", edu: "under", prof: "student", profText: "" });

  playThrough(d, { level: "random", lang: "en" });
  const code = d.getElementById("hiCode").value;
  const t = boot();
  t.d.getElementById("tTeach").click();
  t.d.querySelector('[data-tab="2"]').click();
  t.d.getElementById("rIn").value = code; t.d.getElementById("rGo").click();
  assert.equal(t.d.querySelector(".res-tbl tbody td b").textContent, "Rivera");
  t.d.querySelector("[data-rep]").click();
  assert.match(t.d.querySelector(".report-who").textContent, /21 · Undergraduate · Student/);
  assert.deepEqual(errors, []);
  assert.deepEqual(t.errors, []);
});

test("collection: a finished term is posted to the teacher's sheet, dismissal and all", () => {
  const t = boot();
  t.d.getElementById("tTeach").click();
  t.d.querySelector('[data-tab="3"]').click();
  const url = t.d.getElementById("dUrl");
  url.value = "https://script.google.com/macros/s/TEST/exec"; url.dispatchEvent(new t.w.Event("input"));
  t.d.querySelector('[data-tab="0"]').click();
  const code = t.d.getElementById("aCode").value;

  const st = boot(), posts = [];
  st.w.fetch = (u, o) => { posts.push([u, JSON.parse(o.body)]); return Promise.resolve({}); };
  const r = playThrough(st.d, { lang: "en", start: d => {
    d.getElementById("tJoin").click();
    d.getElementById("joinIn").value = code; d.getElementById("joinGo").click();
    d.getElementById("stName").value = "Nico"; d.getElementById("caGo").click();
  } });
  assert.equal(posts.length, 1, "one row per finished term");
  const [u, row] = posts[0];
  assert.equal(u, "https://script.google.com/macros/s/TEST/exec");
  assert.equal(row.nickname, "Nico");
  assert.equal(row.score, r.score);
  assert.equal(row.quarters, 18);
  assert.equal(row.dismissed, "no");
  assert.equal(row.outcome, "Completed");
  assert.ok(row.result_code.startsWith("HTLR1."), "the row carries the replayable code");
  assert.deepEqual(st.errors, []);
});
