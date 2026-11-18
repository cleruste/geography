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
const MAP_WIDTH = 975;
const MAP_HEIGHT = 610;
let mapView = { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT };
let suppressMapClick = false;

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
          <div class="eyebrow">Geography quiz</div>
          <h1 class="hero-title">Explore <em>geography.</em></h1>
          <p class="hero-subtitle">Choose a region and find places on the map.</p>
        </div>
        <div class="hero-note">
          <span class="hero-note-icon">${icon("globe")}</span>
          <div><strong>Regions</strong><span>More regions coming soon</span></div>
        </div>
      </section>

      <section aria-labelledby="region-heading">
        <div class="section-heading"><h2 id="region-heading">Choose a region</h2><span>1 region available</span></div>
        <div class="region-grid">
          <article class="region-card us-card">
            <div class="region-card-content">
              <span class="region-number">01 / NORTH AMERICA</span>
              <span class="pill pill-ready">${icon("spark")} Available</span>
              <h3>United<br>States</h3>
              <p>Find states and cities on the map.</p>
              <div class="region-tags"><span class="region-tag">50 states</span><span class="region-tag">${cities.length} cities</span></div>
              <button class="primary-button" data-action="select-region">Choose mode ${icon("arrow-right")}</button>
            </div>
            <div class="us-map-preview">${previewMap()}<span class="preview-caption">United States map</span></div>
          </article>
          <div class="coming-soon-column">
            <article class="region-card small-region-card">
              <div class="region-card-content">
                <span class="region-number">02 / EUROPE</span>
                <span class="pill pill-soon">${icon("lock")} Coming soon</span>
                <h3>Europe</h3>
                <p>Not yet available.</p>
              </div>
              <div class="small-region-art">${europeArt()}</div>
            </article>
            <article class="region-card small-region-card">
              <div class="region-card-content">
                <span class="region-number">03 / ASIA</span>
                <span class="pill pill-soon">${icon("lock")} Coming soon</span>
                <h3>China</h3>
                <p>Not yet available.</p>
              </div>
              <div class="small-region-art">${chinaArt()}</div>
            </article>
          </div>
        </div>
        <div class="more-regions">${icon("globe")} More regions coming soon.</div>
      </section>

      <section class="how-section" aria-labelledby="how-heading">
        <div class="section-heading"><h2 id="how-heading">How to play</h2><span>Three steps</span></div>
        <div class="how-grid">
          <div class="how-step"><span class="step-number">01</span><div><h3>Choose a mode</h3><p>Choose states or cities.</p></div></div>
          <div class="how-step"><span class="step-number">02</span><div><h3>Find the place</h3><p>Read the place name and select it on the map.</p></div></div>
          <div class="how-step"><span class="step-number">03</span><div><h3>Review the answer</h3><p>Labels appear after each answer.</p></div></div>
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
        <div class="eyebrow">Choose a mode</div>
        <h1>United <em>States</em></h1>
        <p>Find states or cities on the map.</p>
      </section>
      <div class="setup-grid">
        <div class="setup-map-card">
          <span class="setup-map-label">${icon("map")} United States</span>
          ${previewMap()}
          <div class="setup-map-footer">
            <div class="map-legend"><span class="legend-item"><i class="legend-line"></i>State boundary</span><span class="legend-item"><i class="legend-dot"></i>Major city</span></div>
            <span>50 states · ${cities.length} cities</span>
          </div>
        </div>
        <section class="mode-panel" aria-labelledby="mode-title">
          <h2 id="mode-title">Choose your challenge</h2>
          <p>You can switch modes for your next round.</p>
          <div class="mode-options">
            <button class="mode-option ${selectedMode === "states" ? "selected" : ""}" data-action="select-mode" data-mode="states" aria-pressed="${selectedMode === "states"}">
              <span class="mode-option-icon">${icon("map")}</span>
              <span><strong>Find the state</strong><small>Locate the 50 states.</small></span>
              <span class="mode-radio"></span>
            </button>
            <button class="mode-option ${selectedMode === "cities" ? "selected" : ""}" data-action="select-mode" data-mode="cities" aria-pressed="${selectedMode === "cities"}">
              <span class="mode-option-icon">${icon("pin")}</span>
              <span><strong>Find the city</strong><small>Locate ${cities.length} cities.</small></span>
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

function setMapView(view = { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT }) {
  mapView = { ...view };
  const map = document.querySelector(".quiz-map");
  if (map) map.setAttribute("viewBox", `${mapView.x} ${mapView.y} ${mapView.width} ${mapView.height}`);
}

function focusQuestion(question) {
  const item = (game.mode === "states" ? playableStates : cities).find((entry) => entry.id === question.id);
  if (!item) return setMapView();
  const point = game.mode === "states" ? item.centroid : item.coordinates;
  const width = game.mode === "states" ? 420 : 360;
  const height = width * MAP_HEIGHT / MAP_WIDTH;
  setMapView({ x: point[0] - width / 2, y: point[1] - height / 2, width, height });
}

function zoomMap(factor, anchor) {
  const minWidth = 110;
  const maxWidth = MAP_WIDTH;
  const width = Math.min(maxWidth, Math.max(minWidth, mapView.width * factor));
  const ratio = width / mapView.width;
  const center = anchor || { x: mapView.x + mapView.width / 2, y: mapView.y + mapView.height / 2 };
  const view = {
    width,
    height: width * MAP_HEIGHT / MAP_WIDTH,
    x: center.x - (center.x - mapView.x) * ratio,
    y: center.y - (center.y - mapView.y) * ratio
  };
  setMapView(view);
}

function enableMapPan() {
  const canvas = document.querySelector(".map-canvas");
  if (!canvas) return;
  let drag = null;
  canvas.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".map-zoom-controls") || !event.isPrimary) return;
    suppressMapClick = false;
    drag = { x: event.clientX, y: event.clientY, view: { ...mapView }, moved: false };
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const map = canvas.querySelector(".quiz-map");
    const bounds = map.getBoundingClientRect();
    const scale = Math.min(bounds.width / drag.view.width, bounds.height / drag.view.height);
    const dx = (event.clientX - drag.x) / scale;
    const dy = (event.clientY - drag.y) / scale;
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
    if (drag.moved) {
      canvas.classList.add("is-panning");
      setMapView({ ...drag.view, x: drag.view.x - dx, y: drag.view.y - dy });
    }
  });
  const endPan = () => {
    if (!drag) return;
    if (drag.moved) {
      suppressMapClick = true;
      setTimeout(() => { suppressMapClick = false; }, 0);
    }
    drag = null;
    canvas.classList.remove("is-panning");
  };
  canvas.addEventListener("pointerup", endPan);
  canvas.addEventListener("pointercancel", endPan);
}

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
  const occupied = [];
  const cityLabels = cities.map((city) => {
    const [cx, cy] = city.coordinates;
    const preferred = cityLabelLayout[city.name];
    const candidates = preferred ? [preferred] : [];
    for (const distance of [12, 18, 25, 34, 45, 58, 72]) {
      candidates.push(
        { dx: distance, dy: -8, anchor: "start" },
        { dx: -distance, dy: -8, anchor: "end" },
        { dx: distance, dy: 13, anchor: "start" },
        { dx: -distance, dy: 13, anchor: "end" },
        { dx: 0, dy: -distance, anchor: "middle" },
        { dx: 0, dy: distance, anchor: "middle" }
      );
    }
    const labelWidth = Math.max(14, city.name.length * 4.5);
    let placement = candidates.find((candidate) => {
      const x = cx + candidate.dx;
      const y = cy + candidate.dy;
      const box = {
        left: candidate.anchor === "end" ? x - labelWidth : candidate.anchor === "middle" ? x - labelWidth / 2 : x,
        right: candidate.anchor === "end" ? x : candidate.anchor === "middle" ? x + labelWidth / 2 : x + labelWidth,
        top: y - 10,
        bottom: y + 3
      };
      const clear = occupied.every((other) => box.right + 3 < other.left || box.left - 3 > other.right || box.bottom + 2 < other.top || box.top - 2 > other.bottom);
      if (clear) { occupied.push(box); return true; }
      return false;
    });
    if (!placement) placement = preferred || { dx: 8, dy: -8, anchor: "start" };
    const x = cx + placement.dx;
    const y = cy + placement.dy;
    const leader = Math.hypot(placement.dx, placement.dy) > 22 ? `<path class="label-leader" d="M${cx} ${cy} L${x} ${y - 3}"/>` : "";
    const targetClass = city.id === question.id && game.mode === "cities" ? "target-label" : "";
    return `${leader}<text class="city-label ${targetClass}" x="${x}" y="${y}" text-anchor="${placement.anchor || "start"}">${city.name}</text>`;
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
      <circle class="city-halo" cx="${x}" cy="${y}" r="11"/><circle class="city-hit" cx="${x}" cy="${y}" r="18"/><circle class="city-dot" cx="${x}" cy="${y}" r="3.4"/>
    </g>`;
  }).join("");
  return `<svg class="quiz-map ${game.mode}-mode ${game.answered ? "map-answered" : ""}" viewBox="${mapView.x} ${mapView.y} ${mapView.width} ${mapView.height}" role="group" aria-label="Interactive map of the United States">
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
      <div><strong>${latestAnswer.correct ? "Correct" : "Incorrect"}</strong><p>${latestAnswer.correct ? `You found ${question.name}.` : `You chose ${latestAnswer.selected}. ${question.name} is highlighted on the map.`}</p></div>
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
          <div class="map-canvas">
            ${quizMap(question)}
            <div class="map-zoom-controls" role="group" aria-label="Map zoom">
              <button class="map-zoom-button" data-action="zoom-in" aria-label="Zoom in">+</button>
              <button class="map-zoom-button" data-action="zoom-out" aria-label="Zoom out">−</button>
              <button class="map-zoom-button zoom-reset" data-action="zoom-reset">Full map</button>
            </div>
          </div>
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
  if (game.answered) setMapView(mapView);
  else focusQuestion(question);
  enableMapPan();
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
  const title = "Quiz <em>results</em>";
  const subtitle = "Review your answers below.";
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
          <div class="review-heading"><h2>Answers</h2><span>${score} correct · ${TOTAL_TURNS - score} incorrect</span></div>
          <div class="review-list">${game.answers.map((answer) => `<div class="review-item ${answer.correct ? "correct" : "incorrect"}" title="${answer.correct ? answer.question : `You chose ${answer.selected}`}"><span class="review-status">${icon(answer.correct ? "check" : "close")}</span><span>${answer.question}</span></div>`).join("")}</div>
        </div>
      </section>
    </div>`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHowTo() {
  dialogContent.innerHTML = `
    <div class="dialog-icon">${icon("map")}</div>
    <h2>How to play</h2>
    <p>There is no timer or sign-up.</p>
    <div class="dialog-steps">
      <div class="dialog-step"><span class="dialog-step-number">1</span><div><strong>Choose a region and mode</strong><p>Choose the United States, then select its 50 states or ${cities.length} cities.</p></div></div>
      <div class="dialog-step"><span class="dialog-step-number">2</span><div><strong>Select a location</strong><p>Each round has ten randomized questions. Click the matching state boundary or red city dot.</p></div></div>
      <div class="dialog-step"><span class="dialog-step-number">3</span><div><strong>Review your answer</strong><p>After every answer, all map labels appear and the correct location is highlighted. Your score is saved at the end of the round.</p></div></div>
    </div>`;
  dialog.showModal();
}

function showStats() {
  const stats = getStats();
  dialogContent.innerHTML = `
    <div class="dialog-icon">${icon("chart")}</div>
    <h2>Your progress</h2>
    <p>Progress is saved in this browser.</p>
    <div class="stats-grid"><div class="stat-box"><strong>${stats.completed}</strong><span>Rounds</span></div><div class="stat-box"><strong>${stats.totalCorrect}</strong><span>Places found</span></div><div class="stat-box"><strong>${stats.bestStreak}</strong><span>Best streak</span></div></div>
    <div class="best-score-row"><span>Best state round</span><strong>${stats.best?.states || 0} / 10</strong></div>
    <div class="best-score-row"><span>Best city round</span><strong>${stats.best?.cities || 0} / 10</strong></div>
    ${stats.completed ? `<button class="text-button" data-action="reset-stats">Reset local progress</button>` : ""}`;
  dialog.showModal();
}

const actions = {
  home: renderRegions,
  "zoom-in": () => zoomMap(0.75),
  "zoom-out": () => zoomMap(1 / 0.75),
  "zoom-reset": () => setMapView(),
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
  if (suppressMapClick && event.target.closest(".map-canvas")) {
    suppressMapClick = false;
    event.preventDefault();
    return;
  }
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
