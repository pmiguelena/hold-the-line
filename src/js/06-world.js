/* ═══════════════ WHAT THE WORLD SAYS ═══════════════ */
const NEWS_KIND = { oil1: "supUp", oil2: "supUp", oil3: "supUp", oil4: "supUp", cr1: "demDown", cr2: "demDown", cr3: "demDown", cr4: "demDown", cr5: "demUp",
  pa1: "demDown", pa2: "demUp", pa3: "supUp", pa4: "supUp", pa5: "supDown", ev_house: "demDown", ev_stocks: "demDown", ev_credit: "demUp", ev_exports: "demUp",
  ev_drought: "supUp", ev_oil: "supUp", ev_tech: "supDown", ev_commod: "supDown" };
const AVATAR = { maria: "#C2587A", roberto: "#6B7FA8", diego: "#2F8C7A", sofia: "#C98A2C", andrade: "#7A62C9", bond: "#2E6FA8", tomas: "#B5473A" };
const hashNum = (str, lo, hi) => { let h = 7; for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) % 100003; return lo + (h % (hi - lo)); };

function pressItems(s, prep) {
  const P = tr().press, r = lastReport(), out = [], lastMove = r ? r.inp.move : 0;
  const rk = prep.t - 2, rev = rk >= 1 && game.sc.errX ? -0.6 * (game.sc.errX[rk] || 0) : 0;   // last quarter's growth, first estimate -> revised
  if (Math.abs(rev) >= 0.3) out.push(["wire", g()[rev > 0 ? "revUp" : "revDown"](quarterLabel(rk))]);
  if (s.heat >= 60) out.push(["ledger", g().pressRift]);
  if (prep.t === M.election + 1 && s.govt === "opp") out.push(["ledger", P.newGov]);
  if (s.pi > 4) out.push(["ch9", P.hotPrices(pc(s.pi, 1))]); else if (s.pi < 0.5) out.push(["ch9", P.falling]);
  if (s.x < -2) out.push(["wire", P.layoffs]); else if (s.x > 2) out.push(["wire", P.shortage]);
  if (lastMove > 0) out.push(["ledger", P.hikeHit]); else if (lastMove < 0) out.push(["ledger", s.pi > 3 ? P.cutInfl : P.cutWelcome]);
  if (prep.toElection >= 0 && prep.toElection <= 3) out.push(["ch9", P.campaign(prep.toElection)]);
  if (s.pop < 40) out.push(["ledger", P.pollLow(Math.round(s.pop))]); else if (s.pop > 60) out.push(["ledger", P.pollHigh(Math.round(s.pop))]);
  if (s.cred < 0.4) out.push(["wire", P.doubt]); else if (s.cred > 0.85 && s.t > 0) out.push(["wire", P.trusted]);
  if (!out.length) out.push(["wire", P.calm]);
  return out;
}
function preComments(s, prep) {
  const C = g().cm, keys = [];
  if (prep.news) keys.push(NEWS_KIND[prep.news]);
  if (s.pi > 4) keys.push("highInfl"); else if (s.pi < 0.5) keys.push("deflation");
  if (s.x < -2) keys.push("recession"); else if (s.x > 2) keys.push("boom");
  if (drawdown(s) >= 8) keys.push("markets");
  if (s.heat >= 60) keys.push("rift");
  if (s.cred < 0.45) keys.push("lowCred");
  if (prep.toElection >= 0 && prep.toElection <= 3) keys.push("election");
  if (!keys.length) keys.push("calm");
  const out = [], seenPeople = new Set();
  for (let round = 0; round < 3 && out.length < 3; round++)
    for (const k of keys) {
      const pool = C[k]; if (!pool || out.length >= 3) continue;
      const item = pool[(round + prep.t) % pool.length];
      if (seenPeople.has(item[0])) continue;
      seenPeople.add(item[0]); out.push(item);
    }
  return out;
}
function reactions(r) {
  const R = g().rx, inp = r.inp, p = r.prev, out = [], has = k => r.credParts.some(q => q[0] === k);
  const add = (k, arg) => (R[k] || []).forEach(([who, txt]) => out.push([who, typeof txt === "function" ? txt(arg) : txt]));
  const dk = r.prep.dilemma || r.prep.gd; if (dk && inp.choice != null) add(`d_${dk}_${inp.choice}`);
  if (has("caved")) add("caved"); else if (has("resisted")) add("resisted");
  if (has("brokeHawk") || has("brokeDove")) add("broke");
  if (r.surprise >= 0.25) add("surpHawk"); else if (r.surprise <= -0.25) add("surpDove");
  const piTxt = pc(p.pi, 1);
  if (inp.move >= 0.5) add("hikeBig"); else if (inp.move > 0) add(p.pi > 2.5 ? "hikeOk" : "hikeRisky", piTxt);
  else if (inp.move <= -0.5) add("cutBig"); else if (inp.move < 0) add(p.pi > 3 ? "cutRisky" : "cutOk", piTxt); else add("hold");
  if (inp.tone !== "neutral") add(inp.tone);
  const seen = new Set();
  return out.filter(([who]) => (seen.has(who) ? false : seen.add(who))).slice(0, 4);
}
function calls(s, prep) {
  const t = tr(), m = t.msgs, out = [], r = lastReport(), opp = s.govt === "opp";
  const pres = opp ? "quiroga" : "salas", presRole = opp ? g().presF : t.roles.pres;
  const fin = opp ? "brandt" : "rios", finRole = opp ? g().finM : t.roles.fin;
  if (prep.pressure === "hike") out.push({ id: pres, role: presRole, text: m.hike, mood: "angry", pres: true });
  else if (prep.pressure === "cut") {
    const text = prep.toElection < 0 ? m.cutPost : prep.level === 3 ? m.cut3 : prep.level === 2 ? m.cut2(Math.max(1, prep.toElection)) : m.cut1;
    out.push({ id: pres, role: presRole, text, mood: prep.level === 3 ? "angry" : prep.level === 2 ? "sad" : "neutral", pres: true });
  } else if (s.pop > 55 && s.t > 0 && s.t % 3 === 0) out.push({ id: pres, role: presRole, text: m.steady, mood: "happy" });
  if (prep.g - s.g > 0.2) out.push({ id: fin, role: finRole, text: m.spend((prep.g - s.g).toFixed(1)), mood: "happy" });
  else if (opp && prep.g < s.g - 0.2) out.push({ id: fin, role: finRole, text: m.austerity, mood: "neutral" });
  if (!opp) {
    if (r && r.inp.move < 0 && prep.toElection >= 0 && prep.toElection <= 3) out.push({ id: "quiroga", role: t.roles.opp, text: m.oppCut, mood: "angry" });
    else if (s.pop < 45 && prep.toElection >= 0) out.push({ id: "quiroga", role: t.roles.opp, text: m.oppFail, mood: "angry" });
  } else if (prep.t === M.election + 1) out.push({ id: "salas", role: t.roles.exPres, text: m.oppWatch, mood: "sad" });
  if (s.heat >= 60) out.push({ id: fin, role: finRole, text: g().threatFin[s.heat >= 85 ? 1 : 0], mood: "sad" });
  return out;
}
function advisorText(key, s, prep) {
  const A = tr().advText, m = prep.advisors[key];
  if (key === "keynes") { if (s.i <= 0.25 && s.x < -1) return A.kZlb; return m < 0 ? A.kCut(pc(s.x, 1)) : m > 0 ? A.kHike(pc(s.x, 1)) : A.kHold; }
  if (key === "friedman") return (m > 0 ? A.fHike(pc(s.pi, 1)) : m < 0 ? A.fCut : A.fHold) + (s.cred < 0.5 ? A.fCred : "");
  return A.tRule(pc(Math.max(0, taylorRate(s)), 2));
}
function warnings(s, prep) {
  const t = tr(), w = [];
  if (s.neg > 0) w.push(t.warnDefl(s.neg));
  if (s.hot > 0) w.push(t.warnInfl(s.hot));
  if (s.cred < 0.25) w.push(t.warnCred);
  if (s.heat >= 60) w.push(g().warnHeat(Math.round(s.heat)));
  if (prep.pressure === "cut" && prep.level >= 2 && s.pop < 42) w.push(t.warnFire); else if (s.pop < 32) w.push(t.warnPop);
  return w;
}
function speaker(id) {
  const t = tr(), adv = Object.entries(ADV_ID).find(([, v]) => v === id);
  if (adv) return [t.adv[adv[0]].name, t.adv[adv[0]].school];
  if (id === "salas") return [PEOPLE.salas, t.roles.pres];
  return [PEOPLE[id] || "", ""];
}
const initials = name => name.replace(/^(Prof\.|Dr\.|Dra\.)\s*/, "").split(/\s+/).map(w => w[0]).slice(0, 2).join("");
function commentHTML([who, text], k, key) {
  const [name, handle, role] = g().people[who];
  return `<div class="comment" style="--n:${k}"><span class="avatar" style="--c:${AVATAR[who]}">${esc(initials(name))}</span><div>
    <div class="c-who">${esc(name)} <span>· ${esc(role)}</span></div><p>${esc(text)}</p>
    <div class="c-foot"><span>${ICON.heart}${hashNum(key + text, 4, 480)}</span><span>${ICON.reply}${hashNum(text + key, 0, 40)}</span></div></div></div>`;
}
function postHTML([who, text], k, key) {
  const [name, handle, role] = g().people[who];
  return `<div class="post" style="--n:${k}"><span class="avatar" style="--c:${AVATAR[who]}">${esc(initials(name))}</span><div>
    <div class="p-head"><b>${esc(name)}</b><span>${esc(handle)} · ${esc(role)}</span></div><p>${esc(text)}</p>
    <div class="p-foot"><span>${ICON.reply}${hashNum(text, 2, 90)}</span><span>${ICON.repost}${hashNum(key + text, 5, 900)}</span><span>${ICON.heart}${hashNum(text + key, 20, 4800)}</span></div></div></div>`;
}

