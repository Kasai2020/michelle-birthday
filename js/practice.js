// ─────────────────────────────────────────────────────────────────────
//  🎮 PRACTICE MODE — type a secret code on the join screen to play the
//  minigames solo, with no room, no host and no Firebase writes.
//
//  Built for tuning: play Flappy twenty times in a row, see whether the pipe
//  gap feels right, adjust the constants, reload. Your best score per game is
//  kept in localStorage so you can tell whether a tweak actually helped.
//
//  The codes are deliberately unreachable by the room-code generator, which
//  draws from an alphabet with I and O removed (they read as 1 and 0). So a
//  real room can never be called MINI or SOLO, and this can never shadow
//  someone's actual game.
// ─────────────────────────────────────────────────────────────────────

import { el, $, mount, showScreen } from "./ui.js";
import { render as arcadeRender } from "./rounds/arcade.js";

const CODES = new Set(["MINI", "SOLO"]);

export const isPracticeCode = (code) => CODES.has(String(code || "").trim().toUpperCase());

const GAMES = [
  { id: "flappy",  emoji: "🐤", name: "Flappy Michelle",  hint: "Tap to flap. Mind the pipes." },
  { id: "memory",  emoji: "🧠", name: "Michellorization", hint: "Memorise the grid, tap them back." },
  { id: "surfers", emoji: "🏃", name: "Michelle Surfers", hint: "Three lanes. Dodge everything." },
];

const BESTS = "mb:practice";
const readBests = () => { try { return JSON.parse(localStorage.getItem(BESTS)) || {}; } catch { return {}; } };
const writeBest = (id, v) => {
  const all = readBests();
  if (!(all[id] >= v)) { all[id] = v; try { localStorage.setItem(BESTS, JSON.stringify(all)); } catch { /* ignore */ } }
};

/** Stand-in for the multiplayer context the arcade round normally gets. */
const soloCtx = (onDone, best) => ({
  myId: "solo",
  players: { solo: { name: "You", avatar: "🎮" } },
  myAnswer: best,
  locked: false,
  submit: (value, done) => { if (done) onDone(value); },
});

export function openPractice(onExit) {
  showScreen("screen-practice");
  menu();

  function menu() {
    const bests = readBests();
    mount($("#practice-stage"),
      el("div.card", {},
        el("p.label", {}, "Practice mode"),
        el("h2", {}, "Minigames"),
        el("p.muted.small", {},
          "Solo, unscored, unlimited. Nothing here touches the live game."),
        el("div.practice-list", {},
          GAMES.map((g) =>
            el("button.practice-item", { type: "button", onclick: () => play(g) },
              el("span.pi-emoji", {}, g.emoji),
              el("span.pi-text", {},
                el("span.pi-name", {}, g.name),
                el("span.pi-hint", {}, g.hint)),
              el("span.pi-best", {}, bests[g.id] !== undefined ? `BEST ${bests[g.id]}` : "—"))))),
      el("button.btn.btn-ghost", { type: "button", onclick: () => { onExit?.(); showScreen("screen-home"); } },
        "← Back"),
      Object.keys(bests).length
        ? el("button.btn.btn-tiny.btn-ghost", {
            type: "button",
            onclick: () => { try { localStorage.removeItem(BESTS); } catch { /* ignore */ } menu(); },
          }, "Reset best scores")
        : null);
  }

  function play(game) {
    const best = readBests()[game.id];
    // A long timer so nothing interrupts a practice run; the arcade round
    // reads duration only for display, the host clock isn't involved here.
    const step = {
      type: "arcade", multiplier: 1, duration: 999,
      roundIndex: 0, qNumber: 1, qTotal: 1,
      data: { game: game.id, title: game.name },
    };

    mount($("#practice-stage"),
      el("div.practice-head", {},
        el("button.btn.btn-tiny.btn-ghost", { type: "button", onclick: menu }, "← All minigames")),
      arcadeRender(step, soloCtx((score) => {
        writeBest(game.id, score);
        menu();
      }, best)));
  }
}
