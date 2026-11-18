const regionCatalog = {
  us: { id: "us", name: "United States", continent: "North America", unit: "state", plural: "states", citySingular: "city", cityPlural: "cities", data: window.ATLAS_DATA },
  china: { id: "china", name: "China", continent: "Asia", unit: "province", plural: "provinces", citySingular: "city", cityPlural: "cities", data: window.CHINA_ATLAS_DATA },
  europe: { id: "europe", name: "Europe", continent: "Europe", unit: "country", plural: "countries", citySingular: "capital", cityPlural: "capitals", data: window.EUROPE_ATLAS_DATA },
  france: { id: "france", name: "France", continent: "Europe", unit: "department", plural: "departments", citySingular: "chef-lieu", cityPlural: "chef-lieux", data: window.FRANCE_ATLAS_DATA },
  brazil: { id: "brazil", name: "Brazil", continent: "South America", unit: "federal unit", plural: "federal units", citySingular: "capital", cityPlural: "capitals", data: window.BRAZIL_ATLAS_DATA },
  africa: { id: "africa", name: "Africa", continent: "Africa", unit: "country", plural: "countries", citySingular: "capital", cityPlural: "capitals", data: window.AFRICA_ATLAS_DATA }
};
let activeRegion = regionCatalog.us;
let states = activeRegion.data.states;
let cities = activeRegion.data.cities;
let playableStates = states.filter((state) => state.isState);
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
const FALLBACK_MAP_VIEW = { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT };
let fullMapView = FALLBACK_MAP_VIEW;
let mapView = fullMapView;
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
  const scoreKey = `${game.region}-${game.mode}`;
  stats.best[scoreKey] = Math.max(stats.best[scoreKey] || 0, game.score);
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

function previewMap(data = activeRegion.data) {
  return `
    <svg viewBox="0 -4 975 620" aria-hidden="true">
      <g>${data.states.map((state) => `<path class="preview-state" d="${state.path}"/>`).join("")}</g>
      <g>${data.cities.map((city) => `<circle class="preview-city" cx="${city.coordinates[0]}" cy="${city.coordinates[1]}" r="3.2"/>`).join("")}</g>
    </svg>`;
}

function europeArt() {
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="m23 72 8-19 13-4 1-17 14-10 11 8 13-3 11 13-8 11 7 12-13 5-4 17-14 8-9-12-15 2-5-11Zm22-28 14 8 9-9m-27 31 16-8 12 9 12-14M31 53l15 5-5 16m35-44-4 13 14 8M23 92l8-5m55 13 6-9"/></svg>`;
}

function chinaArt() {
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="m18 57 13-16 15 1 9-17 17 7 13-3 8 13 12 7-6 14 5 12-17 4-5 17-17-2-9 9-11-14-15 2-5-13-12-6 9-9Zm22-15 12 15-7 18 11 14m16-64-3 23 18 9 12-8M31 41l9 16-15 15m44-24-17 9 5 20 25 2M18 57l22 0"/></svg>`;
}

function setRegion(id) {
  activeRegion = regionCatalog[id] || regionCatalog.us;
  states = activeRegion.data.states;
  cities = activeRegion.data.cities;
  playableStates = states.filter((state) => state.isState);
  selectedMode = quizModes()[0].id;
  fullMapView = FALLBACK_MAP_VIEW;
  mapView = fullMapView;
}

function quizModes(region = activeRegion) {
  const modes = [
    { id: "states", singular: region.unit, plural: region.plural, pool: region.data.states.filter((state) => state.isState) },
    { id: "cities", singular: region.citySingular, plural: region.cityPlural, pool: region.data.cities }
  ];
  if (region.data.macroregions?.length) {
    modes.unshift({ id: "macroregions", singular: "region", plural: "regions", pool: region.data.macroregions });
  }
  return modes;
}

function regionCard(id, number, data) {
  const config = regionCatalog[id];
  const count = data.states.filter((state) => state.isState).length;
  const label = config.plural;
  const cityPlural = config.cityPlural;
  return `<article class="region-card us-card ${id === "china" ? "china-card" : ""}">
    <div class="region-card-content"><span class="region-number">${number} / ${config.continent.toUpperCase()}</span>
      <span class="pill pill-ready">${icon("spark")} Available</span><h3>${config.name}</h3>
      <div class="region-tags">${data.macroregions?.length ? `<span class="region-tag">${data.macroregions.length} regions</span>` : ""}<span class="region-tag">${count} ${label}</span><span class="region-tag">${data.cities.length} ${cityPlural}</span></div>
      <button class="primary-button" data-action="select-region" data-region="${id}">Choose mode ${icon("arrow-right")}</button>
    </div><div class="us-map-preview">${previewMap(data)}<span class="preview-caption">${config.name}</span></div>
  </article>`;
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
        <div class="section-heading"><h2 id="region-heading">Choose a region</h2><span>${Object.keys(regionCatalog).length} regions available</span></div>
        <div class="region-grid region-pair">
          ${Object.values(regionCatalog).map((region, index) => regionCard(region.id, String(index + 1).padStart(2, "0"), region.data)).join("")}
        </div>
      </section>

      <section class="how-section" aria-labelledby="how-heading">
        <div class="section-heading"><h2 id="how-heading">How to play</h2><span>Three steps</span></div>
        <div class="how-grid">
          <div class="how-step"><span class="step-number">01</span><div><h3>Choose a mode</h3><p>Choose a boundary or city quiz.</p></div></div>
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
  const rounds = Math.min(quizModes().find((mode) => mode.id === selectedMode).pool.length, TOTAL_TURNS);
  app.innerHTML = `
    <div class="page-shell view setup-view">
      <button class="back-link" data-action="home">${icon("arrow-left")} All regions</button>
      <section class="setup-heading">
        <div class="eyebrow">Choose a mode</div>
        <h1><em>${activeRegion.name}</em></h1>
        <p>${quizModes().map((mode) => mode.plural).join(" · ")}</p>
      </section>
      <div class="setup-grid">
        <div class="setup-map-card">
          <span class="setup-map-label">${icon("map")} ${activeRegion.name}</span>
          ${previewMap()}
          <div class="setup-map-footer">
            <div class="map-legend"><span class="legend-item"><i class="legend-line"></i>${activeRegion.unit} boundary</span><span class="legend-item"><i class="legend-dot"></i>${activeRegion.citySingular}</span></div>
            <span>${playableStates.length} ${activeRegion.plural} · ${cities.length} ${activeRegion.cityPlural}</span>
          </div>
        </div>
        <section class="mode-panel" aria-labelledby="mode-title">
          <h2 id="mode-title">Choose your challenge</h2>
          <p>You can switch modes for your next round.</p>
          <div class="mode-options">
            ${quizModes().map((mode) => `<button class="mode-option ${selectedMode === mode.id ? "selected" : ""}" data-action="select-mode" data-mode="${mode.id}" aria-pressed="${selectedMode === mode.id}">
              <span class="mode-option-icon">${icon(mode.id === "cities" ? "pin" : "map")}</span>
              <span><strong>${mode.plural}</strong><small>${mode.pool.length} locations</small></span>
              <span class="mode-radio"></span>
            </button>`).join("")}
          </div>
          <div class="quiz-details"><span class="quiz-detail">${icon("target")} ${rounds} questions</span><span class="quiz-detail">${icon("clock")} No time limit</span></div>
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

function fitMapView() {
  const territory = document.querySelector(".quiz-map .map-territory");
  if (!territory) return FALLBACK_MAP_VIEW;
  const bounds = territory.getBBox();
  if (bounds.width <= 0 || bounds.height <= 0) return FALLBACK_MAP_VIEW;
  let left = bounds.x;
  let top = bounds.y;
  let right = bounds.x + bounds.width;
  let bottom = bounds.y + bounds.height;
  for (const { coordinates: [x, y] } of cities) {
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  const margin = Math.max(right - left, bottom - top) * 0.035;
  return { x: left - margin, y: top - margin, width: right - left + margin * 2, height: bottom - top + margin * 2 };
}

function clampMapWidth(width) {
  return Math.min(fullMapView.width, Math.max(fullMapView.width / 9, width));
}

function setMapView(view = fullMapView) {
  mapView = { ...view };
  const map = document.querySelector(".quiz-map");
  if (map) map.setAttribute("viewBox", `${mapView.x} ${mapView.y} ${mapView.width} ${mapView.height}`);
}

function zoomMap(factor, anchor) {
  const width = clampMapWidth(mapView.width * factor);
  if (width === fullMapView.width && factor > 1) return setMapView();
  const ratio = width / mapView.width;
  const center = anchor || { x: mapView.x + mapView.width / 2, y: mapView.y + mapView.height / 2 };
  const view = {
    width,
    height: mapView.height * ratio,
    x: center.x - (center.x - mapView.x) * ratio,
    y: center.y - (center.y - mapView.y) * ratio
  };
  setMapView(view);
}

function enableMapPan() {
  const canvas = document.querySelector(".map-canvas");
  if (!canvas) return;
  const pointers = new Map();
  let drag = null;
  let pinch = null;

  const mapPoint = (clientX, clientY, view) => {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(bounds.width / view.width, bounds.height / view.height);
    const offsetX = (bounds.width - view.width * scale) / 2;
    const offsetY = (bounds.height - view.height * scale) / 2;
    return { x: view.x + (clientX - bounds.left - offsetX) / scale, y: view.y + (clientY - bounds.top - offsetY) / scale };
  };
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  canvas.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".map-zoom-controls")) return;
    suppressMapClick = false;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      drag = { ...[...pointers.values()][0], view: { ...mapView }, moved: false };
    } else if (pointers.size === 2) {
      const [a, b] = pointers.values();
      const center = midpoint(a, b);
      pinch = { distance: Math.max(1, distance(a, b)), view: { ...mapView }, anchor: mapPoint(center.x, center.y, mapView) };
      for (const pointerId of pointers.keys()) canvas.setPointerCapture(pointerId);
      drag = null;
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2 && pinch) {
      const [a, b] = pointers.values();
      const center = midpoint(a, b);
      const width = clampMapWidth(pinch.view.width * pinch.distance / Math.max(1, distance(a, b)));
      const height = pinch.view.height * width / pinch.view.width;
      const bounds = canvas.getBoundingClientRect();
      const scale = Math.min(bounds.width / width, bounds.height / height);
      const pointX = (center.x - bounds.left - (bounds.width - width * scale) / 2) / scale;
      const pointY = (center.y - bounds.top - (bounds.height - height * scale) / 2) / scale;
      setMapView({ width, height, x: pinch.anchor.x - pointX, y: pinch.anchor.y - pointY });
      canvas.classList.add("is-panning");
      return;
    }
    if (!drag) return;
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(bounds.width / drag.view.width, bounds.height / drag.view.height);
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    // Measure tap tolerance on the screen so zoom level doesn't change it.
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
    if (drag.moved) {
      canvas.classList.add("is-panning");
      setMapView({ ...drag.view, x: drag.view.x - dx / scale, y: drag.view.y - dy / scale });
    }
  });

  const endPointer = (event) => {
    pointers.delete(event.pointerId);
    const moved = Boolean(drag?.moved || pinch);
    if (pinch) pinch = null;
    if (moved) {
      suppressMapClick = true;
      setTimeout(() => { suppressMapClick = false; }, 0);
    }
    drag = pointers.size === 1 ? { ...[...pointers.values()][0], view: { ...mapView }, moved: false } : null;
    if (!pointers.size) canvas.classList.remove("is-panning");
  };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
}

function mapLabels(question) {
  if (!game.answered) return "";
  const stateLabels = (game.mode === "macroregions" ? game.pool : playableStates).map((state) => {
    const layout = stateLabelLayout[state.name];
    const [cx, cy] = state.centroid;
    const x = layout?.x ?? cx;
    const y = layout?.y ?? cy;
    const targetClass = state.id === question.id && game.mode !== "cities" ? "target-label" : "";
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
  const boundaryMode = game.mode !== "cities";
  const statePaths = (game.mode === "macroregions" ? game.pool : states).map((state) => {
    const isCorrect = game.answered && boundaryMode && state.id === question.id;
    const isIncorrect = game.answered && boundaryMode && state.id === game.selected && !game.answers.at(-1).correct;
    const isDimmed = game.answered && boundaryMode && !isCorrect && !isIncorrect;
    const classes = ["state-shape", state.isState ? "is-state" : "is-dc", isCorrect ? "correct" : "", isIncorrect ? "incorrect" : "", isDimmed ? "dimmed" : ""].join(" ");
    const interactive = boundaryMode && state.isState && !game.answered;
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
  return `<svg class="quiz-map ${boundaryMode ? "states" : "cities"}-mode ${game.answered ? "map-answered" : ""}" viewBox="${mapView.x} ${mapView.y} ${mapView.width} ${mapView.height}" role="group" aria-label="Interactive map of ${activeRegion.name}">
    <g class="map-territory">${statePaths}</g><g>${cityMarkers}</g>${mapLabels(question)}
  </svg>`;
}

function startGame(mode = selectedMode) {
  const config = quizModes().find((option) => option.id === mode);
  if (!config) return;
  selectedMode = mode;
  const { pool } = config;
  game = {
    region: activeRegion.id,
    mode,
    config,
    pool,
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
  const question = game.questions[game.turn];
  const selection = game.pool.find((item) => item.id === id);
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
  const locationPlural = game.config.plural;
  const latestAnswer = game.answers.at(-1);
  const totalTurns = game.questions.length;
  const isLastTurn = game.turn === totalTurns - 1;
  const progress = Array.from({ length: totalTurns }, (_, index) => {
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
        <div class="quiz-title-group"><h1>${activeRegion.name}</h1><span class="mode-badge">${icon(game.mode === "cities" ? "pin" : "map")} ${locationPlural} mode</span></div>
        <button class="back-link" data-action="home">${icon("arrow-left")} Leave quiz</button>
      </div>
      <div class="game-grid">
        <section class="map-card" aria-label="Quiz map">
          <div class="map-toolbar">
            <span class="map-instruction">${icon("target")} ${game.answered ? "Answer revealed" : `Select ${game.mode === "cities" ? `a ${game.config.singular} dot` : `a ${game.config.singular}`}`}</span>
            <div class="map-zoom-controls" role="group" aria-label="Map zoom">
              <button class="map-zoom-button" data-action="zoom-in" aria-label="Zoom in">+</button>
              <button class="map-zoom-button" data-action="zoom-out" aria-label="Zoom out">−</button>
              <button class="map-zoom-button zoom-reset" data-action="zoom-reset">Full map</button>
            </div>
          </div>
          <div class="map-canvas">${quizMap(question)}</div>
          <div class="map-bottom"><div class="map-legend"><span class="legend-item"><i class="legend-line"></i>${game.mode === "macroregions" ? game.config.singular : activeRegion.unit} boundary</span><span class="legend-item"><i class="legend-dot"></i>${activeRegion.citySingular}</span></div><span class="map-bottom-note">${game.answered ? "Labels revealed · Correct answer highlighted" : "Labels appear after your answer"}</span></div>
        </section>
        <aside class="question-column">
          <section class="question-card">
            <div class="question-meta"><span>Question <strong>${String(game.turn + 1).padStart(2, "0")}</strong> of ${totalTurns}</span><span>${game.config.singular} finder</span></div>
            <div class="turn-progress" style="grid-template-columns: repeat(${totalTurns}, 1fr)" aria-label="Question ${game.turn + 1} of ${totalTurns}">${progress}</div>
            <p class="question-kicker">Where is...</p>
            <h2 class="question-name">${question.name}</h2>
            <p class="question-prompt">${game.mode === "cities" ? `Find the red ${game.config.singular} dot on the map.` : `Find the ${game.config.singular} on the map.`}</p>
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
  fullMapView = fitMapView();
  setMapView(game.answered ? mapView : fullMapView);
  enableMapPan();
}

function nextTurn() {
  if (!game?.answered) return;
  if (game.turn === game.questions.length - 1) {
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
  const totalTurns = game.questions.length;
  const title = "Quiz <em>results</em>";
  const subtitle = "Review your answers below.";
  app.innerHTML = `
    <div class="page-shell view results-view">
      <section class="results-card">
        <div class="results-badge">${icon("trophy")}</div>
        <div class="eyebrow">Round complete · ${activeRegion.name}</div>
        <h1>${title}</h1>
        <p class="results-subtitle">${subtitle}</p>
        <div class="results-summary">
          <div class="score-ring" style="--score-angle: ${score / totalTurns * 360}deg"><div class="score-ring-content"><strong>${score}</strong><span> / ${totalTurns}</span></div></div>
          <div class="result-stats">
            <div class="result-stat"><span>Accuracy</span><strong>${Math.round(score / totalTurns * 100)}%</strong></div>
            <div class="result-stat"><span>Best streak</span><strong>${game.bestStreak}</strong></div>
            <div class="result-stat"><span>Mode</span><strong>${game.config.plural}</strong></div>
            <div class="result-stat"><span>Places learned</span><strong>${score}</strong></div>
          </div>
        </div>
        <div class="result-actions">
          <button class="primary-button" data-action="play-again">${icon("refresh")} Play again</button>
          ${quizModes().filter((mode) => mode.id !== game.mode).map((mode) => `<button class="secondary-button" data-action="switch-mode" data-mode="${mode.id}">${icon(mode.id === "cities" ? "pin" : "map")} Try ${mode.plural}</button>`).join("")}
          <button class="text-button" data-action="home">Back to regions</button>
        </div>
        <div class="review-section">
          <div class="review-heading"><h2>Answers</h2><span>${score} correct · ${totalTurns - score} incorrect</span></div>
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
      <div class="dialog-step"><span class="dialog-step-number">1</span><div><strong>Choose a region and mode</strong><p>Choose a map and one of its quiz modes.</p></div></div>
      <div class="dialog-step"><span class="dialog-step-number">2</span><div><strong>Select a location</strong><p>Each round has up to ten questions. Select the matching area or red dot.</p></div></div>
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
    ${Object.values(regionCatalog).flatMap((region) => quizModes(region).map((mode) => `<div class="best-score-row"><span>${region.name} · ${mode.plural}</span><strong>${stats.best?.[`${region.id}-${mode.id}`] || 0} / ${Math.min(mode.pool.length, TOTAL_TURNS)}</strong></div>`)).join("")}
    ${stats.completed ? `<button class="text-button" data-action="reset-stats">Reset local progress</button>` : ""}`;
  dialog.showModal();
}

const actions = {
  home: renderRegions,
  "zoom-in": () => zoomMap(0.75),
  "zoom-out": () => zoomMap(1 / 0.75),
  "zoom-reset": () => setMapView(),
  "select-region": (element) => { setRegion(element.dataset.region); renderSetup(); },
  "select-mode": (element) => { selectedMode = element.dataset.mode; renderSetup(); },
  "start-quiz": () => startGame(),
  "state-answer": (element) => { if (game && game.mode !== "cities") answerLocation(element.dataset.id); },
  "city-answer": (element, event) => {
    if (game?.mode !== "cities") return;
    if (!event.detail) return answerLocation(element.dataset.id);
    const map = element.ownerSVGElement;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(map.getScreenCTM().inverse());
    let nearest = element.dataset.id;
    let bestDistance = Infinity;
    for (const city of game.pool) {
      const distance = Math.hypot(city.coordinates[0] - point.x, city.coordinates[1] - point.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = city.id;
      }
    }
    answerLocation(nearest);
  },
  "next-turn": nextTurn,
  "play-again": () => startGame(game.mode),
  "switch-mode": (element) => startGame(element.dataset.mode),
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
  if (action) action(trigger, event);
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
