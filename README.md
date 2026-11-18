# Atlas

A static geography quiz covering the United States and China.

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

Choose either region and select its provinces/states or cities mode. Each round has ten randomized questions. Click a boundary or red city dot; after each answer, labels appear and the correct location is highlighted. Results are stored locally in the browser.

US state geometry is derived from `us-atlas` / US Census Bureau data (`public/data/us-data.js`). China admin-1 boundaries are from geoBoundaries, licensed CC BY 4.0; attribution is in `public/data/CHINA-DATA-SOURCE.txt`.
