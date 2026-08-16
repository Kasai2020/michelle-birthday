// Put the events in order. Tap items 1→N; tap again to undo the last pick.
// Answer value = array of original indices, in the order the player chose.
// Content lists items in the CORRECT order, so index 0 is genuinely first.

import { el, shuffled } from "../ui.js";
import { SCORING } from "../../data/content.js";

// One shuffle per step per device, kept stable across re-renders.
const shuffleCache = new Map();
const stepKey = (step) => `${step.roundIndex}:${step.qNumber}`;

function displayOrder(step) {
  const key = stepKey(step);
  if (!shuffleCache.has(key)) {
    shuffleCache.set(key, shuffled(step.data.items.map((_, i) => i)));
  }
  return shuffleCache.get(key);
}

export function render(step, ctx) {
  const q = step.data;
  const order = displayOrder(step);
  let picks = Array.isArray(ctx.myAnswer) ? ctx.myAnswer.slice() : [];

  const list = el("div.chrono-list");

  const paint = () => {
    list.replaceChildren(...order.map((origIdx) => {
      const at = picks.indexOf(origIdx);
      return el("button.chrono-item", {
        type: "button",
        class: at >= 0 ? "picked" : "",
        disabled: ctx.locked,
        onclick: () => {
          if (at >= 0) picks = picks.slice(0, at);  // undo this pick and everything after
          else picks.push(origIdx);
          ctx.submit(picks.slice());
          paint();
        },
      },
        el("span.num", {}, at >= 0 ? String(at + 1) : "·"),
        el("span", {}, q.items[origIdx]));
    }));
  };
  paint();

  return el("div", {},
    el("div.qtext", {}, q.q),
    el("p.muted.small", {}, "Tap in order — earliest first. Tap a numbered item to undo from there."),
    list,
    el("button.btn.btn-ghost", {
      type: "button", disabled: ctx.locked,
      onclick: () => { picks = []; ctx.submit([]); paint(); },
    }, "Start over"));
}

export function score(step, answers) {
  const n = step.data.items.length;
  const totalPairs = (n * (n - 1)) / 2 || 1;

  const deltas = {};
  const perPlayer = {};
  for (const [pid, a] of Object.entries(answers)) {
    const picks = Array.isArray(a.v) ? a.v : [];
    let good = 0;
    for (let i = 0; i < picks.length; i++) {
      for (let j = i + 1; j < picks.length; j++) if (picks[i] < picks[j]) good++;
    }
    // Partial credit for pairs you got right, scaled by how much you ordered.
    const frac = (good / totalPairs) * (picks.length / n);
    const perfect = picks.length === n && picks.every((v, i) => v === i);
    let pts = Math.round(SCORING.base * frac);
    if (perfect) pts += SCORING.perfectBonus;
    pts = Math.round(pts * step.multiplier);

    deltas[pid] = pts;
    perPlayer[pid] = { pts, ok: perfect, v: picks, right: good, of: totalPairs };
  }
  return { deltas, result: { players: perPlayer } };
}

export function reveal(step, result, ctx) {
  const items = step.data.items;
  const mine = result.players?.[ctx.myId];
  const picks = mine?.v || [];

  return el("div", {},
    mine
      ? el("div.verdict", { class: mine.pts ? "" : "bad" },
          el("div.v-emoji", {}, mine.ok ? "🏆" : mine.pts ? "👌" : "💀"),
          el("div.v-text", {}, mine.ok ? "Perfect order!" : `${mine.right}/${mine.of} pairs right`),
          el("div.v-pts", {}, `+${mine.pts}`))
      : el("div.verdict.bad", {}, el("div.v-emoji", {}, "🫥"), el("div.v-text", {}, "No answer 😴")),

    el("h3", {}, "The real timeline"),
    el("div.chrono-list", {},
      items.map((text, origIdx) => {
        const yourSpot = picks.indexOf(origIdx);
        const right = yourSpot === origIdx;
        return el("div.chrono-item", { class: right ? "correct" : (yourSpot >= 0 ? "wrong" : "") },
          el("span.num", {}, String(origIdx + 1)),
          el("span", {}, text),
          el("span.real", {}, yourSpot >= 0 ? `you: #${yourSpot + 1}` : "you: —"));
      })));
}
