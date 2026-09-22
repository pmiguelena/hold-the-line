/* ═══════════════ PLAYER PROFILE & DATA COLLECTION ═══════════════ */
const COLLECT_URL = "";                                       // a default sheet for every game; a class link can carry its own
const GEN_KEYS = ["f", "m", "nb", "na"], EDU_KEYS = ["primary", "secondary", "vocational", "under", "grad", "phd"];
const PROF_KEYS = ["student", "teacher", "econ", "public", "private", "other"];

let pfDraft = null;
function profileScreen(back) {
  screen = "profile"; game = null; resetStage(); $("hud").hidden = true; drawRoom(); renderTicker();
  const P = g().prof, p = pfDraft || store.profile || {};
  const opts = (keys, dict, val) => keys.map(k => `<option value="${k}" ${k === val ? "selected" : ""}>${esc(dict[k])}</option>`).join("");
  openOverlay(`<div class="scr">
    <h2 class="scr-title">${esc(P.title)}</h2><p class="credits">${esc(P.sub)}</p>
    <div class="prof-grid">
      <label class="fld"><span>${esc(P.nick)}</span><input id="pfNick" maxlength="40" value="${esc(p.nick || "")}" autocomplete="nickname" spellcheck="false"></label>
      <label class="fld"><span>${esc(P.age)}</span><input id="pfAge" type="number" min="10" max="99" value="${p.age || ""}" inputmode="numeric"></label>
      <label class="fld"><span>${esc(P.gender)}</span><select id="pfGen"><option value="">${esc(P.pick)}</option>${opts(GEN_KEYS, P.genders, p.gen)}</select></label>
      <label class="fld"><span>${esc(P.edu)}</span><select id="pfEdu"><option value="">${esc(P.pick)}</option>${opts(EDU_KEYS, P.edus, p.edu)}</select></label>
      <label class="fld"><span>${esc(P.prof)}</span><select id="pfProf"><option value="">${esc(P.pick)}</option>${opts(PROF_KEYS, P.profs, p.prof)}</select></label>
      <label class="fld" id="pfOtherWrap" ${p.prof === "other" ? "" : "hidden"}><span>${esc(P.profOther)}</span><input id="pfOther" maxlength="40" value="${esc(p.profText || "")}"></label>
    </div>
    <p class="note">${esc(P.privacy)}</p><p class="diff-hint" id="pfHint"></p>
    <div class="btns"><button class="btn big" id="pfGo" data-hot>${esc(P.save)} →</button><button class="btn ghost" id="pfSkip">${esc(P.skip)}</button></div>
    <div class="toggles">${langToggle()}</div>
  </div>`);
  const draft = () => (pfDraft = { nick: $("pfNick").value, age: $("pfAge").value, gen: $("pfGen").value, edu: $("pfEdu").value, prof: $("pfProf").value, profText: $("pfOther") ? $("pfOther").value : "" });
  bindToggles(() => { draft(); profileScreen(back); });
  $("pfProf").onchange = () => ($("pfOtherWrap").hidden = $("pfProf").value !== "other");
  $("pfGo").onclick = () => {
    const nick = $("pfNick").value.trim();
    if (!nick) { $("pfHint").textContent = g().prof.needNick; $("pfNick").focus(); return; }
    const age = parseInt($("pfAge").value, 10);
    store.profile = { nick, age: age >= 10 && age <= 99 ? age : "", gen: $("pfGen").value, edu: $("pfEdu").value, prof: $("pfProf").value, profText: $("pfOther") ? $("pfOther").value.trim() : "" };
    store.studentName = store.studentName || nick;
    delete store.profileSkip; pfDraft = null; persist(); Sound.unlock(); Sound.confirm(); back();
  };
  $("pfSkip").onclick = () => { store.profileSkip = true; pfDraft = null; persist(); Sound.unlock(); Sound.select(); back(); };
}
const profLabel = (key, val) => (val ? g().prof[key][val] || val : "");
const profText = p => (p && p.prof === "other" ? p.profText || profLabel("profs", "other") : profLabel("profs", p && p.prof));

/* ── sending a finished game to the teacher's sheet ── */
const collectURL = () => (game && game.cfg.klass && game.cfg.klass.ep) || (store.teacher && store.teacher.ep) || COLLECT_URL || "";
function postRow(url, row) {
  store.outbox = (store.outbox || []).filter(o => o.url !== url || JSON.stringify(o.row) !== JSON.stringify(row));
  store.outbox.push({ url, row }); persist();
  flushOutbox();
}
function flushOutbox() {
  if (!store.outbox || !store.outbox.length || typeof fetch !== "function") return;
  const queue = store.outbox.slice();
  store.outbox = []; persist();
  queue.forEach(o => {
    try {
      fetch(o.url, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(o.row) })
        .catch(() => { store.outbox = (store.outbox || []).concat([o]); persist(); });      // offline: keep it for the next visit
    } catch { store.outbox = (store.outbox || []).concat([o]); persist(); }
  });
}
// One row per finished term: who played, which economy, and how it ended.
function resultRow(sp, stars, rule, code) {
  const s = cur(), c = game.cfg, p = store.profile || {}, t = tr(), gg = g();
  const db = debriefData(game.sc, game.inputs, game.reports);
  return {
    time: new Date().toISOString(), nickname: p.nick || c.student || "", age: p.age || "", gender: profLabel("genders", p.gen), education: profLabel("edus", p.edu), profession: profText(p),
    class: c.klass ? c.klass.cl || "" : "", scenario: gg.levels[c.scenario] ? gg.levels[c.scenario][0] : c.scenario, shock_code: c.seed,
    difficulty: c.hard ? "hard" : "normal", economy: c.em ? "emerging" : "advanced", mandate: c.mandate, career: c.career ? "yes" : "no",
    quarters: s.t, outcome: s.lost ? t.outcome[s.lost] : gg.cls.res.done, dismissed: s.lost === "fired" ? "yes" : "no",
    score: sp.total, stars, rule_score: rule, macro: sp.macro, credibility: Math.round(s.cred * 100), popularity: Math.round(s.pop), peak_removal_risk: Math.round(s.heatPeak || 0),
    quarters_on_target: db.onTarget, quarters_following_rule: db.N - db.deviations, language: lang, result_code: code
  };
}
function sendResult(sp, stars, rule) {
  if (!game || game.sent) return;
  game.sent = true;
  const url = collectURL();
  if (!url) return;
  try { postRow(url, resultRow(sp, stars, rule, resultCode((store.profile && store.profile.nick) || game.cfg.student || ""))); } catch {}
}

// The Apps Script a teacher pastes into their own spreadsheet.
const APPS_SCRIPT = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('results')
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet('results');
  var data = JSON.parse(e.postData.contents);
  var cols = ['time','nickname','age','gender','education','profession','class','scenario','shock_code',
    'difficulty','economy','mandate','career','quarters','outcome','dismissed','score','stars','rule_score',
    'macro','credibility','popularity','peak_removal_risk','quarters_on_target','quarters_following_rule',
    'language','result_code'];
  if (sheet.getLastRow() === 0) sheet.appendRow(cols);
  sheet.appendRow(cols.map(function (c) { return data[c] === undefined ? '' : data[c]; }));
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return ContentService.createTextOutput('Hold the Line collector is running.'); }`;

function dataTab() {
  const T_ = tdState(), C = g().cls, D = C.data;
  $("tdBody").innerHTML = `<label class="fld wide"><span>${esc(D.url)}</span><input id="dUrl" value="${esc(T_.ep || "")}" placeholder="https://script.google.com/macros/s/…/exec" spellcheck="false"></label>
    <p class="note">${esc(D.urlHint)}</p>
    <div class="btns"><button class="btn" id="dTest">${esc(D.test)}</button><span class="diff-hint" id="dMsg"></span></div>
    <div class="db-sec"><span class="sec-lab">${esc(D.stepsTitle)}</span><ol class="era-list">${D.steps.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>
    <label class="fld wide"><span>${esc(D.script)}</span><textarea id="dScript" class="code-box" rows="10" readonly spellcheck="false">${esc(APPS_SCRIPT)}</textarea></label>
    <div class="btns"><button class="btn ghost" id="dCopy">${esc(C.copy)}</button></div>
    <p class="note">${esc(D.privacy)}</p>`;
  $("dUrl").oninput = () => { T_.ep = $("dUrl").value.trim(); persist(); };
  $("dScript").onfocus = () => $("dScript").select();
  $("dCopy").onclick = () => copyText(APPS_SCRIPT, $("dCopy"));
  $("dTest").onclick = () => {
    const url = ($("dUrl").value || "").trim();
    if (!/^https:\/\//.test(url)) { $("dMsg").textContent = D.badUrl; return; }
    T_.ep = url; persist();
    postRow(url, { time: new Date().toISOString(), nickname: "TEST", scenario: "test row", outcome: "test", score: 0 });
    Sound.confirm(); $("dMsg").textContent = D.sent;
  };
}
