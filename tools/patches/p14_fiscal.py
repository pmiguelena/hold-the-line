# One-off source patch: Phase 8 UI — public finances, household groups, selling holdings.
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

# ── HUD: the Treasury's debt sits beside credibility, popularity and removal risk ──
patch('src/js/07-stage-hud.js', [
('    <div class="hud-btns"><button class="icon-btn" id="bMap"',
 '''    <div class="meter-tile" id="hDebt"><div class="t-row"><span class="t-lab">${esc(gg.hud.debt)}</span><span class="t-num" data-count="${Math.round(from.debt || 0)}|${Math.round(s.debt || 0)}">${Math.round(from.debt || 0)}</span></div><div class="mbar" style="--c:var(--purple)"><i style="width:${Math.min(100, (s.debt || 0) / 1.5)}%" data-to="${Math.min(100, (s.debt || 0) / 1.5)}"></i><em class="danger" style="left:${Math.min(96, debtLim(game.sc.em).heat / 1.5)}%"></em></div></div>
    <div class="hud-btns"><button class="icon-btn" id="bMap"'''),
])

# ── the decide screen: sell the holdings back, once the rate is off the floor ──
patch('src/js/09-quarter.js', [
('''    ${prep.fxTool ?''', '''    ${prep.qt ? `<div class="dec-row"><span class="sec-lab">${esc(gg.qt.label)}</span><div class="tones" role="group">${["off", "on"].map(k => `<button class="tone ${k === "on" ? "qe2" : "qe0"}" data-qt="${k}" aria-pressed="false"><b><i></i>${esc(gg.qt[k][0])}</b><small>${esc(gg.qt[k][1])}</small></button>`).join("")}</div><p class="tip">${esc(gg.qt.tip(Math.round((s.qeStock || 0) * 10) / 10))}</p></div>` : ""}
    ${prep.fxTool ?'''),
('    P.querySelectorAll("[data-macro]").forEach(b => b.setAttribute("aria-pressed", !!draft.macro === (b.dataset.macro === "on")));',
 '    P.querySelectorAll("[data-macro]").forEach(b => b.setAttribute("aria-pressed", !!draft.macro === (b.dataset.macro === "on")));\n    P.querySelectorAll("[data-qt]").forEach(b => b.setAttribute("aria-pressed", !!draft.qt === (b.dataset.qt === "on")));'),
('  P.querySelectorAll("[data-macro]").forEach(b => (b.onclick = () => { draft.macro = b.dataset.macro === "on"; Sound.stamp(); sync(); }));',
 '  P.querySelectorAll("[data-macro]").forEach(b => (b.onclick = () => { draft.macro = b.dataset.macro === "on"; Sound.stamp(); sync(); }));\n  P.querySelectorAll("[data-qt]").forEach(b => (b.onclick = () => { draft.qt = b.dataset.qt === "on"; Sound.stamp(); sync(); }));'),
('macro: prep.canMacro ? !!draft.macro : false, fx: prep.fxTool ? draft.fx || 0 : 0 };',
 'macro: prep.canMacro ? !!draft.macro : false, fx: prep.fxTool ? draft.fx || 0 : 0, qt: prep.qt ? !!draft.qt : false };'),
('  draft = { move: null, tone: "neutral", choice: null, qe: 0, buy: [], macro: !!s.macro, fx: 0 };',
 '  draft = { move: null, tone: "neutral", choice: null, qe: 0, buy: [], macro: !!s.macro, fx: 0, qt: false };'),
# ── the reaction screen: who felt this quarter ──
('''      <div class="dec-row"><span class="sec-lab">${esc(gg.feedTitle)}</span>''',
 '''      <div class="dec-row"><span class="sec-lab">${esc(gg.groups.title)}</span><div class="grp-row">${["savers", "borrowers", "workers", "retirees"].map(k => {
        const v = (nx.grp || {})[k] ?? 50, was = (pv.grp || {})[k] ?? 50, cls = v < 25 ? "bad" : v < 45 ? "warn" : "good";
        return `<div class="grp"><span class="grp-ic">${ICON.grp[k]}</span><span class="grp-n">${esc(gg.groups[k])}</span><div class="mbar" style="--c:var(--${cls === "bad" ? "red" : cls === "warn" ? "amber" : "green"})"><i style="width:${v}%"></i></div><b class="${v >= was ? "upc" : "downc"}">${sgn(v - was, 0)}</b></div>`;
      }).join("")}</div><p class="tip">${esc(gg.groups.tip)}</p></div>
      <div class="dec-row"><span class="sec-lab">${esc(gg.feedTitle)}</span>'''),
])

# ── the map gets a public-finances layer ──
patch('src/js/045-econ-map.js', [
('  credit:   { housing: E => E.hpYoY, shops: E => E.credit, industry: E => E.credit, finance: E => E.bank }',
 '''  credit:   { housing: E => E.hpYoY, shops: E => E.credit, industry: E => E.credit, finance: E => E.bank },
  public:   { gov: E => E.debt, shops: E => E.deficit, finance: E => E.spread, housing: E => E.mortgage }'''),
('function mapTone(layer, key, v) {\n  if (v == null) return "none";',
 '''function mapTone(layer, key, v) {
  if (v == null) return "none";
  if (layer === "public") {
    if (key === "gov") return v < 60 ? "good" : v < 90 ? "warn" : "bad";
    if (key === "shops") return v < 3 ? "good" : v < 6 ? "warn" : "bad";                 // the deficit
    if (key === "finance") return v < 50 ? "good" : v < 150 ? "warn" : "bad";            // the risk premium, in basis points
    return v < 4 ? "good" : v < 6 ? "warn" : "bad";                                      // what a mortgage costs
  }'''),
('function mapFmt(layer, key, v) {',
 '''function mapFmt(layer, key, v) {
  if (layer === "public") return key === "gov" ? `${Math.round(v)}%` : key === "finance" ? `${Math.round(v)} bp` : pc(v, 1);'''),
])

# ── charts and the fiscal series ──
patch('src/js/10-end-menu.js', [
('  if (kind === "mkt")', '''  if (kind === "fisc") return { title: c.fisc, keys: [[c.debt, "#C4A0FF"], [c.interest, "#F2B650"]],
    series: [{ values: H.map(h => h.interest ?? 1.8), color: "#F2B650" }, { values: H.map(h => h.debt ?? 60), color: "#C4A0FF", area: true }], include: [0, 80] };
  if (kind === "mkt")'''),
('    <div class="chart-grid">${["infl", "gap", "rate", "mkt", "fin", "pol"].map(k => chartCard(k, qL)).join("")}</div>',
 '    <div class="chart-grid">${["infl", "gap", "rate", "mkt", "fin", "fisc", "pol"].map(k => chartCard(k, qL)).join("")}</div>'),
])

# ── the model's map detail, and decisions packed for a result code ──
patch('src/js/05-game-model.js', [
('  return { cat, sec, jobs, fxDev, eqGap, hpYoY: 4 * (s.hpg || 0),',
 '  return { cat, sec, jobs, fxDev, eqGap, hpYoY: 4 * (s.hpg || 0), debt: s.debt ?? 60, deficit: s.deficit ?? 3, spread: 100 * sovSpread(s.debt ?? 60, s.em), mortgage: (s.y10 ?? Y10_NEUTRAL) + 1.2,'),
])
patch('src/js/107-class.js', [
('const packInp = i => [Math.round(i.move * 4), TONES.indexOf(i.tone), i.choice ?? -1, i.qa ?? -1, i.qe || 0, i.fx || 0, i.macro ? 1 : 0, (i.buy || []).map(k => DEPT_L[k]).join("")];',
 'const packInp = i => [Math.round(i.move * 4), TONES.indexOf(i.tone), i.choice ?? -1, i.qa ?? -1, i.qe || 0, i.fx || 0, i.macro ? 1 : 0, (i.buy || []).map(k => DEPT_L[k]).join(""), i.qt ? 1 : 0];'),
('  buy: [...(a[7] || "")].map(c => Object.keys(DEPT_L).find(k => DEPT_L[k] === c)).filter(Boolean) });',
 '  qt: !!a[8], buy: [...(a[7] || "")].map(c => Object.keys(DEPT_L).find(k => DEPT_L[k] === c)).filter(Boolean) });'),
])

# ── staff notes for the new systems ──
patch('src/js/095-teach.js', [
(': fn === decideBeat ? ["decide", prep.qe && "qe", prep.fxTool && "fx", prep.canMacro && "macro", "fan", "board", "tone"]',
 ': fn === decideBeat ? ["decide", prep.qe && "qe", prep.qt && "qt", prep.fxTool && "fx", prep.canMacro && "macro", "fan", "board", "tone"]'),
(': fn === reactionBeat ? ["react"]', ': fn === reactionBeat ? ["react", "groups"]'),
(': fn === falloutBeat ? [(r.state.heat || 0) >= 40 && "heat", (r.state.lev || 0) >= 3 && "credit", "ledger"]',
 ': fn === falloutBeat ? [r.dominance && "dominance", (r.state.debt || 0) >= debtLim(game.sc.em).heat && "debt", (r.state.heat || 0) >= 40 && "heat", (r.state.lev || 0) >= 3 && "credit", "ledger"]'),
])

p = os.path.join(ROOT, 'src', 'styles', '30-hud-extras.css')
s = open(p, encoding='utf-8').read()
s += '''.grp-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:8px 14px}
.grp{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"ic name val" "ic bar bar";gap:2px 8px;align-items:center;padding:8px 10px;border-radius:12px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.grp-ic{grid-area:ic;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.06)}
.grp-n{grid-area:name;font:700 12px var(--f-ui);letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
.grp b{grid-area:val;font-variant-numeric:tabular-nums;font-size:13px}
.grp .mbar{grid-area:bar}
'''
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('patched styles')
