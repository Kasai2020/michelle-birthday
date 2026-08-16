// The two big "everyone look at the screen" moments: the race track
// between rounds, and the podium at the end.

import { el, ranked, ordinal, confetti } from "./ui.js";
import { STEPS, CELEBRANT } from "../data/content.js";

/** Best possible score if you aced every remaining step — used to size the track. */
const maxPossible = () => STEPS.reduce((sum, s) => sum + 190 * s.multiplier, 0) || 1;

/**
 * Horizontal race. Everyone's runner sits at score / target along the track.
 * `gains` maps playerId → points just earned, so we can pop a "+120" and hop.
 */
export function raceView(players, myId, gains = {}) {
  const rows = ranked(players);
  const target = Math.max(maxPossible() * 0.6, ...rows.map((r) => r.score), 1);
  const lead = rows[0]?.score || 0;

  return el("div", {},
    el("h2.center", {}, "🏁 The Race"),
    el("p.muted.small.center", {}, "First to the finish line wins the whole thing"),
    el("div.race", {},
      rows.map((p) => {
        const pct = Math.min(94, (p.score / target) * 94);
        const gain = gains[p.id] || 0;
        return el("div.lane", {
          class: [p.score === lead && lead > 0 ? "leader" : "", p.id === myId ? "is-me" : ""]
            .filter(Boolean).join(" "),
        },
          el("div.lane-name", {}, p.name),
          el("div.track", {},
            el("div.fill", { style: `width:${pct + 6}%` }),
            el("div.finish-line"),
            gain > 0 && el("div.gain", {}, `+${gain}`),
            el("div.runner", { class: gain > 0 ? "moving" : "", style: `left:${pct}%` }, p.avatar || "🙂")),
          el("div.lane-score", {}, String(p.score)));
      })),
    el("p.muted.small.center", {}, `${STEPS.length} questions total`));
}

/** Fun superlatives computed from the per-step results the host published. */
function awards(players, results) {
  const out = [];
  const rows = ranked(players);
  // Nothing meaningful to say about a solo game or a game with no data.
  if (rows.length < 2 || !Object.keys(results || {}).length) return out;

  const stat = {};
  for (const id of Object.keys(players)) stat[id] = { answered: 0, correct: 0, best: 0, lone: 0 };

  for (const r of Object.values(results || {})) {
    for (const [pid, pr] of Object.entries(r?.players || {})) {
      if (!stat[pid]) continue;
      stat[pid].answered++;
      if (pr.ok) stat[pid].correct++;
      stat[pid].best = Math.max(stat[pid].best, pr.pts || 0);
      if (pr.pts === 0) stat[pid].lone++;
    }
  }

  const pick = (fn, filter = () => true) => {
    const cands = rows.filter((p) => stat[p.id] && filter(stat[p.id]));
    if (!cands.length) return null;
    return cands.reduce((a, b) => (fn(stat[b.id]) > fn(stat[a.id]) ? b : a));
  };

  const sniper = pick((s) => s.best);
  if (sniper) out.push(["🎯", "Best single answer", `${sniper.name} — ${stat[sniper.id].best} points in one go`]);

  const goose = pick((s) => s.lone);
  if (goose && stat[goose.id].lone > 0) out.push(["🤡", "Confidently incorrect", `${goose.name} whiffed ${stat[goose.id].lone} times`]);

  const ghost = rows.find((p) => stat[p.id] && stat[p.id].answered < STEPS.length * 0.6);
  if (ghost) out.push(["👻", "Was your phone off?", `${ghost.name} only answered ${stat[ghost.id].answered}/${STEPS.length}`]);

  const last = rows[rows.length - 1];
  if (last) out.push(["🥄", "Wooden spoon", `${last.name} — but they showed up, which counts`]);

  return out;
}

export function finalView(players, results, myId) {
  const rows = ranked(players);
  const [first, second, third] = rows;
  const me = rows.findIndex((p) => p.id === myId);

  setTimeout(() => confetti(180, 5200), 250);

  const pod = (p, place) => p && el("div.pod", { class: `p${place}` },
    el("div.p-emoji", {}, p.avatar || "🙂"),
    el("div.p-name", {}, p.name),
    el("div.p-block", {}, place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉"));

  return el("div", {},
    el("div.final-hero", {},
      el("div.crown", {}, "👑"),
      el("h1", {}, "Winner"),
      el("div.winner-name", {}, first?.name || "Nobody"),
      el("p.muted", {}, `${first?.score || 0} points — and ${CELEBRANT.prize}`)),

    el("div.podium", {}, pod(second, 2), pod(first, 1), pod(third, 3)),

    me >= 0 && el("p.center", { style: "font-weight:800;font-size:19px" },
      `You finished ${ordinal(me + 1)} of ${rows.length}`),

    el("div.card", {},
      el("h3", {}, "Final standings"),
      el("div.standings", {},
        rows.map((p, i) =>
          el("div.standing", { class: p.id === myId ? "is-me" : "" },
            el("span.st-rank", {}, `${i + 1}`),
            el("span", {}, p.avatar || "🙂"),
            el("span", {}, p.name),
            el("span.st-score", {}, String(p.score)))))),

    (() => {
      const list = awards(players, results);
      return list.length && el("div.card", {},
        el("h3", {}, "Superlatives"),
        list.map(([emoji, title, sub]) =>
          el("div.award", {},
            el("span.aw-emoji", {}, emoji),
            el("span", {},
              el("div.aw-title", {}, title),
              el("div.aw-sub", {}, sub)))));
    })(),

    el("p.center.muted", { style: "margin-top:18px;font-size:20px" },
      `🎂 Happy 25th, ${CELEBRANT.name} 🎂`));
}
