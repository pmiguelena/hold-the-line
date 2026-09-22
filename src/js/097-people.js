/* ═══════════════ PEOPLE: STANDING, HEARINGS, MEMOIRS ═══════════════ */
const REL_FACE = { harrow: "harrow", weiss: "weiss", okafor: "okafor", press: "press1", pres: "salas", board: "rios" };
const relColor = v => (v >= 60 ? "var(--green)" : v > 40 ? "var(--amber)" : "var(--red)");

function relRow(id, v, prev) {
  const P = g().standing, mood = relMood(v), [nm, role] = P.who[id];
  const d = prev == null ? "" : `<b class="${v >= prev ? "upc" : "downc"}">${sgn(v - prev, 0)}</b>`;
  return `<article class="rel"><span class="rel-face">${portraitSVG(REL_FACE[id], mood === "hostile" ? "angry" : mood === "ally" ? "happy" : "neutral")}</span>
    <div class="rel-head"><b>${esc(nm)}</b><span>${esc(role)}</span></div>
    <div class="rel-bar"><div class="mbar" style="--c:${relColor(v)}"><i style="width:${v}%"></i></div><span class="rel-num">${v}${d}</span></div>
    <span class="rel-mood" style="--c:${relColor(v)}">${esc(P.moods[mood])}</span>
    <p>${esc(P.lines[id][mood])}</p></article>`;
}
function openPeople() {
  if (!game) return;
  cardToken = null;
  const P = g().standing, s = cur(), prev = game.hist.length > 1 ? game.hist[game.hist.length - 2] : null;
  openOverlay(`<div class="scr"><h2 class="scr-title">${esc(P.title)}</h2><p class="credits">${esc(P.sub)}</p>
    <div class="rel-grid">${REL_IDS.map(id => relRow(id, relOf(s, id), prev ? relOf(prev, id) : null)).join("")}</div>
    <p class="note">${esc([P.hint.press, P.hint.pres, P.hint.board].join(" "))}</p>
    <button class="btn big" id="pplClose" data-hot>${esc(g().close)}</button></div>`);
  $("pplClose").onclick = resume;
}
// A quiet word from an advisor who trusts you: what the staff is hearing about next quarter.
function advisorWhisper(school) {
  const id = ADV_OF[school];
  if (relOf(cur(), id) < 70) return "";
  const t = game.prep.t, nx = (game.sc.d[t + 1] || 0) + (game.sc.s[t + 1] || 0);
  if (Math.abs(nx) < 0.35) return g().whisper.calm;
  return (game.sc.s[t + 1] || 0) > 0.3 ? g().whisper.costs : (game.sc.d[t + 1] || 0) > 0.3 ? g().whisper.boom : g().whisper.weak;
}

/* ── the hearing ── */
function hearingBeat() {
  const prep = game.prep;
  draft.hear = prep.hearQs.map(() => 1);
  const H = g().hearing;
  let k = 0;
  const ask = () => {
    const id = prep.hearQs[k], [q, answers] = H.qs[id];
    const mood = draft.hear.slice(0, k).reduce((a, v, j) => a + (HEAR_Q[prep.hearQs[j]][v][3] || 0), 0);
    const level = clamp(Math.round((mood + 8) / 5.5), 0, 3);
    say({ cast: [{ id: "quiroga", mood: k && mood < 0 ? "angry" : "neutral" }, { id: "press1", mood: "neutral" }], name: H.title, role: `${H.role} · ${H.of(k + 1, prep.hearQs.length)}`,
      text: k === 0 ? `${H.intro} ${q}` : q, contDisabled: true,
      pre: k ? `<div class="hear-mood"><span class="sec-lab">${esc(H.mood)}</span><span class="pill ${level >= 2 ? "" : "hot"}">${esc(H.moods[level])}</span></div>` : "",
      extra: `<div class="choices qa">${answers.map((a, j) => `<button class="choice" data-key="${j + 1}" data-hear="${j}"><span class="ck">${j + 1}</span><span>${esc(a)}</span></button>`).join("")}</div>` });
    $("contBtn").hidden = true;
    $("panel").querySelectorAll("[data-hear]").forEach(b => (b.onclick = () => {
      draft.hear[k] = +b.dataset.hear; Sound.stamp();
      k++;
      if (k < prep.hearQs.length) ask();
      else { flash(1); next(); }
    }));
  };
  ask();
}

/* ── memoirs ── */
function memoirHTML(s, era) {
  const M_ = g().memoir, P = g().standing, rel = s.rel || REL0();
  const people = ["harrow", "weiss", "okafor", "board"].map(id => [id, relOf(s, id)]);
  const best = people.slice().sort((a, b) => b[1] - a[1])[0], worst = people.slice().sort((a, b) => a[1] - b[1])[0];
  const open = s.lost ? M_.open.bad : Math.abs(s.pi - 2) < 1 && s.cred >= 0.7 ? M_.open.good : M_.open.mixed;
  const lines = [open];
  if (best[1] >= 65) lines.push(M_.ally(P.who[best[0]][0]));
  if (worst[1] <= 35) lines.push(M_.foe(P.who[worst[0]][0]));
  lines.push(relOf(s, "press") >= 55 ? M_.press.warm : M_.press.cold);
  lines.push(relOf(s, "pres") >= 55 ? M_.pres.warm : M_.pres.cold);
  lines.push(s.lost === "fired" ? M_.close.fired : M_.close.done);
  return `<div class="memoir"><span class="sec-lab">${esc(era ? M_.chapter(era) : M_.title)}</span>${lines.map(l => `<p>${esc(l)}</p>`).join("")}</div>`;
}

// After the decision: who moved, and by how much.
function relStrip(r) {
  const P = g().standing, parts = r.relParts || {};
  const moved = REL_IDS.filter(id => Math.abs(parts[id] || 0) >= 1);
  if (!moved.length) return "";
  return `<div class="rel-strip"><span class="sec-lab">${esc(P.role)}</span>${moved.map(id => {
    const v = relOf(r.state, id), dv = Math.round(parts[id]);
    return `<span>${esc(P.who[id][0])} <b style="color:${relColor(v)}">${v}</b><em class="${dv >= 0 ? "upc" : "downc"}">${sgn(dv, 0)}</em></span>`;
  }).join("")}</div>`;
}
