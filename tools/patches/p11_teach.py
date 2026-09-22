# One-off source patch: Phase 6 — coach tips, debrief with counterfactuals, history comparison, glossary.
import os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
def patch(rel, pairs):
    p = os.path.join(ROOT, rel)
    s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        c = s.count(old)
        assert c == 1, (rel, c, old[:90])
        s = s.replace(old, new)
    open(p, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', rel)

patch('src/js/05-game-model.js', [
('''/*HEAT-END*/
function advance(inp) {''', '''/*HEAT-END*/
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
// Replays the player's own inputs, but with quarter k's rate move replaced: "what if you had followed the rule just then?"
function replayGame(sc, inputs, k, move) {
  let s = initGame(sc);
  for (let j = 0; j < inputs.length && s.t < M.turns && !s.lost; j++) {
    const p = prepGame(s, sc), inp = Object.assign({}, inputs[j], j === k ? { move } : {});
    if ((p.dilemma || p.gd) && inp.choice == null) inp.choice = 0;
    s = stepGame(s, sc, p, inp).state;
  }
  return s;
}
function debriefData(sc, inputs, reports) {
  const s0 = initGame(sc), last = reports.length ? reports[reports.length - 1].state : s0, base = scoreGame(last).total;
  const devs = reports.map((r, k) => ({ k, t: r.prep.t, you: r.inp.move, rule: r.prep.advisors.taylor })).filter(c => Math.abs(c.you - c.rule) > 0.01);
  const moments = devs.map(c => {
    const r = reports[c.k], seen = seenOf(r.prev, sc, r.prev.t), impact = Math.round(base - scoreGame(replayGame(sc, inputs, c.k, c.rule)).total);
    const kind = c.you < c.rule ? (seen.pi >= 2.5 ? "easeHigh" : "ease") : (seen.x < -0.5 || seen.pi < 1.5 ? "tightLow" : "tight");
    return { ...c, impact, pi: seen.pi, x: seen.x, lesson: Math.abs(impact) < 3 ? "same" : kind + (impact > 0 ? "Help" : "Hurt"), caved: r.credParts.some(q => q[0] === "caved") };
  }).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 3).sort((a, b) => a.k - b.k);
  return { moments, deviations: devs.length, N: reports.length, onTarget: reports.filter(r => Math.abs(r.state.pi - 2) < 1).length, cred0: s0.cred, cred1: last.cred, score: base };
}
/*TEACH-END*/
function advance(inp) {'''),
])
patch('tools/build.mjs', [('applyMode, finFeed, MANDATE };', 'applyMode, finFeed, MANDATE, FED_PATH, rulePath, replayGame, debriefData };')])

# beat hooks: one staff note per screen, the first one the player has not seen yet
patch('src/js/09-quarter.js', [
('  calls(s, prep).forEach((c, k) => list.push(() => callBeat(c, k)));', '  calls(s, prep).forEach((c, k) => list.push(() => { callBeat(c, k); coach([c.pres && prep.pressure && "pressure", "calls"]); }));'),
('  play(list.map(fn => { const b = () => fn(); b.ov = fn === quarterCard; return b; }));', '  play(list.map(fn => { const b = () => { fn(); coachFor(fn); }; b.ov = fn === quarterCard; return b; }));'),
('  play([() => presserBeat(inp), () => qaBeat(inp)]);', '  play([() => presserBeat(inp), () => { qaBeat(inp); coach(["qa"]); }]);'),
('  play(list.map(fn => { const b = () => fn(r); b.ov = fn === electionBeat; return b; }));', '  play(list.map(fn => { const b = () => { fn(r); coachFor(fn, r); }; b.ov = fn === electionBeat; return b; }));'),
])

patch('src/js/08-screens.js', [
('  const sb = $("sndBtn"); if (sb) sb.onclick', '  const tb = $("tipsBtn"); if (tb) tb.onclick = () => { store.tips = store.tips === false; if (store.tips) store.tipsSeen = {}; persist(); Sound.select(); rerender(); };\n  const sb = $("sndBtn"); if (sb) sb.onclick'),
('    <div class="btns"><button class="btn ghost" id="lBack">← ${esc(gg.back)}</button>${langToggle()}${soundToggle()}</div>',
 '    <div class="btns"><button class="btn ghost" id="lBack">← ${esc(gg.back)}</button><button class="btn ghost" id="lGloss">${esc(gg.gloss.title)}</button>${langToggle()}${soundToggle()}${tipsToggle()}</div>'),
('  $("lBack").onclick = titleScreen;\n', '  $("lBack").onclick = titleScreen;\n  $("lGloss").onclick = () => openGlossary(levelSelect);\n'),
])

patch('src/js/10-end-menu.js', [
('<button class="btn big" id="eCareer" data-hot>${esc(gg.career.continueStory)} →</button></div>`', '<button class="btn big" id="eCareer" data-hot>${esc(gg.career.continueStory)} →</button><button class="btn ghost" id="eDebrief">${esc(gg.debrief.btn)}</button></div>`'),
('      <button class="btn big" id="eRetry" data-hot>${esc(gg.retry)}</button>', '      <button class="btn big" id="eRetry" data-hot>${esc(gg.retry)}</button>\n      <button class="btn" id="eDebrief">${esc(gg.debrief.btn)}</button>'),
('  if ($("eCareer")) $("eCareer").onclick', '  $("eDebrief").onclick = () => { Sound.select(); openDebrief(); };\n  if ($("eCareer")) $("eCareer").onclick'),
('      <button class="btn ghost" id="mTitle">${esc(gg.toTitle)}</button>', '      <button class="btn ghost" id="mGloss">${esc(gg.gloss.title)}</button>\n      <button class="btn ghost" id="mTitle">${esc(gg.toTitle)}</button>'),
('    <div class="toggles">${langToggle()}${soundToggle()}</div>\n    <p class="hint">${esc(gg.codeLine', '    <div class="toggles">${langToggle()}${soundToggle()}${tipsToggle()}</div>\n    <p class="hint">${esc(gg.codeLine'),
('  $("mTitle").onclick = titleScreen;', '  $("mTitle").onclick = titleScreen;\n  $("mGloss").onclick = () => openGlossary(openMenu);'),
])
