// "How old was she when…" — a number guess. Closest answer wins the most.
// Answer value = the guessed number.

import { el, clamp } from "../ui.js";
import { SCORING } from "../../data/content.js";

export function render(step, ctx) {
  const q = step.data;
  const min = q.min ?? 0;
  const max = q.max ?? 30;
  let value = ctx.myAnswer ?? Math.round((min + max) / 2);

  const display = el("div.guess-value", {}, String(value));
  const slider = el("input", {
    type: "range", min, max, step: 1, value,
    disabled: ctx.locked,
    oninput: (e) => { value = +e.target.value; display.textContent = String(value); },
    // Saved as you slide so a timeout still scores your latest guess, but
    // not marked finished until you tap the button.
    onchange: () => ctx.submit(value),
  });

  const nudge = (by) => () => {
    value = clamp(value + by, min, max);
    display.textContent = String(value);
    slider.value = value;
    ctx.submit(value);
  };

  return el("div", {},
    q.image && el("img.qimg", { src: q.image, alt: "" }),
    el("div.qtext", {}, q.q),
    display,
    el("div.guess-unit", {}, q.unit || "years old"),
    slider,
    el("div.stepper", {},
      el("button.btn.btn-ghost", { type: "button", disabled: ctx.locked, onclick: nudge(-1) }, "−1"),
      el("button.btn.btn-primary", {
        type: "button", disabled: ctx.locked, onclick: () => ctx.submit(value, true),
      }, "Lock it in"),
      el("button.btn.btn-ghost", { type: "button", disabled: ctx.locked, onclick: nudge(1) }, "+1")),
    el("p.muted.small.center", { style: "margin-top:12px" },
      ctx.locked ? `Locked in: ${ctx.myAnswer}` : "Slide to your guess, then lock it in"));
}

export function score(step, answers) {
  const q = step.data;
  const truth = q.answer;
  // How far off you can be before you score nothing. Scales with the range
  // so "how many countries (0–40)" is more forgiving than an age guess.
  const spread = Math.max(4, ((q.max ?? 30) - (q.min ?? 0)) / 3);

  const entries = Object.entries(answers).filter(([, a]) => typeof a.v === "number");
  const best = entries.length ? Math.min(...entries.map(([, a]) => Math.abs(a.v - truth))) : Infinity;

  const deltas = {};
  const perPlayer = {};
  for (const [pid, a] of entries) {
    const diff = Math.abs(a.v - truth);
    let pts = Math.round(SCORING.base * Math.max(0, 1 - diff / spread));
    if (diff === 0) pts += SCORING.exactBonus;
    if (diff === best) pts += SCORING.closestBonus;
    pts = Math.round(pts * step.multiplier);
    deltas[pid] = pts;
    perPlayer[pid] = { pts, ok: diff === 0, v: a.v, diff, closest: diff === best };
  }
  return { deltas, result: { answer: truth, unit: q.unit || "years old", players: perPlayer } };
}

export function reveal(step, result, ctx) {
  const mine = result.players?.[ctx.myId];
  const rows = Object.entries(result.players || {})
    .map(([pid, r]) => ({ pid, ...r }))
    .sort((a, b) => a.diff - b.diff);

  return el("div", {},
    mine
      ? el("div.verdict", { class: mine.ok || mine.closest ? "" : "bad" },
          el("div.v-emoji", {}, mine.ok ? "🎯" : mine.closest ? "🥇" : mine.diff <= 2 ? "😬" : "🙃"),
          el("div.v-text", {}, mine.ok ? "Exactly right!" : mine.closest ? "Closest guess!" : `Off by ${mine.diff}`),
          el("div.v-pts", {}, `+${mine.pts}`))
      : el("div.verdict.bad", {}, el("div.v-emoji", {}, "🫥"), el("div.v-text", {}, "No guess 😴")),

    el("div.answer-box", {},
      el("div.a-label", {}, "The real answer"),
      el("div.a-value", {}, `${result.answer} ${result.unit}`)),

    el("div.guess-list", {},
      rows.map((r) => {
        const p = ctx.players?.[r.pid];
        return el("div.guess-row", {},
          el("span", {}, p?.avatar || "🙂"),
          el("span", {}, p?.name || "?"),
          el("span.muted", {}, `guessed ${r.v}`),
          el("span.gr-pts", {}, `+${r.pts}`));
      })));
}
