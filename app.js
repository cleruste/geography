const { states, cities } = window.ATLAS_DATA;
const playableStates = states.filter((state) => state.isState);
const app = document.querySelector("#app");
const dialog = document.querySelector("#info-dialog");
const dialogContent = document.querySelector("#dialog-content");
const TOTAL_TURNS = 10;
const STORAGE_KEY = "atlas-geography-progress-v1";

let selectedMode = "states";
let game = null;
let currentView = "regions";
let toastTimer;

const icon = (name, className = "") => `<svg class="icon ${className}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
const shuffle = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

function getStats() {
  try {
    return { completed: 0, totalCorrect: 0, bestStreak: 0, best: { states: 0, cities: 0 }, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { completed: 0, totalCorrect: 0, bestStreak: 0, best: { states: 0, cities: 0 } };
  }
}

function updateHeaderStats() {
  document.querySelector("#header-quiz-count").textContent = getStats().completed;
}

function recordGame() {
  const stats = getStats();
  stats.completed += 1;
  stats.totalCorrect += game.score;
  stats.bestStreak = Math.max(stats.bestStreak, game.bestStreak);
  stats.best = { states: 0, cities: 0, ...stats.best };
  stats.best[game.mode] = Math.max(stats.best[game.mode] || 0, game.score);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch { /* The game also works with storage disabled. */ }
  updateHeaderStats();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function previewMap() {
  return `
    <svg viewBox="0 -4 975 620" aria-hidden="true">
      <g>${states.map((state) => `<path class="preview-state" d="${state.path}"/>`).join("")}</g>
      <g>${cities.map((city) => `<circle class="preview-city" cx="${city.coordinates[0]}" cy="${city.coordinates[1]}" r="3.2"/>`).join("")}</g>
    </svg>`;
}

function europeArt() {
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="m23 72 8-19 13-4 1-17 14-10 11 8 13-3 11 13-8 11 7 12-13 5-4 17-14 8-9-12-15 2-5-11Zm22-28 14 8 9-9m-27 31 16-8 12 9 12-14M31 53l15 5-5 16m35-44-4 13 14 8M23 92l8-5m55 13 6-9"/></svg>`;
}

function chinaArt() {
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="m18 57 13-16 15 1 9-17 17 7 13-3 8 13 12 7-6 14 5 12-17 4-5 17-17-2-9 9-11-14-15 2-5-13-12-6 9-9Zm22-15 12 15-7 18 11 14m16-64-3 23 18 9 12-8M31 41l9 16-15 15m44-24-17 9 5 20 25 2M18 57l22 0"/></svg>`;
}

function renderRegions() {
  currentView = "regions";
  game = null;
  app.innerHTML = `
    <div class="page-shell view regions-view">
      <section class="landing-hero">
        <div>
          <div class="eyebrow">Geography, made playful</div>
          <h1 class="hero-title">A little curious?<br><em>Go explore.</em></h1>
          <p class="hero-subtitle">Pick a corner of the world and get to know it, one place at a time. No timers, no pressure — just the joy of finding your way.</p>
        </div>
        <div class="hero-note">
          <span class="hero-note-icon">${icon("globe")}</span>
          <div><strong>The world is waiting</strong><span>New regions are on the horizon</span></div>
        </div>
      </section>

      <section aria-labelledby="region-heading">
        <div class="section-heading"><h2 id="region-heading">Choose your region</h2><span>1 region ready to explore</span></div>
        <div class="region-grid">
          <article class="region-card us-card">
            <div class="region-card-content">
              <span class="region-number">01 / NORTH AMERICA</span>
              <span class="pill pill-ready">${icon("spark")} Ready to explore</span>
              <h3>United<br>States</h3>
              <p>From the Golden Coast<br>to the Big Apple.</p>
              <div class="region-tags"><span class="region-tag">50 states</span><span class="region-tag">30 major cities</span></div>
              <button class="primary-button" data-action="select-region">Start exploring ${icon("arrow-right")}</button>
            </div>
            <div class="us-map-preview">${previewMap()}<span class="preview-caption">Your next adventure</span></div>
          </article>
          <div class="coming-soon-column">
            <article class="region-card small-region-card">
              <div class="region-card-content">
                <span class="region-number">02 / EUROPE</span>
                <span class="pill pill-soon">${icon("lock")} Coming soon</span>
                <h3>Europe</h3>
                <p>Old streets. New discoveries.</p>
              </div>
              <div class="small-region-art">${europeArt()}</div>
            </article>
            <article class="region-card small-region-card">
              <div class="region-card-content">
                <span class="region-number">03 / ASIA</span>
                <span class="pill pill-soon">${icon("lock")} Coming soon</span>
                <h3>China</h3>
                <p>A vast land, waiting to be found.</p>
              </div>
              <div class="small-region-art">${chinaArt()}</div>
            </article>
          </div>
        </div>
        <div class="more-regions">${icon("globe")} More regions are being charted. The adventure doesn't stop here.</div>
      </section>

      <section class="how-section" aria-labelledby="how-heading">
        <div class="section-heading"><h2 id="how-heading">Find your way</h2><span>Three simple steps</span></div>
        <div class="how-grid">
          <div class="how-step"><span class="step-number">01</span><div><h3>Pick your challenge</h3><p>Get to know the states or put major cities on the map.</p></div></div>
          <div class="how-step"><span class="step-number">02</span><div><h3>Trust your inner compass</h3><p>Read the place name, then point to its home on the map.</p></div></div>
          <div class="how-step"><span class="step-number">03</span><div><h3>Learn as you wander</h3><p>Reveal every label after each turn and grow with every guess.</p></div></div>
        </div>
      </section>
    </div>`;
  updateHeaderStats();
}

function renderSetup() {
  currentView = "setup";
  game = null;
  app.innerHTML = `
    <div class="page-shell view setup-view">
      <button class="back-link" data-action="home">${icon("arrow-left")} All regions</button>
      <section class="setup-heading">
        <div class="eyebrow">Your next challenge</div>
        <h1>Let's explore the <em>United States.</em></h1>
        <p>Fifty states, countless stories. How well do you know your way around?</p>
      </section>
      <div class="setup-grid">
        <div class="setup-map-card">
          <span class="setup-map-label">${icon("map")} United States</span>
          ${previewMap()}
          <div class="setup-map-footer">
            <div class="map-legend"><span class="legend-item"><i class="legend-line"></i>State boundary</span><span class="legend-item"><i class="legend-dot"></i>Major city</span></div>
            <span>50 states · 30 cities</span>
          </div>
        </div>
        <section class="mode-panel" aria-labelledby="mode-title">
          <h2 id="mode-title">Choose your challenge</h2>
          <p>You can switch modes for your next round.</p>
          <div class="mode-options">
            <button class="mode-option ${selectedMode === "states" ? "selected" : ""}" data-action="select-mode" data-mode="states" aria-pressed="${selectedMode === "states"}">
              <span class="mode-option-icon">${icon("map")}</span>
              <span><strong>Find the state</strong><small>From Alabama to Wyoming, locate all 50 states.</small></span>
              <span class="mode-radio"></span>
            </button>
            <button class="mode-option ${selectedMode === "cities" ? "selected" : ""}" data-action="select-mode" data-mode="cities" aria-pressed="${selectedMode === "cities"}">
              <span class="mode-option-icon">${icon("pin")}</span>
              <span><strong>Find the city</strong><small>Pinpoint 30 major cities, from Seattle to Miami.</small></span>
              <span class="mode-radio"></span>
            </button>
          </div>
          <div class="quiz-details"><span class="quiz-detail">${icon("target")} 10 questions</span><span class="quiz-detail">${icon("clock")} No time limit</span></div>
          <button class="primary-button start-button" data-action="start-quiz">Start the quiz ${icon("arrow-right")}</button>
          <p class="setup-footnote">A fresh set of questions every time you play.</p>
        </section>
      </div>
    </div>`;
}

const stateLabelLayout = {
  "Vermont": { x: 847, y: 105 },
  "New Hampshire": { x: 944, y: 111 },
  "Massachusetts": { x: 946, y: 143 },
  "Rhode Island": { x: 950, y: 174 },
  "Connecticut": { x: 944, y: 205 },
  "New Jersey": { x: 931, y: 239 },
  "Delaware": { x: 921, y: 280 },
  "Maryland": { x: 908, y: 310 }
};

const cityLabelLayout = {
  "New York": { dx: 8, dy: -9 }, "Los Angeles": { dx: 8, dy: -8 },
  "Chicago": { dx: 8, dy: -8 }, "Houston": { dx: 8, dy: 13 },
  "Phoenix": { dx: 8, dy: 13 }, "Philadelphia": { dx: -8, dy: 14, anchor: "end" },
  "San Antonio": { dx: -8, dy: 13, anchor: "end" }, "San Diego": { dx: 8, dy: 13 },
  "Dallas": { dx: 8, dy: -8 }, "San Francisco": { dx: -8, dy: -8, anchor: "end" },
  "Austin": { dx: 8, dy: 13 }, "Seattle": { dx: 8, dy: -8 },
  "Denver": { dx: 8, dy: -8 }, "Boston": { dx: 8, dy: -8 },
  "Washington, D.C.": { dx: 8, dy: 14 }, "Miami": { dx: 8, dy: -8 },
  "Atlanta": { dx: -8, dy: 13, anchor: "end" }, "Detroit": { dx: 8, dy: -8 },
  "Minneapolis": { dx: 8, dy: -8 }, "Portland": { dx: 8, dy: 13 },
  "Las Vegas": { dx: 8, dy: -8 }, "New Orleans": { dx: 8, dy: 13 },
  "Nashville": { dx: -8, dy: -8, anchor: "end" }, "St. Louis": { dx: 8, dy: 13 },
  "Kansas City": { dx: -8, dy: -8, anchor: "end" }, "Salt Lake City": { dx: 8, dy: -8 },
  "Indianapolis": { dx: 8, dy: -8 }, "Charlotte": { dx: 8, dy: -8 },
  "Honolulu": { dx: 8, dy: 13 }, "Anchorage": { dx: 8, dy: 13 }
};

function mapLabels(question) {
  if (!game.answered) return "";
  const stateLabels = states.filter((state) => state.isState).map((state) => {
    const layout = stateLabelLayout[state.name];
    const [cx, cy] = state.centroid;
    const x = layout?.x ?? cx;
    const y = layout?.y ?? cy;
    const targetClass = state.id === question.id && game.mode === "states" ? "target-label" : "";
    return `${layout ? `<path class="label-leader" d="M${cx} ${cy} L${x} ${y - 3}"/>` : ""}<text class="state-label ${targetClass}" x="${x}" y="${y}">${state.name}</text>`;
  }).join("");
  const cityLabels = cities.map((city) => {
    const [cx, cy] = city.coordinates;
    const layout = cityLabelLayout[city.name] || { dx: 7, dy: -7 };
    const targetClass = city.id === question.id && game.mode === "cities" ? "target-label" : "";
    return `<text class="city-label ${targetClass}" x="${cx + layout.dx}" y="${cy + layout.dy}" text-anchor="${layout.anchor || "start"}">${city.name}</text>`;
  }).join("");
  return `<g class="map-labels" aria-hidden="true">${stateLabels}${cityLabels}</g>`;
}

function quizMap(question) {
  const statePaths = states.map((state) => {
    const isCorrect = game.answered && game.mode === "states" && state.id === question.id;
    const isIncorrect = game.answered && game.mode === "states" && state.id === game.selected && !game.answers.at(-1).correct;
    const isDimmed = game.answered && game.mode === "states" && !isCorrect && !isIncorrect;
    const classes = ["state-shape", state.isState ? "is-state" : "is-dc", isCorrect ? "correct" : "", isIncorrect ? "incorrect" : "", isDimmed ? "dimmed" : ""].join(" ");
    const interactive = game.mode === "states" && state.isState && !game.answered;
    return `<path d="${state.path}" class="${classes}" ${interactive ? `data-action="state-answer" data-id="${state.id}" role="button" tabindex="0" aria-label="Select ${state.name}"` : ""}/>`;
  }).join("");
  const cityMarkers = cities.map((city) => {
    const [x, y] = city.coordinates;
    const isCorrect = game.answered && game.mode === "cities" && city.id === question.id;
    const isIncorrect = game.answered && game.mode === "cities" && city.id === game.selected && !game.answers.at(-1).correct;
    const interactive = game.mode === "cities" && !game.answered;
    return `<g class="city-marker ${isCorrect ? "correct" : ""} ${isIncorrect ? "incorrect" : ""}" ${interactive ? `data-action="city-answer" data-id="${city.id}" role="button" tabindex="0" aria-label="Select ${city.name}"` : ""}>
      <circle class="city-halo" cx="${x}" cy="${y}" r="11"/><circle class="city-hit" cx="${x}" cy="${y}" r="10"/><circle class="city-dot" cx="${x}" cy="${y}" r="3.4"/>
    </g>`;
  }).join("");
  return `<svg class="quiz-map ${game.mode}-mode ${game.answered ? "map-answered" : ""}" viewBox="0 0 975 610" role="group" aria-label="Interactive map of the United States">
    <g>${statePaths}</g><g>${cityMarkers}</g>${mapLabels(question)}
  </svg>`;
}

function startGame(mode = selectedMode) {
  selectedMode = mode;
  const pool = mode === "states" ? playableStates : cities;
  game = {
    mode,
    questions: shuffle(pool).slice(0, TOTAL_TURNS),
    turn: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    answers: [],
    answered: false,
    selected: null
  };
  renderQuiz();
}

function answerLocation(id) {
  if (!game || game.answered) return;
  const pool = game.mode === "states" ? playableStates : cities;
  const question = game.questions[game.turn];
  const selection = pool.find((item) => item.id === id);
  if (!selection) return;
  const correct = selection.id === question.id;
  game.answered = true;
  game.selected = id;
  if (correct) {
    game.score += 1;
    game.streak += 1;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
  } else {
    game.streak = 0;
  }
  game.answers.push({ question: question.name, selected: selection.name, correct });
  renderQuiz();
  document.querySelector(".question-action button")?.focus({ preventScroll: true });
}

function renderQuiz() {
  currentView = "quiz";
  const question = game.questions[game.turn];
  const latestAnswer = game.answers.at(-1);
  const isLastTurn = game.turn === TOTAL_TURNS - 1;
  const progress = Array.from({ length: TOTAL_TURNS }, (_, index) => {
    const answer = game.answers[index];
    const className = answer ? (answer.correct ? "correct" : "incorrect") : (index === game.turn && !game.answered ? "current" : "");
    return `<span class="turn-segment ${className}"></span>`;
  }).join("");
  const feedback = game.answered ? `
    <div class="answer-feedback ${latestAnswer.correct ? "correct" : "incorrect"}" role="status" aria-live="polite">
      <span class="feedback-icon">${icon(latestAnswer.correct ? "check" : "close")}</span>
      <div><strong>${latestAnswer.correct ? "Right on the map!" : "Not quite this time."}</strong><p>${latestAnswer.correct ? `You found ${question.name}. Nice navigating!` : `You chose ${latestAnswer.selected}. ${question.name} is highlighted on the map.`}</p></div>
    </div>` : "";
  app.innerHTML = `
    <div class="page-shell view quiz-view">
      <div class="quiz-topbar">
        <div class="quiz-title-group"><h1>United States</h1><span class="mode-badge">${icon(game.mode === "states" ? "map" : "pin")} ${game.mode} mode</span></div>
        <button class="back-link" data-action="home">${icon("arrow-left")} Leave quiz</button>
      </div>
      <div class="game-grid">
        <section class="map-card" aria-label="Quiz map">
          <div class="map-toolbar"><span class="map-instruction">${icon("target")} ${game.answered ? "Explore the revealed map" : `Click ${game.mode === "states" ? "a state" : "a red city dot"} to make your guess`}</span><span class="map-counter">United States / ${game.mode}</span></div>
          <div class="map-canvas">${quizMap(question)}</div>
          <div class="map-bottom"><div class="map-legend"><span class="legend-item"><i class="legend-line"></i>State boundary</span><span class="legend-item"><i class="legend-dot"></i>Major city</span></div><span class="map-bottom-note">${game.answered ? "Labels revealed · Correct answer highlighted" : "Labels appear after your answer"}</span></div>
        </section>
        <aside class="question-column">
          <section class="question-card">
            <div class="question-meta"><span>Question <strong>${String(game.turn + 1).padStart(2, "0")}</strong> of ${TOTAL_TURNS}</span><span>${game.mode === "states" ? "State finder" : "City finder"}</span></div>
            <div class="turn-progress" aria-label="Question ${game.turn + 1} of ${TOTAL_TURNS}">${progress}</div>
            <p class="question-kicker">Where is...</p>
            <h2 class="question-name">${question.name}</h2>
            <p class="question-prompt">${game.mode === "states" ? "Find this state on the map and click its boundaries." : "Find the red dot for this city and click to place your answer."}</p>
            ${feedback}
            ${game.answered ? `<div class="question-action"><button class="primary-button" data-action="next-turn">${isLastTurn ? "See my results" : "Next question"} ${icon("arrow-right")}</button></div>` : `<div class="waiting-hint">${icon("clock")} Take your time — there's no timer</div>`}
          </section>
          <div class="score-card">
            <div class="score-item">${icon("trophy")}<div><span>Score</span><strong>${game.score} / ${game.turn + (game.answered ? 1 : 0)}</strong></div></div>
            <div class="score-item">${icon("spark")}<div><span>Streak</span><strong>${game.streak} in a row</strong></div></div>
          </div>
          <p class="quiz-exit-note">Your progress is saved when the round is complete.</p>
        </aside>
      </div>
    </div>`;
}

function nextTurn() {
  if (!game?.answered) return;
  if (game.turn === TOTAL_TURNS - 1) {
    recordGame();
    renderResults();
    return;
  }
  game.turn += 1;
  game.answered = false;
  game.selected = null;
  renderQuiz();
}

function renderResults() {
  currentView = "results";
  const score = game.score;
  const title = score === 10 ? "A perfect <em>expedition.</em>" : score >= 8 ? "Nicely done, <em>explorer.</em>" : score >= 5 ? "You're finding <em>your way.</em>" : "Every journey starts <em>somewhere.</em>";
  const subtitle = score >= 8 ? "Your inner compass is looking sharp. Another corner of the map is already calling." : score >= 5 ? "A few new places are familiar now. Keep wandering and watch the map come together." : "Now you know a little more than you did before. Give it another go — every guess builds your mental map.";
  app.innerHTML = `
    <div class="page-shell view results-view">
      <section class="results-card">
        <div class="results-badge">${icon("trophy")}</div>
        <div class="eyebrow">Round complete · United States</div>
        <h1>${title}</h1>
        <p class="results-subtitle">${subtitle}</p>
        <div class="results-summary">
          <div class="score-ring" style="--score-angle: ${score / TOTAL_TURNS * 360}deg"><div class="score-ring-content"><strong>${score}</strong><span> / ${TOTAL_TURNS}</span></div></div>
          <div class="result-stats">
            <div class="result-stat"><span>Accuracy</span><strong>${score * 10}%</strong></div>
            <div class="result-stat"><span>Best streak</span><strong>${game.bestStreak}</strong></div>
            <div class="result-stat"><span>Mode</span><strong>${game.mode === "states" ? "States" : "Cities"}</strong></div>
            <div class="result-stat"><span>Places learned</span><strong>${score}</strong></div>
          </div>
        </div>
        <div class="result-actions">
          <button class="primary-button" data-action="play-again">${icon("refresh")} Play again</button>
          <button class="secondary-button" data-action="switch-mode">${icon(game.mode === "states" ? "pin" : "map")} Try ${game.mode === "states" ? "cities" : "states"}</button>
          <button class="text-button" data-action="home">Back to regions</button>
        </div>
        <div class="review-section">
          <div class="review-heading"><h2>Your journey</h2><span>${score} correct · ${TOTAL_TURNS - score} to revisit</span></div>
          <div class="review-list">${game.answers.map((answer) => `<div class="review-item ${answer.correct ? "correct" : "incorrect"}" title="${answer.correct ? answer.question : `You chose ${answer.selected}`}"><span class="review-status">${icon(answer.correct ? "check" : "close")}</span><span>${answer.question}</span></div>`).join("")}</div>
        </div>
      </section>
    </div>`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHowTo() {
  dialogContent.innerHTML = `
    <div class="dialog-icon">${icon("map")}</div>
    <h2>A map. A name. Your guess.</h2>
    <p>Atlas is a simple way to turn curiosity into confidence. There's no timer and no sign-up.</p>
    <div class="dialog-steps">
      <div class="dialog-step"><span class="dialog-step-number">1</span><div><strong>Choose a region and mode</strong><p>Start with the United States, then choose between finding its 50 states or 30 major cities.</p></div></div>
      <div class="dialog-step"><span class="dialog-step-number">2</span><div><strong>Make your best guess</strong><p>Each round has ten randomized questions. Click the matching state boundary or red city dot.</p></div></div>
      <div class="dialog-step"><span class="dialog-step-number">3</span><div><strong>Reveal, learn, and keep going</strong><p>After every answer, all map labels appear and the correct location is highlighted. Your score is saved at the end of the round.</p></div></div>
    </div>`;
  dialog.showModal();
}

function showStats() {
  const stats = getStats();
  dialogContent.innerHTML = `
    <div class="dialog-icon">${icon("chart")}</div>
    <h2>Your journey so far</h2>
    <p>Every round makes the world a little more familiar. Progress is saved in this browser.</p>
    <div class="stats-grid"><div class="stat-box"><strong>${stats.completed}</strong><span>Rounds</span></div><div class="stat-box"><strong>${stats.totalCorrect}</strong><span>Places found</span></div><div class="stat-box"><strong>${stats.bestStreak}</strong><span>Best streak</span></div></div>
    <div class="best-score-row"><span>Best state round</span><strong>${stats.best?.states || 0} / 10</strong></div>
    <div class="best-score-row"><span>Best city round</span><strong>${stats.best?.cities || 0} / 10</strong></div>
    ${stats.completed ? `<button class="text-button" data-action="reset-stats">Reset local progress</button>` : ""}`;
  dialog.showModal();
}

const actions = {
  home: renderRegions,
  "select-region": renderSetup,
  "select-mode": (element) => { selectedMode = element.dataset.mode; renderSetup(); },
  "start-quiz": () => startGame(),
  "state-answer": (element) => { if (game?.mode === "states") answerLocation(element.dataset.id); },
  "city-answer": (element) => { if (game?.mode === "cities") answerLocation(element.dataset.id); },
  "next-turn": nextTurn,
  "play-again": () => startGame(game.mode),
  "switch-mode": () => startGame(game.mode === "states" ? "cities" : "states"),
  "how-to": showHowTo,
  stats: showStats,
  "close-dialog": () => dialog.close(),
  "reset-stats": () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Ignore storage restrictions. */ }
    updateHeaderStats();
    dialog.close();
    showToast("Your local progress has been reset.");
  }
};

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;
  const action = actions[trigger.dataset.action];
  if (action) action(trigger);
});

document.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-action='state-answer'], [data-action='city-answer']")) {
    event.preventDefault();
    event.target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }
});

dialog.addEventListener("click", (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});

renderRegions();
