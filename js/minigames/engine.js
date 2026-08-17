// ─────────────────────────────────────────────────────────────────────
//  Shared plumbing for the arcade minigames.
//
//  Every minigame exports one function:
//
//      mount(container, { face, onEnd }) → teardown()
//
//  It draws itself into `container`, and calls `onEnd(score)` exactly once
//  when the run finishes. The round module handles the countdown, retries,
//  scoring and the lock-in button, so the games themselves only worry about
//  being fun.
// ─────────────────────────────────────────────────────────────────────

import { el } from "../ui.js";

/** Her face, loaded once and shared by every game. */
let facePromise = null;
export function loadFace() {
  if (!facePromise) {
    facePromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      // A missing sprite must not break the game — the games fall back to
      // drawing a plain pink circle when this resolves null.
      img.onerror = () => resolve(null);
      img.src = new URL("../../img/face.jpg", import.meta.url).href;
    });
  }
  return facePromise;
}

/**
 * A canvas sized to its container, DPR-corrected.
 * Returns CSS-pixel dimensions — games never deal in device pixels.
 */
export function makeCanvas(container, heightCss) {
  const cv = el("canvas.mg-canvas");
  container.append(cv);
  const g = cv.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = container.clientWidth || 340;
  const H = heightCss;
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  cv.style.width = `${W}px`;
  cv.style.height = `${H}px`;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { cv, g, W, H };
}

/**
 * requestAnimationFrame loop with two safety properties the games rely on:
 *
 *  · it stops itself once the canvas leaves the DOM, so a round ending
 *    mid-run can't leave a loop burning CPU against a detached canvas;
 *  · dt is clamped, so a phone that sleeps for 30s doesn't wake up and
 *    teleport the player through a wall.
 */
export function loop(cv, step) {
  let last = performance.now();
  let stopped = false;
  const frame = (t) => {
    if (stopped || !cv.isConnected) return;
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    step(dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return () => { stopped = true; };
}

/** Draws her face as a circle, or a pink disc if the sprite didn't load. */
export function drawFace(g, face, x, y, r) {
  g.save();
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.closePath();
  if (face) {
    g.clip();
    g.drawImage(face, x - r, y - r, r * 2, r * 2);
  } else {
    g.fillStyle = "#ff2e74";
    g.fill();
  }
  g.restore();
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.lineWidth = 3;
  g.strokeStyle = "#f7f0e6";
  g.stroke();
}

/**
 * "GET READY / 3 / 2 / 1 / GO" — the three-second warning before a run.
 * Returns a teardown so an interrupted countdown doesn't fire late.
 */
export function countdown(container, onGo, seconds = 3) {
  const num = el("div.mg-count-num", {}, String(seconds));
  container.append(el("div.mg-countdown", {},
    el("p.label", {}, "Get ready"),
    num));

  let n = seconds;
  const id = setInterval(() => {
    n -= 1;
    if (!container.isConnected) { clearInterval(id); return; }
    if (n > 0) { num.textContent = String(n); return; }
    num.textContent = "GO";
    clearInterval(id);
    setTimeout(() => { if (container.isConnected) onGo(); }, 320);
  }, 700);

  return () => clearInterval(id);
}

/** Big score readout drawn over a canvas game. */
export const hud = (text) => el("div.mg-hud", {}, text);
