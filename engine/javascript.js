// The original JavaScript rules, using pool indices at the engine boundary.
export function createJavaScriptRound(poolSize, limit, randomIndex) {
  const questions = Array.from({ length: poolSize }, (_, index) => index);
  for (let i = questions.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  questions.length = Math.min(poolSize, limit);
  let turn = 0;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let answered = false;
  let complete = false;

  return {
    questions,
    snapshot: () => ({ turn, score, streak, bestStreak, answered }),
    answer(selection) {
      if (answered || selection < 0 || selection >= poolSize) return -1;
      answered = true;
      if (selection !== questions[turn]) {
        streak = 0;
        return 0;
      }
      score += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      return 1;
    },
    next() {
      if (!answered || complete) return 0;
      if (turn + 1 === questions.length) {
        complete = true;
        return 2;
      }
      turn += 1;
      answered = false;
      return 1;
    }
  };
}
