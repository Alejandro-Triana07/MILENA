const NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  if (parent) parent.appendChild(n);
  return n;
};

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const barFill = $("barFill");
const status = $("status");
const btn = $("btn");
const card = $("card");
const scene = $("scene");
const stage = $("stage");

const steps = [
  [0, "Creando pétalos digitales..."],
  [45, "Optimizando renderizado..."],
  [90, "¡Listo para florecer!"],
];
let progress = 0;
const loader = setInterval(() => {
  progress = Math.min(100, progress + Math.random() * 7 + 2);
  barFill.style.width = progress + "%";
  steps.forEach(([at, msg]) => { if (progress >= at) status.textContent = msg; });
  if (progress >= 100) {
    clearInterval(loader);
    status.textContent = steps[2][1];
    btn.disabled = false;
  }
}, 180);

btn.addEventListener("click", () => {
  card.classList.add("hide");
  setTimeout(() => { scene.classList.add("show"); startFlower(); }, 700);
});

const CX = 400, BASE = 630, RX = 330, RY = 440;
const STRANDS = 9, SAMPLES = 46, GROW = 4.4;

function archPoint(t, off) {
  const th = Math.PI - t * (Math.PI / 2 + 0.14);
  const u = RX * Math.cos(th), v = RY * Math.sin(th);
  const n = Math.hypot(Math.cos(th) / RX, Math.sin(th) / RY);
  const nx = Math.cos(th) / RX / n, ny = -Math.sin(th) / RY / n;
  return { x: CX + u + nx * off, y: BASE - v + ny * off, nx, ny };
}

function smoothPath(pts) {
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6];
    const c2 = [p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function buildVines() {
  const rand = rng(7);
  const vines = $("vines");
  [false, true].forEach((mirror) => {
    const g = el("g", mirror ? { transform: `translate(${2 * CX} 0) scale(-1 1)` } : {}, vines);
    const r = rng(7);
    for (let i = 0; i < STRANDS; i++) {
      const base = (i - STRANDS / 2) * 6;
      const amp = 10 + r() * 24, freq = 1.4 + r() * 1.8, phase = r() * 6.28;
      const tEnd = 0.8 + r() * 0.22;
      const delay = r() * 1.2;
      const width = 1.2 + r() * 1.8;
      const pts = [];
      for (let k = 0; k <= SAMPLES; k++) {
        const t = (k / SAMPLES) * tEnd;
        const off = base + amp * Math.sin(2 * Math.PI * freq * t + phase) * (0.4 + t);
        pts.push(archPoint(t, off));
      }
      el("path", {
        d: smoothPath(pts), pathLength: 1, class: "vine", "stroke-width": width.toFixed(2),
        style: `--d:${delay.toFixed(2)}s;--t:${GROW}s`,
      }, g);

      const thorns = 7 + Math.floor(r() * 5);
      for (let j = 0; j < thorns; j++) {
        const t = 0.06 + r() * (tEnd - 0.08);
        const idx = Math.min(SAMPLES - 1, Math.floor((t / tEnd) * SAMPLES));
        const p = pts[idx], q = pts[idx + 1];
        const tx = q.x - p.x, ty = q.y - p.y, tl = Math.hypot(tx, ty) || 1;
        const side = r() > 0.5 ? 1 : -1;
        const len = 9 + r() * 16;
        const dx = (p.nx * side * 0.9 + (tx / tl) * 0.6), dy = (p.ny * side * 0.9 + (ty / tl) * 0.6);
        const dl = Math.hypot(dx, dy);
        const ex = p.x + (dx / dl) * len, ey = p.y + (dy / dl) * len;
        const cx = p.x + (dx / dl) * len * 0.35 - (ty / tl) * side * 3;
        const cy = p.y + (dy / dl) * len * 0.35 + (tx / tl) * side * 3;
        const tDelay = (delay + GROW * (1 - Math.sqrt(1 - Math.min(0.999, (idx / SAMPLES) * 1))) ).toFixed(2);
        el("path", {
          d: `M${p.x.toFixed(1)} ${p.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
          class: "thorn", "stroke-width": 1, style: `--d:${tDelay}s`,
        }, g);
        if (r() > 0.6) el("circle", { cx: ex.toFixed(1), cy: ey.toFixed(1), r: 1.6, class: "tip", style: `--d:${tDelay}s` }, g);
      }
    }
  });
}
buildVines();

const PETAL = "M0 0 C-30 -26 -44 -84 0 -150 C44 -84 30 -26 0 0 Z";
const IRI = "M-9 -40 C-26 -72 -16 -112 0 -138 C5 -100 2 -62 -9 -40 Z";
const lotus = $("lotus");

function petals(angles, s, fill, d, iri) {
  angles.forEach((a) => {
    const g = el("g", { class: "petal", style: `--a:${a}deg;--s:${s};--d:${d}s` }, lotus);
    el("path", { d: PETAL, fill }, g);
    el("path", { d: "M0 -8 L0 -118", class: "vein" }, g);
    if (iri) el("path", { d: IRI, fill: "url(#gIri)", class: "iri" }, g);
    el("circle", { cx: 0, cy: -150, r: 2.6 }, g);
  });
}

petals([-86, -66, 66, 86], 1.9, "url(#gBlue)", 0, true);
petals([-50, -34, 34, 50], 1.5, "url(#gBlue)", 0.4, true);
petals([-18, 0, 18], 1.2, "url(#gPink)", 0.8, false);

[-30, -24, -18, -12, -6, 0, 6, 12, 18, 24, 30].forEach((a, i) => {
  const g = el("g", { class: "stamen", style: `--a:${a}deg;--s:${0.75 + (i % 3) * 0.12};--d:${1.6 + i * 0.05}s` }, lotus);
  el("path", { d: "M0 -10 L0 -70" }, g);
  el("circle", { cx: 0, cy: -70, r: 2.4 }, g);
});

petals([-40, -16, 16, 40], 1.0, "url(#gWhite)", 1.2, false);
petals([-20, 0, 20], 0.74, "url(#gWhite)", 1.6, false);

const front = el("g", { class: "front" }, lotus);
el("ellipse", { cx: 0, cy: -2, rx: 78, ry: 16 }, front);

function sparkles(n) {
  const box = $("sparkles");
  const colors = ["#ffe6a0", "#ffb3d9", "#fff4d6", "#ffc46b"];
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    const size = Math.random() * 3 + 1.5;
    s.className = "spark";
    s.style.cssText =
      `left:${10 + Math.random() * 80}%;top:${25 + Math.random() * 60}%;` +
      `width:${size}px;height:${size}px;` +
      `--c:${colors[i % colors.length]};--t:${4 + Math.random() * 5}s;` +
      `--dl:${Math.random() * 5}s;--x:${(Math.random() - 0.5) * 80}px`;
    box.appendChild(s);
  }
}

function startFlower() {
  stage.classList.add("go");
  setTimeout(() => sparkles(30), 1500);
  setTimeout(() => stage.classList.add("bud"), 2800);
  setTimeout(() => { stage.classList.add("bloom"); sparkles(40); }, 5200);
  setTimeout(() => scene.classList.add("done"), 9800);
}
