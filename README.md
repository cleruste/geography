# Atlas

A static geography quiz covering the United States, China, Europe, and France.

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

Choose a region and take a 10-question boundary or city quiz. After each answer, map labels appear and the correct location is highlighted. Progress is stored locally.

The quiz includes 50 US states, 34 Chinese province-level regions, 50 European countries, and 96 metropolitan French departments. France data excludes overseas departments. See the `public/data/*-SOURCE.txt` files for data sources and attribution.
