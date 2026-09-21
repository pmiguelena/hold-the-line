/* ═══════════════ VECTOR PORTRAITS ═══════════════ */
const CAST = {
  salas:   { skin: "#E3B18E", hair: "#CFCFD2", style: "slick", clothes: "#27304F", tie: "#C9373D" },
  rios:    { skin: "#C68A62", hair: "#2A1D1A", style: "bob", clothes: "#B8862F", earrings: true },
  quiroga: { skin: "#F0C3A0", hair: "#7A3B22", style: "long", clothes: "#8E2B35" },
  brandt:  { skin: "#F2CDA8", hair: "#E2C26B", style: "short", clothes: "#3D4A3F", tie: "#3FB68B", glasses: true },
  harrow:  { skin: "#EFC7A4", hair: "#3A2A22", style: "slick", clothes: "#574670", tie: "#F2B650", moustache: true },
  weiss:   { skin: "#E8B894", hair: "#A3A3A8", style: "bald", clothes: "#393D47", tie: "#5B9BD5", glasses: true },
  okafor:  { skin: "#7A4B30", hair: "#1C1412", style: "short", clothes: "#2F5D4E", tie: "#F5EFE3" },
  ferro:   { skin: "#D9A07A", hair: "#4A2F23", style: "bun", clothes: "#E5484D", earrings: true },
  press1:  { skin: "#EBC3A3", hair: "#1F1A1A", style: "bob", clothes: "#3B4A66", glasses: true },
  press2:  { skin: "#D8A47C", hair: "#8A5A2B", style: "short", clothes: "#243B2F", tie: "#F2B650" },
  citizen: { skin: "#B77B57", hair: "#3B3B3B", style: "cap", clothes: "#5E7D52" }
};
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, "0");
  return "#" + c(n >> 16) + c((n >> 8) & 255) + c(n & 255);
}
let uidN = 0;
function portraitSVG(id, mood = "neutral") {
  const p = CAST[id], u = "pt" + ++uidN, skinD = shade(p.skin, 0.84), ink = "#1A1C26", lip = "#7A3030";
  let back = "", hair = "";
  switch (p.style) {
    case "long":
      back = `<path d="M50 196 C 34 124 44 38 100 32 C 156 38 166 124 150 196 Z" fill="${p.hair}"/>`;
      hair = `<path d="M58 94 C 54 52 78 36 100 36 C 126 36 148 54 142 94 C 132 70 112 58 90 62 C 74 66 64 76 58 94 Z" fill="${p.hair}"/>`; break;
    case "bob":
      hair = `<path d="M52 130 C 38 74 60 30 100 30 C 140 30 162 74 148 130 C 142 110 140 86 132 72 C 118 60 82 60 68 72 C 60 86 58 110 52 130 Z" fill="${p.hair}"/>`; break;
    case "short":
      hair = `<path d="M58 92 C 54 50 78 34 100 34 C 124 34 148 50 142 92 C 138 74 126 62 100 62 C 76 62 62 72 58 92 Z" fill="${p.hair}"/>`; break;
    case "slick":
      hair = `<path d="M58 90 C 54 48 80 32 104 34 C 128 36 148 54 142 90 C 136 70 122 58 96 60 C 76 62 64 72 58 90 Z" fill="${p.hair}"/><path d="M82 46 C 100 38 122 42 134 58" stroke="${shade(p.hair, 1.18)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`; break;
    case "bald":
      hair = `<path d="M59 108 C 54 90 58 74 65 70 L 69 108 Z M141 108 C 146 90 142 74 135 70 L 131 108 Z" fill="${p.hair}"/><ellipse cx="88" cy="58" rx="13" ry="6" fill="#fff" opacity=".2"/>`; break;
    case "bun":
      hair = `<circle cx="100" cy="30" r="17" fill="${p.hair}"/><path d="M58 92 C 54 52 78 40 100 40 C 122 40 146 52 142 92 C 136 72 122 62 100 62 C 78 62 64 72 58 92 Z" fill="${p.hair}"/>`; break;
    case "cap":
      hair = `<path d="M58 86 C 58 48 80 36 100 36 C 122 36 142 48 142 86 Z" fill="#C9373D"/><path d="M96 82 C 120 76 152 78 168 90 C 150 94 120 92 96 90 Z" fill="#9E2A2F"/>`; break;
  }
  const suit = p.tie
    ? `<path d="M82 150 L100 194 L118 150 Z" fill="#F1ECE2"/><path d="M78 152 L100 198 L90 220 L58 220 C 60 190 66 166 78 152 Z" fill="${shade(p.clothes, 0.78)}"/><path d="M122 152 L100 198 L110 220 L142 220 C 140 190 134 166 122 152 Z" fill="${shade(p.clothes, 0.78)}"/><path d="M94 150 H106 L104 162 H96 Z" fill="${shade(p.tie, 0.8)}"/><path d="M95.5 161 H104.5 L109 202 L100 214 L91 202 Z" fill="${p.tie}"/>`
    : `<path d="M78 152 Q100 188 122 152 Z" fill="${skinD}"/>`;
  const brows = {
    neutral: ["M73 82 Q83 77 94 81", "M106 81 Q117 77 127 82"],
    happy: ["M73 80 Q83 72 94 77", "M106 77 Q117 72 127 80"],
    angry: ["M72 76 L95 85", "M105 85 L128 76"],
    sad: ["M72 85 L94 78", "M106 78 L128 85"]
  }[mood] || ["M73 82 Q83 77 94 81", "M106 81 Q117 77 127 82"];
  const my = p.moustache ? 132 : 126;
  const mouth = {
    happy: `<path d="M86 ${my - 2} Q100 ${my + 15} 114 ${my - 2} Q100 ${my + 4} 86 ${my - 2} Z" fill="${lip}"/>`,
    angry: `<path d="M88 ${my + 4} Q100 ${my - 6} 112 ${my + 4}" stroke="${lip}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    sad: `<path d="M89 ${my + 3} Q100 ${my - 3} 111 ${my + 3}" stroke="${lip}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  }[mood] || `<path d="M89 ${my} Q100 ${my + 3} 111 ${my}" stroke="${lip}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  const browCol = p.style === "bald" ? "#6E6E73" : shade(p.hair, 0.8);
  return `<svg viewBox="0 0 200 220" aria-hidden="true"><defs><clipPath id="${u}"><ellipse cx="100" cy="92" rx="40" ry="48"/></clipPath></defs>
    ${back}
    <path d="M84 116 H116 V152 Q100 162 84 152 Z" fill="${skinD}"/>
    <path d="M16 220 C 20 172 56 150 100 148 C 144 150 180 172 184 220 Z" fill="${p.clothes}"/>
    <path d="M150 220 C 150 190 160 172 172 176 C 180 190 184 204 184 220 Z" fill="#000" opacity=".12"/>
    ${suit}
    <ellipse cx="60" cy="98" rx="7" ry="11" fill="${skinD}"/><ellipse cx="140" cy="98" rx="7" ry="11" fill="${skinD}"/>
    <ellipse cx="100" cy="92" rx="40" ry="48" fill="${p.skin}"/>
    <g clip-path="url(#${u})"><ellipse cx="140" cy="100" rx="26" ry="64" fill="${skinD}" opacity=".6"/></g>
    ${hair}
    <path d="${brows[0]}" stroke="${browCol}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="${brows[1]}" stroke="${browCol}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="84" cy="96" rx="4.4" ry="5.4" fill="${ink}"/><ellipse cx="116" cy="96" rx="4.4" ry="5.4" fill="${ink}"/>
    <circle cx="85.5" cy="94" r="1.4" fill="#fff"/><circle cx="117.5" cy="94" r="1.4" fill="#fff"/>
    <path d="M100 100 Q93 113 101 116" stroke="${shade(p.skin, 0.68)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${p.moustache ? `<path d="M80 122 Q92 111 100 118 Q108 111 120 122 Q110 129 100 124 Q90 129 80 122 Z" fill="${p.hair}"/>` : ""}
    ${mouth}
    ${p.glasses ? `<g fill="rgba(255,255,255,.12)" stroke="${ink}" stroke-width="3"><circle cx="84" cy="96" r="13"/><circle cx="116" cy="96" r="13"/></g><path d="M97 95 Q100 92 103 95" stroke="${ink}" stroke-width="3" fill="none"/>` : ""}
    ${mood === "angry" ? `<ellipse cx="72" cy="113" rx="8" ry="4" fill="#E0685E" opacity=".4"/><ellipse cx="128" cy="113" rx="8" ry="4" fill="#E0685E" opacity=".4"/>` : ""}
    ${p.earrings ? `<circle cx="60" cy="112" r="3.5" fill="#F2B650"/><circle cx="140" cy="112" r="3.5" fill="#F2B650"/>` : ""}
  </svg>`;
}

/* ═══════════════ OFFICE PROPS ═══════════════ */
function windowSVG(qIdx) {
  const skies = [["#0A1330", "#1B2A58", "#34427A"], ["#2C2F5F", "#B0687A", "#F3B48B"], ["#4F93D2", "#94C1EA", "#D3E7F7"], ["#2A2352", "#A34E6B", "#F39B5B"]];
  const [a, b, c] = skies[qIdx], night = qIdx === 0, day = qIdx === 2, rnd = seeded(11);
  const far = ["#1A2448", "#6B5277", "#7FA3C8", "#5A3F66"][qIdx], near = ["#0E1530", "#3E3057", "#56769A", "#35284A"][qIdx];
  let o = `<svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
    <linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".62" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
    <radialGradient id="wglow"><stop offset="0" stop-color="#FFF4D6" stop-opacity=".7"/><stop offset="1" stop-color="#FFF4D6" stop-opacity="0"/></radialGradient>
    <linearGradient id="wbank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? "#DCD4BF" : "#F1EADA"}"/><stop offset="1" stop-color="${night ? "#8C8676" : "#B9AF98"}"/></linearGradient></defs>
    <rect width="480" height="300" fill="url(#wsky)"/>`;
  if (night) for (let k = 0; k < 46; k++) o += `<circle cx="${(rnd() * 480).toFixed(1)}" cy="${(rnd() * 150).toFixed(1)}" r="${(0.5 + rnd()).toFixed(2)}" fill="#fff" opacity="${(0.4 + rnd() * 0.5).toFixed(2)}"/>`;
  const sun = night ? [400, 62, 15, "#F3EEDD"] : day ? [96, 58, 20, "#FFF6D8"] : [380, 212, 26, "#FFD29A"];
  o += `<circle cx="${sun[0]}" cy="${sun[1]}" r="${sun[2] * 4}" fill="url(#wglow)"/><circle cx="${sun[0]}" cy="${sun[1]}" r="${sun[2]}" fill="${sun[3]}"/>`;
  for (let x = -10; x < 490;) { const w = 26 + rnd() * 36, h = 70 + rnd() * 90; o += `<rect x="${x.toFixed(1)}" y="${(300 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${far}"/>`; x += w + 2; }
  for (let x = -6; x < 490;) {
    const w = 30 + rnd() * 42, h = 36 + rnd() * 80;
    if (x > 176 && x < 300) { x = 300; continue; }
    o += `<rect x="${x.toFixed(1)}" y="${(300 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${near}"/>`;
    for (let yy = 300 - h + 8; yy < 294; yy += 11) for (let xx = x + 6; xx < x + w - 6; xx += 9)
      if (rnd() < (night ? 0.5 : 0.22)) o += `<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="4" height="6" rx="1" fill="${night ? "#F7C66B" : "#DDEBF7"}" opacity="${night ? 0.9 : 0.45}"/>`;
    x += w + 3;
  }
  o += `<g><rect x="186" y="286" width="108" height="14" fill="url(#wbank)"/><rect x="192" y="278" width="96" height="9" fill="url(#wbank)"/>
    <rect x="198" y="222" width="84" height="57" fill="url(#wbank)"/>`;
  for (let k = 0; k < 6; k++) o += `<rect x="${204 + k * 14}" y="226" width="7" height="52" fill="${night ? "#7D7768" : "#C9BFA7"}"/>`;
  o += `<rect x="194" y="212" width="92" height="10" fill="url(#wbank)"/><path d="M190 212 L240 184 L290 212 Z" fill="url(#wbank)"/>
    <line x1="240" y1="184" x2="240" y2="160" stroke="${night ? "#8C8676" : "#9A917E"}" stroke-width="2"/><path d="M241 160 H260 L256 166 H241 Z" fill="#E5484D"/></g>
    <rect width="480" height="300" fill="${c}" opacity=".07"/>
    <polygon points="0,0 170,0 70,300 0,300" fill="#fff" opacity=".045"/>
    <rect x="236" y="0" width="8" height="300" fill="#2B2019"/><rect x="0" y="146" width="480" height="8" fill="#2B2019"/></svg>`;
  return o;
}
function shelfSVG() {
  const rnd = seeded(5), cols = ["#7A3B3B", "#2F5D4E", "#A87C2F", "#2E5A87", "#5E4A7E", "#B8A57A", "#3F5F36", "#8C5A3C"];
  let o = `<svg viewBox="0 0 140 200" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><rect width="140" height="200" rx="4" fill="#2A1E18"/><rect x="8" y="8" width="124" height="186" fill="#16100C"/>`;
  [66, 128, 190].forEach(sy => {
    for (let x = 12; x < 126;) {
      const w = 7 + Math.floor(rnd() * 7), h = 34 + Math.floor(rnd() * 18), c = cols[Math.floor(rnd() * cols.length)];
      if (x + w > 128) break;
      o += `<rect x="${x}" y="${sy - h}" width="${w}" height="${h}" rx="1.5" fill="${c}"/><rect x="${x + 1.5}" y="${sy - h + 7}" width="${w - 3}" height="2" fill="#fff" opacity=".2"/>`;
      x += w + 1 + (rnd() < 0.15 ? 6 : 0);
    }
    o += `<rect x="8" y="${sy}" width="124" height="5" fill="#3E2C22"/>`;
  });
  return o + `</svg>`;
}
const LAMP_SVG = `<svg viewBox="0 0 120 150" aria-hidden="true"><defs><linearGradient id="lshade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7C66B"/><stop offset="1" stop-color="#B7791F"/></linearGradient></defs>
  <ellipse cx="62" cy="144" rx="30" ry="6" fill="#000" opacity=".35"/><rect x="40" y="132" width="44" height="11" rx="5.5" fill="#8C6A3A"/>
  <path d="M62 134 L50 78 L82 46" stroke="#C9A45A" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="50" cy="78" r="5" fill="#C9A45A"/><path d="M58 16 L112 40 L96 66 L40 44 Z" fill="url(#lshade)"/>
  <ellipse cx="70" cy="57" rx="26" ry="6" fill="#FFF3C9" opacity=".85" transform="rotate(22 70 57)"/></svg>`;
const PHONE_SVG = `<svg viewBox="0 0 120 80" aria-hidden="true"><ellipse cx="60" cy="76" rx="50" ry="4" fill="#000" opacity=".35"/>
  <path d="M14 74 C 16 48 32 38 60 38 C 88 38 104 48 106 74 Z" fill="#B8323A"/><path d="M14 74 C 16 48 32 38 60 38 L60 74 Z" fill="#D03C44"/>
  <path d="M8 30 C 8 15 30 10 60 10 C 90 10 112 15 112 30 C 112 39 100 40 95 33 C 90 25 30 25 25 33 C 20 40 8 39 8 30 Z" fill="#E0474F"/>
  <circle cx="60" cy="58" r="13" fill="#F5EFE3"/><circle cx="60" cy="58" r="4.5" fill="#B8323A"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k * Math.PI / 4; return `<circle cx="${(60 + 9 * Math.cos(a)).toFixed(1)}" cy="${(58 + 9 * Math.sin(a)).toFixed(1)}" r="1.6" fill="#8E2A30"/>`; }).join("")}</svg>`;
const PROPS = {
  podium: () => `<svg viewBox="0 0 200 220" aria-hidden="true"><path d="M78 96 L86 36" stroke="#1B1D24" stroke-width="4"/><path d="M100 96 V30" stroke="#1B1D24" stroke-width="4"/><path d="M122 96 L114 36" stroke="#1B1D24" stroke-width="4"/>
    <rect x="76" y="20" width="18" height="26" rx="9" fill="#E5484D" transform="rotate(-8 85 33)"/><rect x="91" y="14" width="18" height="26" rx="9" fill="#5B9BD5"/><rect x="106" y="20" width="18" height="26" rx="9" fill="#3FB68B" transform="rotate(8 115 33)"/>
    <path d="M36 92 H164 L150 220 H50 Z" fill="#3A281F"/><path d="M36 92 H164 V106 H36 Z" fill="#5E4232"/>
    <circle cx="100" cy="156" r="26" fill="none" stroke="#C9A45A" stroke-width="3.5"/><text x="100" y="166" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-size="28" font-weight="700" fill="#C9A45A">%</text></svg>`,
  folder: label => `<svg viewBox="0 0 250 170" aria-hidden="true"><path d="M10 26 Q10 16 20 16 H86 L100 30 H230 Q240 30 240 40 V158 Q240 166 232 166 H18 Q10 166 10 158 Z" fill="#B98A3E"/>
    <rect x="22" y="22" width="200" height="130" rx="4" fill="#F5EFE3" transform="rotate(-3 122 87)"/>
    <path d="M10 48 Q10 40 18 40 H232 Q240 40 240 48 V158 Q240 166 232 166 H18 Q10 166 10 158 Z" fill="#D9A94E"/>
    <g transform="rotate(-9 125 104)"><rect x="46" y="84" width="158" height="40" rx="6" fill="none" stroke="#C9373D" stroke-width="4"/><text x="125" y="112" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="21" letter-spacing="2" fill="#C9373D">${esc(label)}</text></g></svg>`,
  newspaper: () => `<svg viewBox="0 0 240 170" aria-hidden="true"><g transform="rotate(-4 120 85)"><rect x="12" y="10" width="216" height="150" rx="3" fill="#F5EFE3"/>
    <rect x="28" y="22" width="184" height="14" fill="#1E1B16"/><rect x="28" y="42" width="184" height="3" fill="#1E1B16" opacity=".6"/>
    <rect x="28" y="54" width="120" height="12" fill="#1E1B16" opacity=".85"/><rect x="28" y="72" width="120" height="44" fill="#9AA4BD" opacity=".55"/>
    ${[0, 1, 2, 3].map(k => `<rect x="28" y="${124 + k * 8}" width="120" height="3" fill="#6C6457" opacity=".6"/>`).join("")}
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<rect x="160" y="${56 + k * 9}" width="52" height="3" fill="#6C6457" opacity=".6"/>`).join("")}</g></svg>`
};

/* ═══════════════ ICONS ═══════════════ */
const ICON = {
  chart: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20s-7-4.4-9-8.8A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 9 4.2C19 15.6 12 20 12 20z"/></svg>`,
  repost: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3l3 3-3 3M4 12V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 12v3a3 3 0 0 1-3 3H4"/></svg>`,
  reply: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/></svg>`,
  up: `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2l4.5 7h-9z" fill="currentColor"/></svg>`,
  down: `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10L1.5 3h9z" fill="currentColor"/></svg>`,
  star: `<path d="M12 2.4l2.95 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5l-6.05 3.3 1.3-6.7-5-4.7 6.8-.8z" fill="currentColor"/>`
};
const LEVEL_ICON = {
  random: ["#2C5E8F", `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="16" r="7" fill="#FFD27A"/><path d="M6 29h28" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M11 34h18" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/></svg>`],
  pandemic: ["#2F6E5C", `<svg viewBox="0 0 40 40" aria-hidden="true"><g stroke="#C8F2DF" stroke-width="2.5" stroke-linecap="round">${[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k * Math.PI / 4; return `<line x1="${20 + 9 * Math.cos(a)}" y1="${20 + 9 * Math.sin(a)}" x2="${20 + 14 * Math.cos(a)}" y2="${20 + 14 * Math.sin(a)}"/>`; }).join("")}</g><circle cx="20" cy="20" r="9" fill="#C8F2DF"/><circle cx="17" cy="18" r="2" fill="#2F6E5C"/><circle cx="23" cy="23" r="1.6" fill="#2F6E5C"/></svg>`],
  crisis: ["#8A3441", `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 9 L14 17 L20 13 L29 25 L35 29" stroke="#FFD9DA" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 30 H36 V21" stroke="#FFD9DA" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`],
  oil: ["#3A2E22", `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 5 C 26 15 31 21 31 27 A11 11 0 0 1 9 27 C 9 21 14 15 20 5 Z" fill="#F2B650"/><path d="M14 27 A6 6 0 0 0 20 33" stroke="#FFF3C9" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`]
};
const starRow = (n, cls = "") => [0, 1, 2].map(k => `<svg viewBox="0 0 24 24" class="${k < n ? "got" : ""} ${cls}" style="--n:${k}" aria-hidden="true">${ICON.star}</svg>`).join("");

/* ═══════════════ SMOOTH CHARTS ═══════════════ */
function niceTicks(lo, hi, cnt = 3) {
  const span = hi - lo || 1, raw = span / cnt, mag = 10 ** Math.floor(Math.log10(raw));
  const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(m => m >= raw);
  const out = []; for (let v = Math.floor(lo / st) * st; v <= Math.ceil(hi / st) * st + st / 2; v += st) out.push(+v.toFixed(6));
  return out;
}
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
const FAN_SD = { pi: [0.45, 0.65, 0.8, 0.9], x: [0.8, 1.1, 1.3, 1.45] };
function fanSVG(hist, path, sd, o) {
  const W = 300, H = 124, ml = 30, mr = 8, mt = 20, mb = 8, n = hist.length + path.length, h0 = hist.length - 1;
  const lo0 = Math.min(o.ref, ...hist, ...path.map((v, k) => v - 1.64 * sd[k])), hi0 = Math.max(o.ref, ...hist, ...path.map((v, k) => v + 1.64 * sd[k]));
  const ticks = niceTicks(lo0, hi0, 3), lo = ticks[0], hi = ticks[ticks.length - 1];
  const X = k => ml + (k * (W - ml - mr)) / Math.max(1, n - 1), Y = v => mt + ((hi - v) * (H - mt - mb)) / (hi - lo);
  const f = v => v.toFixed(1);
  const band = z => `M${f(X(h0))} ${f(Y(hist[h0]))} ` + path.map((v, k) => `L${f(X(h0 + 1 + k))} ${f(Y(v + z * sd[k]))}`).join(" ") + " "
    + path.map((v, k) => `L${f(X(h0 + 1 + k))} ${f(Y(v - z * sd[k]))}`).reverse().join(" ") + " Z";
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title)}">`;
  s += `<text x="${ml}" y="12" font-size="10.5" font-weight="700" letter-spacing=".06em" fill="#9AA4BD" font-family="Archivo, sans-serif">${esc(o.title.toUpperCase())}</text>`;
  ticks.forEach(v => { s += `<line x1="${ml}" x2="${W - mr}" y1="${f(Y(v))}" y2="${f(Y(v))}" stroke="#fff" stroke-opacity=".07"/><text x="${ml - 5}" y="${f(Y(v) + 3.5)}" text-anchor="end" font-size="10" fill="#9AA4BD" font-family="Archivo, sans-serif">${+v.toFixed(1)}</text>`; });
  s += `<rect x="${f(X(h0))}" y="${mt}" width="${f(W - mr - X(h0))}" height="${H - mt - mb}" fill="#fff" opacity=".035"/>`;
  s += `<line x1="${ml}" x2="${W - mr}" y1="${f(Y(o.ref))}" y2="${f(Y(o.ref))}" stroke="#fff" stroke-opacity=".35" stroke-dasharray="3 4"/>`;
  s += `<path d="${band(1.64)}" fill="${o.color}" opacity=".16"/><path d="${band(0.67)}" fill="${o.color}" opacity=".3"/>`;
  if (hist.length > 1) s += `<path d="${smoothPath(hist.map((v, k) => [X(k), Y(v)]))}" fill="none" stroke="${o.color}" stroke-width="2.4" stroke-linecap="round"/>`;
  s += `<path d="${smoothPath([[X(h0), Y(hist[h0])], ...path.map((v, k) => [X(h0 + 1 + k), Y(v)])])}" fill="none" stroke="${o.color}" stroke-width="2" stroke-dasharray="5 4"/>`;
  s += `<circle cx="${f(X(h0))}" cy="${f(Y(hist[h0]))}" r="4" fill="${o.color}" stroke="#0F1627" stroke-width="2"/>`;
  s += `<text x="${f(X(h0) + 4)}" y="${mt + 10}" font-size="10" fill="#9AA4BD" font-family="Archivo, sans-serif">${esc(o.nowLabel)}</text>`;
  return s + `</svg>`;
}
function chartSVG(o, qLabel) {
  const W = 360, H = 170, ml = 34, mr = 12, mt = 16, mb = 24, N = M.turns, u = "ch" + ++uidN;
  let lo, hi;
  if (o.fixed) [lo, hi] = o.fixed;
  else { const v = [...(o.include || [])]; o.series.forEach(se => v.push(...se.values)); if (o.band) v.push(...o.band); lo = Math.min(...v); hi = Math.max(...v); const p = (hi - lo) * 0.1 || 1; lo -= p; hi += p; }
  const ticks = niceTicks(lo, hi); lo = ticks[0]; hi = ticks[ticks.length - 1];
  const X = k => ml + (k * (W - ml - mr)) / N, Y = v => mt + ((hi - v) * (H - mt - mb)) / (hi - lo);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title)}"><defs>${o.series.map((se, k) => `<linearGradient id="${u}${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${se.color}" stop-opacity=".32"/><stop offset="1" stop-color="${se.color}" stop-opacity="0"/></linearGradient>`).join("")}</defs>`;
  if (o.band) s += `<rect x="${ml}" y="${Y(o.band[1])}" width="${W - ml - mr}" height="${Y(o.band[0]) - Y(o.band[1])}" fill="#3FB68B" opacity=".1" rx="3"/>`;
  ticks.forEach(v => { s += `<line x1="${ml}" x2="${W - mr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#fff" stroke-opacity=".07"/><text x="${ml - 6}" y="${Y(v) + 3.5}" text-anchor="end" font-size="10.5" fill="#9AA4BD" font-family="Archivo, sans-serif">${+v.toFixed(1)}</text>`; });
  if (lo < 0 && hi > 0) s += `<line x1="${ml}" x2="${W - mr}" y1="${Y(0)}" y2="${Y(0)}" stroke="#fff" stroke-opacity=".3"/>`;
  (o.refs || []).forEach(v => { s += `<line x1="${ml}" x2="${W - mr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#fff" stroke-opacity=".3" stroke-dasharray="3 4"/>`; });
  s += `<line x1="${X(M.election)}" x2="${X(M.election)}" y1="${mt - 4}" y2="${H - mb}" stroke="#F2B650" stroke-opacity=".55" stroke-dasharray="3 4"/><text x="${X(M.election) + 4}" y="${mt - 5}" font-size="10" fill="#F2B650" font-family="Archivo, sans-serif">${esc(g().electionMark)}</text>`;
  [0, Math.round(N / 3), Math.round((2 * N) / 3), N].forEach(k => { s += `<text x="${X(k)}" y="${H - 6}" text-anchor="${k === 0 ? "start" : k === 12 ? "end" : "middle"}" font-size="10.5" fill="#9AA4BD" font-family="Archivo, sans-serif">${qLabel(k)}</text>`; });
  o.series.forEach((se, k) => {
    const v = se.values;
    if (se.bars) {
      const bw = ((W - ml - mr) / N) * 0.56;
      v.forEach((val, j) => { if (!j) return; const y0 = Y(Math.max(0, val)), y1 = Y(Math.min(0, val)); s += `<rect x="${(X(j) - bw / 2).toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1.5, y1 - y0).toFixed(1)}" rx="2.5" fill="${se.color}" opacity="${j === v.length - 1 ? 1 : 0.6}"/>`; });
      return;
    }
    const pts = v.map((val, j) => [X(j), Y(val)]);
    if (se.step) {
      let d = `M${pts[0][0]} ${pts[0][1]}`; for (let j = 1; j < pts.length; j++) d += ` H${pts[j][0]} V${pts[j][1]}`;
      if (pts.length > 1) s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2.5" stroke-linejoin="round"/>`;
    } else if (pts.length > 1) {
      const d = smoothPath(pts);
      if (se.area) s += `<path d="${d} L${pts[pts.length - 1][0]} ${H - mb} L${pts[0][0]} ${H - mb} Z" fill="url(#${u}${k})"/>`;
      s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="${se.dash ? 1.6 : 2.6}" ${se.dash ? `stroke-dasharray="4 4" stroke-opacity=".8"` : ""} stroke-linecap="round"/>`;
    }
    if (!se.dash) { const [ex, ey] = pts[pts.length - 1]; s += `<circle cx="${ex}" cy="${ey}" r="9" fill="${se.color}" opacity=".2"/><circle cx="${ex}" cy="${ey}" r="4.2" fill="${se.color}" stroke="#0F1627" stroke-width="2"/>`; }
  });
  return s + `</svg>`;
}


