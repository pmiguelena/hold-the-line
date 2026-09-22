/* ═══════════════ SCREENS ═══════════════ */
const langToggle = () => `<div class="seg" role="group" aria-label="Language"><button data-lang="en" aria-pressed="${lang === "en"}">EN</button><button data-lang="es" aria-pressed="${lang === "es"}">ES</button></div>`;
const diffToggle = () => `<div class="seg" role="group"><button data-diff="0" aria-pressed="${!store.hard}">${esc(g().diff.normal)}</button><button data-diff="1" aria-pressed="${!!store.hard}">${esc(g().diff.hard)}</button></div>`;
const econToggle = () => `<div class="seg" role="group"><button data-econ="0" aria-pressed="${!store.em}">${esc(g().econ.adv)}</button><button data-econ="1" aria-pressed="${!!store.em}">${esc(g().econ.em)}</button></div>`;
const soundToggle = () => `<button class="btn ghost small" id="sndBtn" aria-pressed="${store.sound !== false}">${esc(g().sound)}: ${esc(store.sound !== false ? g().on : g().off)}</button>`;
function bindToggles(rerender) {
  $("overlay").querySelectorAll("[data-lang]").forEach(b => (b.onclick = () => { lang = b.dataset.lang; store.lang = lang; persist(); document.documentElement.lang = lang; Sound.select(); rerender(); }));
  $("overlay").querySelectorAll("[data-diff]").forEach(b => (b.onclick = () => { store.hard = b.dataset.diff === "1"; persist(); Sound.select(); rerender(); }));
  $("overlay").querySelectorAll("[data-mandate]").forEach(b => (b.onclick = () => { store.mandate = b.dataset.mandate; persist(); Sound.select(); rerender(); }));
  $("overlay").querySelectorAll("[data-econ]").forEach(b => (b.onclick = () => { store.em = b.dataset.econ === "1"; persist(); Sound.select(); rerender(); }));
  const tb = $("tipsBtn"); if (tb) tb.onclick = () => { store.tips = store.tips === false; if (store.tips) store.tipsSeen = {}; persist(); Sound.select(); rerender(); };
  const sb = $("sndBtn"); if (sb) sb.onclick = () => { store.sound = store.sound === false; persist(); Sound.select(); rerender(); };
}
function resetStage() { if (typing) typing.cancel(); beats = []; beatIdx = -1; setCast([]); tvOff(); $("panel").innerHTML = ""; }

function titleScreen() {
  screen = "title"; game = null; resetStage(); $("hud").hidden = true; drawRoom(); renderTicker();
  const gg = g(), sv = loadSave();
  openOverlay(`<div class="scr">
    <span class="tagline">${esc(gg.tagline)}</span>
    <h1 class="wordmark"><span>Hold</span><span>the line</span></h1>
    <div class="lineup">${[["salas", "happy"], ["harrow", "neutral"], ["weiss", "neutral"], ["okafor", "happy"], ["quiroga", "angry"]].map(([id, m]) => portraitSVG(id, m)).join("")}</div>
    <p class="credits">${esc(gg.credits)}</p>
    ${classCardHTML()}
    ${sv ? `<button class="btn big ${store.klass ? "ghost" : ""}" id="tCont" ${store.klass ? "" : "data-hot"}>${esc(gg.continueGame(gg.levels[sv.cfg.scenario][0], sv.inputs.length + 1))} →</button>` : ""}
    <button class="btn big ${sv || store.klass ? "ghost" : ""}" id="tStart" ${sv || store.klass ? "" : "data-hot"}>${esc(gg.play)} →</button>
    <div class="toggles"><button class="btn ghost small" id="tJoin">${esc(gg.cls.joinBtn)}</button><button class="btn ghost small" id="tProf">${esc(gg.prof.edit)}</button><button class="btn ghost small" id="tTeach">${esc(gg.cls.teacherBtn)}</button></div>
    <div class="toggles">${langToggle()}${soundToggle()}</div>
  </div>`);
  $("tStart").onclick = () => { Sound.unlock(); Sound.confirm(); levelSelect(); };
  if (sv) $("tCont").onclick = () => { Sound.unlock(); Sound.confirm(); startLevel(sv.cfg.scenario, sv.cfg.seed, sv.inputs, !!sv.cfg.hard, !!sv.cfg.em, optsOf(sv.cfg)); };
  bindClassCard();
  $("tJoin").onclick = () => { Sound.unlock(); Sound.select(); joinClass(); };
  $("tTeach").onclick = () => { Sound.unlock(); Sound.select(); teacherDesk(); };
  $("tProf").onclick = () => { Sound.unlock(); Sound.select(); profileScreen(titleScreen); };
  bindToggles(titleScreen);
}

function levelSelect() {
  screen = "levels"; game = null; resetStage(); $("hud").hidden = true; drawRoom(); renderTicker();
  const gg = g(), achIds = Object.keys(gg.ach), got = achIds.filter(a => store.ach[a]).length;
  openOverlay(`<div class="scr">
    <h2 class="scr-title">${esc(gg.levelsTitle)}</h2>
    ${careerCard()}
    <div class="lvl-grid">${LEVEL_ORDER.map((k, idx) => {
      const [name, year, blurb] = gg.levels[k], sk = k + (store.hard ? ":hard" : "") + (store.em ? ":em" : "") + (store.mandate === "dual" ? ":dual" : ""), st = store.stars[sk] || 0, [bg, icon] = LEVEL_ICON[k];
      return `<button class="lvl" data-level="${k}" data-key="${idx + 1}">
        <span class="lvl-icon" style="--ic:${bg}">${icon}</span>
        <span class="lvl-main">
          <span class="lvl-top"><span>${esc(gg.level(idx + 1))} · ${esc(year)}</span><span class="dots">${[0, 1, 2, 3].map(d => `<i class="${d <= idx ? "on" : ""}"></i>`).join("")}</span></span>
          <span class="lvl-name">${esc(name)}</span>
          <span class="lvl-blurb">${esc(blurb)}</span>
          <span class="lvl-foot"><span class="stars-s" aria-label="${st}/3">${starRow(st)}</span><span>${esc(gg.best)}: ${store.best[sk] ?? "—"}</span></span>
        </span></button>`;
    }).join("")}</div>
    <div class="toggles">${diffToggle()}${econToggle()}${mandateToggle()}</div><p class="diff-hint">${[store.hard ? gg.hardHint : "", store.em ? gg.emHint : "", store.mandate === "dual" ? gg.mandate.hint.dual : ""].filter(Boolean).map(esc).join(" ")}</p>
    <label class="code"><span>${esc(gg.code)}</span><input id="codeIn" maxlength="8" autocomplete="off" spellcheck="false"></label>
    <p class="hint">${esc(gg.codeHint)}</p>
    <div class="achbar"><span class="sec-lab">${esc(gg.achTitle)} · ${got}/${achIds.length}</span><div class="ach-row">${achIds.map(id => `<span class="ach-pill ${store.ach[id] ? "got" : ""}" title="${esc(gg.ach[id][1])}">${esc(gg.ach[id][0])}</span>`).join("")}</div></div>
    <div class="btns"><button class="btn ghost" id="lBack">← ${esc(gg.back)}</button><button class="btn ghost" id="lGloss">${esc(gg.gloss.title)}</button>${langToggle()}${soundToggle()}${tipsToggle()}</div>
  </div>`);
  $("overlay").querySelectorAll("[data-level]").forEach(b => (b.onclick = () => {
    const code = ($("codeIn").value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    Sound.confirm(); startLevel(b.dataset.level, code || randomCode(), [], !!store.hard, !!store.em, { mandate: store.mandate === "dual" ? "dual" : "price" });
  }));
  $("lBack").onclick = titleScreen;
  $("lGloss").onclick = () => openGlossary(levelSelect);
  bindCareerCard();
  bindToggles(levelSelect);
}

function startLevel(scenario, seed, inputs = [], hard = false, em = false, opts = {}) {
  closeOverlay(); resetStage();
  screen = "game";
  const mandate = opts.mandate === "dual" ? "dual" : "price";
  if (scenario === "custom" && opts.cs) installCustom(opts.cs);
  const sc = applyMode(extendScenario(buildScenario(scenario, seed), seed), hard, em, mandate, opts.carry);
  game = { cfg: { scenario, seed, hard: !!hard, em: !!em, mandate, carry: opts.carry || null, career: !!opts.career, klass: opts.klass || null, student: opts.student || "", cs: opts.cs || null }, sc, hist: [initGame(sc)], reports: [], inputs: [], hud: null, headlines: [] };
  g().tickerStart.forEach((x, k) => game.headlines.push({ key: "start" + k, src: "wire", textFn: () => g().tickerStart[k] }));
  inputs.forEach(advance);
  saveGame();
  drawRoom(); renderTicker();
  if (inputs.length) { if (over()) { renderHUD(cur(), null, cur().t); endLevel(true); } else beginQuarter(); return; }
  renderHUD(cur(), null, 1);
  const intro = () => [["salas", "neutral", g().mandateLine[mandate]], ...g().intro[scenario]];     // re-read on language change
  play([...intro().map(([id, mood], k) => () => say({ speaker: id, mood, text: intro()[k][2], skip: true })), () => beginQuarter()]);
}

