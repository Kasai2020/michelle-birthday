// The arcade round: a real minigame instead of a question.
//
// It reuses the ordinary round contract — the answer value is just your best
// score as a number — so nothing in the engine had to change. What differs is
// what happens on screen: a 3-second countdown, a playable game, then retries
// until you're happy or the clock runs out.
//
// Retries matter. One-shot runs punish the person who dies in two seconds,
// which at a party is the person who most needs the round to be fun. Your
// BEST run counts, and you can lock in early once you're satisfied.

import { el } from "../ui.js";
import { SCORING } from "../../data/content.js";
import { loadFace, countdown } from "../minigames/engine.js";
import * as flappy from "../minigames/flappy.js";
import * as memory from "../minigames/memory.js";
import * as surfers from "../minigames/surfers.js";

const GAMES = { flappy, memory, surfers };
const gameFor = (id) => GAMES[id] || flappy;

export function render(step, ctx) {
  const game = gameFor(step.data.game);
  const root = el("div.arcade");

  if (ctx.locked) {
    return el("div.arcade", {},
      el("div.mg-done", {},
        el("div.mg-done-emoji", {}, "🕹️"),
        el("p.label", {}, "Locked in"),
        el("div.mg-best", {}, game.label(ctx.myAnswer ?? 0)),
        el("p.muted.small", {}, "Waiting for everyone else…")));
  }

  let best = typeof ctx.myAnswer === "number" ? ctx.myAnswer : 0;
  let attempts = 0;
  let teardown = null;

  const arena = el("div.arcade-arena");
  const footer = el("div.arcade-footer");
  root.append(
    el("div.arcade-head", {},
      el("p.label", {}, step.data.title || "Minigame"),
      el("p.muted.small", {}, game.instructions)),
    arena, footer);

  const clear = () => { teardown?.(); teardown = null; arena.replaceChildren(); };

  /**
   * An escape hatch that is ALWAYS on screen — mid-run included. Without it
   * a player who doesn't want to finish (or whose run somehow doesn't end)
   * is stuck staring at the game until the round timer runs out.
   */
  const bailOut = () =>
    el("button.btn.btn-tiny.btn-ghost", {
      type: "button",
      "data-arcade-lock": "1",
      onclick: () => { clear(); ctx.submit(best, true); },
    }, best > 0 ? `Lock in ${game.label(best)}` : "Sit this one out");

  const startRun = async () => {
    clear();
    footer.replaceChildren(
      el("p.muted.small.center", {}, `Best so far: ${game.label(best)}`),
      bailOut());
    const face = await loadFace();
    if (!arena.isConnected) return;

    const stopCount = countdown(arena, () => {
      arena.replaceChildren();
      teardown = game.mount(arena, {
        face,
        onEnd: (score) => {
          attempts += 1;
          best = Math.max(best, score);
          // Saved on every run, so a timeout still banks your best.
          ctx.submit(best);
          showResult(score);
        },
      });
    });
    teardown = () => stopCount();
  };

  const showResult = (score) => {
    const beatIt = score >= best && score > 0;
    footer.replaceChildren(
      el("div.mg-result", { class: beatIt ? "best" : "" },
        el("div.mg-result-score", {}, game.label(score)),
        el("p.muted.small", {}, beatIt && attempts > 1 ? "New personal best!" : `Best: ${game.label(best)}`)),
      el("div.arcade-actions", {},
        el("button.btn.btn-ghost", { type: "button", onclick: startRun }, "Play again"),
        el("button.btn.btn-primary", {
          type: "button",
          "data-arcade-lock": "1",
          onclick: () => { clear(); ctx.submit(best, true); },
        }, `Lock in ${game.label(best)}`)));
  };

  footer.replaceChildren(bailOut());
  startRun();
  return root;
}

export function score(step, answers) {
  const runs = Object.entries(answers)
    .map(([pid, a]) => ({ pid, v: typeof a.v === "number" ? a.v : 0 }))
    .sort((a, b) => b.v - a.v);

  const pts = SCORING.arcade;
  const deltas = {};
  const perPlayer = {};

  for (const r of runs) {
    // Rank by score, so ties genuinely tie rather than splitting on who
    // happened to submit first.
    const place = runs.filter((o) => o.v > r.v).length;
    let p = r.v <= 0 ? 0 : (place === 0 ? pts.first : place === 1 ? pts.second : place === 2 ? pts.third : pts.played);
    p = Math.round(p * step.multiplier);
    deltas[r.pid] = p;
    perPlayer[r.pid] = { pts: p, ok: place === 0 && r.v > 0, v: r.v, place };
  }
  return { deltas, result: { game: step.data.game, players: perPlayer } };
}

export function reveal(step, result, ctx) {
  const game = gameFor(step.data.game);
  const mine = result.players?.[ctx.myId];
  const rows = Object.entries(result.players || {})
    .map(([pid, r]) => ({ pid, ...r }))
    .sort((a, b) => b.v - a.v);

  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ");

  return el("div", {},
    mine
      ? el("div.verdict", { class: mine.pts ? "" : "bad" },
          el("div.v-emoji", {}, mine.place === 0 ? "🏆" : mine.pts ? "🕹️" : "💀"),
          el("div.v-text", {}, mine.place === 0 ? "High score!" : game.label(mine.v)),
          el("div.v-pts", {}, `+${mine.pts}`))
      : el("div.verdict.bad", {}, el("div.v-emoji", {}, "🫥"), el("div.v-text", {}, "Didn't play")),

    el("h3", {}, step.data.title || "Scores"),
    el("div.guess-list", {},
      rows.map((r, i) => {
        const p = ctx.players?.[r.pid];
        return el("div.guess-row", {},
          el("span", {}, medal(i)),
          el("span", {}, p?.avatar || "🙂"),
          el("span", {}, p?.name || "?"),
          el("span.muted", {}, game.label(r.v)),
          el("span.gr-pts", {}, `+${r.pts}`));
      })));
}
