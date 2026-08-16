// Tiny DOM helpers + shared bits of chrome. No framework, no build step.

/** el("div.card", {onclick}, child, child…) */
export function el(spec, props = {}, ...children) {
  const [tag, ...classes] = String(spec).split(".");
  const node = document.createElement(tag || "div");
  if (classes.length) node.className = classes.join(" ");
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className += ` ${v}`;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (k in node && k !== "list") node[k] = v;
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export const $ = (sel) => document.querySelector(sel);

export function mount(container, ...nodes) {
  container.replaceChildren(...nodes.flat().filter(Boolean));
  return container;
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Fisher–Yates. Returns a new array. */
export function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function showScreen(id) {
  for (const s of document.querySelectorAll(".screen")) s.hidden = s.id !== id;
}

let toastTimer;
export function toast(msg, ms = 2200) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

export const waiting = (msg, sub) =>
  el("div.waiting", {},
    el("div.spin", {}, "🎲"),
    el("h3", {}, msg),
    sub && el("p.muted.small", {}, sub));

export const playerChip = (p, pid, opts = {}) =>
  el("div.player-chip", {
    class: [opts.isMe && "is-me", opts.isHost && "is-host", p.online === false && "offline"]
      .filter(Boolean).join(" "),
  },
    el("div.pc-emoji", {}, p.avatar || "🙂"),
    el("div.pc-name", {}, p.name || "?"));

/** Players sorted high→low, tie-broken by name for stable ordering. */
export const ranked = (players = {}) =>
  Object.entries(players)
    .map(([id, p]) => ({ id, ...p, score: p.score || 0 }))
    .sort((a, b) => b.score - a.score || (a.name || "").localeCompare(b.name || ""));

export const ordinal = (n) =>
  n + (["th", "st", "nd", "rd"][((n % 100) - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");

// ── Confetti ─────────────────────────────────────────────────────────

const COLORS = ["#ff5fa2", "#8b5cf6", "#34d3e0", "#a3e635", "#fbbf24", "#ffffff"];

export function confetti(count = 140, durationMs = 4200) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = $("#confetti");
  const ctx = cv.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const resize = () => {
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    cv.style.width = `${innerWidth}px`; cv.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const bits = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.5,
    w: 6 + Math.random() * 7,
    h: 9 + Math.random() * 12,
    vy: 2 + Math.random() * 3.4,
    vx: -1.4 + Math.random() * 2.8,
    rot: Math.random() * Math.PI,
    vr: -0.13 + Math.random() * 0.26,
    color: COLORS[(Math.random() * COLORS.length) | 0],
  }));

  const end = performance.now() + durationMs;
  (function frame(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const b of bits) {
      b.x += b.vx; b.y += b.vy; b.rot += b.vr;
      if (b.y > innerHeight + 30) { b.y = -25; b.x = Math.random() * innerWidth; }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
    if (t < end) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(performance.now());
}
