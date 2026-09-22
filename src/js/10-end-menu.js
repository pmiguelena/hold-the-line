/* ═══════════════ END OF LEVEL ═══════════════ */
function evalAchievements(score, rule) {
  const R = game.reports, s = cur(), got = [], finished = !s.lost && s.t >= M.turns;
  if (R.filter(r => r.credParts.some(p => p[0] === "resisted")).length >= 3) got.push("ironWill");
  if (finished) {
    if (s.cred >= 0.895) got.push("anchored");
    if (Math.abs(s.pi - 2) < 1 && Math.abs(s.x) < 1) got.push("softLanding");
    if (R.some(r => r.state.i <= 0.001)) got.push("zeroHero");
    const statements = R.filter(r => r.inp.tone !== "neutral").length, broke = R.some(r => r.credParts.some(p => p[0] === "brokeHawk" || p[0] === "brokeDove"));
    if (statements >= 3 && !broke) got.push("wordIsBond");
    if (score > rule) got.push("beatMachine");
    if ((s.heatPeak || 0) >= 70) got.push("survivor");
    if (game.cfg.em) got.push("emStar");
    if (Math.max(...game.hist.map(h => h.lev || 0)) >= 6 && !R.some(r => r.bust)) got.push("noBubble");
  }
  if (R.some(r => r.election === "reelected")) got.push("kingmaker");
  if (s.lost) got.push("hardWay");
  return got;
}

function endLevel(restored) {
  resetStage();
  const s = cur(), t = tr(), gg = g(), key = game.cfg.scenario, sk = key + (game.cfg.hard ? ":hard" : "") + (game.cfg.em ? ":em" : "") + (game.cfg.mandate === "dual" ? ":dual" : ""), H = game.hist;
  const sp = scoreGame(s), rule = scoreGame(ruleBoundGame(game.sc)).total;
  const stars = s.lost ? 0 : sp.total >= rule ? 3 : sp.total >= 0.9 * rule ? 2 : 1;
  const got = evalAchievements(sp.total, rule), fresh = got.filter(a => !store.ach[a]);
  if (!restored) sendResult(sp, stars, rule);                              // a finished term reaches the teacher's sheet, if a class set one up
  if (game.cfg.career) careerRecord(s, sp.total, stars);                    // idempotent: a reload of the end screen records nothing new
  if (!restored) {
    clearSave();
    got.forEach(a => (store.ach[a] = true));
    store.stars[sk] = Math.max(store.stars[sk] || 0, stars);
    if (!s.lost) store.best[sk] = Math.max(store.best[sk] || 0, sp.total);
    persist();
  }
  const T_ = Math.max(1, s.t), avg = (a, b) => ((b / a) ** (1 / T_) - 1) * 400;
  const elec = game.reports.find(r => r.election), nextKey = LEVEL_ORDER.includes(key) && !game.cfg.klass ? LEVEL_ORDER[LEVEL_ORDER.indexOf(key) + 1] : null;
  const front = s.lost ? gg.finalFront[s.lost] : s.cred > 0.8 ? gg.finalFront.good : gg.finalFront.mixed;
  const qL = k => quarterLabel(k).replace(" ", "");
  openOverlay(`<div class="scr end">
    <span class="q-date">${esc(gg.levels[key][0])} · ${esc(game.cfg.seed)}${game.cfg.hard ? ` · ${esc(gg.hardTag)}` : ""}${game.cfg.em ? ` · ${esc(gg.econ.em)}` : ""}</span>
    <h2 class="big-title">${esc(s.lost ? gg.gameover : gg.complete)}</h2>
    <article class="paper front"><header class="paper-mast"><span class="pm-meta">${esc(gg.finalLabel)}</span><span class="pm-name">${esc(t.outlets.ledger)}</span><span class="pm-meta">${esc(quarterLabel(s.t + 1))}</span></header>
      <div class="paper-lead"><span class="kicker">${esc(s.lost ? t.outcome[s.lost] : t.outcome.done)}</span><h3>${esc(front)}</h3><p>${esc(s.lost ? t.lostWhy[s.lost] : t.epilogue(s.cred))}</p></div></article>
    <div class="stars">${starRow(stars)}</div>
    <div class="score"><span>${esc(t.score)}</span><b id="scoreNum">${FAST ? sp.total : 0}</b></div>
    <dl>
      <dt>${esc(t.parts.macro)}</dt><dd>${sp.macro}</dd><dt>${esc(t.parts.cred)}</dt><dd>${sp.cred}</dd><dt>${esc(t.parts.pop)}</dt><dd>${sp.pop}</dd>
      <dt>${esc(gg.instBuilt)}</dt><dd style="white-space:normal">${esc(DEPTS.map(k => `${gg.depts[k][0]} ${(s.dept || initDept())[k]}`).join(" · "))}</dd>
      <dt>${esc(gg.peakHeat)}</dt><dd>${Math.round(s.heatPeak || 0)}</dd>
      <dt>${esc(gg.ruleBound)}</dt><dd>${rule}</dd>
      <dt>${esc(t.avgGdp)}</dt><dd>${pc(avg(H[0].Y, s.Y))}</dd><dt>${esc(t.avgPrice)}</dt><dd>${pc(avg(H[0].P, s.P))}</dd>
      ${elec ? `<dt>${esc(t.elecRes)}</dt><dd>${esc(elec.election === "reelected" ? t.elec.reelected(0)[0] : t.elec.defeated()[0])}</dd>` : ""}
    </dl>
    <p class="note">${esc(gg.starsNote)}</p>
    ${fresh.length ? `<div class="achs"><span class="sec-lab">${esc(gg.newAch)}</span>${fresh.map(a => `<div class="ach"><b>${esc(gg.ach[a][0])}</b><small>${esc(gg.ach[a][1])}</small></div>`).join("")}</div>` : ""}
    ${handInHTML()}
    <div class="end-charts">${["infl", "mkt", "pol"].map(k => chartCard(k, qL, true)).join("")}</div>
    ${game.cfg.career ? `<div class="btns"><button class="btn big" id="eCareer" data-hot>${esc(gg.career.continueStory)} →</button><button class="btn ghost" id="eDebrief">${esc(gg.debrief.btn)}</button></div>` : `<div class="btns">
      <button class="btn big" id="eRetry" data-hot>${esc(gg.retry)}</button>
      <button class="btn" id="eDebrief">${esc(gg.debrief.btn)}</button>
      ${game.cfg.klass ? "" : `<button class="btn ghost" id="eFresh">${esc(gg.newShocks)}</button>`}
      ${nextKey && !s.lost ? `<button class="btn ghost" id="eNext">${esc(gg.nextLevel)} →</button>` : ""}
      <button class="btn ghost" id="eLevels">${esc(gg.toLevels)}</button>
    </div>`}
  </div>`);
  $("eDebrief").onclick = () => { Sound.select(); openDebrief(); };
  if ($("eCareer")) $("eCareer").onclick = () => { Sound.confirm(); careerAfterTerm(); };
  bindHandIn();
  const opts = optsOf(game.cfg);
  if ($("eRetry")) $("eRetry").onclick = () => { Sound.confirm(); startLevel(key, game.cfg.seed, [], game.cfg.hard, game.cfg.em, opts); };
  if ($("eFresh")) $("eFresh").onclick = () => { Sound.confirm(); startLevel(key, randomCode(), [], game.cfg.hard, game.cfg.em, opts); };
  if ($("eNext")) $("eNext").onclick = () => { Sound.confirm(); startLevel(nextKey, randomCode(), [], game.cfg.hard, game.cfg.em, opts); };
  if ($("eLevels")) $("eLevels").onclick = levelSelect;
  if (restored || FAST) return;
  if (stars === 3) confetti();
  (s.lost ? Sound.bad : Sound.good)();
  for (let k = 0; k < stars; k++) setTimeout(() => Sound.star(k), 400 + k * 400);
  const t0 = performance.now();
  const stepF = now => { const el = $("scoreNum"); if (!el) return; const f = Math.min(1, (now - t0) / 1400); el.textContent = Math.round(sp.total * (1 - (1 - f) ** 3)); if (f < 1) requestAnimationFrame(stepF); };
  requestAnimationFrame(stepF);
}

/* ═══════════════ CHARTS, MENU ═══════════════ */
function chartSpec(kind, reveal) {
  const now = cur().t, H = reveal ? game.hist : game.hist.map(h => seenOf(h, game.sc, now)), c = g().chart;
  if (kind === "infl" && reveal) return { title: c.infl, keys: [[c.infl, "#E5484D"], [c.first, "#F2B650"]], series: [{ values: game.hist.map(h => h.pi + (game.sc.errPi[h.t] || 0)), color: "#F2B650", dash: true }, { values: H.map(h => h.pi), color: "#E5484D", area: true }], band: [1, 3], include: [0, 4] };
  if (kind === "infl") return { title: c.infl, keys: [[c.infl, "#E5484D"], [c.exp, "#9AA4BD"]], series: [{ values: H.map(h => h.pe), color: "#9AA4BD", dash: true }, { values: H.map(h => h.pi), color: "#E5484D", area: true }], band: [1, 3], include: [0, 4] };
  if (kind === "gap") return { title: c.gap, keys: [], series: [{ values: H.map(h => h.x), color: "#5B9BD5", bars: true }], include: [-2, 2] };
  const iw = h => (game.sc.iw ? game.sc.iw[h.t] : 2.5);
  if (kind === "rate") return { title: c.rate, keys: [[c.rate, "#3FB68B"], [c.y10, "#C4A0FF"], [c.world, "#F2B650"]], series: [{ values: H.map(h => h.i), color: "#3FB68B", step: true }, { values: H.map(h => h.y10 || Y10_NEUTRAL), color: "#C4A0FF" }, { values: H.map(iw), color: "#F2B650", dash: true }], include: [0, 5] };
  if (kind === "fin") return { title: c.fin, keys: [[c.lev, "#E5484D"]].concat(game.sc.em ? [[c.resv, "#3FB68B"]] : []),
    series: [{ values: H.map(h => h.lev || 0), color: "#E5484D", area: true }].concat(game.sc.em ? [{ values: H.map(h => h.reserves ?? 6), color: "#3FB68B" }] : []), include: [-2, 8], refs: [0] };
  if (kind === "fisc") return { title: c.fisc, keys: [[c.debt, "#C4A0FF"], [c.interest, "#F2B650"]],
    series: [{ values: H.map(h => h.interest ?? 1.8), color: "#F2B650" }, { values: H.map(h => h.debt ?? 60), color: "#C4A0FF", area: true }], include: [0, 80] };
  if (kind === "mkt") return { title: c.mkt, keys: [[c.eq, "#5B9BD5"], [c.fx, "#F2B650"]], series: [{ values: H.map(h => h.eq || 100), color: "#5B9BD5", area: true }, { values: H.map(h => fxRate(h)), color: "#F2B650" }], include: [92, 108] };
  return { title: c.pol, keys: [[c.cred, "#3FB68B"], [c.pop, "#F2B650"], [c.heat, "#E5484D"]], series: [{ values: H.map(h => h.cred * 100), color: "#3FB68B", area: true }, { values: H.map(h => h.pop), color: "#F2B650" }, { values: H.map(h => h.heat || 0), color: "#E5484D" }], fixed: [0, 100], refs: [50] };
}
function chartCard(kind, qL, reveal) {
  const spec = chartSpec(kind, reveal);
  return `<div class="chart-card"><header><h4>${esc(spec.title)}</h4><span class="keys">${spec.keys.map(([n, c]) => `<span style="--c:${c}">${esc(n)}</span>`).join("")}</span></header>${chartSVG(spec, qL)}</div>`;
}
function openCharts() {
  if (!game) return;
  cardToken = null;
  const gg = g(), qL = k => quarterLabel(k).replace(" ", "");
  openOverlay(`<div class="scr"><h2 class="scr-title">${esc(gg.chartsTitle)}</h2>
    <div class="chart-grid">${["infl", "gap", "rate", "mkt", "fin", "fisc", "pol"].map(k => chartCard(k, qL)).join("")}</div>
    <button class="btn big" id="chClose" data-hot>${esc(gg.close)}</button></div>`);
  $("chClose").onclick = resume;
}
function openMap() {
  if (!game) return;
  cardToken = null;
  const gg = g(), s = seenOf(cur(), game.sc, cur().t);
  openOverlay(`<div class="scr"><h2 class="scr-title">${esc(gg.map.title)}</h2><div id="mapOv" class="map-ov"></div>
    <button class="btn big" id="mapClose" data-hot>${esc(gg.close)}</button></div>`);
  mountMap($("mapOv"), s, game.mapLayer || "prices");
  $("mapClose").onclick = resume;
}
function resume() { closeOverlay(); const b = beats[beatIdx]; if (b && b.ov) b(); }
function openMenu() {
  if (!game) return;
  cardToken = null;
  const gg = g();
  if (typing) typing.finish();
  openOverlay(`<div class="scr"><h2 class="scr-title">${esc(gg.paused)}</h2>
    <div class="menu-btns">
      <button class="btn big" id="mResume" data-hot>${esc(gg.resume)}</button>
      ${game.cfg.career ? "" : `<button class="btn ghost" id="mRestart">${esc(gg.restart)}</button>`}
      <button class="btn ghost" id="mLevels">${esc(gg.quit)}</button>
      <button class="btn ghost" id="mGloss">${esc(gg.gloss.title)}</button>
      <button class="btn ghost" id="mTitle">${esc(gg.toTitle)}</button>
    </div>
    <div class="toggles">${langToggle()}${soundToggle()}${tipsToggle()}</div>
    <p class="hint">${esc(gg.codeLine(game.cfg.seed))}</p></div>`);
  $("mResume").onclick = resume;
  if ($("mRestart")) $("mRestart").onclick = () => startLevel(game.cfg.scenario, game.cfg.seed, [], game.cfg.hard, game.cfg.em, optsOf(game.cfg));
  $("mLevels").onclick = levelSelect;
  $("mTitle").onclick = titleScreen;
  $("mGloss").onclick = () => openGlossary(openMenu);
  bindToggles(() => { closeOverlay(); if (game.hud) renderHUD(game.hud.s, null, game.hud.turn); drawRoom(); renderTicker(); rerunBeat(); openMenu(); });
}

