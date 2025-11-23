# Crypto Tracker Pro

A fully client-side, real-time cryptocurrency dashboard built with **HTML, CSS, and JavaScript** using public APIs. Designed as an advanced frontend project demonstrating API integration, responsive UI, data visualization, and PWA support.

## Features

- Live market data from **CoinGecko API**
- Top coins **ticker strip**
- Search with **auto-suggestions**
- **Voice search** (Web Speech API, browser-supported)
- Favorite coins (saved in **localStorage**)
- Filter: All coins / Favorites
- **Compare** exactly 2 coins side-by-side
- Detailed coin modal with:
  - 24h change
  - Market rank
  - High/low, ATH/ATL, market cap
  - 7-day **line chart** (Chart.js)
- Per-card 7-day **sparkline mini chart**
- **Portfolio mode**: track holdings, current value, and P/L
- Skeleton loading for a professional feel
- Global **crypto news feed** (CoinStats API)
- Fully responsive layout (mobile, tablet, desktop)
- **PWA**: installable as an app + basic offline caching

## Tech Stack

- HTML5
- Modern CSS3 (flexbox, grid, animations, responsive)
- Vanilla JavaScript (ES6+)
- Chart.js (via CDN)
- Public APIs:
  - CoinGecko (market + coin details + chart)
  - CoinStats (news)
- PWA: manifest + service worker

## How to Run Locally

1. Download or clone this repository.
2. Open `index.html` directly in a modern browser (Chrome/Edge/Brave/etc).
3. Ensure you are **online** so API calls work.
4. Optionally host via any static hosting (GitHub Pages, Netlify, Vercel).

## GitHub Pages Deployment

1. Push these files to a GitHub repository.
2. In the repo settings, enable **GitHub Pages** (source: `main` / `root`).
3. Wait for deployment and open the GitHub Pages URL.

## Notes

- No backend is used; everything runs in the browser.
- API rate limits depend on the free tier of CoinGecko and CoinStats.
- Voice search availability depends on browser support.
