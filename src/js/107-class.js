/* ═══════════════ CLASSROOM: CLASS LINKS, RESULT CODES, TEACHER DESK ═══════════════ */
const PUBLIC_URL = "https://pmiguelena.github.io/hold-the-line/game.html";
const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
const CODE_RE = /HTL([CR])1\.([A-Za-z0-9_-]+)/g;
const sealed = body => ({ ...body, c: hashStr(JSON.stringify(body)).toString(36) });
function encodeCode(kind, body) { return `HTL${kind}1.${b64e(JSON.stringify(sealed(body)))}`; }
function decodeCode(str) {
  CODE_RE.lastIndex = 0;
  const m = CODE_RE.exec(String(str || ""));
  if (!m) return null;
  try { const o = JSON.parse(b64d(m[2])), { c, ...body } = o; return { kind: m[1], body, ok: c === hashStr(JSON.stringify(body)).toString(36) }; } catch { return null; }
}
const classLink = code => (/^https?:$/.test(location.protocol) && !/claude/.test(location.host) ? location.origin + location.pathname : PUBLIC_URL) + "?class=" + code;

// Decisions, packed small so a whole term fits in a code a student can paste.
const TONES = ["dovish", "neutral", "hawkish"], DEPT_L = { stats: "s", research: "r", comms: "c", supervision: "v", markets: "m" };
const packInp = i => [Math.round(i.move * 4), TONES.indexOf(i.tone), i.choice ?? -1, i.qa ?? -1, i.qe || 0, i.fx || 0, i.macro ? 1 : 0, (i.buy || []).map(k => DEPT_L[k]).join(""), i.qt ? 1 : 0];
const unpackInp = a => ({ move: a[0] / 4, tone: TONES[a[1]] || "neutral", choice: a[2] < 0 ? null : a[2], qa: a[3] < 0 ? null : a[3], qe: a[4] || 0, fx: a[5] || 0, macro: !!a[6],
  qt: !!a[8], buy: [...(a[7] || "")].map(c => Object.keys(DEPT_L).find(k => DEPT_L[k] === c)).filter(Boolean) });

// A teacher's scenario: the model part builds the shocks, this adds its words to both languages.
function installCustom(spec) {
  const sc = customScenario(spec), name = (spec.n || "").trim() || g().cls.assign.custom;
  ["en", "es"].forEach(L => {
    G[L].levels.custom = [name, `${sc.year}`, G[L].cls.customBlurb];
    G[L].intro.custom = [["salas", "neutral", (spec.intro || "").trim() || G[L].cls.defaultIntro]];
    (spec.ev || []).forEach(([t, , , , head, dek]) => { if (head) T[L].news["cu" + clamp(Math.round(+t || 1), 1, M.turns)] = [head, dek || ""]; });
  });
}
const cfgOf = c => ({ l: c.scenario, sd: c.seed, h: !!c.hard, e: !!c.em, m: c.mandate || "price", cs: c.cs || null, cr: c.carry || null });
const optsOf = c => ({ mandate: c.mandate, carry: c.carry, career: c.career, klass: c.klass, student: c.student, cs: c.cs });

function resultCode(name) {
  const c = game.cfg;
  return encodeCode("R", { cfg: cfgOf(c), cl: c.klass ? c.klass.cl || "" : "", pr: store.profile || null, nm: (name || "").trim(), d: new Date().toISOString().slice(0, 10), in: game.inputs.map(packInp) });
}
// Replays a term from its settings and decisions, exactly as the game played it.
function replayCfg(cfg, inputs) {
  if (cfg.l === "custom" && cfg.cs) installCustom(cfg.cs);
  const sc = applyMode(extendScenario(buildScenario(cfg.l, cfg.sd), cfg.sd), cfg.h, cfg.e, cfg.m, cfg.cr);
  const hist = [initGame(sc)], reports = [];
  for (const inp of inputs) {
    const s = hist[hist.length - 1];
    if (s.t >= M.turns || s.lost) break;
    const prep = prepGame(s, sc), res = stepGame(s, sc, prep, inp);
    hist.push(res.state); reports.push({ prep, inp, prev: s, ...res });
  }
  return { cfg: { scenario: cfg.l, seed: cfg.sd, hard: cfg.h, em: cfg.e, mandate: cfg.m, cs: cfg.cs, carry: cfg.cr }, sc, hist, reports, inputs: inputs.slice(0, reports.length), hud: null, headlines: [] };
}

function copyText(text, btn) {
  const done = () => { if (btn) { const o = btn.textContent; btn.textContent = g().cls.copied; setTimeout(() => (btn.textContent = o), 1400); } };
  const fallback = () => { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch {} ta.remove(); done(); };
  try { navigator.clipboard.writeText(text).then(done, fallback); } catch { fallback(); }
}
// A plain download link works on the web; inside the claude.ai viewer the page must ask the host to save the file.
function downloadText(name, text, type = "text/plain") {
  const link = () => {
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" })); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    } catch {}
  };
  try {
    if (window.claude && typeof window.claude.use === "function") {
      window.claude.use("downloads").then(dl => (dl ? dl.save({ filename: name, data: text }).catch(() => {}) : link()), link);
      return;
    }
  } catch {}
  link();
}
const fileSafe = s => (s || "result").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "result";

/* ── students ── */
function readClassFromURL() {
  try {
    const p = new URLSearchParams(location.search), raw = p.get("class");
    if (raw) { const d = decodeCode(raw); if (d && d.kind === "C" && d.ok) { store.klass = d.body; persist(); } }
    return /teacher/.test(location.hash) || p.has("teacher");
  } catch { return false; }
}
function classTags(k) {
  const gg = g();
  if (k.l === "custom" && k.cs) installCustom(k.cs);
  return [gg.levels[k.l] ? gg.levels[k.l][0] : k.l, k.sd, k.h ? gg.diff.hard : "", k.e ? gg.econ.em : "", k.m === "dual" ? gg.mandate.dualShort : ""].filter(Boolean).join(" · ");
}
function classCardHTML() {
  const k = store.klass, C = g().cls;
  if (!k) return "";
  return `<div class="class-card"><span class="sec-lab">${esc(C.assignTitle)}</span><b class="cc-name">${esc(k.cl || "—")}</b><span class="cc-tags">${esc(classTags(k))}</span>
    <label class="code"><span>${esc(C.yourName)}</span><input id="stName" class="name-in" maxlength="40" value="${esc(store.studentName || (store.profile && store.profile.nick) || "")}" autocomplete="name" spellcheck="false"></label>
    <p class="diff-hint" id="stHint"></p>
    <div class="btns"><button class="btn big" id="caGo" data-hot>${esc(C.start)} →</button><button class="btn ghost small" id="caLeave">${esc(C.leave)}</button></div></div>`;
}
function bindClassCard() {
  if (!$("caGo")) return;
  $("caGo").onclick = () => {
    const nm = $("stName").value.trim();
    if (!nm) { $("stHint").textContent = g().cls.nameNeeded; $("stName").focus(); return; }
    store.studentName = nm; persist(); Sound.unlock(); Sound.confirm();
    const k = store.klass;
    if (k.l === "custom" && k.cs) installCustom(k.cs);
    startLevel(k.l, k.sd, [], k.h, k.e, { mandate: k.m, klass: k, student: nm, cs: k.cs });
  };
  $("caLeave").onclick = () => { delete store.klass; persist(); Sound.select(); titleScreen(); };
}
function joinClass() {
  const C = g().cls;
  openOverlay(`<div class="scr"><h2 class="scr-title">${esc(C.joinTitle)}</h2><p class="credits">${esc(C.joinHint)}</p>
    <textarea id="joinIn" class="code-box" rows="4" spellcheck="false" placeholder="HTLC1.…"></textarea><p class="diff-hint" id="joinHint"></p>
    <div class="btns"><button class="btn ghost" id="joinBack">← ${esc(g().back)}</button><button class="btn big" id="joinGo" data-hot>${esc(C.joinGo)} →</button></div></div>`);
  $("joinBack").onclick = titleScreen;
  $("joinGo").onclick = () => {
    const d = decodeCode($("joinIn").value);
    if (!d || d.kind !== "C" || !d.ok) { $("joinHint").textContent = C.badCode; return; }
    store.klass = d.body; persist(); Sound.confirm(); titleScreen();
  };
}
// End of a term: the code a student hands in.
function handInHTML() {
  const C = g().cls, k = game.cfg.klass;
  return `<div class="hand-in ${k ? "" : "folded"}" id="handIn">
    ${k ? "" : `<button class="btn ghost" id="hiOpen">${esc(C.shareBtn)}</button>`}
    <div class="hi-body" ${k ? "" : "hidden"}><span class="sec-lab">${esc(C.handTitle)}${k && k.cl ? ` · ${esc(k.cl)}` : ""}</span>
      ${k ? "" : `<label class="code"><span>${esc(C.nameFor)}</span><input id="hiName" class="name-in" maxlength="40" value="${esc(store.studentName || (store.profile && store.profile.nick) || "")}" spellcheck="false"></label>`}
      <textarea id="hiCode" class="code-box" rows="3" readonly spellcheck="false"></textarea>
      <p class="note">${esc(C.handHint)}</p>
      <div class="btns"><button class="btn" id="hiCopy">${esc(C.copy)}</button><button class="btn ghost" id="hiDl">${esc(C.download)}</button></div></div></div>`;
}
function bindHandIn() {
  const nm = () => (game.cfg.klass ? game.cfg.student : $("hiName") ? $("hiName").value : "") || "";
  const refresh = () => { $("hiCode").value = resultCode(nm()); };
  refresh();
  if ($("hiOpen")) $("hiOpen").onclick = () => { $("hiOpen").hidden = true; $("handIn").querySelector(".hi-body").hidden = false; $("handIn").classList.remove("folded"); };
  if ($("hiName")) $("hiName").oninput = () => { store.studentName = $("hiName").value.trim(); persist(); refresh(); };
  $("hiCode").onfocus = () => $("hiCode").select();
  $("hiCopy").onclick = () => copyText($("hiCode").value, $("hiCopy"));
  $("hiDl").onclick = () => downloadText(`hold-the-line-${fileSafe(nm())}.txt`, $("hiCode").value + "\n");
}

/* ── teacher desk ── */
const newAssign = () => ({ cl: "", l: "crisis", sd: randomCode(), h: false, e: false, m: "price" });
const newSpec = () => ({ n: "", intro: "", y: 2027, q: 1, c: 0.75, x: false, ev: [[3, "d", -1.5, 3, "", ""]], dl: [] });
function tdState() {
  store.teacher = store.teacher || {};
  const T_ = store.teacher;
  if (!T_.a) T_.a = newAssign();
  if (!T_.b) T_.b = newSpec();
  return T_;
}
function teacherDesk(tab) {
  screen = "teacher"; game = null; resetStage(); $("hud").hidden = true; drawRoom(); renderTicker();
  const T_ = tdState(), C = g().cls;
  if (tab != null) T_.tab = tab;
  const cur_ = T_.tab || 0;
  openOverlay(`<div class="scr tdesk">
    <h2 class="scr-title">${esc(C.desk.title)}</h2><p class="credits">${esc(C.desk.sub)}</p>
    <div class="seg td-tabs" role="tablist">${C.desk.tabs.map((n, k) => `<button role="tab" data-tab="${k}" aria-pressed="${k === cur_}">${esc(n)}</button>`).join("")}</div>
    <div id="tdBody" class="td-body"></div>
    <div class="btns"><button class="btn ghost" id="tdBack">← ${esc(C.desk.back)}</button>${langToggle()}</div></div>`);
  $("overlay").querySelectorAll("[data-tab]").forEach(b => (b.onclick = () => { Sound.select(); persist(); teacherDesk(+b.dataset.tab); }));
  $("tdBack").onclick = () => { persist(); titleScreen(); };
  bindToggles(() => teacherDesk());
  [assignTab, builderTab, resultsTab, dataTab][cur_]();
}
const seg = (attr, opts, val) => `<div class="seg" role="group">${opts.map(([v, label]) => `<button data-${attr}="${v}" aria-pressed="${String(v) === String(val)}">${esc(label)}</button>`).join("")}</div>`;

function assignTab() {
  const T_ = tdState(), a = T_.a, C = g().cls, A = C.assign, gg = g(), hasCustom = !!(T_.bSaved);
  if (a.l === "custom" && !hasCustom) a.l = "crisis";
  if (hasCustom) installCustom(T_.bSaved);
  const levels = LEVEL_ORDER.map(k => [k, gg.levels[k][0]]).concat(hasCustom ? [["custom", `${A.custom}: ${gg.levels.custom[0]}`]] : []);
  $("tdBody").innerHTML = `<div class="td-grid">
    <label class="fld"><span>${esc(A.className)}</span><input id="aCl" maxlength="60" value="${esc(a.cl)}" placeholder="${esc(A.classPh)}"></label>
    <label class="fld"><span>${esc(A.level)}</span><select id="aLv">${levels.map(([k, n]) => `<option value="${k}" ${k === a.l ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
    <div class="fld"><span>${esc(A.code)}</span><div class="row"><input id="aSd" maxlength="8" value="${esc(a.sd)}" spellcheck="false"><button class="btn ghost small" id="aNew">${esc(A.newCode)}</button></div></div>
    <div class="fld wide"><div class="toggles">${seg("ah", [[0, gg.diff.normal], [1, gg.diff.hard]], +a.h)}${seg("ae", [[0, gg.econ.adv], [1, gg.econ.em]], +a.e)}${seg("am", [["price", gg.mandate.price[0]], ["dual", gg.mandate.dual[0]]], a.m)}</div></div>
  </div>
  ${hasCustom ? "" : `<p class="note">${esc(A.noCustom)}</p>`}
  <div class="td-out">
    <label class="fld"><span>${esc(A.link)}</span><div class="row"><input id="aLink" readonly><button class="btn small" id="aCopyL">${esc(C.copy)}</button></div></label>
    <p class="note">${esc(A.linkHint)}</p>
    <label class="fld"><span>${esc(A.classCode)}</span><div class="row"><textarea id="aCode" class="code-box" rows="2" readonly spellcheck="false"></textarea><button class="btn ghost small" id="aCopyC">${esc(C.copy)}</button></div></label>
    <p class="note">${esc(A.classCodeHint)}</p>
    <div class="btns"><button class="btn" id="aTry">${esc(A.tryIt)} →</button></div>
  </div>`;
  const payload = () => ({ v: 1, cl: a.cl.trim(), l: a.l, sd: (a.sd || "").toUpperCase().replace(/[^A-Z0-9]/g, "") || randomCode(), h: !!a.h, e: !!a.e, m: a.m, cs: a.l === "custom" ? T_.bSaved : null, ep: (T_.ep || "").trim() || null });
  const out = () => { const code = encodeCode("C", payload()); $("aLink").value = classLink(code); $("aCode").value = code; persist(); };
  $("aCl").oninput = () => { a.cl = $("aCl").value; out(); };
  $("aLv").onchange = () => { a.l = $("aLv").value; out(); };
  $("aSd").oninput = () => { a.sd = $("aSd").value.toUpperCase().replace(/[^A-Z0-9]/g, ""); out(); };
  $("aNew").onclick = () => { a.sd = randomCode(); $("aSd").value = a.sd; Sound.select(); out(); };
  const segBind = (attr, set) => $("tdBody").querySelectorAll(`[data-${attr}]`).forEach(b => (b.onclick = () => { set(b.dataset[attr]); Sound.select(); assignTab(); }));
  segBind("ah", v => (a.h = v === "1")); segBind("ae", v => (a.e = v === "1")); segBind("am", v => (a.m = v));
  ["aLink", "aCode"].forEach(id => ($(id).onfocus = () => $(id).select()));
  $("aCopyL").onclick = () => copyText($("aLink").value, $("aCopyL"));
  $("aCopyC").onclick = () => copyText($("aCode").value, $("aCopyC"));
  $("aTry").onclick = () => { store.klass = payload(); persist(); Sound.confirm(); titleScreen(); };
  out();
}

function builderTab() {
  const T_ = tdState(), b = T_.b, C = g().cls, B = C.build, t = tr();
  const qOpts = v => Array.from({ length: M.turns }, (_, k) => `<option value="${k + 1}" ${k + 1 === +v ? "selected" : ""}>${k + 1}</option>`).join("");
  const dils = Object.keys(DILEMMAS);
  $("tdBody").innerHTML = `<div class="td-grid">
    <label class="fld"><span>${esc(B.name)}</span><input id="bN" maxlength="50" value="${esc(b.n)}" placeholder="${esc(B.namePh)}"></label>
    <label class="fld"><span>${esc(B.year)} · ${esc(B.quarter)}</span><div class="row"><input id="bY" type="number" min="1900" max="2100" value="${b.y}"><select id="bQ">${[1, 2, 3, 4].map(q => `<option ${q === +b.q ? "selected" : ""}>${q}</option>`).join("")}</select></div></label>
    <label class="fld wide"><span>${esc(B.intro)}</span><input id="bI" maxlength="220" value="${esc(b.intro)}" placeholder="${esc(B.introPh)}"></label>
    <label class="fld"><span id="bCl">${esc(B.cred(Math.round(b.c * 100)))}</span><input id="bC" type="range" min="30" max="90" step="5" value="${Math.round(b.c * 100)}"></label>
    <div class="fld"><span>${esc(B.surprises)}</span>${seg("bx", [[0, g().off], [1, g().on]], b.x ? 1 : 0)}</div>
  </div>
  <p class="note">${esc(B.surprisesHint)}</p>
  <p class="note guide">${esc(B.guide)}</p>
  <div class="db-sec"><span class="sec-lab">${esc(B.events)}</span>
    <div class="ev-list">${b.ev.length ? b.ev.map((e, k) => `<div class="ev" data-ev="${k}">
      <label><span>${esc(B.q)}</span><select data-f="0">${qOpts(e[0])}</select></label>
      <label><span>${esc(B.kind)}</span><select data-f="1"><option value="d" ${e[1] === "d" ? "selected" : ""}>${esc(B.kinds.d)}</option><option value="s" ${e[1] === "s" ? "selected" : ""}>${esc(B.kinds.s)}</option></select></label>
      <label><span>${esc(B.size)} <b data-sz>${sgn(+e[2], 2)}</b></span><input data-f="2" type="range" min="-3" max="3" step="0.25" value="${e[2]}"></label>
      <label><span>${esc(B.dur)}</span><select data-f="3">${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${n === +e[3] ? "selected" : ""}>${esc(B.durN(n))}</option>`).join("")}</select></label>
      <label class="grow"><span>${esc(B.head)}</span><input data-f="4" maxlength="90" value="${esc(e[4] || "")}" placeholder="${esc(B.headPh)}"></label>
      <label class="grow"><span>${esc(B.dek)}</span><input data-f="5" maxlength="160" value="${esc(e[5] || "")}"></label>
      <button class="btn ghost small" data-rm="${k}">${esc(B.remove)}</button></div>`).join("") : `<p class="note">${esc(B.empty)}</p>`}</div>
    <div class="btns"><button class="btn ghost small" id="bAdd">+ ${esc(B.addEvent)}</button></div></div>
  <div class="db-sec"><span class="sec-lab">${esc(B.dilemmas)}</span>
    <div class="ev-list">${b.dl.map((e, k) => `<div class="ev" data-dl="${k}">
      <label><span>${esc(B.q)}</span><select data-g="0">${qOpts(e[0])}</select></label>
      <label class="grow"><span>${esc(B.dilemmas)}</span><select data-g="1">${dils.map(id => `<option value="${id}" ${id === e[1] ? "selected" : ""}>${esc(t.dilemmas[id][0])}</option>`).join("")}</select></label>
      <button class="btn ghost small" data-rmd="${k}">${esc(B.remove)}</button></div>`).join("")}</div>
    ${b.dl.length < 4 ? `<div class="btns"><button class="btn ghost small" id="bAddD">+ ${esc(B.addDil)}</button></div>` : ""}</div>
  <div class="chart-card" id="bPrev"></div>
  <div class="btns"><button class="btn" id="bSave">${esc(B.save)}</button><button class="btn ghost" id="bTest">${esc(B.test)} →</button><button class="btn ghost" id="bUse">${esc(B.use)} →</button></div>`;
  const preview = () => {
    const sc = customScenario(b), d = [0, ...sc.d], s = [0, ...sc.s];
    const yq = k => { const z = sc.q - 1 + k; return `${sc.year + Math.floor(z / 4)}Q${(z % 4) + 1}`; };
    $("bPrev").innerHTML = `<header><h4>${esc(B.preview)}</h4><span class="keys"><span style="--c:#5B9BD5">${esc(B.demand)}</span><span style="--c:#F2B650">${esc(B.supply)}</span></span></header>`
      + chartSVG({ title: B.preview, series: [{ values: d, color: "#5B9BD5", bars: true }, { values: s, color: "#F2B650" }], include: [-2, 2], refs: [0] }, yq);
    persist();
  };
  const body = $("tdBody");
  $("bN").oninput = () => { b.n = $("bN").value; persist(); };
  $("bI").oninput = () => { b.intro = $("bI").value; persist(); };
  $("bY").oninput = () => { b.y = +$("bY").value || 2027; preview(); };
  $("bQ").onchange = () => { b.q = +$("bQ").value; preview(); };
  $("bC").oninput = () => { b.c = +$("bC").value / 100; $("bCl").textContent = B.cred($("bC").value); persist(); };
  body.querySelectorAll("[data-bx]").forEach(x => (x.onclick = () => { b.x = x.dataset.bx === "1"; Sound.select(); builderTab(); }));
  body.querySelectorAll(".ev[data-ev]").forEach(row => {
    const e = b.ev[+row.dataset.ev];
    row.querySelectorAll("[data-f]").forEach(inp => (inp.oninput = inp.onchange = () => {
      const f = +inp.dataset.f; e[f] = f === 1 || f >= 4 ? inp.value : +inp.value;
      if (f === 2) row.querySelector("[data-sz]").textContent = sgn(+inp.value, 2);
      preview();
    }));
  });
  body.querySelectorAll(".ev[data-dl]").forEach(row => {
    const e = b.dl[+row.dataset.dl];
    row.querySelectorAll("[data-g]").forEach(inp => (inp.onchange = () => { e[+inp.dataset.g] = inp.dataset.g === "0" ? +inp.value : inp.value; persist(); }));
  });
  body.querySelectorAll("[data-rm]").forEach(x => (x.onclick = () => { b.ev.splice(+x.dataset.rm, 1); Sound.select(); builderTab(); }));
  body.querySelectorAll("[data-rmd]").forEach(x => (x.onclick = () => { b.dl.splice(+x.dataset.rmd, 1); Sound.select(); builderTab(); }));
  $("bAdd").onclick = () => { const last = b.ev[b.ev.length - 1]; b.ev.push([Math.min(M.turns, last ? +last[0] + 3 : 3), "s", 1, 2, "", ""]); Sound.select(); builderTab(); };
  if ($("bAddD")) $("bAddD").onclick = () => { b.dl.push([Math.min(M.turns, 4 + 4 * b.dl.length), dils.find(id => !b.dl.some(e => e[1] === id)) || dils[0]]); Sound.select(); builderTab(); };
  const save = () => { T_.bSaved = JSON.parse(JSON.stringify(b)); persist(); };
  $("bSave").onclick = () => { save(); Sound.confirm(); $("bSave").textContent = B.saved; setTimeout(() => $("bSave") && ($("bSave").textContent = B.save), 1400); };
  $("bTest").onclick = () => { save(); installCustom(T_.bSaved); Sound.confirm(); startLevel("custom", randomCode(), [], false, false, { cs: T_.bSaved }); };
  $("bUse").onclick = () => { save(); T_.a.l = "custom"; Sound.confirm(); teacherDesk(0); };
  preview();
}

// Results: every code is replayed, so the numbers are the game's own, not what anyone typed.
function checkResults(text) {
  const out = [], seen = new Set();
  const all = String(text || "").match(CODE_RE) || [];
  for (const raw of all) {
    if (seen.has(raw)) continue; seen.add(raw);
    const d = decodeCode(raw);
    if (!d || d.kind !== "R" || !d.body.cfg || !Array.isArray(d.body.in)) { out.push({ bad: true, raw }); continue; }
    try {
      const B = d.body, gm = replayCfg(B.cfg, B.in.map(unpackInp)), s = gm.hist[gm.hist.length - 1];
      const sp = scoreGame(s), rule = scoreGame(ruleBoundGame(gm.sc)).total, db = debriefData(gm.sc, gm.inputs, gm.reports);
      const stars = s.lost ? 0 : sp.total >= rule ? 3 : sp.total >= 0.9 * rule ? 2 : 1;
      out.push({ raw, ok: d.ok, nm: B.nm || "—", cl: B.cl || "", date: B.d || "", pr: B.pr || null, cfg: B.cfg, gm, s, score: sp.total, rule, stars, db, done: !s.lost && s.t >= M.turns });
    } catch { out.push({ bad: true, raw }); }
  }
  return out;
}
function resultsCSV(rows) {
  const t = tr(), gg = g(), q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["student", "age", "gender", "education", "profession", "class", "scenario", "shock_code", "difficulty", "economy", "mandate", "score", "stars", "rule_score", "credibility", "popularity", "peak_removal_risk", "outcome", "quarters_on_target", "quarters_following_rule", "quarters_played", "date", "check"];
  const lines = rows.filter(r => !r.bad).map(r => [r.nm, r.pr ? r.pr.age : "", profLabel("genders", r.pr && r.pr.gen), profLabel("edus", r.pr && r.pr.edu), r.pr ? profText(r.pr) : "", r.cl, gg.levels[r.cfg.l] ? gg.levels[r.cfg.l][0] : r.cfg.l, r.cfg.sd, r.cfg.h ? "hard" : "normal", r.cfg.e ? "emerging" : "advanced", r.cfg.m,
    r.score, r.stars, r.rule, Math.round(r.s.cred * 100), Math.round(r.s.pop), Math.round(r.s.heatPeak || 0), r.s.lost ? t.outcome[r.s.lost] : g().cls.res.done,
    r.db.onTarget, r.db.N - r.db.deviations, r.db.N, r.date, r.ok ? "verified" : "altered"].map(q).join(","));
  return [head.join(","), ...lines].join("\n");
}
function resultsTab() {
  const T_ = tdState(), C = g().cls, R = C.res, t = tr(), gg = g();
  const rows = checkResults(T_.pasted || ""), good = rows.filter(r => !r.bad);
  const avg = good.length ? Math.round(good.reduce((a, r) => a + r.score, 0) / good.length) : 0;
  $("tdBody").innerHTML = `<label class="fld"><span>${esc(R.paste)}</span><textarea id="rIn" class="code-box" rows="5" spellcheck="false" placeholder="${esc(R.pastePh)}">${esc(T_.pasted || "")}</textarea></label>
    <div class="btns"><button class="btn" id="rGo" data-hot>${esc(R.check)}</button>${good.length ? `<button class="btn ghost" id="rCsv">${esc(R.csv)}</button><button class="btn ghost" id="rCopy">${esc(R.copyTable)}</button><button class="btn ghost" id="rPrint">${esc(R.print)}</button>` : ""}</div>
    ${rows.length ? `<p class="db-stats"><span>${esc(R.summary(good.length, avg, good.filter(r => r.done).length))}</span></p>
    <div class="tbl-wrap"><table class="hof res-tbl"><thead><tr>${R.cols.map(c => `<th>${esc(c)}</th>`).join("")}<th></th></tr></thead><tbody>
      ${rows.map((r, k) => r.bad ? `<tr class="bad"><td colspan="${R.cols.length + 1}">${esc(R.bad)}: ${esc(r.raw.slice(0, 24))}…</td></tr>`
        : `<tr><td><b>${esc(r.nm)}</b></td><td>${esc(r.cl)}</td><td>${esc(gg.levels[r.cfg.l] ? gg.levels[r.cfg.l][0] : r.cfg.l)}</td><td><b>${r.score}</b></td><td class="stars-s">${starRow(r.stars)}</td><td>${r.rule}</td>
          <td>${Math.round(r.s.cred * 100)}</td><td>${esc(r.s.lost ? t.outcome[r.s.lost] : R.done)}</td><td>${r.db.onTarget}/${r.db.N}</td><td>${r.db.N - r.db.deviations}/${r.db.N}</td>
          <td class="${r.ok ? "pos" : "neg"}">${esc(r.ok ? R.ok : R.tampered)}</td><td><button class="btn ghost small" data-rep="${k}">${esc(R.report)}</button></td></tr>`).join("")}
    </tbody></table></div>` : `<p class="note">${esc(R.none)}</p>`}`;
  $("rIn").oninput = () => { T_.pasted = $("rIn").value; persist(); };
  $("rGo").onclick = () => { T_.pasted = $("rIn").value; persist(); Sound.confirm(); resultsTab(); };
  if ($("rCsv")) {
    $("rCsv").onclick = () => downloadText(`hold-the-line-results-${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + resultsCSV(rows), "text/csv");
    $("rCopy").onclick = () => copyText(resultsCSV(rows).split("\n").map(l => l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"')).join("\t")).join("\n"), $("rCopy"));
    $("rPrint").onclick = () => window.print();
  }
  $("tdBody").querySelectorAll("[data-rep]").forEach(b => (b.onclick = () => {
    const r = rows[+b.dataset.rep];
    game = r.gm; Sound.select();
    openDebrief({ back: () => { game = null; teacherDesk(2); }, who: [C.report.who(r.nm, r.cl, r.date), r.pr ? [r.pr.age, profLabel("edus", r.pr.edu), profText(r.pr)].filter(Boolean).join(" · ") : ""].filter(Boolean).join(" — ") });
  }));
}
