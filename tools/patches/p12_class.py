# One-off source patch: Phase 7 — classroom hooks (class links, hand-in codes, teacher desk, printable report).
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

patch('src/js/08-screens.js', [
# start: a class game and a teacher's scenario travel in the config (and the save)
('''  const mandate = opts.mandate === "dual" ? "dual" : "price";
  const sc = applyMode(''', '''  const mandate = opts.mandate === "dual" ? "dual" : "price";
  if (scenario === "custom" && opts.cs) installCustom(opts.cs);
  const sc = applyMode('''),
('carry: opts.carry || null, career: !!opts.career }, sc,', 'carry: opts.carry || null, career: !!opts.career, klass: opts.klass || null, student: opts.student || "", cs: opts.cs || null }, sc,'),
('startLevel(sv.cfg.scenario, sv.cfg.seed, sv.inputs, !!sv.cfg.hard, !!sv.cfg.em, { mandate: sv.cfg.mandate, carry: sv.cfg.carry, career: sv.cfg.career });',
 'startLevel(sv.cfg.scenario, sv.cfg.seed, sv.inputs, !!sv.cfg.hard, !!sv.cfg.em, optsOf(sv.cfg));'),
# title screen: the class assignment card, and doors for students and teachers
('''    ${sv ? `<button class="btn big" id="tCont" data-hot>''', '''    ${classCardHTML()}
    ${sv ? `<button class="btn big ${store.klass ? "ghost" : ""}" id="tCont" ${store.klass ? "" : "data-hot"}>'''),
('''    <button class="btn big ${sv ? "ghost" : ""}" id="tStart" ${sv ? "" : "data-hot"}>${esc(gg.play)} →</button>
    <div class="toggles">${langToggle()}${soundToggle()}</div>''', '''    <button class="btn big ${sv || store.klass ? "ghost" : ""}" id="tStart" ${sv || store.klass ? "" : "data-hot"}>${esc(gg.play)} →</button>
    <div class="toggles"><button class="btn ghost small" id="tJoin">${esc(gg.cls.joinBtn)}</button><button class="btn ghost small" id="tTeach">${esc(gg.cls.teacherBtn)}</button></div>
    <div class="toggles">${langToggle()}${soundToggle()}</div>'''),
('''  bindToggles(titleScreen);''', '''  bindClassCard();
  $("tJoin").onclick = () => { Sound.unlock(); Sound.select(); joinClass(); };
  $("tTeach").onclick = () => { Sound.unlock(); Sound.select(); teacherDesk(); };
  bindToggles(titleScreen);'''),
])

patch('src/js/11-boot.js', [
('startLevel(data.cfg.scenario, data.cfg.seed, data.inputs || [], !!data.cfg.hard, !!data.cfg.em, { mandate: data.cfg.mandate, carry: data.cfg.carry, career: data.cfg.career });',
 'startLevel(data.cfg.scenario, data.cfg.seed, data.inputs || [], !!data.cfg.hard, !!data.cfg.em, optsOf(data.cfg));'),
('  else if (data && data.screen === "levels") levelSelect();', '  else if (data && data.screen === "levels") levelSelect();\n  else if (teacherLink || (data && data.screen === "teacher")) teacherDesk();'),
('function start(data) {\n  document.documentElement.lang = lang;', 'function start(data) {\n  document.documentElement.lang = lang;\n  const teacherLink = readClassFromURL();'),
])

patch('src/js/05-game-model.js', [
('    const sv = JSON.parse(localStorage.getItem(SAVE_KEY));', '    const sv = JSON.parse(localStorage.getItem(SAVE_KEY));\n    if (sv && sv.cfg && sv.cfg.scenario === "custom" && sv.cfg.cs) installCustom(sv.cfg.cs);'),
])

patch('src/js/10-end-menu.js', [
('nextKey = LEVEL_ORDER[LEVEL_ORDER.indexOf(key) + 1];', 'nextKey = LEVEL_ORDER.includes(key) && !game.cfg.klass ? LEVEL_ORDER[LEVEL_ORDER.indexOf(key) + 1] : null;'),
('      <button class="btn ghost" id="eFresh">${esc(gg.newShocks)}</button>', '      ${game.cfg.klass ? "" : `<button class="btn ghost" id="eFresh">${esc(gg.newShocks)}</button>`}'),
('    <div class="end-charts">${["infl", "mkt", "pol"]', '    ${handInHTML()}\n    <div class="end-charts">${["infl", "mkt", "pol"]'),
('  const opts = { mandate: game.cfg.mandate };', '  bindHandIn();\n  const opts = optsOf(game.cfg);'),
('{ mandate: game.cfg.mandate });\n  $("mLevels")', 'optsOf(game.cfg));\n  $("mLevels")'),
])

patch('src/js/095-teach.js', [
('function openDebrief() {', 'function openDebrief(o = {}) {\n  const back = o.back || (() => endLevel(true));'),
('''    <h2 class="scr-title">${esc(D.title)}</h2>''', '''    <h2 class="scr-title">${esc(D.title)}</h2>
    ${o.who || game.cfg.student ? `<p class="report-who">${esc(o.who || gg.cls.report.who(game.cfg.student, game.cfg.klass && game.cfg.klass.cl, new Date().toISOString().slice(0, 10)))}</p>` : ""}'''),
('<button class="btn ghost" id="dbGloss">${esc(gg.gloss.title)}</button></div>', '<button class="btn ghost" id="dbPrint">${esc(gg.cls.report.print)}</button><button class="btn ghost" id="dbGloss">${esc(gg.gloss.title)}</button></div>'),
('''  $("dbBack").onclick = () => endLevel(true);
  $("dbGloss").onclick = () => openGlossary(openDebrief);''', '''  $("dbBack").onclick = back;
  $("dbPrint").onclick = () => window.print();
  $("dbGloss").onclick = () => openGlossary(() => openDebrief(o));'''),
])

# styles: classroom screens, and a clean printed page
p = os.path.join(ROOT, 'src', 'styles', '30-hud-extras.css')
s = open(p, encoding='utf-8').read()
s += '''/* classroom */
.class-card{width:min(560px,100%);display:grid;gap:8px;justify-items:center;padding:16px 18px;border-radius:18px;background:linear-gradient(135deg,rgba(63,182,139,.16),rgba(255,255,255,.03) 60%);box-shadow:inset 0 0 0 1px rgba(63,182,139,.45)}
.cc-name{font:800 22px/1.15 var(--f-ui)} .cc-tags{color:var(--muted);font-size:14px}
.code-box{width:100%;min-width:0;font:500 12.5px/1.45 ui-monospace,Consolas,monospace;color:var(--text);background:var(--bg-2);border:1px solid var(--line-2);border-radius:10px;padding:10px 12px;resize:vertical;word-break:break-all}
.hand-in{width:100%;display:grid;justify-items:center;gap:10px}
.hi-body{width:min(640px,100%);display:grid;gap:10px;justify-items:center;padding:14px 16px;border-radius:16px;background:var(--surface);box-shadow:inset 0 0 0 1px rgba(63,182,139,.4)}
.tdesk{max-width:980px}
.td-tabs{justify-self:center}
.td-body{width:100%;display:grid;gap:14px;text-align:left}
.td-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px 16px;align-items:end}
.fld{display:grid;gap:5px;min-width:0}
.fld>span{font:700 11.5px var(--f-ui);letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
.fld.wide{grid-column:1 / -1}
.fld input:not([type=range]),.fld select,.ev input:not([type=range]),.ev select{width:100%;min-width:0;font:500 15px var(--f-ui);color:var(--text);background:var(--bg-2);border:1px solid var(--line-2);border-radius:10px;padding:8px 10px}
.fld input[type=range],.ev input[type=range]{width:100%;accent-color:var(--amber)}
.fld .row{display:flex;gap:8px;align-items:center}
.fld .row>input,.fld .row>textarea{flex:1}
.td-out{display:grid;gap:8px;padding:14px 16px;border-radius:16px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.guide{padding:10px 12px;border-radius:12px;background:rgba(91,155,213,.1);color:#C9D8EE}
.ev-list{display:grid;gap:8px}
.ev{display:grid;grid-template-columns:70px 110px minmax(120px,1fr) 80px minmax(140px,2fr) minmax(140px,2fr) auto;gap:8px;align-items:end;padding:10px;border-radius:12px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.ev[data-dl]{grid-template-columns:70px minmax(0,1fr) auto}
.ev label{display:grid;gap:4px;min-width:0}
.ev label>span{font:700 11px var(--f-ui);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
@media (max-width:900px){.ev{grid-template-columns:repeat(2,minmax(0,1fr))}.ev .grow{grid-column:1 / -1}.ev>button{grid-column:1 / -1;justify-self:end}}
.res-tbl td.pos{color:var(--green);font-weight:700} .res-tbl td.neg{color:var(--red);font-weight:700}
.res-tbl tr.bad td{color:var(--red)}
.report-who{margin:-4px 0 0;font:700 16px var(--f-ui);color:var(--amber)}
@media print{
  @page{margin:14mm}
  html,body{background:#fff!important;color:#111!important}
  body *{visibility:hidden}
  #overlay,#overlay *{visibility:visible}
  #overlay{position:absolute!important;inset:0 auto auto 0!important;width:100%!important;height:auto!important;overflow:visible!important;background:#fff!important;backdrop-filter:none!important;padding:0!important}
  #overlay .scr{max-width:none!important;box-shadow:none!important;background:#fff!important;color:#111!important;padding:0!important}
  #overlay .btns,#overlay .td-tabs,#overlay .fld,#overlay .toggles,#overlay button:not(.term){display:none!important}
  #overlay .term{visibility:visible;color:#111!important;text-decoration:none!important}
  #overlay .chart-card,#overlay .moment,#overlay .db-stats span,#overlay .tbl-wrap,#overlay dl.gloss>div{background:#fff!important;box-shadow:none!important;border:1px solid #bbb;break-inside:avoid}
  #overlay .scr-title,#overlay h4,#overlay b,#overlay p,#overlay small,#overlay td,#overlay th,#overlay .interlude,#overlay .credits,#overlay .note{color:#111!important}
  #overlay .q-date,#overlay .sec-lab,#overlay .report-who{color:#8A5A00!important}
}
'''
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('patched styles')
