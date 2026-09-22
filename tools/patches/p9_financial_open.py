# One-off source patch: Phase 4 — credit cycle, bank capital, world rates and capital flows, emerging-market mode.
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
def slice_patch(rel, a, b, new):
    p = os.path.join(ROOT, rel)
    s = open(p, encoding='utf-8').read()
    i = s.index(a); j = s.index(b, i) + len(b)
    assert s.count(a) == 1
    s = s[:i] + new + s[j:]
    open(p, 'w', encoding='utf-8', newline='\n').write(s)
    print('sliced', rel)

# ───────── model ─────────
slice_patch('js/05-game-model.js', '// Financial conditions at the start of a quarter feed demand and prices.\nfunction finFeed(s) {', 'eqGap, fxDev, yGap };\n}', '''// Financial conditions at the start of a quarter feed demand and prices.
function finFeed(s, sc) {
  // Households and firms judge markets against what they have got used to, so swings bite hard and then fade.
  const em = !!(sc && sc.em);
  const eqGap = clamp(100 * (s.eq / s.eqA - 1), -40, 40);   // stocks vs the accustomed level: wealth and confidence
  const fxDev = clamp(100 * (s.fx / s.fxA - 1), -40, 40);   // + = currency stronger than people are used to
  const yGap = s.y10 - Y10_NEUTRAL;                          // long rates the Bank does not set directly
  const bustD = -(s.bustSize || 0) * [0, 0.3, 0.6, 1][s.bust || 0];                       // a credit bust drags demand for three quarters
  const crunch = (s.bankCap ?? 100) < 75 ? -0.03 * (75 - s.bankCap) : 0;                 // thin bank capital means rationed credit
  // In an emerging market a weaker currency raises prices much more, and hurts demand through dollar debts.
  const d = clamp(0.03 * eqGap - 0.25 * yGap + (em ? 0.02 : -0.03) * fxDev, -1.8, 1.2) + bustD + crunch;
  return { d, s: clamp((em ? -0.12 : -0.05) * fxDev, -2.5, 2.5), eqGap, fxDev, yGap, bustD, crunch };
}''')
slice_patch('js/05-game-model.js', '// Markets reprice the moment the decision lands.\nfunction finStep(', 'eqPeak: Math.max(s.eqPeak, eq), eqRet, fxRet };\n}', '''// Markets reprice the moment the decision lands.
function finStep(s, n, prep, inp, sc, t, gdT, qe, ext = {}) {
  const ts = inp.tone === "hawkish" ? 1 : inp.tone === "dovish" ? -1 : 0, em = !!sc.em;
  const h = (inp.move - prep.advisors.taylor + 0.25 * ts) * (inp.hDamp || 1), dcred = n.cred - s.cred;   // a good markets desk means smaller surprises
  const iwNow = ext.iwNow ?? 2.5, iwPrev = ext.iwPrev ?? 2.5, iw0 = sc.iw ? sc.iw[0] : 2.5;
  const eqRet = 1.2 - 2.5 * h + 1.4 * (n.x - s.x) - 0.8 * Math.max(0, n.pi - 3) + 12 * dcred
    + 4 * (sc.d[t] || 0) * ((sc.d[t] || 0) < 0 ? inp.eqDamp || 1 : 1) - 1.2 * (sc.s[t] || 0) + qe.eq + (gdT.eq || 0)
    - (ext.bustOnset ? 6 : 0) - (ext.ss ? 4 : 0);
  // Currency: surprises, credibility, the rate gap with the world, intervention and, in emerging markets, capital flight.
  const fxRet = 1.6 * h + 25 * dcred - 0.3 * (n.pi - s.pi) - 1.2 * qe.eq
    + 1.0 * ((n.i - iwNow) - (s.i - iwPrev)) - (em ? 1.5 * Math.max(0, iwNow - iwPrev) : 0) + (ext.fxI || 0) - (ext.ss ? 9 : 0);
  const yTarget = 1 + n.pe + 0.4 * (n.i - 1 - n.pi) + 3 * (0.8 - n.cred) + 0.015 * n.heat - qe.y
    + (em ? 0.5 : 0.25) * (iwNow - iw0) + (ext.ss ? 1.2 : 0);                             // world rates spill into long yields
  const eq = Math.max(20, s.eq * (1 + eqRet / 100)), fx = Math.max(30, s.fx * (1 + fxRet / 100));
  const eqA = s.eqA * EQ_TREND + 0.25 * (eq - s.eqA * EQ_TREND), fxA = s.fxA + 0.25 * (fx - s.fxA);
  return { eq, fx, eqA, fxA, y10: clamp(s.y10 + 0.55 * (yTarget - s.y10) + 0.35 * h, 0.1, 18),
    eqPeak: Math.max(s.eqPeak, eq), eqRet, fxRet };
}''')
patch('js/05-game-model.js', [
('    credit: 6 + 1.5 * s.x - 1.2 * (s.i - 3) - 0.15 * dd + 0.3 * (s.hpg || 0),',
 '    credit: s.cg ?? (6 + 1.5 * s.x - 1.2 * (s.i - 3) - 0.15 * dd + 0.3 * (s.hpg || 0)), lev: s.lev || 0, bankCap: s.bankCap ?? 100,'),
('bank: clamp(80 - 1.2 * dd', 'bank: clamp((s.bankCap ?? 100) - 20 - 1.2 * dd'),
('  const fs = { key: sc.key, year: sc.year, q: sc.q, cred: sc.cred, d: z(), s: z(), noiseD: z(), noiseS: z(), news: {}, dilemmas: {} };',
 '  const fs = { key: sc.key, year: sc.year, q: sc.q, cred: sc.cred, d: z(), s: z(), noiseD: z(), noiseS: z(), news: {}, dilemmas: {}, em: sc.em,\n    iw: z().map((_, k) => (sc.iw ? sc.iw[Math.min(k, sc.iw.length - 1)] : 2.5)) };'),
('''  const free = Object.keys(DILEMMAS).filter(id => !Object.values(sc.dilemmas).includes(id)).sort(() => rng() - 0.5);''',
'''  // The world interest rate: each era has its own global cycle. Big moves make the news.
  const wrng = rngFrom("world:" + sc.key + ":" + seed), IW = {
    pandemic: t => (t < 1 ? 1.75 : t < 9 ? 0.25 : Math.min(5.25, 0.25 + 1.25 * (t - 8))),     // near zero, then the 2022 hiking cycle
    crisis: t => (t < 2 ? 5 : t < 5 ? 5 - 1.5 * (t - 1) : 0.25),                              // global rates collapse after 2008
    oil: t => (t < 9 ? 6 + 0.2 * t : t < 13 ? 7.6 + 1.2 * (t - 8) : 12.4 - 0.8 * (t - 12))     // the late-1970s Volcker shock
  };
  sc.iw = [];
  for (let t = 0, w = 2.5; t <= M.turns + 8; t++) {
    if (IW[sc.key]) sc.iw.push(IW[sc.key](t));
    else { if (t && wrng() < 0.4) w = clamp(w + (wrng() < 0.5 ? -0.25 : 0.25), 0.25, 5); sc.iw.push(w); }
  }
  for (let t = 2; t <= M.turns; t++) { const dw = sc.iw[t] - sc.iw[t - 1]; if (Math.abs(dw) >= 0.75 && !sc.news[t]) sc.news[t] = dw > 0 ? "gl_up" : "gl_down"; }
  sc.bustRoll = Array.from({ length: n }, () => wrng());                                        // fixed dice for credit busts and sudden stops
  sc.ssRoll = Array.from({ length: n }, () => wrng());
  const free = Object.keys(DILEMMAS).filter(id => !Object.values(sc.dilemmas).includes(id)).sort(() => rng() - 0.5);'''),
('''/*FIN-END*/''', '''// Difficulty and economy type, applied after the scenario is built.
function applyMode(sc, hard, em) {
  if (hard) { const f = sc.key === "oil" ? 1.15 : 1.3; ["d", "s"].forEach(k => (sc[k] = sc[k].map(v => v * f))); ["noiseD", "noiseS"].forEach(k => (sc[k] = sc[k].map(v => v * 1.4))); sc.cred = Math.max(0.3, sc.cred - 0.05); }
  if (em) { sc.em = true; sc.cred = Math.max(0.3, sc.cred - 0.08); }                           // emerging-market central banks start less trusted
  return sc;
}
/*FIN-END*/'''),
('dept: initDept(), points: BUDGET_START, board: BOARD0.slice(), macro: false, fogM: 1 });',
 'dept: initDept(), points: BUDGET_START, board: BOARD0.slice(), macro: false, fogM: 1,\n  lev: 0, cg: 6, bust: 0, bustSize: 0, bankCap: 100, reserves: sc.em ? 6 : 12, ssHit: false });'),
('  p.budget = budgetQuarter(p.t); p.canMacro = dept.supervision >= 2;',
 '  p.budget = budgetQuarter(p.t); p.canMacro = dept.supervision >= 2;\n  p.fxTool = !!sc.em || dept.markets >= 2; p.bustNow = s.bust === 3; p.ssLast = !!s.ssHit;'),
('''  const macro = !!inp.macro && dept.supervision >= 2;
  inp = Object.assign({}, inp,''', '''  const macro = !!inp.macro && dept.supervision >= 2;
  const fxL = sc.em || dept.markets >= 2 ? inp.fx || 0 : 0;                      // -1 buy reserves, 0 float, 1 sell, 2 sell heavily
  const iwNow = sc.iw ? sc.iw[t] : 2.5, iwPrev = sc.iw ? sc.iw[t - 1] : 2.5;
  const pSS = sc.em ? clamp(0.02 + 0.3 * Math.max(0, iwNow - iwPrev) + 0.4 * Math.max(0, 0.55 - s.cred) + ((s.reserves ?? 6) < 3 ? 0.08 : 0), 0, 0.6) : 0;
  const ss = !!(sc.ssRoll && sc.ssRoll[t] < pSS);                               // sudden stop: capital flees an emerging market
  inp = Object.assign({}, inp,'''),
('ff = finFeed(s);', 'ff = finFeed(s, sc);'),
('  sc.d[t] = dSave + ff.d + (gdT.d || 0) + qe.d - (macro ? 0.15 : 0);', '  sc.d[t] = dSave + ff.d + (gdT.d || 0) + qe.d - (macro ? 0.15 : 0) - (ss ? 0.4 : 0);'),
('''  Object.assign(n, finStep(s, n, prep, inp, sc, t, gdT, qe));''', '''  // The credit cycle: easy money and rising house prices push credit above trend; a big gap can burst.
  const cap0 = s.bankCap ?? 100;
  const cg = 6 + 1.5 * n.x - 1.2 * (n.i - 3) + 0.3 * (s.hpg || 0) - 0.15 * drawdown(s) - (macro ? 2.5 : 0) - (cap0 < 75 ? 0.1 * (75 - cap0) : 0);
  const lev = 0.92 * (s.lev || 0) + 0.25 * (cg - 6);
  const pBust = (s.bust || 0) > 0 || lev < 4 ? 0 : (1 - 0.2 * dept.supervision) / (1 + Math.exp(-(0.45 * (lev - 10) + 1.5 * Math.max(0, n.i - s.i) + 0.05 * drawdown(s))));
  const bustOnset = !!(sc.bustRoll && sc.bustRoll[t] < pBust);
  const bankLoss = bustOnset ? (10 + lev) * (1 - 0.2 * dept.supervision) : 0;
  n.cg = cg; n.lev = bustOnset ? lev * 0.5 : lev;
  n.bust = bustOnset ? 3 : Math.max(0, (s.bust || 0) - 1); n.bustSize = bustOnset ? 0.9 + 0.08 * lev : s.bustSize || 0;
  const FXI = { "-1": [-1.5, 0.8], 0: [0, 0], 1: [2.2, -1], 2: [4, -2] }[fxL] || [0, 0], resv0 = s.reserves ?? (sc.em ? 6 : 12);
  if (fxL > 0 && resv0 < 3) bump(-0.02, 0, "lastReserves");
  Object.assign(n, finStep(s, n, prep, inp, sc, t, gdT, qe, { fxI: FXI[0] * (1 + 0.15 * dept.markets), ss, bustOnset, iwNow, iwPrev }));
  n.bankCap = clamp(cap0 + (n.x > -1 ? 1.5 : 0.5) - 20 * Math.max(0, n.y10 - s.y10 - 0.5) - bankLoss, 30, 130);   // profits rebuild capital; busts and bond losses eat it
  n.reserves = Math.max(0, resv0 + FXI[1] + (sc.em ? 0.1 : 0)); n.ssHit = ss;
  res.bust = bustOnset; res.ss = ss;'''),
('+ 0.5 * (n.x - s.x) - (macro ? 1.5 : 0), -8, 8);', '+ 0.5 * (n.x - s.x) - (macro ? 1.5 : 0) - (n.bust > 0 ? 2.5 : 0), -8, 8);'),
('  if (!n.lost && (n.pop < M.popFire || heat >= 100 || (heat >= 80 && n.pop < 35))) n.lost = "fired";',
 '  if (!n.lost && (n.pop < M.popFire || heat >= 100 || (heat >= 80 && n.pop < 35))) n.lost = "fired";\n  if (!n.lost && ss && resv0 < 1) n.lost = "fxcrisis";                              // capital fled and there was nothing left to defend with'),
])

# ───────── shared text ─────────
patch('js/01-text-shared.js', [
('      oil1: ["OPEC embargo: crude prices quadruple",', '''      gl_up: ["Global rates surge as the world's biggest central bank hikes", "Money is flowing back to the big financial centres."],
      gl_down: ["World central banks slash rates", "Cheap global money is looking for returns abroad."],
      oil1: ["OPEC embargo: crude prices quadruple",'''),
('      oil1: ["Embargo de la OPEP: el crudo se cuadruplica",', '''      gl_up: ["Suben las tasas mundiales: el mayor banco central del mundo endurece", "El dinero vuelve a los grandes centros financieros."],
      gl_down: ["Los bancos centrales del mundo recortan tasas", "El dinero global barato busca rendimientos en el exterior."],
      oil1: ["Embargo de la OPEP: el crudo se cuadruplica",'''),
('fired: "Fired" },', 'fired: "Fired", fxcrisis: "Currency crisis" },'),
('fired: "Despedido" },', 'fired: "Despedido", fxcrisis: "Crisis cambiaria" },'),
('      fired: "Popularity crashed and the President blamed the Bank. Parliament voted to replace you."',
 '      fired: "Popularity crashed and the President blamed the Bank. Parliament voted to replace you.",\n      fxcrisis: "Capital fled with the Bank\'s reserves almost gone. The currency collapsed and dollar debts became unpayable."'),
('      fired: "La popularidad se desplomó y el Presidente culpó al Banco. El Congreso votó tu reemplazo."',
 '      fired: "La popularidad se desplomó y el Presidente culpó al Banco. El Congreso votó tu reemplazo.",\n      fxcrisis: "El capital huyó con las reservas casi agotadas. La moneda colapsó y las deudas en dólares se volvieron impagables."'),
])

# ───────── game text ─────────
EN = '''  econ: { adv: "Advanced", em: "Emerging" },
  emHint: "Emerging market: the currency moves prices much more, depreciation hurts through dollar debts, capital can flee suddenly, and you hold reserves to defend the currency.",
  fx: { label: "Currency", opts: { "-1": ["Buy reserves", "weaken the currency"], 0: ["Float", "let the market decide"], 1: ["Sell reserves", "support the currency"], 2: ["Sell heavily", "defend it hard"] },
    reserves: r => `Reserves: ${r} months of imports`,
    tip: "Selling reserves props up the currency and keeps import prices down, but they run out. If capital flees when they are almost gone, the currency collapses." },
  fxSpeech: { "-1": "The Bank will buy foreign currency to rebuild its reserves.", 1: "The Bank will sell reserves to steady the currency.", 2: "The Bank will defend the currency with every tool it has." },
  bustNews: ["Credit bubble bursts: banks count their losses", "Years of easy lending are unwinding. House prices are falling and banks are cutting loans."],
  ssNews: f => [`Capital flight: the currency plunges ${f}`, "Foreign investors pulled their money out in days. Import prices will follow."],
  creditBoomNews: v => `Credit boom: lending grows ${v} a year`, crunchNews: "Banks ration credit as their capital runs thin",
  warnLev: v => `Credit is running ${v} points above trend. The bigger the gap, the likelier a bust.`,
  warnResv: v => `Reserves are down to ${v} months of imports. A sudden stop now could break the currency.`,
'''
ES = '''  econ: { adv: "Avanzada", em: "Emergente" },
  emHint: "Mercado emergente: la moneda mueve mucho más los precios, la depreciación duele por las deudas en dólares, el capital puede huir de golpe y tienes reservas para defender la moneda.",
  fx: { label: "Moneda", opts: { "-1": ["Comprar reservas", "debilitar la moneda"], 0: ["Flotar", "que decida el mercado"], 1: ["Vender reservas", "sostener la moneda"], 2: ["Vender fuerte", "defenderla a fondo"] },
    reserves: r => `Reservas: ${r} meses de importaciones`,
    tip: "Vender reservas sostiene la moneda y contiene los precios importados, pero se agotan. Si el capital huye cuando casi no quedan, la moneda colapsa." },
  fxSpeech: { "-1": "El Banco comprará divisas para reconstruir sus reservas.", 1: "El Banco venderá reservas para estabilizar la moneda.", 2: "El Banco defenderá la moneda con todas sus herramientas." },
  bustNews: ["Estalla la burbuja de crédito: los bancos cuentan sus pérdidas", "Años de crédito fácil se desarman. Caen los precios de las viviendas y los bancos recortan préstamos."],
  ssNews: f => [`Fuga de capitales: la moneda se desploma ${f}`, "Los inversores extranjeros retiraron su dinero en días. Los precios importados vendrán detrás."],
  creditBoomNews: v => `Boom de crédito: los préstamos crecen ${v} por año`, crunchNews: "Los bancos racionan el crédito con el capital al límite",
  warnLev: v => `El crédito corre ${v} puntos sobre su tendencia. Cuanto mayor la brecha, más probable un estallido.`,
  warnResv: v => `Las reservas bajaron a ${v} meses de importaciones. Una parada súbita ahora podría quebrar la moneda.`,
'''
patch('js/02-text-game.js', [
('  continueGame: (name, q) => `Continue: ${name}, quarter ${q}`,', EN + '  continueGame: (name, q) => `Continue: ${name}, quarter ${q}`,'),
('  continueGame: (name, q) => `Continuar: ${name}, trimestre ${q}`,', ES + '  continueGame: (name, q) => `Continuar: ${name}, trimestre ${q}`,'),
('menu: "Pause", jobs: "Unemployment", heat: "Removal risk", stocks: "Stock index" },', 'menu: "Pause", jobs: "Unemployment", heat: "Removal risk", stocks: "Stock index", world: "world", y10: "10-year", reserves: "Reserves", months: "months" },'),
('menu: "Pausa", jobs: "Desempleo", heat: "Riesgo de destitución", stocks: "Bolsa" },', 'menu: "Pausa", jobs: "Desempleo", heat: "Riesgo de destitución", stocks: "Bolsa", world: "mundo", y10: "10 años", reserves: "Reservas", months: "meses" },'),
('y10: "10-year yield", first: "first estimate" }', 'y10: "10-year yield", first: "first estimate", world: "world rate", fin: "Credit gap and reserves", lev: "credit gap, points", resv: "reserves, months" }'),
('y10: "bono a 10 años", first: "primera estimación" }', 'y10: "bono a 10 años", first: "primera estimación", world: "tasa mundial", fin: "Brecha de crédito y reservas", lev: "brecha de crédito, puntos", resv: "reservas, meses" }'),
('    good: "A steady hand: Governor leaves inflation tamed",', '    fxcrisis: "Currency collapses as reserves run dry",\n    good: "A steady hand: Governor leaves inflation tamed",'),
('    good: "Mano firme: la autoridad del Banco deja la inflación domada",', '    fxcrisis: "La moneda colapsa al agotarse las reservas",\n    good: "Mano firme: la autoridad del Banco deja la inflación domada",'),
('    markets: [["bond", "Equities in free fall', '''    bust: [["bond", "The credit boom is over. Banks are counting their losses."], ["diego", "My house is now worth less than my mortgage."]],
    suddenStop: [["bond", "Foreign investors are dumping everything. The currency is in free fall."], ["sofia", "Imported flour doubled in price overnight."]],
    creditBoom: [["andrade", "Credit is growing far faster than the economy. We have seen how this ends."], ["diego", "The bank offered me a bigger mortgage than I asked for."]],
    global: [["bond", "When the world's biggest central bank moves, everyone else feels it."], ["andrade", "Global rates just moved. Our currency will feel it within days."]],
    markets: [["bond", "Equities in free fall'''),
('    markets: [["bond", "La bolsa en caída libre', '''    bust: [["bond", "Se terminó el boom de crédito. Los bancos cuentan sus pérdidas."], ["diego", "Mi casa ahora vale menos que mi hipoteca."]],
    suddenStop: [["bond", "Los inversores extranjeros venden todo. La moneda está en caída libre."], ["sofia", "La harina importada duplicó su precio de un día para otro."]],
    creditBoom: [["andrade", "El crédito crece mucho más rápido que la economía. Ya vimos cómo termina esto."], ["diego", "El banco me ofreció una hipoteca más grande de la que pedí."]],
    global: [["bond", "Cuando se mueve el mayor banco central del mundo, todos lo sienten."], ["andrade", "Se movieron las tasas mundiales. Nuestra moneda lo sentirá en días."]],
    markets: [["bond", "La bolsa en caída libre'''),
('    survivor: ["Survivor", "Finish a level after removal risk passed 70"]', '    survivor: ["Survivor", "Finish a level after removal risk passed 70"],\n    emStar: ["Emerging Star", "Finish a level in emerging-market mode"],\n    noBubble: ["No Bubble", "Finish a level where credit ran 6 points above trend, without a bust"]'),
('    survivor: ["Sobreviviente", "Termina un nivel después de que el riesgo de destitución superó 70"]', '    survivor: ["Sobreviviente", "Termina un nivel después de que el riesgo de destitución superó 70"],\n    emStar: ["Estrella Emergente", "Termina un nivel en modo mercado emergente"],\n    noBubble: ["Sin Burbuja", "Termina un nivel en que el crédito corrió 6 puntos sobre su tendencia, sin estallido"]'),
('macro: "Stricter mortgage rules annoy buyers" },', 'macro: "Stricter mortgage rules annoy buyers", lastReserves: "Spending the last of the reserves" },'),
('macro: "Las reglas hipotecarias estrictas molestan a los compradores" },', 'macro: "Las reglas hipotecarias estrictas molestan a los compradores", lastReserves: "Gastar las últimas reservas" },'),
('    housingBust: v => `House prices are falling, ${v} over a year.`', '    housingBust: v => `House prices are falling, ${v} over a year.`,\n    levWarn: v => `Credit is running ${v} points above trend: bust risk rising.`, crunch: "Banks are short of capital and rationing credit."'),
('    housingBust: v => `Los precios de las viviendas caen: ${v} en un año.`', '    housingBust: v => `Los precios de las viviendas caen: ${v} en un año.`,\n    levWarn: v => `El crédito corre ${v} puntos sobre su tendencia: sube el riesgo de estallido.`, crunch: "A los bancos les falta capital y racionan el crédito."'),
])

# ───────── world: news, comments, warnings, map ─────────
patch('js/06-world.js', [
('const NEWS_KIND = { ', 'const NEWS_KIND = { gl_up: "global", gl_down: "global", '),
('  if (r && r.stacked) out.unshift(["ledger", g().board.stackNews(g().board.names.rubio[0])]);',
 '  if (r && r.stacked) out.unshift(["ledger", g().board.stackNews(g().board.names.rubio[0])]);\n  if ((s.lev || 0) >= 6) out.push(["wire", g().creditBoomNews(pc(s.cg || 6, 0))]);\n  if ((s.bankCap ?? 100) < 75) out.push(["ledger", g().crunchNews]);'),
('  if (drawdown(s) >= 8) keys.push("markets");', '  if (s.bust > 0) keys.push("bust");\n  if (s.ssHit) keys.push("suddenStop");\n  if ((s.lev || 0) >= 6) keys.push("creditBoom");\n  if (drawdown(s) >= 8) keys.push("markets");'),
('  if (s.heat >= 60) w.push(g().warnHeat(Math.round(s.heat)));', '  if (s.heat >= 60) w.push(g().warnHeat(Math.round(s.heat)));\n  if ((s.lev || 0) >= 8) w.push(g().warnLev(Math.round(s.lev)));\n  if (game.sc.em && (s.reserves ?? 6) < 3) w.push(g().warnResv((s.reserves ?? 0).toFixed(1)));'),
])
patch('js/045-econ-map.js', [
('  else if (E.hpYoY < -6) out.push(m.housingBust(`${sgn(E.hpYoY, 0)}%`));', '  else if (E.hpYoY < -6) out.push(m.housingBust(`${sgn(E.hpYoY, 0)}%`));\n  if (E.lev >= 5) out.push(m.levWarn(Math.round(E.lev)));\n  if (E.bankCap < 75) out.push(m.crunch);'),
])

# ───────── HUD ─────────
patch('js/07-stage-hud.js', [
('const dd = drawdown(s), eqCls = dd > 20 ? "bad" : dd > 10 ? "warn" : "good";', 'const dd = drawdown(s), eqCls = dd > 20 ? "bad" : dd > 10 ? "warn" : "good", iwT = game.sc.iw ? game.sc.iw[Math.min(turn, M.turns)] : 2.5;'),
('<span class="t-lab">${esc(gg.chart.y10)} ${pc(s.y10 || Y10_NEUTRAL, 1)}</span></div></div>',
 '<span class="t-lab">${esc(gg.hud.y10)} ${pc(s.y10 || Y10_NEUTRAL, 1)} · ${esc(gg.hud.world)} ${pc(iwT, 1)}</span>${game.sc.em ? `<span class="t-lab">${esc(gg.hud.reserves)} ${(s.reserves ?? 6).toFixed(1)} ${esc(gg.hud.months)}</span>` : ""}</div></div>'),
('${game.cfg.hard ? `<span class="hard-tag">${esc(gg.hardTag)}</span>` : ""}', '${game.cfg.hard ? `<span class="hard-tag">${esc(gg.hardTag)}</span>` : ""}${game.cfg.em ? `<span class="hard-tag em">${esc(gg.econ.em)}</span>` : ""}'),
])

# ───────── screens: the economy toggle, modes everywhere ─────────
patch('js/08-screens.js', [
('const soundToggle = () =>', 'const econToggle = () => `<div class="seg" role="group"><button data-econ="0" aria-pressed="${!store.em}">${esc(g().econ.adv)}</button><button data-econ="1" aria-pressed="${!!store.em}">${esc(g().econ.em)}</button></div>`;\nconst soundToggle = () =>'),
('  const sb = $("sndBtn"); if (sb) sb.onclick', '  $("overlay").querySelectorAll("[data-econ]").forEach(b => (b.onclick = () => { store.em = b.dataset.econ === "1"; persist(); Sound.select(); rerender(); }));\n  const sb = $("sndBtn"); if (sb) sb.onclick'),
('sk = k + (store.hard ? ":hard" : "")', 'sk = k + (store.hard ? ":hard" : "") + (store.em ? ":em" : "")'),
('    <div class="toggles">${diffToggle()}</div><p class="diff-hint">${store.hard ? esc(gg.hardHint) : ""}</p>',
 '    <div class="toggles">${diffToggle()}${econToggle()}</div><p class="diff-hint">${[store.hard ? gg.hardHint : "", store.em ? gg.emHint : ""].filter(Boolean).map(esc).join(" ")}</p>'),
('startLevel(b.dataset.level, code || randomCode(), [], !!store.hard);', 'startLevel(b.dataset.level, code || randomCode(), [], !!store.hard, !!store.em);'),
('startLevel(sv.cfg.scenario, sv.cfg.seed, sv.inputs, !!sv.cfg.hard);', 'startLevel(sv.cfg.scenario, sv.cfg.seed, sv.inputs, !!sv.cfg.hard, !!sv.cfg.em);'),
('function startLevel(scenario, seed, inputs = [], hard = false) {', 'function startLevel(scenario, seed, inputs = [], hard = false, em = false) {'),
('''  const sc = extendScenario(buildScenario(scenario, seed), seed);
  if (hard) { const f = scenario === "oil" ? 1.15 : 1.3; ["d", "s"].forEach(k => (sc[k] = sc[k].map(v => v * f))); ["noiseD", "noiseS"].forEach(k => (sc[k] = sc[k].map(v => v * 1.4))); sc.cred = Math.max(0.3, sc.cred - 0.05); }
  game = { cfg: { scenario, seed, hard: !!hard }, sc,''', '''  const sc = applyMode(extendScenario(buildScenario(scenario, seed), seed), hard, em);
  game = { cfg: { scenario, seed, hard: !!hard, em: !!em }, sc,'''),
])
patch('js/11-boot.js', [
('startLevel(data.cfg.scenario, data.cfg.seed, data.inputs || [], !!data.cfg.hard);', 'startLevel(data.cfg.scenario, data.cfg.seed, data.inputs || [], !!data.cfg.hard, !!data.cfg.em);'),
])

# ───────── the quarter: currency row, bust and capital-flight news ─────────
patch('js/09-quarter.js', [
('  draft = { move: null, tone: "neutral", choice: null, qe: 0, buy: [], macro: !!s.macro };', '  draft = { move: null, tone: "neutral", choice: null, qe: 0, buy: [], macro: !!s.macro, fx: 0 };'),
('  if (prep.gd === "crash") return { head: g().crashNews[0], dek: g().crashNews[1], breaking: true };', '''  if (prep.gd === "crash") return { head: g().crashNews[0], dek: g().crashNews[1], breaking: true };
  if (prep.bustNow) return { head: g().bustNews[0], dek: g().bustNews[1], breaking: true };
  if (prep.ssLast) { const r = lastReport(), [head, dek] = g().ssNews(r ? pc(-100 * (r.state.fx / r.prev.fx - 1), 0) : ""); return { head, dek, breaking: true }; }'''),
('    ${prep.canMacro ? `<div class="dec-row"><span class="sec-lab">${esc(gg.macro.label)}</span>', '''    ${prep.fxTool ? `<div class="dec-row"><div class="fan-head"><span class="sec-lab">${esc(gg.fx.label)}</span><span class="tip">${esc(gg.fx.reserves((s.reserves ?? 6).toFixed(1)))}</span></div><div class="tones fx4" role="group">${[-1, 0, 1, 2].map(k => `<button class="tone ${k > 0 ? "qe1" : k < 0 ? "qe2" : "qe0"}" data-fx="${k}" aria-pressed="false" ${k > 0 && (s.reserves ?? 6) < k ? "disabled" : ""}><b><i></i>${esc(gg.fx.opts[k][0])}</b><small>${esc(gg.fx.opts[k][1])}</small></button>`).join("")}</div><p class="tip">${esc(gg.fx.tip)}</p></div>` : ""}
    ${prep.canMacro ? `<div class="dec-row"><span class="sec-lab">${esc(gg.macro.label)}</span>'''),
('    P.querySelectorAll("[data-macro]").forEach(b => b.setAttribute("aria-pressed", !!draft.macro === (b.dataset.macro === "on")));',
 '    P.querySelectorAll("[data-macro]").forEach(b => b.setAttribute("aria-pressed", !!draft.macro === (b.dataset.macro === "on")));\n    P.querySelectorAll("[data-fx]").forEach(b => b.setAttribute("aria-pressed", (draft.fx || 0) === +b.dataset.fx));'),
('  P.querySelectorAll("[data-macro]").forEach(b => (b.onclick = () => { draft.macro = b.dataset.macro === "on"; Sound.stamp(); sync(); }));',
 '  P.querySelectorAll("[data-macro]").forEach(b => (b.onclick = () => { draft.macro = b.dataset.macro === "on"; Sound.stamp(); sync(); }));\n  P.querySelectorAll("[data-fx]").forEach(b => (b.onclick = () => { draft.fx = +b.dataset.fx; Sound.select(); sync(); }));'),
('macro: prep.canMacro ? !!draft.macro : false };', 'macro: prep.canMacro ? !!draft.macro : false, fx: prep.fxTool ? draft.fx || 0 : 0 };'),
('${inp.qe ? " " + gg.qeSpeech[inp.qe] : ""}` });\n  if (!bv.passed)', '${inp.qe ? " " + gg.qeSpeech[inp.qe] : ""}${inp.fx ? " " + gg.fxSpeech[inp.fx] : ""}` });\n  if (!bv.passed)'),
])

# ───────── charts, end screen ─────────
patch('js/10-end-menu.js', [
('  if (kind === "rate") return { title: c.rate, keys: [[c.rate, "#3FB68B"], [c.y10, "#C4A0FF"]], series: [{ values: H.map(h => h.i), color: "#3FB68B", step: true }, { values: H.map(h => h.y10 || Y10_NEUTRAL), color: "#C4A0FF" }], include: [0, 5] };',
 '''  const iw = h => (game.sc.iw ? game.sc.iw[h.t] : 2.5);
  if (kind === "rate") return { title: c.rate, keys: [[c.rate, "#3FB68B"], [c.y10, "#C4A0FF"], [c.world, "#F2B650"]], series: [{ values: H.map(h => h.i), color: "#3FB68B", step: true }, { values: H.map(h => h.y10 || Y10_NEUTRAL), color: "#C4A0FF" }, { values: H.map(iw), color: "#F2B650", dash: true }], include: [0, 5] };
  if (kind === "fin") return { title: c.fin, keys: [[c.lev, "#E5484D"]].concat(game.sc.em ? [[c.resv, "#3FB68B"]] : []),
    series: [{ values: H.map(h => h.lev || 0), color: "#E5484D", area: true }].concat(game.sc.em ? [{ values: H.map(h => h.reserves ?? 6), color: "#3FB68B" }] : []), include: [-2, 8], refs: [0] };'''),
('<div class="chart-grid">${["infl", "gap", "rate", "mkt", "pol"].map(k => chartCard(k, qL)).join("")}</div>', '<div class="chart-grid">${["infl", "gap", "rate", "mkt", "fin", "pol"].map(k => chartCard(k, qL)).join("")}</div>'),
('sk = key + (game.cfg.hard ? ":hard" : "")', 'sk = key + (game.cfg.hard ? ":hard" : "") + (game.cfg.em ? ":em" : "")'),
('${game.cfg.hard ? ` · ${esc(gg.hardTag)}` : ""}</span>', '${game.cfg.hard ? ` · ${esc(gg.hardTag)}` : ""}${game.cfg.em ? ` · ${esc(gg.econ.em)}` : ""}</span>'),
('startLevel(key, game.cfg.seed, [], game.cfg.hard); };', 'startLevel(key, game.cfg.seed, [], game.cfg.hard, game.cfg.em); };'),
('startLevel(key, randomCode(), [], game.cfg.hard); };', 'startLevel(key, randomCode(), [], game.cfg.hard, game.cfg.em); };'),
('startLevel(nextKey, randomCode(), [], game.cfg.hard); };', 'startLevel(nextKey, randomCode(), [], game.cfg.hard, game.cfg.em); };'),
('startLevel(game.cfg.scenario, game.cfg.seed, [], game.cfg.hard);', 'startLevel(game.cfg.scenario, game.cfg.seed, [], game.cfg.hard, game.cfg.em);'),
('    if ((s.heatPeak || 0) >= 70) got.push("survivor");', '    if ((s.heatPeak || 0) >= 70) got.push("survivor");\n    if (game.cfg.em) got.push("emStar");\n    if (Math.max(...game.hist.map(h => h.lev || 0)) >= 6 && !R.some(r => r.bust)) got.push("noBubble");'),
])

p = os.path.join(ROOT, 'styles', '30-hud-extras.css')
s = open(p, encoding='utf-8').read()
s += '''.hard-tag.em{background:var(--blue)}
.tones.fx4{grid-template-columns:repeat(4,minmax(0,1fr))}
@media (max-width:640px){.tones.fx4{grid-template-columns:repeat(2,minmax(0,1fr))}}
.tone:disabled{opacity:.35;cursor:not-allowed}
'''
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('patched styles')
