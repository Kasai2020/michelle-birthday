// Multiple choice trivia. Answer value = index of the chosen option.

import { el, clamp, qText } from "../ui.js";
import { SCORING } from "../../data/content.js";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function render(step, ctx) {
  const q = step.data;
  return el("div", {},
    q.image && el("img.qimg", { src: q.image, alt: "", loading: "eager" }),
    qText(q.q),
    el("div.options", {},
      q.options.map((text, i) =>
        el("button.opt", {
          type: "button",
          "aria-pressed": String(ctx.myAnswer === i),
          disabled: ctx.locked,
          // Tapping an option is final, the same way it is in a pub quiz —
          // that's what lets the round end as soon as everyone has picked.
          onclick: () => ctx.submit(i, true),
        },
          el("span.badge", {}, LETTERS[i]),
          el("span", {}, text))
      )),
    !ctx.locked && el("p.muted.small.center", { style: "margin-top:14px" },
      "Tap an answer to lock it in."));
}

export function score(step, answers, { state }) {
  const q = step.data;
  const span = Math.max(1, (state.endsAt || 0) - (state.startedAt || 0));
  const deltas = {};
  const perPlayer = {};
  const tally = q.options.map(() => 0);

  for (const [pid, a] of Object.entries(answers)) {
    const pick = a.v;
    if (typeof pick === "number" && tally[pick] !== undefined) tally[pick]++;
    const ok = pick === q.answer;
    let pts = 0;
    if (ok) {
      // Answer fast, score more — but a slow correct answer still pays well.
      const speed = clamp(((state.endsAt || 0) - (a.t || 0)) / span, 0, 1);
      pts = Math.round((SCORING.base + SCORING.speedBonus * speed) * step.multiplier);
    }
    deltas[pid] = pts;
    perPlayer[pid] = { pts, ok, v: pick };
  }
  return { deltas, result: { answer: q.answer, tally, players: perPlayer } };
}

export function reveal(step, result, ctx) {
  const q = step.data;
  const mine = result.players?.[ctx.myId];
  const total = Object.values(result.tally || {}).reduce((a, b) => a + b, 0) || 1;

  return el("div", {},
    verdict(mine, "You didn't answer in time 😴"),
    qText(q.q),
    el("div.options", {},
      q.options.map((text, i) => {
        const picked = mine && mine.v === i;
        const cls = i === q.answer ? "correct" : (picked ? "wrong" : "");
        const count = result.tally?.[i] || 0;
        return el("button.opt", { type: "button", disabled: true, class: cls },
          el("span.badge", {}, i === q.answer ? "✓" : LETTERS[i]),
          el("span", {}, text),
          el("span.tally", {}, count ? `${count} · ${Math.round((count / total) * 100)}%` : "—"));
      })));
}

/** Shared "you got it / you didn't" banner used by several round types. */
export function verdict(mine, noAnswerText = "No answer 😴") {
  if (!mine) return el("div.verdict.bad", {}, el("div.v-emoji", {}, "🫥"), el("div.v-text", {}, noAnswerText));
  return mine.ok
    ? el("div.verdict", {},
        el("div.v-emoji", {}, "🎉"),
        el("div.v-text", {}, "Correct!"),
        el("div.v-pts", {}, `+${mine.pts}`))
    : el("div.verdict.bad", {},
        el("div.v-emoji", {}, "💀"),
        el("div.v-text", {}, "Nope"),
        el("div.v-pts", {}, "+0"));
}
