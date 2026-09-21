/* ═══════════════ STORAGE & ENV ═══════════════ */
const STORE_KEY = "holdtheline.v1";
const store = (() => { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } })();
store.stars = store.stars || {}; store.best = store.best || {}; store.ach = store.ach || {};
const persist = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch {} };
let lang = store.lang || ((navigator.language || "").startsWith("es") ? "es" : "en");
if (!T[lang]) lang = "en";
const FAST = !window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tr = () => T[lang], g = () => G[lang];
const randomCode = () => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let k = 0; k < 5; k++) s += c[Math.floor(Math.random() * c.length)]; return s; };
const seeded = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* ═══════════════ SOUND (soft WebAudio synth) ═══════════════ */
const Sound = (() => {
  let ac = null;
  const enabled = () => store.sound !== false;
  const ctx = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { ac = null; } } if (ac && ac.state === "suspended") ac.resume(); return ac; };
  function tone(f, d = 0.1, type = "sine", v = 0.05, when = 0, slide = 0) {
    if (!enabled()) return; const a = ctx(); if (!a) return;
    try {
      const t = a.currentTime + when, o = a.createOscillator(), gn = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + 0.012); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(gn); gn.connect(a.destination); o.start(t); o.stop(t + d + 0.03);
    } catch {}
  }
  return {
    unlock: () => ctx(),
    blip: () => tone(1400 + Math.random() * 200, 0.02, "sine", 0.006),
    select: () => tone(740, 0.08, "triangle", 0.05),
    confirm: () => { tone(587, 0.12, "triangle", 0.05); tone(880, 0.18, "triangle", 0.05, 0.09); },
    ring: () => { for (let k = 0; k < 2; k++) for (let j = 0; j < 8; j++) tone(j % 2 ? 1320 : 1100, 0.05, "sine", 0.03, k * 0.9 + j * 0.05); },
    stamp: () => { tone(160, 0.16, "sine", 0.12, 0, -90); tone(90, 0.12, "triangle", 0.06, 0.01); },
    sting: () => [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.22, "triangle", 0.04, k * 0.09)),
    good: () => [659, 784, 988].forEach((f, k) => tone(f, 0.22, "sine", 0.05, k * 0.08)),
    bad: () => [440, 370, 294].forEach((f, k) => tone(f, 0.28, "triangle", 0.045, k * 0.12)),
    star: k => tone(880 + k * 220, 0.3, "sine", 0.05),
    flash: () => tone(3000, 0.04, "sine", 0.02),
    pop: () => tone(900, 0.05, "sine", 0.025)
  };
})();

