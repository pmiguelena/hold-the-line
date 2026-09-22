/* ═══════════════ INPUT & BOOT ═══════════════ */
document.addEventListener("keydown", e => {
  if (e.target.closest && e.target.closest("input,select,textarea")) return;
  const ovOpen = !$("overlay").hidden, scope = ovOpen ? $("overlay") : $("frame");
  if (e.key === " " || e.key === "Enter") {
    if (e.target.closest && e.target.closest("button")) return;
    const b = scope.querySelector("[data-hot]:not(:disabled)"); if (b) { e.preventDefault(); b.click(); } return;
  }
  if (/^[1-9]$/.test(e.key)) { const b = scope.querySelector(`[data-key="${e.key}"]:not(:disabled)`); if (b) { e.preventDefault(); b.click(); } return; }
  if (!ovOpen && game && game.nudge && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); game.nudge(e.key === "ArrowLeft" ? -1 : 1); return; }
  if (e.key === "Escape" && screen === "game") { if (ovOpen) { if ($("mResume") || $("chClose") || $("mapClose")) resume(); } else openMenu(); }
});

function start(data) {
  document.documentElement.lang = lang;
  const teacherLink = readClassFromURL();
  flushOutbox();                                                                // results that could not be sent last time
  if (!FAST) $("room").addEventListener("mousemove", e => { const r = $("room").getBoundingClientRect(); $("room").style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); $("room").style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); });
  if (data && data.screen === "game" && data.cfg) startLevel(data.cfg.scenario, data.cfg.seed, data.inputs || [], !!data.cfg.hard, !!data.cfg.em, optsOf(data.cfg));
  else if (data && data.screen === "levels") levelSelect();
  else if (teacherLink || (data && data.screen === "teacher")) teacherDesk();
  else if (!store.profile && !store.profileSkip) profileScreen(titleScreen);     // first run: who is playing
  else titleScreen();
  window.claude?.hot?.snapshot?.(() => ({ screen, cfg: game?.cfg, inputs: game?.inputs, lang }));
}
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
