// Safety checks for Flappy Michelle's difficulty ramp.
//   node tests/flappy-tuning.test.mjs
//
// ⚠️ WHAT THIS CAN AND CANNOT TELL YOU
//
// It cannot calibrate difficulty for humans. I tried. A bang-bang bot dies on
// pipe 5 because it can't stop overshooting; a predictive bot with perfect
// state knowledge clears 250+ even with a fifth of its taps deleted. Neither
// resembles a person at a party, and tuning to satisfy either would be tuning
// to satisfy a bug in the bot.
//
// What it CAN prove is that the ramp never becomes impossible — which is the
// failure mode that actually matters, because it's invisible until someone
// hits the wall mid-party. So: a geometric invariant on the gap floor, plus a
// competent bot that has to survive well past where the ramp bottoms out.
//
// Real difficulty gets tuned by playing it. Join with the code MINI.

import assert from "node:assert/strict";
import { gapFor, speedFor, stepBird, TUNING } from "../js/minigames/flappy.js";

let pass = 0;
const test = (name, fn) => {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
};

const H = 360, W = 362, DT = 1 / 60;
const { R, PIPE_W, SPACING, GAP_MIN, GAP_START, MAX_SHIFT, riseFor } = TUNING;
const X = Math.max(58, W * 0.26);

/** A competent player: taps at most every 66ms, aims not to clip either pipe. */
function simulate(tapFrames = 4, missRate = 0, seed = 1, maxSeconds = 200) {
  let rnd = seed;
  const rand = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;

  let centre = H / 2;
  const makePipe = (n, px) => {
    const gap = gapFor(n), half = gap / 2;
    const lo = Math.max(40 + half, centre - MAX_SHIFT);
    const hi = Math.min(H - 40 - half, centre + MAX_SHIFT);
    centre = lo + rand() * Math.max(0, hi - lo);
    return { px, top: centre - half, gap, passed: false };
  };

  let y = H * 0.4, vy = 0, score = 0, lastFlap = -99;
  const pipes = [makePipe(0, W + PIPE_W)];
  const tc = tapFrames * DT;

  for (let f = 0; f < maxSeconds * 60; f++) {
    let flap = false;
    if (f - lastFlap >= tapFrames) {
      const next = pipes.find((p) => p.px + PIPE_W >= X - R) || pipes[pipes.length - 1];
      const ceilingOfGap = next.top + R + 4;
      const floorOfGap = next.top + next.gap - R - 4;
      const sink = y + vy * tc + 0.5 * TUNING.GRAVITY * tc * tc;
      if (missRate && rand() < missRate) flap = false;
      else if (sink > floorOfGap && y - riseFor > ceilingOfGap) flap = true;
      if (flap) lastFlap = f;
    }
    ({ y, vy } = stepBird(y, vy, DT, flap));

    const speed = speedFor(score);
    for (const p of pipes) {
      p.px -= speed * DT;
      if (!p.passed && p.px + PIPE_W < X - R) { p.passed = true; score++; }
    }
    while (pipes.length && pipes[0].px < -PIPE_W - 4) pipes.shift();
    if (pipes[pipes.length - 1].px <= W - SPACING) {
      pipes.push(makePipe(score + pipes.filter((p) => !p.passed).length, W + PIPE_W));
    }

    if (y - R <= 0 || y + R >= H) return score;
    for (const p of pipes) {
      if (X + R > p.px && X - R < p.px + PIPE_W && !(y - R > p.top && y + R < p.top + p.gap)) return score;
    }
  }
  return score;
}

console.log("\nthe ramp");
test("the gap narrows as you score, then floors", () => {
  assert.ok(gapFor(0) > gapFor(4), "should already be tighter by pipe 4");
  assert.ok(gapFor(4) > gapFor(8), "and tighter again by pipe 8");
  assert.equal(gapFor(100), GAP_MIN, "must floor rather than invert");
  assert.equal(gapFor(1e6), GAP_MIN);
});
test("the opening gap is tight but flyable", () => {
  const band = GAP_START - 2 * R;
  assert.ok(band > riseFor * 1.6, `opening band ${band}px vs a ${Math.round(riseFor)}px flap`);
  assert.ok(band < riseFor * 2.6, "opening gap is too generous — this is meant to bite early");
});
test(`the floor respects the flap: ${Math.round(GAP_MIN - 2 * R)}px of room for a ${Math.round(riseFor)}px flap`, () => {
  const band = GAP_MIN - 2 * R;
  assert.ok(band > riseFor * 1.3,
    `${band}px of room vs a ${Math.round(riseFor)}px flap is frame-perfect, not hard`);
});
test("speed ramps and then caps", () => {
  assert.ok(speedFor(0) < speedFor(8));
  assert.equal(speedFor(1e6), speedFor(1e6 + 1));
});
test("the gap centre can't jump further than a player can climb", () => {
  const timeBetweenPipes = SPACING / speedFor(99);
  const climbable = riseFor * (timeBetweenPipes / 0.35);
  assert.ok(MAX_SHIFT < climbable,
    `a ${MAX_SHIFT}px shift in ${timeBetweenPipes.toFixed(2)}s is more than she can climb`);
});

console.log("\nthe ramp never walls out");
const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const clean = [1, 2, 3, 4, 5, 6, 7].map((s) => simulate(4, 0, s));
test(`a competent player gets far past the floor (median ${median(clean)} of ${clean.join(", ")})`, () => {
  // Median, not a single seed: one bad pipe sequence is variance, not a wall.
  assert.ok(median(clean) >= 40, `median ${median(clean)} — the ramp becomes impassable`);
  assert.ok(Math.max(...clean) >= 80, "no run gets far — the ceiling is too low");
});
const noisy = [1, 2, 3, 4, 5].map((s) => simulate(4, 0.1, s));
test(`still passable when a tenth of the taps are dropped (${noisy.join(", ")})`, () => {
  assert.ok(Math.min(...noisy) >= 15, `worst run ${Math.min(...noisy)} — too fragile`);
});

console.log(`\n${pass} passed${process.exitCode ? " — with failures above" : ""}\n`);
