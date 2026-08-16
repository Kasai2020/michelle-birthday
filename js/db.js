// Firebase bootstrap + every read/write the game performs.
// Keeping all RTDB paths in one file makes the security rules easy to reason about.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, remove, onValue, onDisconnect,
  serverTimestamp, runTransaction,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { firebaseConfig } from "./config.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

/** Signs in anonymously. Resolves with the uid. */
export function authReady() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => { if (user) resolve(user.uid); });
    signInAnonymously(auth).catch((e) => {
      reject(new Error(
        e?.code === "auth/configuration-not-found" || e?.code === "auth/operation-not-allowed"
          ? "Anonymous sign-in isn't enabled. Firebase console → Authentication → Sign-in method → enable Anonymous."
          : (e?.message || "Could not sign in to Firebase.")
      ));
    });
  });
}

// ── Clock sync ───────────────────────────────────────────────────────
// Every device computes the countdown from the *server* clock so phones
// with drifting clocks stay in step.

let clockSkew = 0;
onValue(ref(db, ".info/serverTimeOffset"), (s) => { clockSkew = s.val() || 0; });

/** Server-aligned "now", in ms. */
export const now = () => Date.now() + clockSkew;

// ── Paths ────────────────────────────────────────────────────────────

const roomRef    = (code)      => ref(db, `rooms/${code}`);
const playersRef = (code)      => ref(db, `rooms/${code}/players`);
const playerRef  = (code, pid) => ref(db, `rooms/${code}/players/${pid}`);
const stateRef   = (code)      => ref(db, `rooms/${code}/state`);
const answersRef = (code, i)   => ref(db, `rooms/${code}/answers/${i}`);
const answerRef  = (code, i, pid) => ref(db, `rooms/${code}/answers/${i}/${pid}`);
const resultRef  = (code, i)   => ref(db, `rooms/${code}/results/${i}`);

// ── Room lifecycle ───────────────────────────────────────────────────

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O — they read as 1/0

const randomCode = () =>
  Array.from({ length: 4 }, () =>
    CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");

const LOBBY_STATE = { phase: "lobby", step: -1, sub: "", startedAt: 0, endsAt: 0 };

/**
 * Claims an unused 4-letter room code, then fills the room in.
 *
 * The claim is a transaction on `hostId` alone — not on the whole room —
 * because the security rules keep `rooms/$code` itself unreadable so that
 * players can't peek at the answer pile. Winning the hostId race is what
 * grants permission to write everything else underneath.
 */
export async function createRoom(host) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = randomCode();
    const claim = await runTransaction(
      ref(db, `rooms/${code}/hostId`),
      (existing) => (existing ? undefined : host.id)   // undefined = abort, code taken
    );
    if (!claim.committed) continue;

    await set(stateRef(code), LOBBY_STATE);
    await set(playerRef(code, host.id), {
      name: host.name, avatar: host.avatar, score: 0, online: true, joinedAt: Date.now(),
    });
    await set(ref(db, `rooms/${code}/createdAt`), serverTimestamp());
    return code;
  }
  throw new Error("Could not find a free room code — try again.");
}

export async function roomExists(code) {
  const snap = await get(ref(db, `rooms/${code}/hostId`));
  return snap.exists();
}

export async function joinRoom(code, player) {
  if (!(await roomExists(code))) throw new Error("No room with that code.");
  // Preserve score on rejoin so a refresh mid-game doesn't wipe someone out.
  await runTransaction(playerRef(code, player.id), (prev) => ({
    name: player.name,
    avatar: player.avatar,
    score: prev?.score || 0,
    online: true,
    joinedAt: prev?.joinedAt || Date.now(),
  }));
}

/** Marks this player offline if the tab closes / loses signal. */
export async function trackPresence(code, pid) {
  const r = ref(db, `rooms/${code}/players/${pid}/online`);
  await onDisconnect(r).set(false);
  await set(r, true);
}

export async function leaveRoom(code, pid) {
  await remove(playerRef(code, pid)).catch(() => {});
}

// Subscriptions are deliberately split per-node rather than watching the whole
// room: the security rules hide `answers` from non-hosts, and RTDB read rules
// don't filter children — a room-wide listener would be denied for players.

export const watchHostId  = (code, cb) => onValue(ref(db, `rooms/${code}/hostId`), (s) => cb(s.val()));
export const watchPlayers = (code, cb) => onValue(playersRef(code), (s) => cb(s.val() || {}));
export const watchState   = (code, cb) => onValue(stateRef(code),   (s) => cb(s.val()));
export const watchResults = (code, cb) => onValue(ref(db, `rooms/${code}/results`), (s) => cb(s.val() || {}));
export const watchAnswers = (code, step, cb) => onValue(answersRef(code, step), (s) => cb(s.val() || {}));

// ── Gameplay writes ──────────────────────────────────────────────────

/** Host only: move the whole room to a new phase. */
export const setState = (code, state) => set(stateRef(code), state);

/** Player: submit (or overwrite) an answer for a step. */
export const submitAnswer = (code, step, pid, value) =>
  set(answerRef(code, step, pid), { v: value, t: now() });

/**
 * Player: flag that they're finished with this step.
 *
 * Kept in a separate node from the answer itself because everyone can read
 * this one — it drives the "3 of 5 locked in" indicator and tells the host
 * when it's safe to advance. The answers stay host-only so nobody can peek.
 * A half-finished answer (three of five events ordered) is saved but not
 * locked, so it can't end the round early.
 */
export const setLocked = (code, step, pid, done) =>
  set(ref(db, `rooms/${code}/locked/${step}/${pid}`), done ? true : null);

export const watchLocked = (code, step, cb) =>
  onValue(ref(db, `rooms/${code}/locked/${step}`), (s) => cb(s.val() || {}));

export const getAnswers = async (code, step) =>
  (await get(answersRef(code, step))).val() || {};

/** Host only: publish per-player scoring for a step. */
export const publishResult = (code, step, payload) => set(resultRef(code, step), payload);

export const watchResult = (code, step, cb) =>
  onValue(resultRef(code, step), (s) => cb(s.val()));

/** Host only: apply a batch of score deltas. */
export async function applyScores(code, deltas) {
  const snap = await get(playersRef(code));
  const players = snap.val() || {};
  const patch = {};
  for (const [pid, delta] of Object.entries(deltas)) {
    if (!players[pid]) continue;
    patch[`${pid}/score`] = (players[pid].score || 0) + delta;
  }
  if (Object.keys(patch).length) await update(playersRef(code), patch);
}

/** Host only: wipe scores + answers for a rematch. */
export async function resetRoom(code) {
  const snap = await get(playersRef(code));
  const patch = {};
  for (const pid of Object.keys(snap.val() || {})) patch[`players/${pid}/score`] = 0;
  patch.answers = null;
  patch.locked = null;
  patch.results = null;
  patch.state = LOBBY_STATE;
  await update(roomRef(code), patch);   // multi-path: each key is checked against its own rule
}
