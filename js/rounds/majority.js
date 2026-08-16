// "Hive Mind" — there is no correct answer. You score by matching whatever
// the majority of the room picked. Answer value = option index.

import { el } from "../ui.js";
import { SCORING } from "../../data/content.js";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function render(step, ctx) {
  const q = step.data;
  return el("div", {},
    el("div.qtext", {}, q.q),
    el("p.muted.small", {}, "🐝 No right answer — score by matching the crowd."),
    el("div.options", {},
      q.options.map((text, i) =>
        el("button.opt", {
          type: "button",
          "aria-pressed": String(ctx.myAnswer === i),
          disabled: ctx.locked,
          onclick: () => ctx.submit(i),
        },
          el("span.badge", {}, LETTERS[i]),
          el("span", {}, text)))));
}

export function score(step, answers) {
  const q = step.data;
  const tally = q.options.map(() => 0);
  for (const a of Object.values(answers)) {
    if (typeof a.v === "number" && tally[a.v] !== undefined) tally[a.v]++;
  }
  const top = Math.max(0, ...tally);
  // Ties all count as "the majority" — nobody gets punished for a split room.
  const winners = tally.map((c, i) => (c === top && c > 0 ? i : -1)).filter((i) => i >= 0);

  const deltas = {};
  const perPlayer = {};
  for (const [pid, a] of Object.entries(answers)) {
    const ok = winners.includes(a.v);
    const pts = ok ? Math.round(SCORING.base * step.multiplier) : 0;
    deltas[pid] = pts;
    perPlayer[pid] = { pts, ok, v: a.v };
  }
  return { deltas, result: { tally, winners, players: perPlayer } };
}

export function reveal(step, result, ctx) {
  const q = step.data;
  const mine = result.players?.[ctx.myId];
  const total = result.tally.reduce((a, b) => a + b, 0) || 1;

  return el("div", {},
    mine
      ? el("div.verdict", { class: mine.ok ? "" : "bad" },
          el("div.v-emoji", {}, mine.ok ? "🐝" : "🦄"),
          el("div.v-text", {}, mine.ok ? "You're with the hive!" : "Lone wolf"),
          el("div.v-pts", {}, `+${mine.pts}`))
      : el("div.verdict.bad", {}, el("div.v-emoji", {}, "🫥"), el("div.v-text", {}, "No answer 😴")),
    el("div.qtext", {}, q.q),
    el("div.options", {},
      q.options.map((text, i) => {
        const count = result.tally[i] || 0;
        const isTop = result.winners.includes(i);
        return el("button.opt", {
          type: "button", disabled: true,
          class: isTop ? "correct" : (mine && mine.v === i ? "wrong" : ""),
        },
          el("span.badge", {}, isTop ? "👑" : LETTERS[i]),
          el("span", {}, text),
          el("span.tally", {}, `${count} · ${Math.round((count / total) * 100)}%`));
      })));
}
