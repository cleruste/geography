import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createJavaScriptRound } from "../engine/javascript.js";
import { createWebAssemblyRound } from "../engine/webassembly.js";

const wasm = await WebAssembly.compile(await readFile(new URL("../engine/quiz.wasm", import.meta.url)));

function randomIndex() {
  let seed = 42;
  return (length) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % length;
  };
}

for (const size of [5, 27, 57, 96]) {
  test(`WASM matches JavaScript with a pool of ${size}`, () => {
    const js = createJavaScriptRound(size, 10, randomIndex());
    const round = createWebAssemblyRound(wasm, size, 10, randomIndex());
    assert.deepEqual(round.questions, js.questions);
    assert.equal(new Set(round.questions).size, Math.min(size, 10));
    for (const [turn, question] of round.questions.entries()) {
      assert.deepEqual(round.snapshot(), js.snapshot());
      assert.equal(round.next(), 0);
      assert.equal(round.answer(-1), -1);
      const selection = turn % 3 === 2 ? (question + 1) % size : question;
      assert.equal(round.answer(selection), js.answer(selection));
      assert.equal(round.answer(question), -1);
      assert.deepEqual(round.snapshot(), js.snapshot());
      assert.equal(round.next(), js.next());
    }
    assert.equal(round.next(), 0);
    const replay = createWebAssemblyRound(wasm, size, 10, randomIndex());
    assert.deepEqual(replay.snapshot(), { turn: 0, score: 0, streak: 0, bestStreak: 0, answered: false });
  });
}
