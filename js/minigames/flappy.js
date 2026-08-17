// 🐤 FLAPPY MICHELLE — her face, with wings, versus a lot of pipes.
//
// Tuned much gentler than real Flappy Bird: wider gaps, slower pipes, softer
// gravity. Half the room has never played a game before, and a round where
// everybody scores 0 is not a round.
//
// Score = pipes cleared.

import { el } from "../ui.js";
import { makeCanvas, loop, drawFace, hud } from "./engine.js";

const GRAVITY   = 1250;   // px/s²
const FLAP      = -390;   // px/s impulse
const SPEED     = 132;    // px/s the pipes travel left
const GAP       = 188;    // vertical gap — generous on purpose
const PIPE_W    = 58;
const SPAWN     = 1.55;   // seconds between pipes
const R         = 21;     // her radius

export const label = (n) => `${n} pipe${n === 1 ? "" : "s"}`;
export const instructions = "Tap anywhere to flap. Don't hit the pipes.";

export function mount(container, { face, onEnd }) {
  const wrap = el("div.mg-stage");
  container.append(wrap);
  const H = Math.min(Math.round(innerHeight * 0.40), 360);
  const { cv, g, W } = makeCanvas(wrap, H);
  const scoreEl = hud("0");
  wrap.append(scoreEl);

  let y = H * 0.4, vy = 0, score = 0, dead = false, t = 0, wing = 0;
  const pipes = [];
  const x = Math.max(58, W * 0.26);

  const flap = (e) => { e.preventDefault(); if (!dead) vy = FLAP; };
  cv.addEventListener("pointerdown", flap);

  const spawn = () => {
    const margin = 54;
    const top = margin + Math.random() * (H - GAP - margin * 2);
    pipes.push({ px: W + PIPE_W, top, passed: false });
  };
  spawn();

  const finish = () => {
    if (dead) return;
    dead = true;
    stop();
    onEnd(score);
  };

  const stop = loop(cv, (dt) => {
    t += dt;
    wing += dt * 18;
    vy += GRAVITY * dt;
    y += vy * dt;

    if (t > SPAWN) { t = 0; spawn(); }

    for (const p of pipes) {
      p.px -= SPEED * dt;
      if (!p.passed && p.px + PIPE_W < x - R) { p.passed = true; score++; scoreEl.textContent = String(score); }
    }
    while (pipes.length && pipes[0].px < -PIPE_W - 4) pipes.shift();

    // Floor and ceiling are lethal, same as the original.
    if (y + R >= H || y - R <= 0) { y = Math.min(Math.max(y, R), H - R); finish(); return; }

    for (const p of pipes) {
      const inX = x + R > p.px && x - R < p.px + PIPE_W;
      const inGap = y - R > p.top && y + R < p.top + GAP;
      if (inX && !inGap) { finish(); return; }
    }

    // ── draw ────────────────────────────────────────────────────────
    g.fillStyle = "#0c0a0c";
    g.fillRect(0, 0, W, H);

    // Parallax stripes so movement reads even between pipes.
    g.fillStyle = "#161216";
    for (let i = 0; i < 8; i++) {
      const sx = ((i * 90) - (performance.now() * 0.03) % 90) % (W + 90) - 45;
      g.fillRect(sx, 0, 26, H);
    }

    for (const p of pipes) {
      g.fillStyle = "#ff2e74";
      g.fillRect(p.px, 0, PIPE_W, p.top);
      g.fillRect(p.px, p.top + GAP, PIPE_W, H - p.top - GAP);
      g.fillStyle = "#f7f0e6";
      g.fillRect(p.px - 4, p.top - 16, PIPE_W + 8, 16);
      g.fillRect(p.px - 4, p.top + GAP, PIPE_W + 8, 16);
    }

    // Wings — two ellipses beating either side of her face.
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
