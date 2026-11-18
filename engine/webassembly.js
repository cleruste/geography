const wasmUrl = new URL("./quiz.wasm", import.meta.url);

// Compile once, but instantiate a fresh module for every round.
let modulePromise;
export function loadWebAssemblyEngine() {
  if (!modulePromise) {
    modulePromise = fetch(wasmUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`WASM fetch failed: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((bytes) => WebAssembly.compile(bytes))
      .catch((error) => {
        modulePromise = undefined;
        throw error;
      });
  }
  return modulePromise.then((module) => (poolSize, limit, randomIndex) =>
    createWebAssemblyRound(module, poolSize, limit, randomIndex));
}

export function createWebAssemblyRound(module, poolSize, limit, randomIndex) {
  if (poolSize > 16384) throw new RangeError("Quiz pool exceeds WASM memory capacity");
  const { exports: engine } = new WebAssembly.Instance(module, { host: { random_index: randomIndex } });
  engine.start(poolSize, limit);
  return {
    questions: Array.from({ length: Math.min(poolSize, limit) }, (_, index) => engine.question(index)),
    snapshot: () => ({
      turn: engine.turn.value,
      score: engine.score.value,
      streak: engine.streak.value,
      bestStreak: engine.best_streak.value,
      answered: Boolean(engine.answered.value)
    }),
    answer: engine.answer,
    next: engine.next
  };
}
