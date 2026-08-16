// "How old is she here?" — a photo, then a number guess.
//
// Scoring is identical to the plain `age` round (closest wins, exact gets a
// bonus), so it's reused rather than duplicated. What's different is the
// presentation: the photo is the question, printed big, and the guess sits
// underneath it.
//
// Answer value = the guessed number.

import { el, clamp } from "../ui.js";
import { score as ageScore } from "./age.js";

export const score = ageScore;

/**
 * The photo in its print frame. Falls back to a visible placeholder so the
 * round still works — and still looks deliberate — before the real pictures
 * are committed, or if a URL ends up broken on party wifi.
 */
function frame(q, caption) {
  const missing = el("div.photo-missing", {},
    el("b", {}, "📷"),
    el("span", {}, q.image ? "Photo didn't load" : "Add a photo in data/content.js"));

  const holder = el("div.photo-frame", {}, missing, el("div.photo-caption", {}, caption));

  if (q.image) {
    const img = el("img", {
      src: q.image,
      alt: "Photo to guess the age from",
      onerror: () => img.replaceWith(missing),
    });
    holder.replaceChildren(img, el("div.photo-caption", {}, caption));
  }
  return holder;
}

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
    onchange: () => ctx.submit(value),   // saved, but not final
  });

  const nudge = (by) => () => {
    value = clamp(value + by, min, max);
    display.textContent = String(value);
    slider.value = value;
    ctx.submit(value);
  };

  return el("div", {},
    frame(q, q.caption || "How old is she here?"),
    q.q && el("div.qtext", {}, q.q),
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

export function reveal(step, result, ctx) {
  const q = step.data;
  const mine = result.players?.[ctx.myId];
  const rows = Object.entries(result.players || {})
    .map(([pid, r]) => ({ pid, ...r }))
    .sort((a, b) => a.diff - b.diff);

  return el("div", {},
    mine
      ? el("div.verdict", { class: mine.ok || mine.closest ? "" : "bad" },
          el("div.v-emoji", {}, mine.ok ? "🎯" : mine.closest ? "🥇" : mine.diff <= 2 ? "😬" : "🙃"),
          el("div.v-text", {}, mine.ok ? "Nailed it" : mine.closest ? "Closest guess" : `Off by ${mine.diff}`),
          el("div.v-pts", {}, `+${mine.pts}`))
      : el("div.verdict.bad", {}, el("div.v-emoji", {}, "🫥"), el("div.v-text", {}, "No guess")),

    frame(q, `She was ${result.answer}`),

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
