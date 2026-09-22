/* ═══════════════ ECONOMY MAP ═══════════════ */
// A top-down map of the country. Each district is a part of the economy; layers recolor it like SimCity overlays.
const MAP_TONE = { good: "#3FB68B", warn: "#F2B650", bad: "#E5484D", cold: "#5B9BD5", none: "#34405E" };
const DISTRICTS = {
  farms:    { d: "M28 36 L250 28 L262 168 L36 184 Z", chip: [145, 132] },
  housing:  { d: "M285 30 L398 26 L402 152 L292 160 Z", chip: [344, 118] },
  shops:    { d: "M462 36 L612 46 L604 188 L466 180 Z", chip: [535, 142] },
  finance:  { d: "M636 40 L772 48 L766 196 L630 192 Z", chip: [701, 152] },
  industry: { d: "M34 206 L386 190 L392 300 L40 306 Z", chip: [140, 272] },
  energy:   { d: "M446 206 L532 200 L538 292 L452 298 Z", chip: [492, 268] },
  gov:      { d: "M560 222 L770 226 L764 300 L556 296 Z", chip: [712, 276] }
};
// Which number each district shows on each layer.
const MAP_LAYERS = {
  prices:   { farms: E => E.cat.food, housing: E => E.cat.housing, shops: E => E.cat.services, industry: E => E.cat.goods, energy: E => E.cat.energy },
  activity: { farms: E => E.sec.farms, housing: E => E.sec.construction, shops: E => E.sec.shops, industry: E => E.sec.industry, energy: E => E.sec.industry, finance: E => E.sec.finance },
  jobs:     { farms: E => E.jobs.farms, housing: E => E.jobs.construction, shops: E => E.jobs.shops, industry: E => E.jobs.industry, energy: E => E.jobs.industry, finance: E => E.jobs.finance },
  credit:   { housing: E => E.hpYoY, shops: E => E.credit, industry: E => E.credit, finance: E => E.bank },
  public:   { gov: E => E.debt, shops: E => E.deficit, finance: E => E.spread, housing: E => E.mortgage }
};
function mapTone(layer, key, v) {
  if (v == null) return "none";
  if (layer === "public") {
    if (key === "gov") return v < 60 ? "good" : v < 90 ? "warn" : "bad";
    if (key === "shops") return v < 3 ? "good" : v < 6 ? "warn" : "bad";                 // the deficit
    if (key === "finance") return v < 50 ? "good" : v < 150 ? "warn" : "bad";            // the risk premium, in basis points
    return v < 4 ? "good" : v < 6 ? "warn" : "bad";                                      // what a mortgage costs
  }
  if (layer === "prices") return v < 1 ? "cold" : v <= 3 ? "good" : v <= 5 ? "warn" : "bad";
  if (layer === "activity") return v < -2.5 || v > 3 ? "bad" : v < -1 || v > 1.5 ? "warn" : "good";
  if (layer === "jobs") return v < 5 ? "good" : v < 6.5 ? "warn" : "bad";
  if (key === "finance") return v >= 70 ? "good" : v >= 50 ? "warn" : "bad";           // bank health
  return v < 0 ? "bad" : v < 3 ? "warn" : v <= 10 ? "good" : v <= 14 ? "warn" : "bad";   // lending and house prices
}
function mapFmt(layer, key, v) {
  if (layer === "public") return key === "gov" ? `${Math.round(v)}%` : key === "finance" ? `${Math.round(v)} bp` : pc(v, 1);
  if (layer === "prices" || layer === "jobs") return pc(v, 1);
  if (layer === "activity") return `${sgn(v, 1)}%`;
  return key === "finance" ? String(Math.round(v)) : `${sgn(v, 0)}%`;
}
function mapIcons(E) {
  const w = "#EEF1F7";
  let o = "";
  for (let k = 0; k < 7; k++) o += `<path d="M${48 + k * 28} 60 L${70 + k * 28} 162" stroke="${w}" stroke-opacity=".13" stroke-width="7" stroke-linecap="round"/>`;
  o += `<path d="M58 44 h34 v22 h-34z M54 46 L75 32 L96 46" fill="#8E3B3B" opacity=".85"/>`;                                  // barn
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const x = 300 + c * 30, y = 40 + r * 32;
    o += `<path d="M${x} ${y + 12} L${x + 11} ${y} L${x + 22} ${y + 12} V${y + 26} H${x} Z" fill="${w}" opacity=".22"/>`;
  }
  if (E.sec.construction > 0.5) o += `<path d="M386 34 V100 M362 40 H400 M386 40 L366 58" stroke="#F2B650" stroke-width="3" fill="none"/>`;   // crane
  for (let k = 0; k < 4; k++) {
    const x = 476 + k * 32;
    o += `<rect x="${x}" y="60" width="26" height="30" rx="2" fill="${w}" opacity=".2"/><path d="M${x - 2} 60 h30 l-3 8 h-24z" fill="${["#E5484D", "#F2B650", "#5B9BD5", "#3FB68B"][k]}" opacity=".85"/>`;
  }
  [[650, 56, 90], [676, 74, 72], [702, 46, 100], [728, 84, 62]].forEach(([x, y, h]) => {
    o += `<rect x="${x}" y="${y}" width="20" height="${h}" rx="2" fill="${w}" opacity=".18"/>`;
    for (let yy = y + 8; yy < y + h - 6; yy += 12) o += `<rect x="${x + 5}" y="${yy}" width="10" height="4" fill="#F7C66B" opacity="${E.eqGap > -5 ? 0.7 : 0.25}"/>`;
  });
  o += `<path d="M60 262 V228 L84 216 V228 L108 216 V228 L132 216 V228 L156 216 V262 Z" fill="${w}" opacity=".2"/><rect x="164" y="204" width="10" height="58" fill="${w}" opacity=".25"/>`;
  const puffs = clamp(Math.round(2 + E.sec.industry), 0, 5);                                                                  // smoke = industrial activity
  for (let k = 0; k < puffs; k++) o += `<circle cx="${172 + k * 9}" cy="${196 - k * 10}" r="${6 + k * 2}" fill="${w}" opacity="${0.16 - k * 0.02}"/>`;
  o += `<path d="M300 292 V226 M300 232 H346 M340 232 V252" stroke="#F2B650" stroke-width="3" fill="none"/><path d="M340 292 V238 M340 244 H372" stroke="#F2B650" stroke-width="3" fill="none" opacity=".7"/>`;
  o += `<path d="M300 340 h64 l-8 12 h-50z" fill="${w}" opacity=".35"/><rect x="316" y="330" width="22" height="10" fill="#E5484D" opacity=".7"/>`;
  o += `<path d="M462 280 C 466 250 462 236 470 222 H500 C 508 236 504 250 508 280 Z" fill="${w}" opacity=".22"/><path d="M516 218 L522 280 M512 232 H528" stroke="${w}" stroke-opacity=".3" stroke-width="2"/>`;
  o += `<path d="M578 262 H640 V268 H578 Z M582 240 V262 M594 240 V262 M606 240 V262 M618 240 V262 M630 240 V262 M576 240 L609 228 L642 240 Z" fill="#E9E1CC" stroke="#E9E1CC" stroke-width="3" opacity=".6"/>`;
  o += `<path d="M660 268 V246 H690 V268 Z M662 246 C 662 230 688 230 688 246" fill="#E9E1CC" opacity=".45"/><path d="M675 232 V222 H684 V228 H675" fill="#E5484D" opacity=".8"/>`;
  return o;
}
// District labels change with the layer: lending growth on the credit layer, the deficit on the public one.
const layerName = (gm, layer, key) => (layer === "credit" ? gm.sub[key] : layer === "public" ? gm.pub[key] : null);
function mapSVG(s, E, layer) {
  const L = MAP_LAYERS[layer], gm = g().map;
  let o = `<svg viewBox="0 0 800 380" role="img" aria-label="${esc(gm.title + ": " + gm.layers[layer])}">
    <rect width="800" height="380" fill="#15243A"/>
    <path d="M0 110 H800 M0 200 H800 M200 0 V330 M620 0 V330" stroke="#22354F" stroke-width="3"/>
    <path d="M0 318 C 120 305 220 330 340 318 S 560 305 800 322 L800 380 L0 380 Z" fill="#10294A"/>
    <path d="M40 350 q10 -6 20 0 t20 0 M500 346 q10 -6 20 0 t20 0 M660 360 q10 -6 20 0 t20 0" stroke="#5B9BD5" stroke-opacity=".35" fill="none" stroke-width="2"/>
    <path d="M430 0 C 420 60 450 110 425 170 S 400 260 415 322" stroke="#1E4A78" stroke-width="18" fill="none" stroke-linecap="round"/>`;
  for (const [key, dd] of Object.entries(DISTRICTS)) {
    const f = L[key], v = f ? f(E) : null, c = MAP_TONE[key === "gov" ? "none" : mapTone(layer, key, v)];
    o += `<path d="${dd.d}" fill="${c}" fill-opacity="${v == null ? 0.35 : 0.5}" stroke="${c}" stroke-opacity=".9" stroke-width="3" stroke-linejoin="round"/>`;
  }
  o += mapIcons(E);
  for (const [key, dd] of Object.entries(DISTRICTS)) {
    const gov = key === "gov", pub = layer === "public";
    const f = L[key], v = gov && !pub ? s.i : f ? f(E) : null;
    if (v == null) continue;                                     // no reading on this layer: leave the district unlabelled
    const tone = gov && !pub ? "none" : mapTone(layer, key, v), val = gov && !pub ? pc(s.i) : mapFmt(layer, key, v);
    const name = layerName(gm, layer, key) || (gov ? gm.rateChip : gm.dist[key]);
    const [cx, cy] = dd.chip, wd = Math.max(96, 7.2 * name.length + 14);
    o += `<g transform="translate(${cx - wd / 2} ${cy - 24})"><rect width="${wd}" height="42" rx="9" fill="#0B1222" fill-opacity=".9" stroke="${MAP_TONE[tone]}" stroke-width="2"/>
      <text x="${wd / 2}" y="15" text-anchor="middle" font-size="11" font-weight="600" fill="#9AA4BD" font-family="Archivo, sans-serif">${esc(name)}</text>
      <text x="${wd / 2}" y="34" text-anchor="middle" font-size="17" font-weight="800" fill="#EEF1F7" font-family="Archivo, sans-serif">${esc(val)}</text></g>`;
  }
  return o + `</svg>`;
}
function mapSummary(s, E) {
  const m = g().map, out = [];
  const cats = Object.keys(E.cat).sort((a, b) => E.cat[b] - E.cat[a]);
  if (E.cat[cats[0]] - s.pi > 1.2) out.push(m.drivers(m.cat[cats[0]], pc(E.cat[cats[0]], 1)));
  else if (E.cat[cats[cats.length - 1]] - s.pi < -1.5) out.push(m.drag(m.cat[cats[cats.length - 1]], pc(E.cat[cats[cats.length - 1]], 1)));
  else out.push(Math.abs(s.pi - 2) < 1 ? m.broadCalm : m.broad(pc(s.pi, 1)));
  const secs = Object.keys(E.sec).sort((a, b) => E.sec[a] - E.sec[b]), lo = secs[0], hi = secs[secs.length - 1];
  if (E.sec[lo] < -1.5) out.push(m.weak(m.secName[lo], `${sgn(E.sec[lo], 1)}%`));
  if (E.sec[hi] > 2) out.push(m.hot(m.secName[hi], `${sgn(E.sec[hi], 1)}%`));
  if (E.bank < 50) out.push(m.bankStress(Math.round(E.bank)));
  else if (E.hpYoY > 10) out.push(m.housingBoom(`${sgn(E.hpYoY, 0)}%`));
  else if (E.hpYoY < -6) out.push(m.housingBust(`${sgn(E.hpYoY, 0)}%`));
  if (E.lev >= 5) out.push(m.levWarn(Math.round(E.lev)));
  if (E.bankCap < 75) out.push(m.crunch);
  return out.join(" ");
}
function mapHTML(s, layer) {
  const E = econDetail(s), gm = g().map, L = MAP_LAYERS[layer];
  const list = Object.keys(DISTRICTS).filter(k => (k !== "gov" || layer === "public") && L[k]).map(k => {
    const v = L[k](E), tone = mapTone(layer, k, v);
    return `<span class="emap-item" style="--c:${MAP_TONE[tone]}"><b>${esc(mapFmt(layer, k, v))}</b>${esc(layerName(gm, layer, k) || gm.dist[k])}</span>`;
  }).join("");
  return `<div class="emap" data-map="${layer}">
    <div class="emap-tabs" role="group">${Object.keys(MAP_LAYERS).map(k => `<button data-layer="${k}" aria-pressed="${k === layer}">${esc(gm.layers[k])}</button>`).join("")}</div>
    <p class="emap-sum">${esc(mapSummary(s, E))}</p>
    <div class="emap-svg">${mapSVG(s, E, layer)}</div>
    <div class="emap-list">${list}</div>
    <div class="emap-legend">${gm.legend[layer].map(([t, lab]) => `<span style="--c:${MAP_TONE[t]}">${esc(lab)}</span>`).join("")}</div>
  </div>`;
}
function mountMap(box, s, layer) {
  box.innerHTML = mapHTML(s, layer);
  box.querySelectorAll("[data-layer]").forEach(b => (b.onclick = () => { if (game) game.mapLayer = b.dataset.layer; Sound.select(); mountMap(box, s, b.dataset.layer); }));
}
