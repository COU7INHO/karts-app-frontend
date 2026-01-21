# Speed Champions 🏁

A modern web application for tracking and analyzing karting race results, built to help drivers improve their performance through detailed statistics and insights.

**Live Site:** [https://karts.tiago-coutinho.com](https://karts.tiago-coutinho.com)

## Overview

Speed Champions transforms race timing sheets into actionable insights. Upload race results, track driver performance over time, and discover patterns that lead to faster lap times. Whether you're competing with friends or training for competitions, Speed Champions provides the analytics you need to stay ahead of the pack.

## Key Features

### 📸 Smart Race Upload
Upload race timing sheet images and let AI-powered OCR automatically extract results. No more manual data entry—just snap a photo and go.

### 👥 Driver Profiles
Track individual driver statistics including:
- Total races and laps completed
- Performance evolution over time
- Personal best lap times
- Average lap time trends
- Complete race history

### 🏆 Leaderboards
View real-time rankings across all drivers. See who's dominating the track and where you stand in the competition.

### 📊 Performance Analytics
- **Evolution Charts**: Visualize lap time improvements across races
- **Driver Comparisons**: Compare up to 4 drivers side-by-side
- **Circuit-Specific Stats**: Filter performance by specific tracks
- **Historical Trends**: Track progress over time

### 🗺️ Circuit Management
Organize races by circuit, track venue-specific records, and analyze performance at different tracks.

### 📱 Responsive Design
Access your race data anywhere—desktop, tablet, or mobile. The interface adapts seamlessly to any screen size.

## Technology Stack

- **React** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **TanStack Query** - Data fetching
- Built with [Lovable](https://lovable.dev)

## Backend

This frontend connects to a Django REST API backend.

**Backend Repository:** [https://github.com/COU7INHO/karst-app-backend](https://github.com/COU7INHO/karst-app-backend)

## Getting Started

```bash
# Clone and install
git clone https://github.com/COU7INHO/speedway-stats.git
cd speedway-stats
npm install

# Run development server
npm run dev
```

## Project Structure

```
speedway-stats/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context providers (Auth, etc)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API client and utilities
│   ├── pages/          # Page components (routes)
│   └── main.tsx        # Application entry point
├── public/             # Static assets
└── index.html          # HTML template
```

## Contributing

This is a personal project, but suggestions and feedback are welcome! Feel free to open an issue for bugs or feature requests.

## License

Private project - All rights reserved

---

**Live Application:** [karts.tiago-coutinho.com](https://karts.tiago-coutinho.com)

*Track. Analyze. Improve. Race faster with Speed Champions.* 🏎️💨
