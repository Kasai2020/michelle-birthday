// 🏃 MICHELLE SURFERS — a 2D, three-lane endless runner. Obstacles scroll
// toward you, you hop lanes to dodge, it speeds up until you don't.
//
// Score = metres survived.
//
// Rows never block all three lanes, and never leave the free lane more than
// one hop away, so every wall is genuinely dodgeable.

import { el } from "../ui.js";
import { makeCanvas, loop, drawFace, hud } from "./engine.js";

const LANES     = 3;
const START_V   = 210;    // px/s scroll speed
const ACCEL     = 11;     // px/s per second — the ramp
const ROW_GAP   = 200;    // px between obstacle rows
const OBST_H    = 30;
const R         = 20;
const METRE     = 26;     // px per "metre" of score

export const label = (n) => `${n} m`;
export const instructions = "Tap the left or right of the screen to switch lanes. Dodge everything.";

export function mount(container, { face, onEnd }) {
  const wrap = el("div.mg-stage");
  container.append(wrap);
  const H = Math.min(Math.round(innerHeight * 0.40), 360);
  const { cv, g, W } = makeCanvas(wrap, H);
  const scoreEl = hud("0 m");
  wrap.append(scoreEl);
  wrap.append(el("div.mg-tapzones", {},
    el("div.mg-tap", {}, "◀"),
    el("div.mg-tap", {}, "▶")));

  const laneX = (i) => (W / LANES) * (i + 0.5);
  const playerY = H - 62;

  let lane = 1, drawLane = 1, v = START_V, dist = 0, dead = false;
  let rows = [];
  let lastFree = 1;

  // Build a row that leaves at least one lane open, adjacent to the last
  // open one so it's always reachable in a single hop.
  const addRow = (y) => {
    const free = Math.max(0, Math.min(LANES - 1, lastFree + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.65 ? 1 : 0)));
    lastFree = free;
    const blocked = [];
    for (let i = 0; i < LANES; i++) if (i !== free && Math.random() < 0.8) blocked.push(i);
    if (!blocked.length) blocked.push((free + 1) % LANES);
    rows.push({ y, blocked });
  };
  for (let i = 0; i < 4; i++) addRow(-i * ROW_GAP - 120);

  const move = (e) => {
    e.preventDefault();
    if (dead) return;
    const rect = cv.getBoundingClientRect();
    const left = (e.clientX - rect.left) < rect.width / 2;
    lane = Math.max(0, Math.min(LANES - 1, lane + (left ? -1 : 1)));
  };
  cv.addEventListener("pointerdown", move);

  const finish = () => {
    if (dead) return;
    dead = true;
    stop();
    onEnd(Math.floor(dist / METRE));
  };

  const stop = loop(cv, (dt) => {
    v += ACCEL * dt;
    const dy = v * dt;
    dist += dy;
    drawLane += (lane - drawLane) * Math.min(1, dt * 14);

    for (const r of rows) r.y += dy;
    if (rows.length && rows[rows.length - 1].y > -ROW_GAP + ROW_GAP) {
      addRow(rows[rows.length - 1].y - ROW_GAP);
    }
    rows = rows.filter((r) => r.y < H + 60);

    scoreEl.textContent = `${Math.floor(dist / METRE)} m`;

    for (const r of rows) {
      if (r.y + OBST_H > playerY - R && r.y < playerY + R && r.blocked.includes(lane)) { finish(); return; }
    }

    // ── draw ────────────────────────────────────────────────────────
    g.fillStyle = "#0c0a0c";
    g.fillRect(0, 0, W, H);

    // Lane dividers, scrolling, to sell the speed.
    g.strokeStyle = "#201a20";
    g.lineWidth = 2;
    for (let i = 1; i < LANES; i++) {
      const lx = (W / LANES) * i;
      g.beginPath();
      for (let yy = (dist % 40) - 40; yy < H; yy += 40) { g.moveTo(lx, yy); g.lineTo(lx, yy + 20); }
      g.stroke();
    }

    for (const r of rows) {
      for (const b of r.blocked) {
        const bw = W / LANES - 12;
        g.fillStyle = "#ff2e74";
        g.fillRect(laneX(b) - bw / 2, r.y, bw, OBST_H);
        g.fillStyle = "#f7f0e6";
        g.fillRect(laneX(b) - bw / 2, r.y, bw, 5);
      }
    }

    // Her shadow, then her — a slight lean into the lane change.
    g.fillStyle = "rgba(0,0,0,.5)";
    g.beginPath();
    g.ellipse(laneX(drawLane), playerY + R + 6, R * 0.8, 5, 0, 0, Math.PI * 2);
    g.fill();

    g.save();
    g.translate(laneX(drawLane), playerY);
    g.rotate((lane - drawLane) * 0.35);
    drawFace(g, face, 0, 0, R);
    g.restore();
  });

  return () => { stop(); cv.removeEventListener("pointerdown", move); };
}
