/* ═══════════════ CAREER ═══════════════ */
// Four eras, one Bank. Departments and credibility carry forward; governors come and go.
const CAREER_ERAS = ["oil", "crisis", "pandemic", "random"];
const careerNow = () => (store.career && store.career.gov ? store.career : null);
const mandateToggle = () => `<div class="seg" role="group"><button data-mandate="price" aria-pressed="${store.mandate !== "dual"}">${esc(g().mandate.price[0])}</button><button data-mandate="dual" aria-pressed="${store.mandate === "dual"}">${esc(g().mandate.dual[0])}</button></div>`;
const suggestName = () => { const n = g().career.names; return n[Math.floor(Math.random() * n.length)]; };
const eraYears = k => { const sc = SCEN[CAREER_ERAS[k]]; return [sc.year, sc.year + Math.floor((sc.q - 1 + M.turns) / 4)]; };

function careerCard() {
  const C = g().career, cr = careerNow();
  return `<div class="career-card">
    <div><span class="sec-lab">${esc(C.title)}</span><p>${esc(C.tagline)}</p></div>
    <div class="btns">${cr ? `<button class="btn" id="crCont">${esc(C.cont(cr.era + 1, cr.gov.name))} →</button>` : ""}
      <button class="btn ${cr ? "ghost" : ""}" id="crNew">${esc(C.start)}</button><button class="btn ghost" id="crHall">${esc(C.hall)}</button></div>
  </div>`;
}
function bindCareerCard() {
  $("crNew").onclick = careerSetup;
  $("crHall").onclick = hallOfFame;
  if ($("crCont")) $("crCont").onclick = startCareerTerm;
}

function careerSetup() {
  const gg = g(), C = gg.career, keep = $("govName") ? $("govName").value : suggestName();
  openOverlay(`<div class="scr">
    <h2 class="scr-title">${esc(C.setupTitle)}</h2>
    <p class="credits">${esc(C.tagline)}</p>
    <label class="code"><span>${esc(C.nameLabel)}</span><input id="govName" class="name-in" maxlength="28" value="${esc(keep)}" autocomplete="off" spellcheck="false"></label>
    <div class="toggles">${mandateToggle()}${econToggle()}${diffToggle()}</div>
    <p class="diff-hint">${esc(gg.mandate.hint[store.mandate === "dual" ? "dual" : "price"])}${store.em ? " " + esc(gg.emHint) : ""}</p>
    <ol class="era-list">${C.eras.map(e => `<li>${esc(e)}</li>`).join("")}</ol>
    <div class="btns"><button class="btn ghost" id="csBack">← ${esc(gg.back)}</button><button class="btn big" id="csGo" data-hot>${esc(C.begin)} →</button></div>
  </div>`);
  bindToggles(careerSetup);
  $("csBack").onclick = levelSelect;
  $("csGo").onclick = () => {
    const name = ($("govName").value || "").trim().slice(0, 28) || suggestName();
    store.career = { id: Date.now(), mandate: store.mandate === "dual" ? "dual" : "price", em: !!store.em, hard: !!store.hard,
      era: 0, gov: { name, terms: [] }, govs: [], results: [], carry: null, seeds: [], recorded: -1 };
    persist();
    startCareerTerm();
  };
}

function startCareerTerm() {
  const cr = careerNow(); if (!cr) return levelSelect();
  const scen = CAREER_ERAS[cr.era], sv = loadSave();
  Sound.unlock(); Sound.confirm();
  if (sv && sv.cfg.career && sv.cfg.scenario === scen) return startLevel(sv.cfg.scenario, sv.cfg.seed, sv.inputs, !!sv.cfg.hard, !!sv.cfg.em, { mandate: sv.cfg.mandate, carry: sv.cfg.carry, career: true });
  if (!cr.seeds[cr.era]) { cr.seeds[cr.era] = randomCode(); persist(); }
  startLevel(scen, cr.seeds[cr.era], [], cr.hard, cr.em, { mandate: cr.mandate, carry: cr.carry, career: true });
}

// Called from the end screen of a career term; safe to call twice.
function careerRecord(s, total, stars) {
  const cr = careerNow(); if (!cr || cr.recorded === cr.era) return;
  const [from, to] = eraYears(cr.era);
  cr.gov.terms.push({ era: cr.era, score: total, stars, cred: s.cred, outcome: s.lost || "served", from, to });
  cr.results.push({ era: cr.era, governor: cr.gov.name, score: total, stars, outcome: s.lost || "served" });
  const next = CAREER_ERAS[Math.min(cr.era + 1, CAREER_ERAS.length - 1)];
  const base = SCEN[next].cred - (cr.em ? 0.08 : 0) - (cr.hard ? 0.05 : 0);
  cr.carry = { dept: Object.assign({}, s.dept || initDept()), cred: +clamp(0.5 * base + 0.5 * s.cred - (s.lost ? 0.1 : 0), 0.3, 0.9).toFixed(3), points: 3 + stars };
  cr.last = { lost: s.lost, cred: s.cred, heat: s.heat, pop: s.pop, govt: s.govt };
  cr.recorded = cr.era;
  persist();
}

function finishGovernor(gov, ended) {
  const t = gov.terms, rec = { name: gov.name, from: t.length ? t[0].from : "", to: t.length ? t[t.length - 1].to : "", terms: t.length,
    total: t.reduce((a, x) => a + x.score, 0), stars: t.reduce((a, x) => a + x.stars, 0),
    cred: t.length ? t.reduce((a, x) => a + x.cred, 0) / t.length : 0, ended, date: new Date().toISOString().slice(0, 10) };
  store.hall = store.hall || { governors: [], careers: [] };
  store.hall.governors = [rec, ...store.hall.governors].sort((a, b) => b.total - a.total).slice(0, 30);
  return rec;
}

function careerAfterTerm() {
  const cr = careerNow(); if (!cr || !cr.last) return levelSelect();
  const gg = g(), C = gg.career, last = cr.last, finalEra = cr.era >= CAREER_ERAS.length - 1;
  const leader = last.govt === "opp" ? PEOPLE.quiroga : PEOPLE.salas, leaderId = last.govt === "opp" ? "quiroga" : "salas";
  const kind = last.lost ? "ousted" : finalEra ? "retire" : last.heat < 60 && (last.cred >= 0.55 || last.pop >= 50) ? "reappointed" : "notReappointed";
  const [h, body] = kind === "ousted" ? C.ousted(cr.gov.name) : kind === "retire" ? C.retire(cr.gov.name) : C[kind](cr.gov.name, leader);
  const endsTenure = kind !== "reappointed", suggestion = suggestName();
  resetStage();
  openOverlay(`<div class="scr">
    <span class="q-date">${esc(C.eras[cr.era])}</span>
    <div class="elec-bust">${portraitSVG(leaderId, kind === "reappointed" || kind === "retire" ? "happy" : kind === "ousted" ? "angry" : "neutral")}</div>
    <h2 class="big-title">${esc(h)}</h2><p class="credits">${esc(body)}</p>
    ${endsTenure && !finalEra ? `<label class="code"><span>${esc(C.successor)}</span><input id="succName" class="name-in" maxlength="28" value="${esc(suggestion)}" autocomplete="off" spellcheck="false"></label>` : ""}
    <button class="btn big" id="caNext" data-hot>${esc(finalEra ? C.summaryTitle : endsTenure ? C.appoint : C.serveAgain)} →</button>
  </div>`);
  (kind === "ousted" || kind === "notReappointed" ? Sound.bad : Sound.good)();
  $("caNext").onclick = () => {
    if (endsTenure || finalEra) cr.govs.push(finishGovernor(cr.gov, kind === "ousted" ? last.lost : finalEra ? "retired" : "notReappointed"));
    if (finalEra) { persist(); return careerFinish(); }
    if (endsTenure) cr.gov = { name: ($("succName").value || "").trim().slice(0, 28) || suggestion, terms: [] };
    cr.era++; cr.last = null; persist();
    careerInterlude();
  };
}

function careerInterlude() {
  const cr = careerNow(), gg = g(), C = gg.career, [, prevEnd] = eraYears(cr.era - 1), [nextStart] = eraYears(cr.era), c = cr.carry || {};
  openOverlay(`<div class="scr">
    <span class="q-date">${esc(C.eras[cr.era])}</span>
    <h2 class="big-title">${esc(C.interTitle(prevEnd, nextStart))}</h2>
    <p class="credits interlude">${esc(C.inter[cr.era - 1])}</p>
    <div class="carry"><span class="sec-lab">${esc(C.carryTitle)}</span>
      <div class="carry-row"><span>${esc(C.carryCred(Math.round((c.cred || 0) * 100)))}</span><span>${esc(C.carryPts(c.points ?? 3))}</span></div>
      <div class="carry-depts">${DEPTS.map(k => `<span><b>${esc(gg.depts[k][0])}</b><i class="pips">${[0, 1, 2].map(q => `<i class="${q < ((c.dept || {})[k] || 0) ? "on" : ""}"></i>`).join("")}</i></span>`).join("")}</div>
    </div>
    <p class="hint">${esc(C.govLine(cr.gov.name))}</p>
    <button class="btn big" id="ciGo" data-hot>${esc(C.nextEra)} →</button>
  </div>`);
  $("ciGo").onclick = startCareerTerm;
}

function careerFinish() {
  const cr = careerNow(), gg = g(), C = gg.career, total = cr.results.reduce((a, r) => a + r.score, 0);
  store.hall = store.hall || { governors: [], careers: [] };
  store.hall.careers = [{ date: new Date().toISOString().slice(0, 10), mandate: cr.mandate, em: cr.em, hard: cr.hard, total, governors: cr.govs.length, results: cr.results },
    ...store.hall.careers].sort((a, b) => b.total - a.total).slice(0, 15);
  const got = [];
  if (cr.govs.length === 1 && cr.govs[0].terms === CAREER_ERAS.length) got.push("dynasty");
  if (cr.carry && DEPTS.every(k => (cr.carry.dept[k] || 0) >= 2)) got.push("builder");
  const fresh = got.filter(a => !store.ach[a]); got.forEach(a => (store.ach[a] = true));
  const results = cr.results;
  delete store.career; persist();
  openOverlay(`<div class="scr end">
    <span class="q-date">${esc(gg.mandate[cr.mandate][0])} · ${esc(cr.em ? gg.econ.em : gg.econ.adv)}${cr.hard ? " · " + esc(gg.hardTag) : ""}</span>
    <h2 class="big-title">${esc(C.summaryTitle)}</h2>
    <div class="tbl-wrap"><table class="hof"><thead><tr><th>${esc(C.eraCol)}</th><th>${esc(C.cols[0])}</th><th>${esc(C.cols[3])}</th><th>★</th><th>${esc(C.cols[5])}</th></tr></thead>
      <tbody>${results.map(r => `<tr><td>${esc(C.eras[r.era])}</td><td>${esc(r.governor)}</td><td>${r.score}</td><td>${r.stars}</td><td>${esc(C.ended[r.outcome] || r.outcome)}</td></tr>`).join("")}</tbody></table></div>
    <div class="score"><span>${esc(C.total)}</span><b>${total}</b></div>
    ${fresh.length ? `<div class="achs"><span class="sec-lab">${esc(gg.newAch)}</span>${fresh.map(a => `<div class="ach"><b>${esc(gg.ach[a][0])}</b><small>${esc(gg.ach[a][1])}</small></div>`).join("")}</div>` : ""}
    <div class="btns"><button class="btn big" id="cfHall" data-hot>${esc(C.hall)}</button><button class="btn ghost" id="cfLevels">${esc(gg.toLevels)}</button></div>
  </div>`);
  if (!FAST) { Sound.good(); confetti(); }
  $("cfHall").onclick = hallOfFame;
  $("cfLevels").onclick = levelSelect;
}

function hallOfFame() {
  const gg = g(), C = gg.career, H = store.hall || { governors: [], careers: [] };
  const gov = H.governors.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.from)}–${esc(r.to)}</td><td>${r.terms}</td><td>${r.total}</td><td>${Math.round(r.cred * 100)}</td><td>${esc(C.ended[r.ended] || r.ended)}</td></tr>`).join("");
  const car = H.careers.map(r => `<tr><td>${esc(r.date)}</td><td>${esc(gg.mandate[r.mandate][0])}</td><td>${esc(r.em ? gg.econ.em : gg.econ.adv)}${r.hard ? " · " + esc(gg.hardTag) : ""}</td><td>${r.governors}</td><td>${r.total}</td></tr>`).join("");
  openOverlay(`<div class="scr">
    <h2 class="scr-title">${esc(C.hallTitle)}</h2>
    ${gov ? `<span class="sec-lab">${esc(C.hallGov)}</span><div class="tbl-wrap"><table class="hof"><thead><tr>${C.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${gov}</tbody></table></div>` : `<p class="hint">${esc(C.noHall)}</p>`}
    ${car ? `<span class="sec-lab">${esc(C.hallCareers)}</span><div class="tbl-wrap"><table class="hof"><thead><tr>${C.colsC.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${car}</tbody></table></div>` : ""}
    <div class="btns"><button class="btn big" id="hfBack" data-hot>← ${esc(gg.toLevels)}</button></div>
  </div>`);
  $("hfBack").onclick = levelSelect;
}
