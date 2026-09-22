# One-off source patch: Phase 9 UI — standing, hearings, advisor whispers, memoirs.
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

patch('src/js/09-quarter.js', [
# the hearing takes its place in the quarter, before you decide
('  if (prep.dilemma || prep.gd) list.push(dilemmaBeat);', '  if (prep.dilemma || prep.gd) list.push(dilemmaBeat);\n  if (prep.hearing) list.push(hearingBeat);'),
('  draft = { move: null, tone: "neutral", choice: null, qe: 0, buy: [], macro: !!s.macro, fx: 0, qt: false };',
 '  draft = { move: null, tone: "neutral", choice: null, qe: 0, buy: [], macro: !!s.macro, fx: 0, qt: false, hear: null };'),
('macro: prep.canMacro ? !!draft.macro : false, fx: prep.fxTool ? draft.fx || 0 : 0, qt: prep.qt ? !!draft.qt : false };',
 'macro: prep.canMacro ? !!draft.macro : false, fx: prep.fxTool ? draft.fx || 0 : 0, qt: prep.qt ? !!draft.qt : false, hear: prep.hearing ? draft.hear : null };'),
# advisors carry their standing, and those who trust you say more
('''    return `<article class="adv" style="--n:${n}"><header><b>${esc(t.adv[k].name)}</b><span>${esc(t.adv[k].school)}</span></header><p>${esc(advisorText(k, s, prep))}</p>''',
 '''    const rv = relOf(cur(), ADV_OF[k]), wh = advisorWhisper(k);
    return `<article class="adv" style="--n:${n}"><header><b>${esc(t.adv[k].name)}</b><span>${esc(t.adv[k].school)}</span><span class="rel-chip" style="--c:${relColor(rv)}" title="${esc(g().people.moods[relMood(rv)])}">${rv}</span></header><p>${esc(advisorText(k, s, prep))}</p>
      ${wh ? `<p class="whisper">${esc(wh)}</p>` : ""}'''),
# the quarter's fallout shows who moved, and why
('''    extra: `<div class="ledgers">${ledger(t.credHead, cd, r.credParts, t.credWhy, 100, 0)}''',
 '''    extra: `${relStrip(r)}<div class="ledgers">${ledger(t.credHead, cd, r.credParts, t.credWhy, 100, 0)}'''),
])

patch('src/js/07-stage-hud.js', [
('<button class="icon-btn" id="bCharts"', '<button class="icon-btn" id="bPeople" aria-label="${esc(gg.people.hudBtn)}" title="${esc(gg.people.hudBtn)}">${ICON.people}</button><button class="icon-btn" id="bCharts"'),
('  $("bMap").onclick = openMap;', '  $("bMap").onclick = openMap;\n  $("bPeople").onclick = openPeople;'),
])

# the end of a term, and of a career, is remembered
patch('src/js/10-end-menu.js', [
('    ${handInHTML()}', '    ${memoirHTML(s)}\n    ${handInHTML()}'),
])
patch('src/js/107-class.js', [
('(i.buy || []).map(k => DEPT_L[k]).join(""), i.qt ? 1 : 0];', '(i.buy || []).map(k => DEPT_L[k]).join(""), i.qt ? 1 : 0, (i.hear || []).join("")];'),
('  qt: !!a[8], buy:', '  qt: !!a[8], hear: a[9] ? [...String(a[9])].map(Number) : null, buy:'),
])

patch('src/js/095-teach.js', [
(': fn === advisorsBeat ? ["advisors"]', ': fn === advisorsBeat ? ["advisors", "people"]'),
(': fn === reactionBeat ? ["react", "groups"]', ': fn === reactionBeat ? ["react", "groups"] : fn === hearingBeat ? ["hearing"]'),
])

p = os.path.join(ROOT, 'src', 'styles', '30-hud-extras.css')
s = open(p, encoding='utf-8').read()
s += '''.rel-grid{width:100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:12px}
.rel{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-areas:"face head" "face bar" "face mood" "text text";gap:4px 12px;align-items:center;padding:12px 14px;border-radius:14px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);text-align:left}
.rel-face{grid-area:face;width:64px;height:64px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.05)}
.rel-face svg{width:100%;height:auto;display:block}
.rel-head{grid-area:head;display:grid} .rel-head b{font:800 16px var(--f-ui)} .rel-head span{font-size:12.5px;color:var(--muted)}
.rel-bar{grid-area:bar;display:flex;gap:8px;align-items:center} .rel-bar .mbar{flex:1}
.rel-num{font-variant-numeric:tabular-nums;font-weight:700;font-size:13px;display:flex;gap:4px;align-items:baseline}
.rel-mood{grid-area:mood;color:var(--c);font:700 11.5px var(--f-ui);letter-spacing:.06em;text-transform:uppercase}
.rel p{grid-area:text;margin:2px 0 0;font-size:14px;line-height:1.45;color:#C9CFDD}
.rel-chip{margin-left:auto;font:800 12px var(--f-ui);color:var(--c);background:rgba(255,255,255,.06);border-radius:99px;padding:2px 8px}
.whisper{margin:6px 0 0!important;padding-left:10px;border-left:2px solid var(--amber);font-style:italic;color:#E4D4B0!important}
.hear-mood{display:flex;gap:10px;align-items:center;margin-bottom:6px}
.rel-strip{display:flex;flex-wrap:wrap;gap:6px 14px;margin-bottom:10px;font-size:13px}
.rel-strip span{display:inline-flex;gap:6px;align-items:center;color:var(--muted)}
.rel-strip b{font-variant-numeric:tabular-nums}
.memoir{width:min(640px,100%);display:grid;gap:8px;padding:16px 18px;border-radius:16px;background:linear-gradient(135deg,rgba(196,160,255,.12),rgba(255,255,255,.02));box-shadow:inset 0 0 0 1px rgba(196,160,255,.35);text-align:left}
.memoir p{margin:0;font:400 16.5px/1.5 var(--f-news);color:#E4E8F1}
'''
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('patched styles')
