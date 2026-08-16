// ─────────────────────────────────────────────────────────────────────
//  Michelle's 25th — game controller
//
//  The host device is the referee: it owns every phase transition, scores
//  each question, and writes the results. Players only ever write their
//  own answer. That keeps the whole thing on Firebase's free tier with no
//  server code at all.
// ─────────────────────────────────────────────────────────────────────

import { isConfigured } from "./config.js";
import {
  authReady, now, createRoom, joinRoom, roomExists, trackPresence, leaveRoom,
  watchHostId, watchPlayers, watchState, watchResults, watchAnswers, watchLocked,
  setState, submitAnswer, setLocked, getAnswers, publishResult, applyScores, resetRoom,
} from "./db.js";
import { el, $, mount, showScreen, toast, waiting, playerChip, clamp, confetti } from "./ui.js";
import { roundModule } from "./rounds/index.js";
import { raceView, finalView } from "./views.js";
import { STEPS, ACTIVE_ROUNDS, CELEBRANT } from "../data/content.js";

const AVATARS = ["🦊", "🐼", "🐸", "🦄", "🐙", "🦖", "🐝", "🦩", "🐳", "🦉", "🐨", "🍕"];

const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

// ── Local session ────────────────────────────────────────────────────

const me = {
  id: null,
  ...{ name: "", avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] },
  ...store.get("mb:profile", {}),
};

let room = { code: null, hostId: null, players: {}, state: null, results: {} };
let isHost = false;

let myAnswer = null;        // my answer for the current step
let myLocked = false;       // have I finished this step?
let stageKey = "";          // rebuild the stage only when this changes
let unsubs = [];            // active firebase listeners
let stepUnsubs = [];        // listeners scoped to the current step
let watchedStep = null;     // which step stepUnsubs are pointed at
let tickHandle = null;      // countdown interval
let advancing = false;      // guards against double phase transitions

const stepAt = (i) => STEPS[i] || null;
const currentStep = () => stepAt(room.state?.step ?? -1);

// ── Boot ─────────────────────────────────────────────────────────────

(async function boot() {
  if (!isConfigured()) { showScreen("screen-setup"); return; }

  try {
    me.id = await authReady();
  } catch (e) {
    showScreen("screen-setup");
    $("#screen-setup").querySelector(".card").append(el("p.err", {}, e.message));
    return;
  }

  buildHome();
  wireButtons();

  // Rejoin automatically after a refresh or a dropped connection.
  const saved = store.get("mb:session", null);
  if (saved?.code && (await roomExists(saved.code).catch(() => false))) {
    try {
      await joinRoom(saved.code, me);
      await enterRoom(saved.code);
      return;
    } catch { store.del("mb:session"); }
  }
  showScreen("screen-home");
})();

// ── Home screen ──────────────────────────────────────────────────────

function buildHome() {
  $("#input-name").value = me.name || "";
  $("#input-name").addEventListener("input", (e) => {
    me.name = e.target.value.trim().slice(0, 14);
    store.set("mb:profile", { name: me.name, avatar: me.avatar });
  });

  const picker = $("#avatar-picker");
  mount(picker, AVATARS.map((a) =>
    el("button.avatar-opt", {
      type: "button",
      "aria-pressed": String(a === me.avatar),
      onclick: () => {
        me.avatar = a;
        store.set("mb:profile", { name: me.name, avatar: me.avatar });
        for (const b of picker.children) b.setAttribute("aria-pressed", String(b.textContent === a));
      },
    }, a)));
}

function requireName(errSel) {
  const name = ($("#input-name").value || "").trim();
  const err = $(errSel);
  if (name.length < 1) {
    err.textContent = "Put your name in first!";
    err.hidden = false;
    showScreen("screen-home");
    $("#input-name").focus();
    return null;
  }
  err.hidden = true;
  me.name = name.slice(0, 14);
  store.set("mb:profile", { name: me.name, avatar: me.avatar });
  return me.name;
}

function wireButtons() {
  $("#btn-host").onclick = async () => {
    if (!requireName("#home-err")) return;
    $("#btn-host").disabled = true;
    try {
      const code = await createRoom(me);
      await enterRoom(code);
    } catch (e) {
      $("#home-err").textContent = e.message;
      $("#home-err").hidden = false;
    } finally { $("#btn-host").disabled = false; }
  };

  $("#btn-join-open").onclick = () => {
    if (!requireName("#home-err")) return;
    showScreen("screen-join");
    $("#input-code").focus();
  };

  $("#btn-join-back").onclick = () => showScreen("screen-home");

  const codeInput = $("#input-code");
  codeInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    if (e.target.value.length === 4) $("#btn-join").click();
  });

  $("#btn-join").onclick = async () => {
    const code = codeInput.value.trim().toUpperCase();
    const err = $("#join-err");
    if (code.length !== 4) { err.textContent = "Codes are 4 letters."; err.hidden = false; return; }
    $("#btn-join").disabled = true;
    try {
      await joinRoom(code, me);
      await enterRoom(code);
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
    } finally { $("#btn-join").disabled = false; }
  };

  $("#btn-start").onclick = () => hostStart();
  $("#btn-next").onclick  = () => hostNext();
  $("#btn-leave").onclick = () => quitRoom();
  $("#btn-play-again").onclick = () => resetRoom(room.code);
}

// ── Room subscription ────────────────────────────────────────────────

async function enterRoom(code) {
  room = { code, hostId: null, players: {}, state: null, results: {}, answers: {}, locked: {} };
  store.set("mb:session", { code });
  await trackPresence(code, me.id).catch(() => {});

  unsubs.forEach((u) => u());
  unsubs = [
    watchHostId(code, (hostId) => {
      room.hostId = hostId;
      isHost = hostId === me.id;
      ensureStepWatches(true);
      render();
    }),
    watchPlayers(code, (players) => { room.players = players; render(); }),
    watchResults(code, (results) => { room.results = results; render(); }),
    watchState(code, (state) => { onStateChange(state); }),
  ];

  clearInterval(tickHandle);
  tickHandle = setInterval(tick, 200);
}

async function quitRoom() {
  clearInterval(tickHandle);
  unsubs.forEach((u) => u());
  unsubs = [];
  stepUnsubs.forEach((u) => u());
  stepUnsubs = [];
  watchedStep = null;
  await leaveRoom(room.code, me.id);
  store.del("mb:session");
  room = { code: null, hostId: null, players: {}, state: null, results: {}, answers: {}, locked: {} };
  showScreen("screen-home");
}

function onStateChange(state) {
  const prev = room.state;
  room.state = state;

  if (!prev || prev.step !== state?.step) {
    myAnswer = null;         // new question, clean slate
    myLocked = false;
    room.answers = {};
    room.locked = {};
  }
  ensureStepWatches();
  advancing = false;
  render();
}

/**
 * Re-points the per-step listeners whenever the step (or who's host) changes.
 *
 * Everyone watches `locked` — it drives the "who's ready" bar. Only the host
 * watches `answers`, because the rules hide that node from players, so a
 * player subscribing to it would just get a permission error.
 */
function ensureStepWatches(force = false) {
  const st = room.state;
  const want = st && st.step >= 0 ? st.step : null;
  if (want === watchedStep && !force) return;

  stepUnsubs.forEach((u) => u());
  stepUnsubs = [];
  watchedStep = want;
  if (want === null) return;

  stepUnsubs.push(watchLocked(room.code, want, (locked) => {
    room.locked = locked;
    renderLockBar();
    maybeAutoReveal();
  }));

  if (isHost) {
    stepUnsubs.push(watchAnswers(room.code, want, (answers) => { room.answers = answers; }));
  }
}

// ── Host: phase machine ──────────────────────────────────────────────

const write = (patch) => setState(room.code, { ...room.state, ...patch });

function hostStart() {
  if (!STEPS.length) { toast("No questions in data/content.js!"); return; }
  goToStep(0);
}

/** Enter a step — via its round intro if it's the first question of a round. */
function goToStep(i) {
  const step = stepAt(i);
  if (!step) { write({ phase: "final", step: STEPS.length, sub: "" }); return; }
  if (step.isRoundStart) write({ phase: "intro", step: i, sub: "", startedAt: now(), endsAt: now() + 5000 });
  else askQuestion(i);
}

function askQuestion(i) {
  const step = stepAt(i);
  write({ phase: "question", step: i, sub: "", startedAt: now(), endsAt: now() + step.duration * 1000 });
}

/**
 * Host advances when the clock runs out, or when every player has explicitly
 * locked in.
 *
 * Counts *all* players, not just the ones currently flagged online. A phone
 * that sleeps or backgrounds its tab fires onDisconnect and goes offline for
 * a few seconds, and letting that shrink the denominator used to end rounds
 * the moment one person answered. The timer is the backstop for someone who
 * has genuinely wandered off, and the host can always hit "Skip ahead".
 */
function maybeAutoReveal() {
  if (!isHost || advancing) return;
  const st = room.state;
  if (st?.phase !== "question") return;

  const { ready, total } = lockCount();
  if (now() >= (st.endsAt || 0) || (total > 0 && ready >= total)) doReveal();
}

const lockCount = () => ({
  ready: Object.values(room.locked || {}).filter(Boolean).length,
  total: Object.keys(room.players || {}).length,
});

async function doReveal() {
  if (advancing) return;
  advancing = true;
  const st = room.state;
  const step = stepAt(st.step);
  try {
    const answers = await getAnswers(room.code, st.step);
    const { deltas, result } = roundModule(step.type).score(step, answers, { state: st, players: room.players });
    await publishResult(room.code, st.step, result);
    await applyScores(room.code, deltas);
    await write({ phase: "reveal", step: st.step, sub: "" });
  } catch (e) {
    toast("Scoring hiccup — tap Next");
    console.error(e);
  } finally { advancing = false; }
}

/** The host's "Next ▸" button — meaning depends on the current phase. */
function hostNext() {
  const st = room.state;
  if (!st) return;
  const i = st.step;

  if (st.phase === "intro")    { askQuestion(i); return; }
  if (st.phase === "question") { doReveal(); return; }

  if (st.phase === "reveal") {
    const next = stepAt(i + 1);
    // Show the race between rounds, not after every single question.
    if (!next || next.roundIndex !== stepAt(i).roundIndex) {
      write({ phase: "race", step: i, sub: String(stepAt(i).roundIndex) });
    } else {
      askQuestion(i + 1);
    }
    return;
  }

  if (st.phase === "race") { goToStep(i + 1); return; }
}

// ── Countdown ────────────────────────────────────────────────────────

function tick() {
  const st = room.state;
  if (!st) return;

  if (st.phase === "question") {
    const total = Math.max(1, (st.endsAt || 0) - (st.startedAt || 0));
    const left = Math.max(0, (st.endsAt || 0) - now());
    const secs = Math.ceil(left / 1000);
    $("#timer-num").textContent = String(secs);
    $("#timer").classList.toggle("urgent", secs <= 5);
    $("#timer-fill").style.width = `${clamp((left / total) * 100, 0, 100)}%`;

    // Lock inputs the instant the clock hits zero, even before the host writes.
    if (left <= 0) renderStage();
    if (isHost) maybeAutoReveal();
  } else if (st.phase === "intro" && isHost && now() >= (st.endsAt || 0)) {
    if (!advancing) { advancing = true; askQuestion(st.step); }
  }
}

// ── Render ───────────────────────────────────────────────────────────

function render() {
  if (!room.code) return;
  const st = room.state;

  for (const n of document.querySelectorAll(".host-only")) n.hidden = !isHost;
  for (const n of document.querySelectorAll(".guest-only")) n.hidden = isHost;

  if (!st || st.phase === "lobby") { renderLobby(); return; }
  if (st.phase === "final") {
    showScreen("screen-final");
    if (stageKey !== "final") { stageKey = "final"; renderFinal(); }
    return;
  }

  showScreen("screen-game");
  const step = currentStep();
  $("#round-pill").textContent = step ? `${step.roundEmoji} ${step.roundName} · ${step.qNumber}/${step.qTotal}` : "";
  $("#score-pill").textContent = String(room.players?.[me.id]?.score ?? 0);
  $("#timer").hidden = st.phase !== "question";
  $("#timer-fill").parentElement.hidden = st.phase !== "question";
  $("#btn-next").textContent = st.phase === "question" ? "Skip ahead ▸" : "Next ▸";

  renderLockBar();
  renderStage();
}

/** "3 of 5 locked in" — so nobody has to guess who the room is waiting on. */
function renderLockBar() {
  const bar = $("#lockbar");
  const st = room.state;
  if (!st || st.phase !== "question") { bar.hidden = true; return; }

  const { ready, total } = lockCount();
  bar.hidden = false;
  mount(bar,
    el("span.lb-count", {}, `${ready} of ${total} locked in`),
    el("span.lb-dots", {},
      Object.entries(room.players || {}).map(([pid, p]) =>
        el("span.lb-dot", {
          class: room.locked?.[pid] ? "ready" : "",
          title: p.name,
        }, p.avatar || "🙂"))));
}

function renderLobby() {
  showScreen("screen-lobby");
  stageKey = "";  // so a rematch rebuilds the stage from scratch
  $("#lobby-code").textContent = room.code;
  const list = Object.entries(room.players || {});
  $("#lobby-count").textContent = String(list.length);
  mount($("#lobby-players"), list.map(([pid, p]) =>
    playerChip(p, pid, { isMe: pid === me.id, isHost: pid === room.hostId })));
  $("#btn-start").textContent = `Start the game 🎉 (${list.length})`;
}

function renderStage() {
  const st = room.state;
  const step = currentStep();
  const stage = $("#stage");
  const locked = st.phase !== "question" || myLocked || now() >= (st.endsAt || 0);
  const key = `${st.phase}:${st.step}:${locked}`;
  if (key === stageKey) return;
  stageKey = key;

  const mod = roundModule(step?.type);
  const ctx = {
    myId: me.id,
    players: room.players,
    myAnswer,
    locked,
    /**
     * @param value  the answer so far — always saved, so a timeout still
     *               scores whatever you'd got to
     * @param done   true when the player is finished with this question
     */
    submit: (value, done = false) => {
      if (locked || now() >= (st.endsAt || 0)) return;
      myAnswer = value;
      submitAnswer(room.code, st.step, me.id, value)
        .catch(() => toast("Couldn't send that — check signal"));
      if (done) {
        myLocked = true;
        setLocked(room.code, st.step, me.id, true).catch(() => {});
        renderStage();   // repaint in the locked state
        renderLockBar();
      }
    },
  };

  if (st.phase === "intro") {
    const round = ACTIVE_ROUNDS[step.roundIndex];
    mount(stage, el("div.intro", {},
      el("div.intro-emoji", {}, step.roundEmoji),
      el("p.label", {}, `Round ${step.roundIndex + 1} of ${ACTIVE_ROUNDS.length}`),
      el("h2", {}, step.roundName),
      el("p.blurb", {}, step.roundBlurb),
      step.multiplier > 1 && el("div.mult", {}, `${step.multiplier}× POINTS`),
      el("p.muted.small", { style: "margin-top:18px" }, `${round.questions.length} questions · ${step.duration}s each`)));
    return;
  }

  if (st.phase === "question") {
    if (now() >= (st.endsAt || 0)) mount(stage, waiting("Time's up!", "Scoring everyone's answers…"));
    else mount(stage, mod.render(step, ctx));
    return;
  }

  if (st.phase === "reveal") {
    const result = room.results?.[st.step];
    mount(stage, result
      ? mod.reveal(step, result, ctx)
      : waiting("Scoring…", "The host's phone is doing maths"));
    if (result?.players?.[me.id]?.pts > 0) confetti(60, 1600);
    return;
  }

  if (st.phase === "race") {
    const roundIdx = Number(st.sub);
    const gains = {};
    for (let i = 0; i < STEPS.length; i++) {
      if (STEPS[i].roundIndex !== roundIdx) continue;
      for (const [pid, r] of Object.entries(room.results?.[i]?.players || {})) {
        gains[pid] = (gains[pid] || 0) + (r.pts || 0);
      }
    }
    mount(stage, raceView(room.players, me.id, gains));
  }
}

function renderFinal() {
  mount($("#final-stage"), finalView(room.players, room.results, me.id));
}

// Keep presence honest when a phone sleeps and wakes.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && room.code) trackPresence(room.code, me.id).catch(() => {});
});

document.title = `${CELEBRANT.name}'s ${CELEBRANT.age}th — Birthday Games`;
