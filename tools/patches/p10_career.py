# One-off source patch: Phase 5 — mandates, career mode with carry-over, reappointment, hall of fame.
import os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'src')
def patch(rel, pairs):
    p = os.path.join(ROOT, rel)
    s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        c = s.count(old)
        assert c == 1, (rel, c, old[:90])
        s = s.replace(old, new)
    open(p, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', rel)

# ───────── model: mandates and carry-over ─────────
patch('js/05-game-model.js', [
('const scoreGame = s => {\n  if (s.lost) return { macro: 0, cred: 0, pop: 0, total: 0 };\n  const macro = Math.round(550 * Math.exp(-s.L / (25 * (M.turns / 12))));',
 '''// Mandates: what the Bank is legally asked to deliver. The score weight on jobs, the credibility band and the government's patience differ.
const MANDATE = { price: { lam: 0.5, band: 1, gain: 0.02, slope: 0.05, heat: 0 }, dual: { lam: 1.0, band: 1.5, gain: 0.015, slope: 0.04, heat: -4 } };
const scoreGame = s => {
  if (s.lost) return { macro: 0, cred: 0, pop: 0, total: 0 };
  const lam = s.lam ?? 0.5, L = s.Lm ?? s.L;
  const macro = Math.round(550 * Math.exp(-L / (25 * (M.turns / 12) * (0.5 + lam))));'''),
('function applyMode(sc, hard, em) {', 'function applyMode(sc, hard, em, mandate, carry) {'),
('  if (em) { sc.em = true; sc.cred = Math.max(0.3, sc.cred - 0.08); }                           // emerging-market central banks start less trusted',
 '''  if (em) { sc.em = true; sc.cred = Math.max(0.3, sc.cred - 0.08); }                           // emerging-market central banks start less trusted
  sc.mandate = mandate === "dual" ? "dual" : "price";
  if (carry) { sc.cred = clamp(carry.cred ?? sc.cred, 0.3, 0.9); sc.dept0 = carry.dept; sc.points0 = carry.points; }   // a career: the institution carries forward'''),
('dept: initDept(), points: BUDGET_START, board: BOARD0.slice(),', 'dept: sc.dept0 ? Object.assign(initDept(), sc.dept0) : initDept(), points: sc.points0 ?? BUDGET_START, board: BOARD0.slice(),\n  Lm: 0, lam: (MANDATE[sc.mandate] || MANDATE.price).lam, mandate: sc.mandate || "price",'),
('  if (inp.qa != null) { const e = qaEffect(s, prep, inp);', '''  const md = MANDATE[sc.mandate] || MANDATE.price, ci = res.credParts.findIndex(q => q[0] === "onTarget" || q[0] === "offTarget");
  if (ci >= 0 && md !== MANDATE.price) {                                                     // the mandate decides what counts as "on target"
    const old = res.credParts[ci][1], miss = Math.abs(n.pi - 2), nv = miss < md.band ? md.gain : -Math.min(0.15, md.slope * (miss - md.band));
    res.credParts[ci] = [nv >= 0 ? "onTarget" : "offTarget", nv]; n.cred = clamp(n.cred - old + nv, 0.05, 0.95);
  }
  n.lam = md.lam; n.Lm = (s.Lm || 0) + (n.pi - 2) ** 2 + md.lam * n.x ** 2; n.mandate = sc.mandate || "price";
  if (inp.qa != null) { const e = qaEffect(s, prep, inp);'''),
('  hp.push(["drift", ((s.pop >= 50 ? 10 : 20) - s.heat) * 0.2]);', '  hp.push(["drift", ((s.pop >= 50 ? 10 : 20) + md.heat - s.heat) * 0.2]);'),
])

# ───────── text ─────────
EN = '''  mandate: { price: ["Inflation target", "price stability comes first"], dual: ["Dual mandate", "stable prices and maximum employment"], dualShort: "Dual mandate",
    hint: { price: "Inflation target: credibility rewards hitting 2%, and the score weighs inflation more than jobs.",
      dual: "Dual mandate: jobs count as much as inflation, the target band is wider, and the government is a little more patient with the Bank." } },
  mandateLine: { price: "Your mandate is price stability: 2% inflation comes first. The country expects you to deliver it.",
    dual: "Your mandate is twofold: stable prices and maximum employment. You will be judged on both." },
  career: {
    title: "Career mode", tagline: "From 1973 to today: four eras, one Bank. The departments you build and the credibility you earn carry forward.",
    start: "Start a career", cont: (era, name) => `Continue: era ${era} of 4, ${name}`, hall: "Hall of fame", tag: "Career",
    setupTitle: "A new career", nameLabel: "Your governor", begin: "Take office",
    eras: ["The Oil Shock · 1973", "The Great Recession · 2007", "The Pandemic · 2020", "Today · 2027"], eraCol: "Era",
    continueStory: "Continue the Bank's story",
    reappointed: (nm, leader) => [`${nm} is reappointed`, `President ${leader} asks you to serve another term. The Bank's work continues.`],
    notReappointed: (nm, leader) => [`${nm} is not reappointed`, `President ${leader} wants a new face at the Bank. Your tenure ends here.`],
    ousted: nm => [`${nm}'s tenure ends in failure`, "The Bank survives. Its next governor inherits the damage."],
    retire: nm => [`${nm} closes the story`, "Four eras, one Bank. History will judge the record."],
    serveAgain: "Serve the next term", successor: "Next governor", appoint: "Appoint the successor",
    govLine: nm => `Governor for this era: ${nm}.`,
    interTitle: (a, b) => `${a} → ${b}`,
    inter: [
      "Inflation raged until a new generation of central bankers crushed it in the early 1980s, at the price of a deep recession. Central banks won independence and adopted inflation targets. Then came the Great Moderation: low inflation, steady growth — and, quietly, a credit boom.",
      "Rates stayed near zero for a decade. Central banks bought government bonds by the trillion, and inflation stayed stubbornly low. Then, in early 2020, a virus reached every country at once.",
      "The post-pandemic inflation surge forced the fastest rate hikes in forty years. Inflation came down; not every scar healed. Now the economy is calm. Your next test could come from anywhere."
    ],
    carryTitle: "What the Bank carries forward", carryCred: v => `Credibility starts at ${v}`, carryPts: v => `${v} budget points to invest`,
    nextEra: "Begin the next era", summaryTitle: "The Bank's story", total: "Career score", hallTitle: "Hall of fame",
    hallGov: "Governors", hallCareers: "Careers", noHall: "No governors yet. Start a career to write the first page.",
    cols: ["Governor", "Years", "Terms", "Score", "Credibility", "How it ended"], colsC: ["Date", "Mandate", "Economy", "Governors", "Score"],
    ended: { retired: "Closed the story", notReappointed: "Not reappointed", served: "Served", fired: "Fired", cred: "Lost credibility", defl: "Deflation trap", infl: "Inflation spiral", fxcrisis: "Currency crisis" },
    names: ["Elena Castillo", "Marcus Webb", "Ingrid Solberg", "Rafael Duarte", "Amara Okoye", "Hugo Lemaire", "Sofía Brandão", "Kenji Tanaka"]
  },
'''
ES = '''  mandate: { price: ["Meta de inflación", "la estabilidad de precios primero"], dual: ["Mandato dual", "precios estables y máximo empleo"], dualShort: "Mandato dual",
    hint: { price: "Meta de inflación: la credibilidad premia cumplir el 2% y el puntaje pesa más la inflación que el empleo.",
      dual: "Mandato dual: el empleo cuenta tanto como la inflación, la banda es más amplia y el gobierno tiene algo más de paciencia con el Banco." } },
  mandateLine: { price: "Su mandato es la estabilidad de precios: el 2% de inflación va primero. El país espera que lo cumpla.",
    dual: "Su mandato es doble: precios estables y máximo empleo. Se le juzgará por ambos." },
  career: {
    title: "Modo carrera", tagline: "De 1973 a hoy: cuatro épocas, un Banco. Los departamentos que construyes y la credibilidad que ganas pasan a la siguiente.",
    start: "Empezar una carrera", cont: (era, name) => `Continuar: época ${era} de 4, ${name}`, hall: "Salón de la fama", tag: "Carrera",
    setupTitle: "Una nueva carrera", nameLabel: "Tu autoridad", begin: "Asumir el cargo",
    eras: ["El Shock Petrolero · 1973", "La Gran Recesión · 2007", "La Pandemia · 2020", "Hoy · 2027"], eraCol: "Época",
    continueStory: "Continuar la historia del Banco",
    reappointed: (nm, leader) => [`${nm} es confirmado en el cargo`, `El Presidente ${leader} le pide otro mandato. El trabajo del Banco continúa.`],
    notReappointed: (nm, leader) => [`${nm} no es renovado`, `El Presidente ${leader} quiere una cara nueva en el Banco. Tu mandato termina aquí.`],
    ousted: nm => [`El mandato de ${nm} termina en fracaso`, "El Banco sobrevive. Quien lo suceda hereda el daño."],
    retire: nm => [`${nm} cierra la historia`, "Cuatro épocas, un Banco. La historia juzgará el legado."],
    serveAgain: "Servir el próximo mandato", successor: "Próxima autoridad", appoint: "Nombrar sucesor",
    govLine: nm => `Autoridad del Banco en esta época: ${nm}.`,
    interTitle: (a, b) => `${a} → ${b}`,
    inter: [
      "La inflación siguió alta hasta que una nueva generación de banqueros centrales la aplastó a comienzos de los ochenta, al precio de una recesión profunda. Los bancos centrales ganaron independencia y adoptaron metas de inflación. Llegó la Gran Moderación: inflación baja, crecimiento estable — y, en silencio, un boom de crédito.",
      "Las tasas quedaron cerca de cero durante una década. Los bancos centrales compraron bonos por billones y la inflación siguió obstinadamente baja. Entonces, a comienzos de 2020, un virus llegó a todos los países a la vez.",
      "El salto inflacionario pospandemia forzó las subas de tasas más rápidas en cuarenta años. La inflación bajó; no todas las cicatrices sanaron. Ahora la economía está en calma. Tu próxima prueba puede venir de cualquier lado."
    ],
    carryTitle: "Lo que el Banco lleva consigo", carryCred: v => `La credibilidad arranca en ${v}`, carryPts: v => `${v} puntos de presupuesto para invertir`,
    nextEra: "Comenzar la próxima época", summaryTitle: "La historia del Banco", total: "Puntaje de la carrera", hallTitle: "Salón de la fama",
    hallGov: "Autoridades", hallCareers: "Carreras", noHall: "Aún no hay autoridades. Empieza una carrera para escribir la primera página.",
    cols: ["Autoridad", "Años", "Mandatos", "Puntaje", "Credibilidad", "Cómo terminó"], colsC: ["Fecha", "Mandato", "Economía", "Autoridades", "Puntaje"],
    ended: { retired: "Cerró la historia", notReappointed: "No renovado", served: "Cumplió", fired: "Despedido", cred: "Perdió la credibilidad", defl: "Trampa deflacionaria", infl: "Espiral inflacionaria", fxcrisis: "Crisis cambiaria" },
    names: ["Elena Castillo", "Marcos Webb", "Ingrid Solberg", "Rafael Duarte", "Amara Okoye", "Hugo Lemaire", "Sofía Brandão", "Kenji Tanaka"]
  },
'''
patch('js/02-text-game.js', [
('  econ: { adv: "Advanced", em: "Emerging" },', EN + '  econ: { adv: "Advanced", em: "Emerging" },'),
('  econ: { adv: "Avanzada", em: "Emergente" },', ES + '  econ: { adv: "Avanzada", em: "Emergente" },'),
('    emStar: ["Emerging Star", "Finish a level in emerging-market mode"],', '    emStar: ["Emerging Star", "Finish a level in emerging-market mode"],\n    dynasty: ["Dynasty", "One governor serves all four eras of a career"],\n    builder: ["Institution Builder", "Finish a career with every department at level 2 or more"],'),
('    emStar: ["Estrella Emergente", "Termina un nivel en modo mercado emergente"],', '    emStar: ["Estrella Emergente", "Termina un nivel en modo mercado emergente"],\n    dynasty: ["Dinastía", "Una misma autoridad sirve las cuatro épocas de una carrera"],\n    builder: ["Constructor de Instituciones", "Termina una carrera con todos los departamentos en nivel 2 o más"],'),
])

# ───────── screens ─────────
patch('js/08-screens.js', [
('  $("overlay").querySelectorAll("[data-econ]")', '  $("overlay").querySelectorAll("[data-mandate]").forEach(b => (b.onclick = () => { store.mandate = b.dataset.mandate; persist(); Sound.select(); rerender(); }));\n  $("overlay").querySelectorAll("[data-econ]")'),
('startLevel(sv.cfg.scenario, sv.cfg.seed, sv.inputs, !!sv.cfg.hard, !!sv.cfg.em);', 'startLevel(sv.cfg.scenario, sv.cfg.seed, sv.inputs, !!sv.cfg.hard, !!sv.cfg.em, { mandate: sv.cfg.mandate, carry: sv.cfg.carry, career: sv.cfg.career });'),
('sk = k + (store.hard ? ":hard" : "") + (store.em ? ":em" : "")', 'sk = k + (store.hard ? ":hard" : "") + (store.em ? ":em" : "") + (store.mandate === "dual" ? ":dual" : "")'),
('    <div class="lvl-grid">', '    ${careerCard()}\n    <div class="lvl-grid">'),
('    <div class="toggles">${diffToggle()}${econToggle()}</div><p class="diff-hint">${[store.hard ? gg.hardHint : "", store.em ? gg.emHint : ""].filter(Boolean).map(esc).join(" ")}</p>',
 '    <div class="toggles">${diffToggle()}${econToggle()}${mandateToggle()}</div><p class="diff-hint">${[store.hard ? gg.hardHint : "", store.em ? gg.emHint : "", store.mandate === "dual" ? gg.mandate.hint.dual : ""].filter(Boolean).map(esc).join(" ")}</p>'),
('startLevel(b.dataset.level, code || randomCode(), [], !!store.hard, !!store.em);', 'startLevel(b.dataset.level, code || randomCode(), [], !!store.hard, !!store.em, { mandate: store.mandate === "dual" ? "dual" : "price" });'),
('  $("lBack").onclick = titleScreen;\n  bindToggles(levelSelect);', '  $("lBack").onclick = titleScreen;\n  bindCareerCard();\n  bindToggles(levelSelect);'),
('function startLevel(scenario, seed, inputs = [], hard = false, em = false) {', 'function startLevel(scenario, seed, inputs = [], hard = false, em = false, opts = {}) {'),
('  const sc = applyMode(extendScenario(buildScenario(scenario, seed), seed), hard, em);\n  game = { cfg: { scenario, seed, hard: !!hard, em: !!em }, sc,',
 '  const mandate = opts.mandate === "dual" ? "dual" : "price";\n  const sc = applyMode(extendScenario(buildScenario(scenario, seed), seed), hard, em, mandate, opts.carry);\n  game = { cfg: { scenario, seed, hard: !!hard, em: !!em, mandate, carry: opts.carry || null, career: !!opts.career }, sc,'),
('''  const lines = g().intro[scenario];
  play([...lines.map(([id, mood], k) => () => say({ speaker: id, mood, text: g().intro[scenario][k][2], skip: true })), () => beginQuarter()]);''',
 '''  const intro = () => [["salas", "neutral", g().mandateLine[mandate]], ...g().intro[scenario]];     // re-read on language change
  play([...intro().map(([id, mood], k) => () => say({ speaker: id, mood, text: intro()[k][2], skip: true })), () => beginQuarter()]);'''),
])
patch('js/11-boot.js', [
('startLevel(data.cfg.scenario, data.cfg.seed, data.inputs || [], !!data.cfg.hard, !!data.cfg.em);', 'startLevel(data.cfg.scenario, data.cfg.seed, data.inputs || [], !!data.cfg.hard, !!data.cfg.em, { mandate: data.cfg.mandate, carry: data.cfg.carry, career: data.cfg.career });'),
])

# ───────── HUD tags ─────────
patch('js/07-stage-hud.js', [
('${game.cfg.em ? `<span class="hard-tag em">${esc(gg.econ.em)}</span>` : ""}', '${game.cfg.em ? `<span class="hard-tag em">${esc(gg.econ.em)}</span>` : ""}${game.cfg.mandate === "dual" ? `<span class="hard-tag dual">${esc(gg.mandate.dualShort)}</span>` : ""}${game.cfg.career ? `<span class="hard-tag career">${esc(gg.career.tag)}</span>` : ""}'),
])

# ───────── end screen and menu ─────────
patch('js/10-end-menu.js', [
('sk = key + (game.cfg.hard ? ":hard" : "") + (game.cfg.em ? ":em" : "")', 'sk = key + (game.cfg.hard ? ":hard" : "") + (game.cfg.em ? ":em" : "") + (game.cfg.mandate === "dual" ? ":dual" : "")'),
('''  if (!restored) {
    clearSave();''', '''  if (game.cfg.career) careerRecord(s, sp.total, stars);                    // idempotent: a reload of the end screen records nothing new
  if (!restored) {
    clearSave();'''),
('''    <div class="btns">
      <button class="btn big" id="eRetry" data-hot>${esc(gg.retry)}</button>''', '''    ${game.cfg.career ? `<div class="btns"><button class="btn big" id="eCareer" data-hot>${esc(gg.career.continueStory)} →</button></div>` : `<div class="btns">
      <button class="btn big" id="eRetry" data-hot>${esc(gg.retry)}</button>'''),
('''      <button class="btn ghost" id="eLevels">${esc(gg.toLevels)}</button>
    </div>
  </div>`);''', '''      <button class="btn ghost" id="eLevels">${esc(gg.toLevels)}</button>
    </div>`}
  </div>`);
  if ($("eCareer")) $("eCareer").onclick = () => { Sound.confirm(); careerAfterTerm(); };'''),
('  $("eRetry").onclick = () => { Sound.confirm(); startLevel(key, game.cfg.seed, [], game.cfg.hard, game.cfg.em); };',
 '  const opts = { mandate: game.cfg.mandate };\n  if ($("eRetry")) $("eRetry").onclick = () => { Sound.confirm(); startLevel(key, game.cfg.seed, [], game.cfg.hard, game.cfg.em, opts); };'),
('  $("eFresh").onclick = () => { Sound.confirm(); startLevel(key, randomCode(), [], game.cfg.hard, game.cfg.em); };',
 '  if ($("eFresh")) $("eFresh").onclick = () => { Sound.confirm(); startLevel(key, randomCode(), [], game.cfg.hard, game.cfg.em, opts); };'),
('startLevel(nextKey, randomCode(), [], game.cfg.hard, game.cfg.em); };', 'startLevel(nextKey, randomCode(), [], game.cfg.hard, game.cfg.em, opts); };'),
('  $("eLevels").onclick = levelSelect;', '  if ($("eLevels")) $("eLevels").onclick = levelSelect;'),
('      <button class="btn ghost" id="mRestart">${esc(gg.restart)}</button>', '      ${game.cfg.career ? "" : `<button class="btn ghost" id="mRestart">${esc(gg.restart)}</button>`}'),
('  $("mRestart").onclick = () => startLevel(game.cfg.scenario, game.cfg.seed, [], game.cfg.hard, game.cfg.em);', '  if ($("mRestart")) $("mRestart").onclick = () => startLevel(game.cfg.scenario, game.cfg.seed, [], game.cfg.hard, game.cfg.em, { mandate: game.cfg.mandate });'),
])

p = os.path.join(ROOT, 'styles', '30-hud-extras.css')
s = open(p, encoding='utf-8').read()
s += '''.hard-tag.dual{background:var(--green)} .hard-tag.career{background:var(--amber);color:#1B1405}
.career-card{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px 20px;align-items:center;text-align:left;padding:16px 18px;border-radius:18px;
  background:linear-gradient(135deg,rgba(242,182,80,.16),rgba(255,255,255,.03) 60%);box-shadow:inset 0 0 0 1px rgba(242,182,80,.4)}
.career-card p{margin:4px 0 0;color:#D5DAE6;font-size:15px;max-width:62ch}
.career-card .btns{justify-content:flex-end}
@media (max-width:760px){.career-card{grid-template-columns:minmax(0,1fr)}.career-card .btns{justify-content:flex-start}}
.name-in{width:20ch!important;text-transform:none!important;letter-spacing:.01em!important}
.era-list{margin:0;padding-left:1.2em;text-align:left;color:#C9CFDD;display:grid;gap:2px}
.interlude{font:400 clamp(17px,2vw,20px)/1.55 var(--f-news);color:#D5DAE6;max-width:60ch}
.carry{display:grid;gap:10px;justify-items:center;padding:14px 16px;border-radius:14px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.carry-row{display:flex;flex-wrap:wrap;gap:6px 18px;justify-content:center;font-weight:700}
.carry-depts{display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:center;font-size:14px}
.carry-depts span{display:inline-flex;gap:8px;align-items:center}
.tbl-wrap{width:100%;overflow-x:auto}
table.hof{width:100%;border-collapse:collapse;font-size:14px;text-align:left}
table.hof th{font:700 11.5px var(--f-ui);letter-spacing:.07em;text-transform:uppercase;color:var(--muted);padding:6px 10px;border-bottom:1px solid var(--line-2)}
table.hof td{padding:7px 10px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums;white-space:nowrap}
'''
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('patched styles')
