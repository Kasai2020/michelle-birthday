// Pure-logic tests for the scoring functions. No Firebase, no DOM.
//   node tests/scoring.test.mjs
import assert from "node:assert/strict";

import * as trivia from "../js/rounds/trivia.js";
import * as age from "../js/rounds/age.js";
import * as chronology from "../js/rounds/chronology.js";
import * as majority from "../js/rounds/majority.js";
import { STEPS, ROUNDS, SCORING } from "../data/content.js";

let pass = 0;
const test = (name, fn) => {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
};

const state = { startedAt: 1000, endsAt: 21000 };
const step = (over = {}) => ({ multiplier: 1, duration: 20, roundIndex: 0, qNumber: 1, ...over });

console.log("\ncontent");
test("every round type has an implementation", () => {
  const known = new Set(["trivia", "age", "chronology", "majority"]);
  for (const r of ROUNDS) assert.ok(known.has(r.type), `unknown round type: ${r.type}`);
});
test("trivia answers point at a real option", () => {
  for (const r of ROUNDS.filter((r) => r.type === "trivia")) {
    for (const q of r.questions) {
      assert.ok(Number.isInteger(q.answer), `${q.q}: answer must be an index`);
      assert.ok(q.options[q.answer] !== undefined, `${q.q}: answer index out of range`);
    }
  }
});
test("age questions have answers inside their slider range", () => {
  for (const r of ROUNDS.filter((r) => r.type === "age")) {
    for (const q of r.questions) {
      assert.ok(q.answer >= (q.min ?? 0) && q.answer <= (q.max ?? 30), `${q.q}: answer outside min/max`);
    }
  }
});
test("chronology rounds have at least two items", () => {
  for (const r of ROUNDS.filter((r) => r.type === "chronology")) {
    for (const q of r.questions) assert.ok(q.items.length >= 2, `${q.q}: needs 2+ items`);
  }
});
test("STEPS flattens every question exactly once", () => {
  const total = ROUNDS.reduce((n, r) => n + r.questions.length, 0);
  assert.equal(STEPS.length, total);
  assert.ok(STEPS[0].isRoundStart);
});

console.log("\ntrivia");
test("right answer beats wrong answer; faster beats slower", () => {
  const s = step({ data: { q: "?", options: ["a", "b"], answer: 1 } });
  const { deltas } = trivia.score(s, {
    fast:  { v: 1, t: 3000 },   // answered almost immediately
    slow:  { v: 1, t: 20000 },  // answered at the buzzer
    wrong: { v: 0, t: 5000 },
  }, { state });
  assert.ok(deltas.fast > deltas.slow, "speed bonus should reward answering early");
  assert.ok(deltas.slow >= SCORING.base, "a correct answer always pays at least base");
  assert.equal(deltas.wrong, 0);
});
test("multiplier scales the whole payout", () => {
  const data = { q: "?", options: ["a", "b"], answer: 0 };
  const one = trivia.score(step({ data }), { p: { v: 0, t: 11000 } }, { state }).deltas.p;
  const two = trivia.score(step({ data, multiplier: 2 }), { p: { v: 0, t: 11000 } }, { state }).deltas.p;
  assert.equal(two, one * 2);
});
test("tally counts each pick", () => {
  const s = step({ data: { q: "?", options: ["a", "b", "c"], answer: 2 } });
  const { result } = trivia.score(s, { x: { v: 0, t: 5e3 }, y: { v: 0, t: 5e3 }, z: { v: 2, t: 5e3 } }, { state });
  assert.deepEqual(result.tally, [2, 0, 1]);
});
test("non-answerers score nothing and are absent from results", () => {
  const s = step({ data: { q: "?", options: ["a", "b"], answer: 0 } });
  const { deltas, result } = trivia.score(s, {}, { state });
  assert.deepEqual(deltas, {});
  assert.deepEqual(result.players, {});
});

console.log("\nage");
test("exact guess wins outright, closest gets a bonus, far guesses score 0", () => {
  const s = step({ data: { q: "?", answer: 10, min: 0, max: 25 } });
  const { deltas, result } = age.score(s, {
    exact: { v: 10 }, near: { v: 12 }, far: { v: 25 },
  });
  assert.ok(deltas.exact > deltas.near && deltas.near > deltas.far);
  assert.equal(deltas.far, 0, "a guess beyond the spread earns nothing");
  assert.ok(result.players.exact.ok && result.players.exact.closest);
});
test("ties for closest both get the bonus", () => {
  const s = step({ data: { q: "?", answer: 10, min: 0, max: 25 } });
  const { deltas } = age.score(s, { under: { v: 9 }, over: { v: 11 } });
  assert.equal(deltas.under, deltas.over);
});
test("wider ranges are more forgiving", () => {
  const tight = age.score(step({ data: { q: "?", answer: 20, min: 0, max: 25 } }), { p: { v: 26 } }).deltas.p;
  const wide  = age.score(step({ data: { q: "?", answer: 20, min: 0, max: 100 } }), { p: { v: 26 } }).deltas.p;
  assert.ok(wide > tight);
});

console.log("\nchronology");
test("perfect order gets base + perfect bonus", () => {
  const s = step({ data: { q: "?", items: ["a", "b", "c", "d"] } });
  const { deltas } = chronology.score(s, { p: { v: [0, 1, 2, 3] } });
  assert.equal(deltas.p, SCORING.base + SCORING.perfectBonus);
});
test("partial credit sits between perfect and reversed", () => {
  const s = step({ data: { q: "?", items: ["a", "b", "c", "d"] } });
  const g = (v) => chronology.score(s, { p: { v } }).deltas.p;
  assert.equal(g([3, 2, 1, 0]), 0, "fully reversed = no pairs right");
  assert.ok(g([0, 1, 3, 2]) > 0 && g([0, 1, 3, 2]) < g([0, 1, 2, 3]));
});
test("an incomplete ordering is scaled down, not thrown away", () => {
  const s = step({ data: { q: "?", items: ["a", "b", "c", "d"] } });
  const half = chronology.score(s, { p: { v: [0, 1] } }).deltas.p;
  assert.ok(half > 0 && half < SCORING.base);
});
test("missing / empty answers don't throw", () => {
  const s = step({ data: { q: "?", items: ["a", "b", "c"] } });
  const { deltas } = chronology.score(s, { p: { v: null }, q: { v: [] } });
  assert.equal(deltas.p, 0);
  assert.equal(deltas.q, 0);
});

console.log("\nmajority");
test("matching the crowd scores, the lone wolf doesn't", () => {
  const s = step({ data: { q: "?", options: ["a", "b"] } });
  const { deltas, result } = majority.score(s, { x: { v: 0 }, y: { v: 0 }, z: { v: 1 } });
  assert.equal(deltas.x, SCORING.base);
  assert.equal(deltas.z, 0);
  assert.deepEqual(result.winners, [0]);
});
test("a split room rewards everyone in a tied group", () => {
  const s = step({ data: { q: "?", options: ["a", "b"] } });
  const { deltas } = majority.score(s, { x: { v: 0 }, y: { v: 1 } });
  assert.equal(deltas.x, SCORING.base);
  assert.equal(deltas.y, SCORING.base);
});

console.log(`\n${pass} passed${process.exitCode ? " — with failures above" : ""}\n`);
