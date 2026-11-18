# Atlas

A static, dependency-free geography quiz interface. The current release includes the United States with 50 clickable states and 30 major cities.

## Run locally

```sh
npm install
npm run dev
```

## Build for static hosting

```sh
npm run build
```

Deploy the generated `dist` directory to any static host. No API keys, backend, or runtime map services are required.

## Gameplay

Choose the United States, select **States** or **Cities**, and complete ten randomized questions. Click the matching state or red city dot. After each answer, the map reveals state and city names and highlights the correct location. Results and quiz counts are stored locally in the browser.

US state geometry is derived from `us-atlas` / US Census Bureau data and is included locally in `public/data/us-data.js`.
