/* ═══════════════ SCREENS ═══════════════ */
const langToggle = () => `<div class="seg" role="group" aria-label="Language"><button data-lang="en" aria-pressed="${lang === "en"}">EN</button><button data-lang="es" aria-pressed="${lang === "es"}">ES</button></div>`;
const diffToggle = () => `<div class="seg" role="group"><button data-diff="0" aria-pressed="${!store.hard}">${esc(g().diff.normal)}</button><button data-diff="1" aria-pressed="${!!store.hard}">${esc(g().diff.hard)}</button></div>`;
const soundToggle = () => `<button class="btn ghost small" id="sndBtn" aria-pressed="${store.sound !== false}">${esc(g().sound)}: ${esc(store.sound !== false ? g().on : g().off)}</button>`;
function bindToggles(rerender) {
  $("overlay").querySelectorAll("[data-lang]").forEach(b => (b.onclick = () => { lang = b.dataset.lang; store.lang = lang; persist(); document.documentElement.lang = lang; Sound.select(); rerender(); }));
  $("overlay").querySelectorAll("[data-diff]").forEach(b => (b.onclick = () => { store.hard = b.dataset.diff === "1"; persist(); Sound.select(); rerender(); }));
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
    ${sv ? `<button class="btn big" id="tCont" data-hot>${esc(gg.continueGame(gg.levels[sv.cfg.scenario][0], sv.inputs.length + 1))} →</button>` : ""}
    <button class="btn big ${sv ? "ghost" : ""}" id="tStart" ${sv ? "" : "data-hot"}>${esc(gg.play)} →</button>
    <div class="toggles">${langToggle()}${soundToggle()}</div>
  </div>`);
  $("tStart").onclick = () => { Sound.unlock(); Sound.confirm(); levelSelect(); };
  if (sv) $("tCont").onclick = () => { Sound.unlock(); Sound.confirm(); startLevel(sv.cfg.scenario, sv.cfg.seed, sv.inputs, !!sv.cfg.hard); };
  bindToggles(titleScreen);
}

function levelSelect() {
  screen = "levels"; game = null; resetStage(); $("hud").hidden = true; drawRoom(); renderTicker();
  const gg = g(), achIds = Object.keys(gg.ach), got = achIds.filter(a => store.ach[a]).length;
  openOverlay(`<div class="scr">
    <h2 class="scr-title">${esc(gg.levelsTitle)}</h2>
    <div class="lvl-grid">${LEVEL_ORDER.map((k, idx) => {
      const [name, year, blurb] = gg.levels[k], sk = k + (store.hard ? ":hard" : ""), st = store.stars[sk] || 0, [bg, icon] = LEVEL_ICON[k];
      return `<button class="lvl" data-level="${k}" data-key="${idx + 1}">
        <span class="lvl-icon" style="--ic:${bg}">${icon}</span>
        <span class="lvl-main">
          <span class="lvl-top"><span>${esc(gg.level(idx + 1))} · ${esc(year)}</span><span class="dots">${[0, 1, 2, 3].map(d => `<i class="${d <= idx ? "on" : ""}"></i>`).join("")}</span></span>
          <span class="lvl-name">${esc(name)}</span>
          <span class="lvl-blurb">${esc(blurb)}</span>
          <span class="lvl-foot"><span class="stars-s" aria-label="${st}/3">${starRow(st)}</span><span>${esc(gg.best)}: ${store.best[sk] ?? "—"}</span></span>
        </span></button>`;
    }).join("")}</div>
    <div class="toggles">${diffToggle()}</div><p class="diff-hint">${store.hard ? esc(gg.hardHint) : ""}</p>
    <label class="code"><span>${esc(gg.code)}</span><input id="codeIn" maxlength="8" autocomplete="off" spellcheck="false"></label>
    <p class="hint">${esc(gg.codeHint)}</p>
    <div class="achbar"><span class="sec-lab">${esc(gg.achTitle)} · ${got}/${achIds.length}</span><div class="ach-row">${achIds.map(id => `<span class="ach-pill ${store.ach[id] ? "got" : ""}" title="${esc(gg.ach[id][1])}">${esc(gg.ach[id][0])}</span>`).join("")}</div></div>
    <div class="btns"><button class="btn ghost" id="lBack">← ${esc(gg.back)}</button>${langToggle()}${soundToggle()}</div>
  </div>`);
  $("overlay").querySelectorAll("[data-level]").forEach(b => (b.onclick = () => {
    const code = ($("codeIn").value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    Sound.confirm(); startLevel(b.dataset.level, code || randomCode(), [], !!store.hard);
  }));
  $("lBack").onclick = titleScreen;
  bindToggles(levelSelect);
}

function startLevel(scenario, seed, inputs = [], hard = false) {
  closeOverlay(); resetStage();
  screen = "game";
  const sc = extendScenario(buildScenario(scenario, seed), seed);
  if (hard) { const f = scenario === "oil" ? 1.15 : 1.3; ["d", "s"].forEach(k => (sc[k] = sc[k].map(v => v * f))); ["noiseD", "noiseS"].forEach(k => (sc[k] = sc[k].map(v => v * 1.4))); sc.cred = Math.max(0.3, sc.cred - 0.05); }
  game = { cfg: { scenario, seed, hard: !!hard }, sc, hist: [initGame(sc)], reports: [], inputs: [], hud: null, headlines: [] };
  g().tickerStart.forEach((x, k) => game.headlines.push({ key: "start" + k, src: "wire", textFn: () => g().tickerStart[k] }));
  inputs.forEach(advance);
  saveGame();
  drawRoom(); renderTicker();
  if (inputs.length) { if (over()) { renderHUD(cur(), null, cur().t); endLevel(true); } else beginQuarter(); return; }
  renderHUD(cur(), null, 1);
  const lines = g().intro[scenario];
  play([...lines.map(([id, mood], k) => () => say({ speaker: id, mood, text: g().intro[scenario][k][2], skip: true })), () => beginQuarter()]);
}

