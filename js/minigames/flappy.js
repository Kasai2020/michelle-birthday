// 🐤 FLAPPY MICHELLE — her face, with wings, versus a lot of pipes.
//
// The gap starts forgiving and closes in as you score, so a beginner clears
// a few pipes and feels good while a decent player has to keep earning it.
// The ramp floors out at GAP_MIN, which is deliberately still passable —
// past that point it's an endurance test, not a wall.
//
// Score = pipes cleared.

import { el } from "../ui.js";
import { makeCanvas, loop, drawFace, hud } from "./engine.js";

const GRAVITY    = 1250;  // px/s²  — unchanged, the flap should feel the same
const FLAP       = -390;  // px/s impulse
const R          = 21;    // her radius
const PIPE_W     = 58;
const SPACING    = 212;   // px between pipes — distance-based, so the ramp in
                          // speed doesn't also crush the spacing

// The difficulty ramp. Gap is fixed per pipe at spawn time, so a pipe never
// changes shape while it's on screen.
//
// GAP_MIN is set from geometry, not taste: one flap lifts her
// FLAP²/(2·GRAVITY) ≈ 61px, and the space she has to fly through is
// GAP_MIN − 2R. Let those get close and the game stops being hard and starts
// being frame-perfect, which is a different (worse) game.
const GAP_START  = 178;
const GAP_MIN    = 128;   // 86px of clearance vs a 61px flap — tight, fair
const GAP_STEP   = 7;     // px narrower per pipe, so the floor lands at ~8
const SPEED_START = 138;  // px/s
const SPEED_STEP  = 4.5;
const SPEED_MAX   = 250;

// How far the gap centre may move between consecutive pipes. Without this the
// vertical scatter grows as the gap narrows — the tightest gaps would also
// demand the biggest climbs, compounding difficulty twice over.
const MAX_SHIFT  = 74;

export const gapFor   = (n) => Math.max(GAP_MIN, GAP_START - n * GAP_STEP);
export const speedFor = (n) => Math.min(SPEED_MAX, SPEED_START + n * SPEED_STEP);

/** One physics tick. Exported so the tuning test uses the real integration. */
export const stepBird = (y, vy, dt, flapping) => {
  const nv = (flapping ? FLAP : vy) + GRAVITY * dt;
  return { y: y + nv * dt, vy: nv };
};

export const TUNING = { GRAVITY, FLAP, R, GAP_START, GAP_MIN, GAP_STEP, SPACING, PIPE_W, MAX_SHIFT,
  /** How high one flap carries her — the number GAP_MIN has to respect. */
  get riseFor() { return (FLAP * FLAP) / (2 * GRAVITY); } };

export const label = (n) => `${n} pipe${n === 1 ? "" : "s"}`;
export const instructions = "Tap anywhere to flap. The pipes close in as you go.";

export function mount(container, { face, onEnd }) {
  const wrap = el("div.mg-stage");
  container.append(wrap);
  const H = Math.min(Math.round(innerHeight * 0.40), 360);
  const { cv, g, W } = makeCanvas(wrap, H);
  const scoreEl = hud("0");
  wrap.append(scoreEl);

  let y = H * 0.4, vy = 0, score = 0, dead = false, wing = 0, flapping = false;
  let centre = H / 2;
  const pipes = [];
  const x = Math.max(58, W * 0.26);

  const flap = (e) => { e.preventDefault(); if (!dead) flapping = true; };
  cv.addEventListener("pointerdown", flap);

  const spawn = () => {
    const gap = gapFor(score + pipes.filter((p) => !p.passed).length);
    const half = gap / 2;
    const lo = Math.max(40 + half, centre - MAX_SHIFT);
    const hi = Math.min(H - 40 - half, centre + MAX_SHIFT);
    centre = lo + Math.random() * Math.max(0, hi - lo);
    pipes.push({ px: W + PIPE_W, top: centre - half, gap, passed: false });
  };
  spawn();

  const finish = () => {
    if (dead) return;
    dead = true;
    stop();
    onEnd(score);
  };

  const stop = loop(cv, (dt) => {
    const speed = speedFor(score);
    ({ y, vy } = stepBird(y, vy, dt, flapping));
    flapping = false;
    wing += dt * 18;

    for (const p of pipes) {
      p.px -= speed * dt;
      if (!p.passed && p.px + PIPE_W < x - R) {
        p.passed = true;
        score++;
        scoreEl.textContent = String(score);
        // Flash the HUD when the gap is still tightening, so the ramp reads
        // as a design choice rather than the game feeling inconsistent.
        scoreEl.classList.toggle("tightening", gapFor(score) > GAP_MIN);
      }
    }
    while (pipes.length && pipes[0].px < -PIPE_W - 4) pipes.shift();
    if (pipes[pipes.length - 1].px <= W - SPACING) spawn();

    if (y + R >= H || y - R <= 0) { y = Math.min(Math.max(y, R), H - R); finish(); return; }

    for (const p of pipes) {
      const inX = x + R > p.px && x - R < p.px + PIPE_W;
      const inGap = y - R > p.top && y + R < p.top + p.gap;
      if (inX && !inGap) { finish(); return; }
    }

    // ── draw ────────────────────────────────────────────────────────
    g.fillStyle = "#0c0a0c";
    g.fillRect(0, 0, W, H);

    g.fillStyle = "#161216";
    for (let i = 0; i < 8; i++) {
      const sx = ((i * 90) - (performance.now() * 0.03) % 90) % (W + 90) - 45;
      g.fillRect(sx, 0, 26, H);
    }

    for (const p of pipes) {
      // Pipes go acid yellow once the gap has bottomed out — a visual cue
      // that this is as hard as it gets.
      g.fillStyle = p.gap <= GAP_MIN ? "#ffe500" : "#ff2e74";
      g.fillRect(p.px, 0, PIPE_W, p.top);
      g.fillRect(p.px, p.top + p.gap, PIPE_W, H - p.top - p.gap);
      g.fillStyle = "#f7f0e6";
      g.fillRect(p.px - 4, p.top - 16, PIPE_W + 8, 16);
      g.fillRect(p.px - 4, p.top + p.gap, PIPE_W + 8, 16);
    }

    const beat = Math.sin(wing) * 0.5;
    g.fillStyle = "#ffe500";
    for (const dir of [-1, 1]) {
      g.save();
      g.translate(x + dir * (R - 2), y);
      g.rotate(dir * (0.5 + beat));
      g.beginPath();
      g.ellipse(dir * 12, 0, 15, 7, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    g.save();
    g.translate(x, y);
    g.rotate(Math.max(-0.5, Math.min(0.9, vy / 620)));
    drawFace(g, face, 0, 0, R);
    g.restore();
  });

  return () => { stop(); cv.removeEventListener("pointerdown", flap); };
}
