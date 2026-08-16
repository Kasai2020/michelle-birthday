// Security-rules tests for database.rules.json, run against the Firebase
// Realtime Database emulator. These are what prove a guest can't peek at the
// answer pile or hand themselves 9999 points.
//
//   npm i -D firebase-tools firebase @firebase/rules-unit-testing
//   npx firebase emulators:start --only database --project michelle-bday
//   node tests/rules.test.mjs        # in a second terminal
//
import fs from "node:fs";
import assert from "node:assert/strict";
import { initializeTestEnvironment, assertSucceeds, assertFails }
  from "@firebase/rules-unit-testing";
import { ref, set, get, update, remove, runTransaction } from "firebase/database";

const env = await initializeTestEnvironment({
  projectId: "michelle-bday",
  database: {
    rules: fs.readFileSync(new URL("../database.rules.json", import.meta.url), "utf8"),
    host: "127.0.0.1", port: 9000,
  },
});

const HOST = "uid-host", P1 = "uid-p1", P2 = "uid-p2";
const dbOf = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).database();
const R = "TEST";
const at = (uid, path) => ref(dbOf(uid), path);

let pass = 0, fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.error(`  ✗ ${name}\n      ${String(e).split("\n")[0]}`); }
};

await env.clearDatabase();

console.log("\nroom creation");
await t("anonymous (signed-out) user is locked out entirely", async () => {
  await assertFails(get(at(null, `rooms/${R}/hostId`)));
  await assertFails(set(at(null, `rooms/${R}/hostId`), "nope"));
});
await t("host claims a free code via transaction on hostId", async () => {
  const res = await runTransaction(at(HOST, `rooms/${R}/hostId`), (v) => (v ? undefined : HOST));
  assert.ok(res.committed);
});
await t("a second person cannot steal an owned room", async () => {
  await assertFails(set(at(P1, `rooms/${R}/hostId`), P1));
});
await t("host writes lobby state; players cannot", async () => {
  const lobby = { phase: "lobby", step: -1, sub: "", startedAt: 0, endsAt: 0 };
  await assertSucceeds(set(at(HOST, `rooms/${R}/state`), lobby));
  await assertFails(set(at(P1, `rooms/${R}/state`), { ...lobby, phase: "final" }));
});
await t("host writes createdAt", async () => {
  await assertSucceeds(set(at(HOST, `rooms/${R}/createdAt`), Date.now()));
});

console.log("\nplayers");
const player = (name, avatar) => ({ name, avatar, score: 0, online: true, joinedAt: Date.now() });
await t("a player joins by writing their own node", async () => {
  await assertSucceeds(set(at(HOST, `rooms/${R}/players/${HOST}`), player("Isaac", "🦊")));
  await assertSucceeds(set(at(P1, `rooms/${R}/players/${P1}`), player("Sam", "🐼")));
  await assertSucceeds(set(at(P2, `rooms/${R}/players/${P2}`), player("Priya", "🦄")));
});
await t("a player cannot write someone else's node", async () => {
  await assertFails(set(at(P1, `rooms/${R}/players/${P2}`), player("Hacked", "😈")));
});
await t("a player CANNOT inflate their own score", async () => {
  await assertFails(set(at(P1, `rooms/${R}/players/${P1}/score`), 99999));
  await assertFails(update(at(P1, `rooms/${R}/players/${P1}`), { score: 500 }));
  await assertFails(set(at(P1, `rooms/${R}/players/${P1}`), { name: "Sam", avatar: "x", score: 9999 }));
});
await t("a player CAN rejoin, preserving the score the host gave them", async () => {
  await assertSucceeds(update(at(HOST, `rooms/${R}/players`), { [`${P1}/score`]: 240 }));
  await assertSucceeds(runTransaction(at(P1, `rooms/${R}/players/${P1}`), (prev) => ({
    name: "Sam", avatar: "\ud83d\udc3c", score: prev?.score || 0, online: true, joinedAt: prev?.joinedAt || Date.now(),
  })));
  const snap = await get(at(HOST, `rooms/${R}/players/${P1}/score`));
  assert.equal(snap.val(), 240, "rejoin must not reset the score");
});
await t("everyone can read the player list", async () => {
  await assertSucceeds(get(at(P1, `rooms/${R}/players`)));
});
await t("junk fields and bad types are rejected", async () => {
  await assertFails(set(at(P1, `rooms/${R}/players/${P1}/evil`), true));
  await assertFails(set(at(P1, `rooms/${R}/players/${P1}/score`), -5));
  await assertFails(set(at(P1, `rooms/${R}/players/${P1}`), { name: "", avatar: "x", score: 0 }));
  await assertFails(set(at(P1, `rooms/${R}/players/${P1}`), { name: "waaaaaaaaaaaaaaaytoolong", avatar: "x", score: 0 }));
});
await t("presence toggle works (the onDisconnect write)", async () => {
  await assertSucceeds(set(at(P1, `rooms/${R}/players/${P1}/online`), false));
  await assertSucceeds(set(at(P1, `rooms/${R}/players/${P1}/online`), true));
});
await t("host applies score deltas to everyone (applyScores)", async () => {
  await assertSucceeds(update(at(HOST, `rooms/${R}/players`), { [`${P1}/score`]: 150, [`${P2}/score`]: 90 }));
});
await t("a player can leave (delete own node)", async () => {
  await assertSucceeds(remove(at(P2, `rooms/${R}/players/${P2}`)));
  await assertSucceeds(set(at(P2, `rooms/${R}/players/${P2}`), player("Priya", "🦄")));
});

console.log("\nanswers — the anti-cheat surface");
await t("a player submits their own answer", async () => {
  await assertSucceeds(set(at(P1, `rooms/${R}/answers/0/${P1}`), { v: 2, t: Date.now() }));
  await assertSucceeds(set(at(P2, `rooms/${R}/answers/0/${P2}`), { v: 1, t: Date.now() }));
});
await t("a player CANNOT write another player's answer", async () => {
  await assertFails(set(at(P1, `rooms/${R}/answers/0/${P2}`), { v: 3, t: Date.now() }));
});
await t("a player CANNOT read the answer pile (no peeking)", async () => {
  await assertFails(get(at(P1, `rooms/${R}/answers/0`)));
  await assertFails(get(at(P1, `rooms/${R}/answers/0/${P2}`)));
});
await t("the host CAN read the answer pile (needed to score)", async () => {
  const snap = await assertSucceeds(get(at(HOST, `rooms/${R}/answers/0`)));
  assert.equal(Object.keys(snap.val()).length, 2);
});

console.log("\nresults + reset");
await t("host publishes results, players read them", async () => {
  await assertSucceeds(set(at(HOST, `rooms/${R}/results/0`),
    { answer: 2, tally: [0, 1, 1], players: { [P1]: { pts: 130, ok: true } } }));
  await assertSucceeds(get(at(P1, `rooms/${R}/results/0`)));
});
await t("a player cannot forge results", async () => {
  await assertFails(set(at(P1, `rooms/${R}/results/0`), { answer: 0, players: { [P1]: { pts: 9999 } } }));
});
await t("host resets the room for a rematch", async () => {
  await assertSucceeds(update(at(HOST, `rooms/${R}`), {
    [`players/${P1}/score`]: 0, [`players/${P2}/score`]: 0,
    answers: null, results: null,
    state: { phase: "lobby", step: -1, sub: "", startedAt: 0, endsAt: 0 },
  }));
});
await t("a player cannot wipe the room", async () => {
  await assertFails(update(at(P1, `rooms/${R}`), { answers: null, results: null }));
  await assertFails(remove(at(P1, `rooms/${R}/results`)));
});
await t("nobody can read the room root (that's what hides answers)", async () => {
  await assertFails(get(at(HOST, `rooms/${R}`)));
  await assertFails(get(at(P1, "rooms")));
});

console.log(`\n${pass} passed, ${fail} failed\n`);
await env.cleanup();
process.exit(fail ? 1 : 0);
