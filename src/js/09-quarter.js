/* ═══════════════ A QUARTER ═══════════════ */
function beginQuarter() {
  const s = cur(), prep = (game.prep = prepGame(s, game.sc));
  draft = { move: null, tone: "neutral", choice: null, qe: 0, buy: [], macro: !!s.macro, fx: 0, qt: false, hear: null };
  resetStage(); drawRoom(); renderHUD(s, null, prep.t);
  const list = [quarterCard, newsBeat, frontPageBeat, mapBeat];
  if (prep.budget) list.push(budgetBeat);
  calls(s, prep).forEach((c, k) => list.push(() => { callBeat(c, k); coach([c.pres && prep.pressure && "pressure", "calls"]); }));
  if (prep.dilemma || prep.gd) list.push(dilemmaBeat);
  if (prep.hearing) list.push(hearingBeat);
  list.push(advisorsBeat, decideBeat);
  play(list.map(fn => { const b = () => { fn(); coachFor(fn); }; b.ov = fn === quarterCard; return b; }));
}

function quarterCard() {
  const prep = game.prep, gg = g();
  if (typing) typing.cancel(); setCast([]); $("panel").innerHTML = "";
  Sound.select();
  openOverlay(`<div class="scr"><span class="q-date">${esc(quarterLabel(prep.t))}</span><h2 class="big-title">${esc(gg.quarter(prep.t, M.turns))}</h2>
    <div class="qline"><i style="width:${(prep.t / M.turns) * 100}%"></i></div>
    <p class="q-sub ${prep.toElection === 0 ? "hot" : ""}">${esc(gg.toElection(prep.toElection))}</p>
    <button class="btn" id="cardGo" data-hot>${esc(gg.cont)} →</button></div>`, "card-ov");
  const token = (cardToken = {});
  const go = () => { if (cardToken !== token) return; cardToken = null; closeOverlay(); next(); };
  $("cardGo").onclick = go;
  if (!FAST) setTimeout(go, 2000);
}

function leadStory(s, prep) {
  const t = tr();
  if (prep.gd === "crash") return { head: g().crashNews[0], dek: g().crashNews[1], breaking: true };
  if (prep.bustNow) return { head: g().bustNews[0], dek: g().bustNews[1], breaking: true };
  if (prep.ssLast) { const r = lastReport(), [head, dek] = g().ssNews(r ? pc(-100 * (r.state.fx / r.prev.fx - 1), 0) : ""); return { head, dek, breaking: true }; }
  if (prep.news) return { head: t.news[prep.news][0], dek: t.news[prep.news][1], breaking: true };
  const first = pressItems(s, prep)[0];
  return { head: first[1], dek: t.quietHead(pc(s.pi, 1), pc(s.x, 1)) + ". " + t.quietDek, breaking: false };
}

function newsBeat() {
  const s = seenNow(), prep = game.prep, t = tr(), gg = g(), lead = leadStory(s, prep);
  tvOn(lead.head, lead.breaking ? t.breaking : t.dataRelease, !lead.breaking);
  pushHeadline(`q${prep.t}-lead`, lead.breaking ? "ch9" : "wire", () => { const h = seenOf(game.hist[prep.t - 1], game.sc, prep.t - 1); return leadStory(h, prepGame(game.hist[prep.t - 1], game.sc)).head; });
  if (lead.breaking) { Sound.sting(); if (Math.abs(game.sc.d[prep.t] || 0) + Math.abs(game.sc.s[prep.t] || 0) >= 1.5) shake(); }
  say({ name: gg.anchor, role: `${gg.anchorRole} · ${lead.breaking ? t.breaking : t.dataRelease}`, text: `${lead.head}. ${lead.dek}` });
}

const BOARD_COL = { vane: "#B5473A", lind: "#2F8C7A", mensah: "#2E6FA8", ortiz: "#C98A2C", rubio: "#7A62C9" };
function budgetBeat() {
  const s = cur(), gg = g(), prep = game.prep, dept = s.dept || initDept(), pts = s.points ?? BUDGET_START;
  const render = () => {
    const left = pts - buyCost(dept, draft.buy), d = Object.assign({}, dept);
    draft.buy.forEach(k => d[k]++);
    $("budgetBox").innerHTML = `<div class="budget-head"><span class="budget-pts">${esc(gg.points(left))}</span><span class="tip">${esc(gg.budgetTip)}</span></div>
      <div class="depts">${DEPTS.map(k => {
        const [name, lines] = gg.depts[k], lv = d[k], cost = lv < DEPT_MAX ? deptCost(lv) : null;
        return `<article class="dept"><header><b>${esc(name)}</b><span class="pips">${[0, 1, 2].map(q => `<i class="${q < dept[k] ? "on" : q < lv ? "new" : ""}"></i>`).join("")}</span></header>
          <p>${esc(lines[lv])}</p><p class="next">${lv < DEPT_MAX ? esc(gg.nextLvl(lines[lv + 1])) : ""}</p>
          <footer>${cost == null ? `<span class="tip">${esc(gg.maxed)}</span>` : `<button class="btn small ${cost <= left ? "" : "ghost"}" data-buy="${k}" ${cost <= left ? "" : "disabled"}>${esc(gg.invest(cost))}</button>`}</footer></article>`;
      }).join("")}</div>
      ${draft.buy.length ? `<button class="btn ghost small" id="buyUndo">${esc(gg.undo)}</button>` : ""}`;
    $("budgetBox").querySelectorAll("[data-buy]").forEach(b => (b.onclick = () => { draft.buy.push(b.dataset.buy); Sound.confirm(); render(); }));
    if ($("buyUndo")) $("buyUndo").onclick = () => { draft.buy.pop(); Sound.select(); render(); };
  };
  say({ cast: [], name: gg.budgetTitle, role: gg.budgetRole(Math.floor((prep.t - 1) / 4) + 1), extra: `<div id="budgetBox"></div>` });
  render();
}

function mapBeat() {
  const s = seenNow(), gg = g();
  const layer = game.mapLayer || (Math.abs(s.pi - 2) > 1 ? "prices" : "activity");
  say({ cast: [], name: gg.map.title, role: `${gg.map.role} · ${quarterLabel(game.prep.t)}`, extra: `<div id="mapBox"></div>` });
  mountMap($("mapBox"), s, layer);
}

function frontPageBeat() {
  const s = seenNow(), prep = game.prep, t = tr(), gg = g(), lead = leadStory(s, prep);
  const side = pressItems(s, prep).filter(([, h]) => h !== lead.head).slice(0, 2);
  const cms = preComments(s, prep);
  say({ cast: [{ prop: "newspaper" }], name: t.outlets.ledger, role: gg.edition, extra: `<article class="paper">
      <header class="paper-mast"><span class="pm-meta">${esc(gg.edition)}</span><span class="pm-name">${esc(t.outlets.ledger)}</span><span class="pm-meta">${esc(gg.price(quarterLabel(prep.t)))}</span></header>
      <div class="paper-body">
        <div class="paper-lead"><span class="kicker">${esc(lead.breaking ? t.breaking : t.dataRelease)}</span><h3>${esc(lead.head)}</h3><p>${esc(lead.dek)}</p></div>
        <aside class="paper-side">${side.map(([o, h]) => `<div><small>${esc(t.outlets[o])}</small><h4>${esc(h)}</h4></div>`).join("") || `<div><small>${esc(gg.sideLabel)}</small><h4>“${esc(streetVoiceText(s))}”</h4></div>`}</aside>
      </div>
      <section class="comments"><div class="c-head">${esc(gg.comments(cms.length))}</div>${cms.map((c, k) => commentHTML(c, k, `pre${prep.t}`)).join("")}</section>
    </article>` });
  if (!FAST) cms.forEach((_, k) => setTimeout(Sound.pop, 350 + k * 300));
}
function streetVoiceText(s) {
  const V = tr().street, r = lastReport();
  if (s.pi > 4) return V.prices; if (s.x < -2) return V.jobs; if (s.pi < 0.3) return V.deflation;
  if (r && r.inp.move > 0) return V.mortgage; if (s.x > 1.5) return V.boom; return V.fine;
}

function callBeat(c, k) {
  const prep = game.prep, gg = g();
  if (k === 0) { Sound.ring(); const p = $("phone"); p.classList.remove("ring"); void p.offsetWidth; p.classList.add("ring"); }
  const pressure = c.pres && prep.pressure ? `<div class="warn-strip" style="align-items:center"><b>${esc(gg.pressure)}</b><span class="dots">${[1, 2, 3].map(q => `<i class="${q <= prep.level ? "on" : ""}" style="width:22px;height:6px;border-radius:3px"></i>`).join("")}</span></div>` : "";
  say({ speaker: c.id, mood: c.mood, call: true, name: PEOPLE[c.id], role: c.role, text: c.text, pre: pressure });
  if (c.mood === "angry" && prep.level === 3) shake();
}

function dilemmaBeat() {
  const prep = game.prep, t = tr(), [h, body, a, b] = prep.dilemma ? t.dilemmas[prep.dilemma] : g().dilemmasExtra[prep.gd];
  say({ cast: [{ prop: "folder", label: g().folder }], name: t.dilemmaHead, pre: `<h3 class="dil-title">${esc(h)}</h3>`, text: body, contDisabled: draft.choice == null,
    extra: `<div class="choices">${[a, b].map((txt, k) => `<button class="choice" data-key="${k + 1}" data-choice="${k}" aria-pressed="${draft.choice === k}"><span class="ck">${k + 1}</span><span>${esc(txt)}</span></button>`).join("")}</div>` });
  $("panel").querySelectorAll("[data-choice]").forEach(btn => (btn.onclick = () => {
    draft.choice = +btn.dataset.choice; Sound.stamp();
    $("panel").querySelectorAll("[data-choice]").forEach(x => x.setAttribute("aria-pressed", x === btn));
    $("contBtn").disabled = false; $("contBtn").focus();
  }));
}

function advisorsBeat() {
  const s = seenNow(), prep = game.prep, t = tr(), gg = g(), keys = ["keynes", "friedman", "taylor"];
  const cards = keys.map((k, n) => {
    const m = prep.advisors[k];
    const rv = relOf(cur(), ADV_OF[k]), wh = advisorWhisper(k);
    return `<article class="adv" style="--n:${n}"><header><b>${esc(t.adv[k].name)}</b><span>${esc(t.adv[k].school)}</span><span class="rel-chip" style="--c:${relColor(rv)}" title="${esc(g().standing.moods[relMood(rv)])}">${rv}</span></header><p>${esc(advisorText(k, s, prep))}</p>
      ${wh ? `<p class="whisper">${esc(wh)}</p>` : ""}
      <footer><span class="rec ${m < 0 ? "cut" : m > 0 ? "hike" : ""}">${esc(t.moveName(m))}</span><button class="btn small ghost" data-follow="${m}" data-adv="${k}" aria-pressed="${draft.adv === k}">${esc(draft.adv === k ? gg.followed : gg.follow)}</button></footer></article>`;
  }).join("");
  const mood = k => (k === "friedman" && s.pi > 3.5) || (k === "keynes" && s.x < -2) ? "angry" : prep.advisors[k] === 0 ? "neutral" : "happy";
  say({ cast: keys.map(k => ({ id: ADV_ID[k], mood: mood(k) })), row: true, name: gg.advisorsTitle, role: quarterLabel(prep.t), extra: `<div class="advs">${cards}</div>` });
  $("panel").querySelectorAll("[data-follow]").forEach(btn => (btn.onclick = () => {
    draft.move = +btn.dataset.follow; draft.adv = btn.dataset.adv; Sound.select();
    $("panel").querySelectorAll("[data-follow]").forEach(x => { const on = x === btn; x.setAttribute("aria-pressed", on); x.textContent = on ? gg.followed : gg.follow; });
  }));
}

function decideBeat() {
  const s = seenNow(), prep = game.prep, t = tr(), gg = g();
  if (typing) typing.cancel();
  setCast([]);
  const ok = m => s.i + m >= M.iMin - 1e-9 && s.i + m <= M.iMax + 1e-9;
  $("panel").innerHTML = `<div class="decide">
    ${warnings(s, prep).map(w => `<div class="warn-strip" role="alert"><b>${esc(gg.warn)}</b><span>${esc(w)}</span></div>`).join("")}
    <div class="dec-row"><span class="sec-lab">${esc(gg.rate)}</span><div class="moves" role="group">${MOVES.map((m, k) => `<button class="mv ${m < 0 ? "cut" : m > 0 ? "hike" : ""}" data-move="${m}" data-key="${k + 1}" aria-pressed="false" ${ok(m) ? "" : "disabled"}>${esc(m === 0 ? gg.hold : sgn(m))}<small>${pc(s.i + m)}</small></button>`).join("")}</div></div>
    <div class="dec-row"><div class="fan-head"><span class="sec-lab">${esc(gg.board.title)}</span><span class="tip" id="boardTally"></span></div><div class="board" id="boardRow"></div></div>
    <div class="dec-row"><div class="fan-head"><span class="sec-lab">${esc(gg.fanTitle)}</span><span class="tip" id="fanNote"></span></div><div class="fan-wrap"><div class="fan" id="fanPi"></div><div class="fan" id="fanX"></div></div></div>
    <div class="dec-row"><span class="sec-lab">${esc(gg.tone)}</span><div class="tones" role="group">${["dovish", "neutral", "hawkish"].map(k => `<button class="tone ${k}" data-tone="${k}" aria-pressed="false"><b><i></i>${esc(gg.tones[k][0])}</b><small>${esc(gg.tones[k][1])}</small></button>`).join("")}</div><p class="tip">${esc(gg.toneTip(Math.round(s.cred * 100)))}</p></div>
    ${prep.qe ? `<div class="dec-row"><span class="sec-lab">${esc(gg.qeLabel)}</span><div class="tones" role="group">${[0, 1, 2].map(k => `<button class="tone qe${k}" data-qe="${k}" aria-pressed="false"><b><i></i>${esc(gg.qe[k][0])}</b><small>${esc(gg.qe[k][1])}</small></button>`).join("")}</div><p class="tip">${esc(gg.qeTip)}</p></div>` : ""}
    ${prep.qt ? `<div class="dec-row"><span class="sec-lab">${esc(gg.qt.label)}</span><div class="tones" role="group">${["off", "on"].map(k => `<button class="tone ${k === "on" ? "qe2" : "qe0"}" data-qt="${k}" aria-pressed="false"><b><i></i>${esc(gg.qt[k][0])}</b><small>${esc(gg.qt[k][1])}</small></button>`).join("")}</div><p class="tip">${esc(gg.qt.tip(Math.round((s.qeStock || 0) * 10) / 10))}</p></div>` : ""}
    ${prep.fxTool ? `<div class="dec-row"><div class="fan-head"><span class="sec-lab">${esc(gg.fx.label)}</span><span class="tip">${esc(gg.fx.reserves((s.reserves ?? 6).toFixed(1)))}</span></div><div class="tones fx4" role="group">${[-1, 0, 1, 2].map(k => `<button class="tone ${k > 0 ? "qe1" : k < 0 ? "qe2" : "qe0"}" data-fx="${k}" aria-pressed="false" ${k > 0 && (s.reserves ?? 6) < k ? "disabled" : ""}><b><i></i>${esc(gg.fx.opts[k][0])}</b><small>${esc(gg.fx.opts[k][1])}</small></button>`).join("")}</div><p class="tip">${esc(gg.fx.tip)}</p></div>` : ""}
    ${prep.canMacro ? `<div class="dec-row"><span class="sec-lab">${esc(gg.macro.label)}</span><div class="tones" role="group">${["off", "on"].map(k => `<button class="tone ${k === "on" ? "qe2" : "qe0"}" data-macro="${k}" aria-pressed="false"><b><i></i>${esc(gg.macro[k][0])}</b><small>${esc(gg.macro[k][1])}</small></button>`).join("")}</div><p class="tip">${esc(gg.macro.tip)}</p></div>` : ""}
    <div class="dec-foot"><div class="recs"><span class="sec-lab">${esc(gg.recsLabel)}</span>${["keynes", "friedman", "taylor"].map(k => `<button class="chip-btn" data-follow="${prep.advisors[k]}">${esc(t.adv[k].name)}: ${esc(t.moveName(prep.advisors[k]))}</button>`).join("")}</div>
      <div class="dec-go"><div class="newrate"><span>${esc(gg.newRate)}</span><b id="newRate">—</b></div><button class="btn red big" id="announce" data-hot disabled>${esc(gg.announce)}</button></div></div>
  </div>`;
  const P = $("panel");
  const sync = () => {
    P.querySelectorAll("[data-move]").forEach(b => b.setAttribute("aria-pressed", draft.move === +b.dataset.move));
    P.querySelectorAll("[data-tone]").forEach(b => b.setAttribute("aria-pressed", draft.tone === b.dataset.tone));
    P.querySelectorAll("[data-qe]").forEach(b => b.setAttribute("aria-pressed", (draft.qe || 0) === +b.dataset.qe));
    $("newRate").textContent = draft.move == null ? "—" : pc(s.i + draft.move);
    $("announce").disabled = draft.move == null;
    const mv = draft.move == null ? 0 : draft.move, now = cur().t;
    const fc = staffForecast(cur(), game.sc, { move: mv, tone: draft.tone, qe: draft.qe || 0, macro: prep.canMacro && draft.macro });
    const hist = game.hist.slice(Math.max(0, now - 4), now + 1).map(h => seenOf(h, game.sc, now));
    const fm = FANM[(cur().dept || initDept()).research];
    $("fanPi").innerHTML = fanSVG(hist.map(h => h.pi), fc.map(f => f.pi), FAN_SD.pi.map(v => v * fm), { color: "#E5484D", ref: 2, title: gg.chart.infl, nowLabel: gg.nowLabel });
    $("fanX").innerHTML = fanSVG(hist.map(h => h.x), fc.map(f => f.x), FAN_SD.x.map(v => v * fm), { color: "#5B9BD5", ref: 0, title: gg.chart.gap, nowLabel: gg.nowLabel });
    $("fanNote").textContent = draft.move == null ? gg.fanHold : gg.fanMove(t.moveName(mv));
    P.querySelectorAll("[data-macro]").forEach(b => b.setAttribute("aria-pressed", !!draft.macro === (b.dataset.macro === "on")));
    P.querySelectorAll("[data-qt]").forEach(b => b.setAttribute("aria-pressed", !!draft.qt === (b.dataset.qt === "on")));
    P.querySelectorAll("[data-fx]").forEach(b => b.setAttribute("aria-pressed", (draft.fx || 0) === +b.dataset.fx));
    const B = gg.board, bv = draft.move == null ? null : boardVote(cur(), game.sc, prep, draft.move), prefs = boardPrefs(seenOf(cur(), game.sc, cur().t), prep);
    $("boardRow").innerHTML = `<div class="bm you ${bv ? "yes" : ""}"><span class="avatar" style="--c:#F2B650">${esc(B.youShort)}</span><span><b>${esc(gg.you)}</b><small>${esc(bv ? t.moveName(draft.move) : "—")}</small></span><i>${bv ? "✓" : ""}</i></div>`
      + (cur().board || BOARD0).map(id => {
        const v = bv && bv.votes.find(q => q.id === id), [nm, role] = B.names[id];
        return `<div class="bm ${v ? (v.yes ? "yes" : "no") : ""}" title="${esc(role)}"><span class="avatar" style="--c:${BOARD_COL[id]}">${esc(initials(nm))}</span><span><b>${esc(nm)}</b><small>${esc(B.wants(t.moveName(prefs[id])))}</small></span><i>${v ? (v.yes ? "✓" : "✗") : ""}</i></div>`;
      }).join("");
    $("boardTally").textContent = !bv ? B.noMove : bv.passed ? B.pass(bv.yes, bv.no) : B.fail(bv.yes, bv.no, t.moveName(bv.implemented));
    $("boardTally").className = "tip " + (!bv ? "" : bv.passed ? "tally-pass" : "tally-fail");
  };
  P.querySelectorAll("[data-move]").forEach(b => (b.onclick = () => { draft.move = +b.dataset.move; Sound.select(); sync(); }));
  P.querySelectorAll(".chip-btn[data-follow]").forEach(b => (b.onclick = () => { draft.move = +b.dataset.follow; Sound.select(); sync(); }));
  P.querySelectorAll("[data-tone]").forEach(b => (b.onclick = () => { draft.tone = b.dataset.tone; Sound.stamp(); sync(); }));
  P.querySelectorAll("[data-qe]").forEach(b => (b.onclick = () => { draft.qe = +b.dataset.qe; Sound.select(); sync(); }));
  P.querySelectorAll("[data-macro]").forEach(b => (b.onclick = () => { draft.macro = b.dataset.macro === "on"; Sound.stamp(); sync(); }));
  P.querySelectorAll("[data-qt]").forEach(b => (b.onclick = () => { draft.qt = b.dataset.qt === "on"; Sound.stamp(); sync(); }));
  P.querySelectorAll("[data-fx]").forEach(b => (b.onclick = () => { draft.fx = +b.dataset.fx; Sound.select(); sync(); }));
  $("announce").onclick = announce;
  game.nudge = dir => {
    const allowed = MOVES.filter(ok), idx = allowed.indexOf(draft.move == null ? 0 : draft.move);
    draft.move = allowed[Math.max(0, Math.min(allowed.length - 1, (idx < 0 ? allowed.indexOf(0) : idx) + dir))];
    Sound.blip(); sync();
  };
  sync();
}

function announce() {
  const prep = game.prep;
  if (draft.move == null || ((prep.dilemma || prep.gd) && draft.choice == null)) return;
  Sound.stamp(); game.nudge = null;
  const inp = { move: draft.move, tone: draft.tone, choice: prep.dilemma || prep.gd ? draft.choice : null, qe: prep.qe ? draft.qe || 0 : 0, qa: null, buy: prep.budget ? draft.buy.slice() : [], macro: prep.canMacro ? !!draft.macro : false, fx: prep.fxTool ? draft.fx || 0 : 0, qt: prep.qt ? !!draft.qt : false, hear: prep.hearing ? draft.hear : null };
  play([() => presserBeat(inp), () => { qaBeat(inp); coach(["qa"]); }]);
}
function afterQA(inp) {
  advance(inp);
  const r = lastReport(), list = [reactionBeat, falloutBeat];
  if (r.election) list.push(electionBeat);
  list.push(() => { if (over()) endLevel(false); else beginQuarter(); });
  play(list.map(fn => { const b = () => { fn(r); coachFor(fn, r); }; b.ov = fn === electionBeat; return b; }));
}

function presserBeat(inp) {
  const gg = g(), s = cur(), bv = boardVote(s, game.sc, game.prep, inp.move), mv = bv.passed ? inp.move : bv.implemented;
  flash(3);
  say({ cast: [{ prop: "podium" }], name: gg.you, role: gg.youRole, text: `${bv.passed ? "" : gg.board.overruled + " "}${gg.speech.move(mv, pc(clamp(s.i + mv, M.iMin, M.iMax)))} ${gg.speech[inp.tone]}${inp.qe ? " " + gg.qeSpeech[inp.qe] : ""}${inp.fx ? " " + gg.fxSpeech[inp.fx] : ""}` });
  if (!bv.passed) { shake(); Sound.bad(); }
}

function qaBeat(inp) {
  const s = cur(), prep = game.prep, gg = g(), id = qaId(s, prep, inp), rep = prep.t % 2 ? "press1" : "press2";
  const [q, answers] = gg.qa[id], [name, outlet] = gg.reporters[rep];
  flash(1);
  say({ cast: [{ prop: "podium" }, { id: rep, mood: "neutral" }], name, role: `${outlet} · ${gg.qaHead}`, text: typeof q === "function" ? q(pc(s.pi, 1)) : q, contDisabled: true,
    extra: `<div class="choices qa">${answers.map((a, k) => `<button class="choice" data-key="${k + 1}" data-qa="${k}"><span class="ck">${k + 1}</span><span>${esc(a)}</span></button>`).join("")}</div>` });
  $("contBtn").hidden = true;
  $("panel").querySelectorAll("[data-qa]").forEach(btn => (btn.onclick = () => { inp.qa = +btn.dataset.qa; Sound.select(); afterQA(inp); }));
}

function decisionHeadline(r) { return g().decisionHead(r.state.move, pc(r.state.i), r.inp.tone) + (r.vote ? ` (${g().board.voteTag(r.vote.yes, r.vote.no)})` : ""); }

function reactionBeat(r) {
  const gg = g(), t = tr(), head = decisionHeadline(r), posts = reactions(r), pv = r.prev, nx = r.state;
  const mk = { fx: 100 * (fxRate(nx) / fxRate(pv) - 1), y10: (nx.y10 - pv.y10) * 100, stocks: 100 * (nx.eq / pv.eq - 1) };   // + = the dollar costs more local money
  const kicker = r.vote && !r.vote.passed ? gg.board.kickerOutvoted : r.credParts.some(q => q[0] === "caved") ? gg.kicker.pressure : Math.abs(r.surprise) >= 0.25 ? gg.kicker.surprise : gg.kicker.expected;
  tvOn(head, gg.live, true);
  pushHeadline(`q${r.state.t}-dec`, "wire", () => decisionHeadline(r));
  const arrow = (v, invert) => { const cls = Math.abs(v) < 0.05 ? "flatc" : (v > 0) !== !!invert ? "upc" : "downc"; return [cls, Math.abs(v) < 0.05 ? "" : v > 0 ? ICON.up : ICON.down]; };
  const cell = (label, v, fmt, k, inv) => { const [cls, ic] = arrow(v, inv); return `<div class="mkt" style="--n:${k}"><span>${esc(label)}</span><b class="${cls}">${ic}${fmt(v)}</b></div>`; };
  say({ cast: [], name: gg.reactionTitle, role: quarterLabel(r.state.t), extra: `<div class="react">
      <div class="react-head"><div class="react-src"><span>${esc(t.outlets.wire)}</span><span class="pill ${kicker === gg.kicker.expected ? "" : "hot"}">${esc(kicker)}</span></div><h3>${esc(head)}</h3></div>
      <div class="dec-row"><span class="sec-lab">${esc(gg.marketsTitle)}</span><div class="mkts">
        ${cell(gg.mkt.fx, mk.fx, v => `${sgn(v, 1)}%`, 0, true)}${cell(gg.mkt.y10, mk.y10, v => `${sgn(v, 0)} bp`, 1)}${cell(gg.mkt.stocks, mk.stocks, v => `${sgn(v, 1)}%`, 2)}
      </div></div>
      <div class="dec-row"><span class="sec-lab">${esc(gg.groups.title)}</span><div class="grp-row">${["savers", "borrowers", "workers", "retirees"].map(k => {
        const v = (nx.grp || {})[k] ?? 50, was = (pv.grp || {})[k] ?? 50, cls = v < 25 ? "bad" : v < 45 ? "warn" : "good";
        return `<div class="grp"><span class="grp-ic">${ICON.grp[k]}</span><span class="grp-n">${esc(gg.groups[k])}</span><div class="mbar" style="--c:var(--${cls === "bad" ? "red" : cls === "warn" ? "amber" : "green"})"><i style="width:${v}%"></i></div><b class="${v >= was ? "upc" : "downc"}">${sgn(v - was, 0)}</b></div>`;
      }).join("")}</div><p class="tip">${esc(gg.groups.tip)}</p></div>
      <div class="dec-row"><span class="sec-lab">${esc(gg.feedTitle)}</span><div class="posts">${posts.map((p, k) => postHTML(p, k, `rx${r.state.t}`)).join("")}</div></div>
    </div>` });
  if (!FAST) posts.forEach((_, k) => setTimeout(Sound.pop, 400 + k * 280));
}

function onTargetStreak() { let n = 0; for (let k = game.reports.length - 1; k >= 0; k--) { if (Math.abs(game.reports[k].state.pi - 2) < 1) n++; else break; } return n; }

function falloutBeat(r) {
  const t = tr(), gg = g(), s = r.state, p = r.prev;
  renderHUD(s, p, s.t);
  const cd = (s.cred - p.cred) * 100, pd = s.pop - p.pop, hd = s.heat - p.heat;
  setTimeout(() => { floater("hCred", sgn(cd, 0), cd >= 0); floater("hPop", sgn(pd, 0), pd >= 0); floater("hHeat", sgn(hd, 0), hd <= 0); }, 350);
  if (s.lost || cd <= -5 || pd <= -5 || hd >= 15) shake();
  (s.lost || cd + pd / 2 < 0 ? Sound.bad : Sound.good)();
  const verdict = t.verdict[(cd >= 0 ? "u" : "d") + (pd >= 0 ? "u" : "d")];
  const streak = onTargetStreak();
  const ledger = (title, total, parts, why, scale, d, inv) => `<div class="ledger"><div class="lg-h"><span>${esc(title)}</span><b class="${(inv ? -total : total) >= 0 ? "pos" : "neg"}">${sgn(total, d)}</b></div>${parts.map(([k, v]) => `<div class="lg-r"><span>${esc(why[k] || g().whyExtra[k] || k)}</span><b class="${(inv ? -v : v) >= 0 ? "pos" : "neg"}">${sgn(v * scale, d)}</b></div>`).join("")}</div>`;
  say({ cast: s.lost ? [{ id: s.govt === "opp" ? "quiroga" : "salas", mood: "angry" }] : [], name: gg.resultTitle, role: quarterLabel(s.t),
    text: s.lost ? `${t.outcome[s.lost]}. ${t.lostWhy[s.lost]}` : "",
    pre: streak >= 2 && !s.lost ? `<div class="streak">${esc(gg.streak(streak))}</div>` : "",
    extra: `${relStrip(r)}<div class="ledgers">${ledger(t.credHead, cd, r.credParts, t.credWhy, 100, 0)}${ledger(t.popHead, pd, r.popParts, t.popWhy, 1, 1)}${ledger(gg.hud.heat, hd, r.heatParts, gg.heatWhy, 1, 0, true)}</div><p class="verdict-q">${esc(verdict)}</p>` });
}

function electionBeat(r) {
  const t = tr(), gg = g();
  if (typing) typing.cancel(); setCast([]); $("panel").innerHTML = "";
  const newGov = r.popParts.find(q => q[0] === "newGov");
  const share = Math.round(r.state.pop - (newGov ? newGov[1] : 0)), won = r.election === "reelected";
  const [h, body] = won ? t.elec.reelected(share) : t.elec.defeated();
  const posts = gg.elecCm[r.election];
  tvOn(h, gg.electionNight, true);
  pushHeadline("election", "ch9", () => (r.election === "reelected" ? tr().elec.reelected(share) : tr().elec.defeated())[0]);
  openOverlay(`<div class="scr">
    <span class="q-date">${esc(t.outlets.ch9)} · ${esc(quarterLabel(r.state.t))}</span>
    <h2 class="big-title">${esc(gg.electionNight)}</h2>
    <div class="elec-bust" id="elecBust">${portraitSVG("salas", "neutral")}</div>
    <div class="vote"><div class="vote-bar"><i id="voteFill" style="width:0%"></i><em></em></div><div class="vote-num"><span>${esc(gg.voteShare)}</span><b id="voteNum">0%</b><span>${esc(gg.toWin)}</span></div></div>
    <div id="elecRes" hidden style="display:grid;gap:12px;justify-items:center;width:100%"><h3 class="elec-h">${esc(h)}</h3><p class="credits">${esc(body)}</p><div class="posts">${posts.map((p, k) => postHTML(p, k, "elec")).join("")}</div></div>
    <button class="btn big" id="elecGo" data-hot>${esc(gg.cont)} →</button>
  </div>`);
  const reveal = () => {
    if (!$("elecRes")) return;
    $("voteFill").style.width = share + "%"; $("voteNum").textContent = share + "%";
    $("elecRes").hidden = false; $("elecBust").innerHTML = portraitSVG("salas", won ? "happy" : "sad");
    (won ? Sound.good : Sound.bad)();
  };
  if (FAST) reveal();
  else { let v = 0; const id = setInterval(() => { if (!$("voteFill")) return clearInterval(id); v++; $("voteFill").style.width = v + "%"; $("voteNum").textContent = v + "%"; if (v % 4 === 0) Sound.blip(); if (v >= share) { clearInterval(id); reveal(); } }, 30); }
  $("elecGo").onclick = () => { closeOverlay(); next(); };
}

