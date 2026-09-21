import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";
const require = createRequire(import.meta.url);
export const model = () => require("../tools/model.cjs");

// Plays one level with a policy function and returns the final state.
export function simulate(m, level, seed, policy, hard = false) {
  const S = m.extendScenario(m.buildScenario(level, seed), seed);
  if (hard) {
    const f = level === "oil" ? 1.15 : 1.3;
    ["d", "s"].forEach(k => (S[k] = S[k].map(v => v * f)));
    ["noiseD", "noiseS"].forEach(k => (S[k] = S[k].map(v => v * 1.4)));
    S.cred = Math.max(0.3, S.cred - 0.05);
  }
  let s = m.initGame(S);
  while (s.t < m.M.turns && !s.lost) { const p = m.prepGame(s, S); s = m.stepGame(s, S, p, policy(s, p)).state; }
  return s;
}

export const POLICIES = {
  rule: (s, p) => ({ move: p.advisors.taylor, tone: "neutral", choice: 0, qa: 0, qe: p.qe && s.x < -0.5 ? 2 : 0 }),
  keynes: (s, p) => ({ move: p.advisors.keynes, tone: "neutral", choice: 0, qa: 0, qe: p.qe && s.x < -0.5 ? 2 : 0 }),
  yesMan: (s, p) => ({ move: p.pressure === "cut" ? -0.5 : p.advisors.taylor, tone: "dovish", choice: 1, qa: 1, qe: p.qe ? 2 : 0 }),
  hold: () => ({ move: 0, tone: "neutral", choice: 0, qa: 0, qe: 0 })
};

// Boots the built page in a simulated browser (no animations: jsdom has no matchMedia).
export function boot(pre = "") {
  const html = readFileSync(new URL("../game.html", import.meta.url), "utf8");
  const vc = new VirtualConsole(), errors = [];
  vc.on("jsdomError", e => { if (!/Not implemented/.test(e.message)) errors.push(e.message); });
  const dom = new JSDOM("<!doctype html><html><head></head><body>" + pre + html + "</body></html>",
    { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc, url: "https://example.org/" });
  dom.window.addEventListener("error", e => errors.push(e.message));
  return { w: dom.window, d: dom.window.document, errors };
}

// Clicks through a whole level like a player; returns what was seen.
export function playThrough(d, { level, lang = "en", hard = false, advisor = 2, choice = 0, qa = 0, qe = 1 }) {
  const seen = { quarters: 0, fronts: 0, reactions: 0, dilemmas: 0, qa: 0, qe: 0, elections: 0, fans: 0 };
  d.querySelector(`#overlay [data-lang="${lang}"]`).click();
  d.getElementById("tStart").click();
  if (hard) d.querySelector('#overlay [data-diff="1"]').click();
  d.querySelector(`[data-level="${level}"]`).click();
  for (let k = 0; k < 1500; k++) {
    const ov = d.getElementById("overlay"), P = d.getElementById("panel");
    if (!ov.hidden) {
      if (d.getElementById("eRetry")) {
        return { ...seen, end: d.querySelector("#overlay .big-title").textContent,
          stars: d.querySelectorAll("#overlay .stars svg.got").length, score: +d.getElementById("scoreNum").textContent };
      }
      if (d.getElementById("cardGo")) seen.quarters++;
      if (d.getElementById("elecGo")) seen.elections++;
      ov.querySelector("[data-hot]").click();
      continue;
    }
    if (P.querySelector(".paper")) seen.fronts++;
    if (P.querySelector(".react")) seen.reactions++;
    if (P.querySelector("[data-qa]")) { seen.qa++; P.querySelectorAll("[data-qa]")[qa].click(); continue; }
    if (P.querySelector(".decide")) {
      const q = P.querySelectorAll("[data-qe]");
      if (q.length) { seen.qe++; q[qe].click(); }
      if (P.querySelector(".fan")) seen.fans++;
      P.querySelectorAll(".chip-btn")[advisor].click();
      d.getElementById("announce").click();
      continue;
    }
    if (P.querySelector(".choices")) { seen.dilemmas++; P.querySelector(`[data-choice="${choice}"]`).click(); }
    d.getElementById("contBtn").click();
  }
  throw new Error("level did not finish within 1500 steps");
}
