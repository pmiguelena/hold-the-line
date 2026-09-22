# One-off source patch: player profile, and sending finished terms to a teacher's sheet.
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

patch('src/js/107-class.js', [
# the profile rides along with the decisions, and a class link carries the teacher's collection URL
('return encodeCode("R", { cfg: cfgOf(c), cl: c.klass ? c.klass.cl || "" : "",',
 'return encodeCode("R", { cfg: cfgOf(c), cl: c.klass ? c.klass.cl || "" : "", pr: store.profile || null,'),
('  [assignTab, builderTab, resultsTab][cur_]();', '  [assignTab, builderTab, resultsTab, dataTab][cur_]();'),
('m: a.m, cs: a.l === "custom" ? T_.bSaved : null });', 'm: a.m, cs: a.l === "custom" ? T_.bSaved : null, ep: (T_.ep || "").trim() || null });'),
('out.push({ raw, ok: d.ok, nm: B.nm || "—", cl: B.cl || "", date: B.d || "",',
 'out.push({ raw, ok: d.ok, nm: B.nm || "—", cl: B.cl || "", date: B.d || "", pr: B.pr || null,'),
('const head = ["student", "class", "scenario", "shock_code", "difficulty", "economy", "mandate",',
 'const head = ["student", "age", "gender", "education", "profession", "class", "scenario", "shock_code", "difficulty", "economy", "mandate",'),
('const lines = rows.filter(r => !r.bad).map(r => [r.nm, r.cl,',
 'const lines = rows.filter(r => !r.bad).map(r => [r.nm, r.pr ? r.pr.age : "", profLabel("genders", r.pr && r.pr.gen), profLabel("edus", r.pr && r.pr.edu), r.pr ? profText(r.pr) : "", r.cl,'),
('openDebrief({ back: () => { game = null; teacherDesk(2); }, who: C.report.who(r.nm, r.cl, r.date) });',
 'openDebrief({ back: () => { game = null; teacherDesk(2); }, who: [C.report.who(r.nm, r.cl, r.date), r.pr ? [r.pr.age, profLabel("edus", r.pr.edu), profText(r.pr)].filter(Boolean).join(" · ") : ""].filter(Boolean).join(" — ") });'),
# a student's name defaults to their nickname
('value="${esc(store.studentName || "")}" autocomplete="name"', 'value="${esc(store.studentName || (store.profile && store.profile.nick) || "")}" autocomplete="name"'),
('${k ? "" : `<label class="code"><span>${esc(C.nameFor)}</span><input id="hiName" class="name-in" maxlength="40" value="${esc(store.studentName || "")}"',
 '${k ? "" : `<label class="code"><span>${esc(C.nameFor)}</span><input id="hiName" class="name-in" maxlength="40" value="${esc(store.studentName || (store.profile && store.profile.nick) || "")}"'),
])

patch('src/js/08-screens.js', [
('<button class="btn ghost small" id="tTeach">${esc(gg.cls.teacherBtn)}</button>',
 '<button class="btn ghost small" id="tProf">${esc(gg.prof.edit)}</button><button class="btn ghost small" id="tTeach">${esc(gg.cls.teacherBtn)}</button>'),
('  $("tTeach").onclick = () => { Sound.unlock(); Sound.select(); teacherDesk(); };',
 '  $("tTeach").onclick = () => { Sound.unlock(); Sound.select(); teacherDesk(); };\n  $("tProf").onclick = () => { Sound.unlock(); Sound.select(); profileScreen(titleScreen); };'),
])

patch('src/js/10-end-menu.js', [
('  if (game.cfg.career) careerRecord(s, sp.total, stars);', '  if (!restored) sendResult(sp, stars, rule);                              // a finished term reaches the teacher\'s sheet, if a class set one up\n  if (game.cfg.career) careerRecord(s, sp.total, stars);'),
])

patch('src/js/11-boot.js', [
('  else titleScreen();', '  else if (!store.profile && !store.profileSkip) profileScreen(titleScreen);     // first run: who is playing\n  else titleScreen();'),
('  const teacherLink = readClassFromURL();', '  const teacherLink = readClassFromURL();\n  flushOutbox();                                                                // results that could not be sent last time'),
])

p = os.path.join(ROOT, 'src', 'styles', '30-hud-extras.css')
s = open(p, encoding='utf-8').read()
s += '''.prof-grid{width:min(620px,100%);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px 16px;text-align:left}
.prof-grid .fld input,.prof-grid .fld select{width:100%;min-width:0;font:500 15px var(--f-ui);color:var(--text);background:var(--bg-2);border:1px solid var(--line-2);border-radius:10px;padding:9px 11px}
'''
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('patched styles')
