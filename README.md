# Atlas

A static geography quiz covering the United States, China, Europe, France, Brazil, and Africa.

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

Choose a map and quiz mode. Most rounds have 10 questions; Brazil’s regions mode asks all five regions once. After each answer, map labels appear and the correct location is highlighted. Progress is stored locally.

Brazil includes the five official regions, all 26 states and the Federal District, and their capitals. Africa includes country and capital modes for its 54 UN member countries. France covers metropolitan departments only. See `public/data/*-SOURCE.txt` for coverage, conventions, and attribution.
