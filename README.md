# Speed Champions 🏁

A web application for tracking and analyzing karting race results, built to help drivers improve their performance through detailed statistics and insights.

**Live Site:** [https://karts.tiago-coutinho.com](https://karts.tiago-coutinho.com)

## Overview

Speed Champions turns race timing sheets into results, standings and lap time analysis. Upload a photo of the timing sheet, and the results are presented the way race broadcasts show them: timing towers, gaps to the leader and colour-coded lap times.

## Key Features

### 📸 Smart Race Upload
Upload a photo of the timing sheet and AI-powered OCR extracts every driver's laps. Check and correct the lap times, pick the circuit and date, and save.

### 🏠 Home
- The latest race and each championship's standings, rotating every few seconds
- Season numbers: races run, laps timed, drivers and championships
- Recent race days, track records, days since the last race and races per year

### 🏁 Race Results
- Classification as a timing tower, with the gap to the leader
- Fastest lap, best average and laps timed for each race
- Lap-by-lap pace chart and lap chart. The pace chart's scale adjusts to the drivers you select
- Timing colours: **purple** for the fastest lap of the race, **green** for the fastest on each lap, **cyan** for the best average

### 🏆 Championships
Group races into championships with points for the fastest lap (10, 6, 4, 3, 2) and the best average (9, 5, 3, 2, 1), plus a 2-point bonus when one driver takes both in the same race. Each championship shows a podium, the standings and how the points evolved race by race.

### 📊 Leaderboard
All-time and last-12-months rankings for fastest lap and best average, filterable by circuit, with a podium for the top three.

### 👥 Driver Profiles
Best lap, best average, races and laps driven, race history and lap time evolution, overall or per circuit.

### 🗺️ Circuits
Track layout drawings, lap records, race history and how the fastest and average laps have evolved at each circuit.

### 📱 Mobile First
Every page is designed for phones as well as desktop, with a bottom tab bar on mobile.

## Technology Stack

- **React** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling, with **shadcn/ui** components
- **TanStack Query** - Data fetching and caching
- **Recharts** - Charts
- **Saira** (Google Fonts) - Typography

## Backend

This frontend connects to a Django REST API backend.

**Backend Repository:** [https://github.com/COU7INHO/karst-app-backend](https://github.com/COU7INHO/karst-app-backend)

## Getting Started

```bash
# Clone and install
git clone https://github.com/COU7INHO/karts-app-frontend.git
cd karts-app-frontend
npm install

# Run development server (http://localhost:8080)
npm run dev
```

By default the app talks to the production API (`VITE_API_URL` in `.env`). To work against a backend running locally, create a `.env.local` file, which is ignored by git:

```bash
VITE_API_URL=http://localhost:8000
```

Other scripts:

```bash
npm run build   # Production build
npm run test    # Unit tests (Vitest)
npm run lint    # ESLint
```

## Project Structure

```
karts-app-frontend/
├── src/
│   ├── components/
│   │   ├── home/       # Home page sections (rotating hero, season stats)
│   │   ├── racing/     # Racing UI: timing tower, podium, page header, charts
│   │   └── ui/         # shadcn/ui primitives
│   ├── contexts/       # React context providers (Auth)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API client, lap time and race helpers, asset maps
│   ├── pages/          # Page components (routes)
│   └── main.tsx        # Application entry point
├── public/
│   ├── brand/          # Site logo, podium and home artwork
│   ├── championships/  # Championship logos
│   └── circuits/       # Track layout drawings
└── index.html          # HTML template
```

### Adding a championship logo or circuit drawing

Logos and track drawings are static files matched to the backend by id:

1. Add the image (WebP with a transparent background) to `public/championships/` or `public/circuits/`.
2. Map it to the championship or circuit id in `src/lib/championshipLogos.ts` or `src/lib/circuitLayouts.ts`.

Championships and circuits without an entry show no image.

## Contributing

This is a personal project, but suggestions and feedback are welcome! Feel free to open an issue for bugs or feature requests.

## License

Private project - All rights reserved

---

**Live Application:** [karts.tiago-coutinho.com](https://karts.tiago-coutinho.com)

*Track. Analyze. Improve. Race faster with Speed Champions.* 🏎️💨
