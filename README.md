<div align="center">

# 🌦 WeatherLens
### A Modern Real-Time Weather Dashboard

![WeatherLens](https://img.shields.io/badge/WeatherLens-Weather%20Dashboard-4A90E2?style=for-the-badge&logo=cloud&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![API](https://img.shields.io/badge/API-Open--Meteo-FF9800?style=for-the-badge&logo=cloud&logoColor=white)
![Charts](https://img.shields.io/badge/Charts-Recharts-8884d8?style=for-the-badge)
![Date](https://img.shields.io/badge/Date-date--fns-6C63FF?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Hosted-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**Real-time weather insights · GPS-based location · Interactive charts**

[🌐 Live Demo](https://weather-lens-omega.vercel.app/) 

</div>
## ✨ Core Features (As Per Requirements)

### 📍 Page 1 — Current Weather & Hourly Forecast

- **Auto GPS detection** on page load — browser requests location permission on landing; falls back to New Delhi if denied
- **Date picker** — view weather data for today (default) or any past date via calendar
- **Temperature toggle** — switch between °C and °F; applies to both the stat card and the hourly chart simultaneously

#### Individual Weather Variables (all displayed as stat cards)

| Category | Variables |
|---|---|
| Temperature | Current, Maximum, Minimum |
| Atmospheric | Precipitation, Relative Humidity, UV Index |
| Sun Cycle | Sunrise time, Sunset time |
| Wind & Air | Max Wind Speed (km/h), Precipitation Probability Max |
| Air Quality | AQI, PM10, PM2.5, CO, CO₂, NO₂, SO₂ |

#### Hourly Charts (6 individual charts, all plotted at hourly intervals)

1. **Temperature** — with °C/°F toggle
2. **Relative Humidity**
3. **Precipitation**
4. **Visibility** (converted from metres → km)
5. **Wind Speed (10m)**
6. **PM10 & PM2.5** — combined dual-line chart

---

### 📅 Page 2 — Historical Date Range (Max 2 Years)

- Date range pickers with automatic **2-year cap enforcement**
- Quick range buttons: **1M · 3M · 6M · 1Y · 2Y**

#### Historical Charts

| Chart | Type | Reason for Chart Type |
|---|---|---|
| Temperature — Mean, Max, Min | Line | Trends over time are best shown as continuous lines |
| Sun Cycle — Sunrise & Sunset (IST) | Line | Gradual daily shift best shown as a curve |
| Precipitation — Daily Totals | Bar | Discrete daily totals are clearest as bars |
| Wind — Max Speed + Dominant Direction | Line + compass table | Speed as line; direction as compass label grid |
| Air Quality — PM10 & PM2.5 | Line | Trend/pollution patterns over time |

---

### 📊 Chart Interactions (All Charts)

- **Horizontal Scrolling** — handles dense 24-hour and multi-year datasets on any screen
- **Click & Drag Zoom** — select any region to zoom in; `Reset Zoom` button to return
- **Brush Slider** — secondary scroll/zoom control at chart bottom
- **Tooltips** — hover for exact values with units

---

## ✨ UX Enhancements (Self Added beyond Requirements)

These features were added by myself to improve the user experience and demonstrate initiative. Each one solves a real usability problem:

### 🌗 Dark / Light Theme Toggle
**What:** A sliding pill toggle in the navbar switches between dark (default) and light themes instantly.  
**Why:** Weather apps are used at all times of day. A light theme is more comfortable in bright sunlight; dark is easier on the eyes at night. Theme preference is saved in `localStorage` so it persists across page refreshes.  
**How:** `ThemeContext.jsx` sets `data-theme="light"` on the `<html>` element. All colours are CSS variables — the entire app re-colours with a 0.3s transition, no JS re-render needed.

---

### 🌍 City Search Box (Location Override)
**What:** A search box in the navbar lets users type any city name and select from a dropdown of results.  
**Why:** GPS detection only works once on load and gives the user's current location. If someone wants to check the weather in Mumbai, London, or any other city, they previously had no way to do that. City search makes the app genuinely useful for checking weather anywhere in the world.  
**How:** Uses the **Open-Meteo Geocoding API** (free, no key). Input is debounced by 350ms to avoid excessive API calls. Selecting a result updates `coords` and `locationName` globally via `WeatherContext`, triggering an immediate data re-fetch for the new location. GPS auto-detect still runs on load — the search box is an override, not a replacement.

---

### 🏠 Hero Banner with Greeting & Day Summary
**What:** A prominent banner at the top of Page 1 showing:
- Time-aware greeting: **Good Morning / Good Afternoon / Good Evening / Good Night**
- Full date (Tuesday, 31 March 2026)
- Day's **Forecast High** (red) and **Forecast Low** (cyan)
- Quick summary: wind, rain, sunrise, sunset  
**Why:** A weather app's primary job is to give you a quick answer to "what's the weather like today?" The hero delivers this at a glance, before the user reads any stat card. The greeting changes based on local hour so it feels personal and contextual. The High/Low shown here are the day's forecast extremes — deliberately different from the "Current Temp" stat card below (which shows the live real-time reading).

---

### 🫁 Air Quality Info Cards (Click to Learn)
**What:** Each of the 7 air quality metric cards is clickable. Clicking opens a **centred modal popup** showing:
- Full pollutant name + chemical formula
- Brief description (what it is and where it comes from)
- **Colour-coded range guide** (Green = Good → Red = Dangerous) with the current reading highlighted
- Health tip explaining real-world effects  
**Why:** Most users don't know what PM2.5 or SO₂ means or whether a reading of 150 µg/m³ is dangerous. Displaying numbers without context is not useful. The info modal turns raw data into actionable understanding.  
**How:** All info is **hardcoded static data** — zero extra API calls. Modal uses `React.createPortal` to render into `document.body`, so it's always centred and never clipped by the grid layout. A subtle 3D tilt effect on hover signals interactivity.

---

## 🛠 Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | React | 18 |
| Styling | CSS3 (with CSS Modules) | — |
| Build Tool | Vite | 5 |
| Routing | React Router | v6 |
| Charts | Recharts | 2.x |
| Date Picker | react-datepicker | 6.x |
| HTTP Client | axios | 1.x |
| Date Utilities | date-fns | 3.x |
| Fonts | Syne + DM Sans | Google Fonts |
| Deployment | Vercel | — |

---

## 📁 Project Structure

```
src/
├── context/
│   ├── WeatherContext.jsx     # GPS auto-detect + city search + global coords
│   └── ThemeContext.jsx       # Dark/light theme — persists via localStorage
├── hooks/
│   ├── useCurrentWeather.js   # Page 1 data fetching (weather + air quality)
│   └── useHistoricalWeather.js # Page 2 historical data fetching
├── utils/
│   ├── api.js                 # All Open-Meteo API calls (centralised)
│   └── helpers.js             # Formatters, unit converters, level labels
├── components/
│   ├── Navbar.jsx             # Navigation + city search + theme toggle
│   ├── StatCard.jsx           # Individual metric display card
│   ├── AirQualityCard.jsx     # AQ card with click-to-learn modal popup
│   ├── HourlyChart.jsx        # Scrollable + zoomable hourly line chart
│   ├── HistoricalChart.jsx    # Line/bar chart for historical data
│   ├── LoadingScreen.jsx      # Animated triple-ring loading state
│   └── ErrorBanner.jsx        # Warning / error inline banner
├── pages/
│   ├── CurrentPage.jsx        # Page 1 — current weather + hourly forecast
│   └── HistoricalPage.jsx     # Page 2 — historical date range analysis
├── App.jsx                    # Router + ThemeProvider + WeatherProvider
├── main.jsx                   # ReactDOM.createRoot entry point
└── index.css                  # Design system: CSS vars, dark+light themes, animations
```

---

## ⚡ Performance — 500ms Rendering Target

The spec requires all data to load and render within **500ms**. Here is how we achieve it:

| Technique | Where | Impact |
|---|---|---|
| `Promise.all()` parallel fetch | `api.js` | Weather + Air Quality APIs called simultaneously — halves wait time |
| `React.lazy()` on HourlyChart | `CurrentPage.jsx` | Recharts (~200kb) loads after first paint; stat cards appear instantly |
| `Suspense` skeleton fallback | `CurrentPage.jsx` | Shimmer placeholders show while charts load — no blank space |
| `useMemo()` on all derived data | `CurrentPage.jsx` | No array recomputation on re-renders |
| `lastKeyRef` deduplication | `useCurrentWeather.js` | Prevents duplicate API calls for same lat/lon/date |
| `AbortController` | `useCurrentWeather.js` | Cancels stale in-flight requests on unmount |
| Static AQ info | `AirQualityCard.jsx` | Modal content is hardcoded — zero extra API calls |
| Google Fonts `preconnect` | `index.html` | Fonts don't block initial render |

**Typical timeline:**
```
0ms        → React mounts, GPS request fires, API calls fire (all simultaneously)
~50–150ms  → Hero banner + stat cards render with loading state
~200–400ms → API responses arrive, real data populates cards
~300–500ms → Charts lazy-load and appear below the fold
```

---

## 🌍 APIs Used

| API | Purpose | Key Required |
|---|---|---|
| `api.open-meteo.com/v1/forecast` | Current + hourly weather + daily stats | ❌ Free |
| `air-quality-api.open-meteo.com/v1/air-quality` | PM10, PM2.5, AQI, CO, CO₂, NO₂, SO₂ | ❌ Free |
| `archive-api.open-meteo.com/v1/archive` | Historical daily weather data | ❌ Free |
| `geocoding-api.open-meteo.com/v1/search` | City name → coordinates (search box) | ❌ Free |
| `nominatim.openstreetmap.org/reverse` | GPS coordinates → city name | ❌ Free |

---

## 🏗 Setup & Development

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/weather-dashboard.git
cd weather-dashboard

# 2. Install dependencies
#    IMPORTANT: Do NOT run "npm audit fix --force"
#    It upgrades Vite to v8 which breaks the @vitejs/plugin-react-swc plugin
npm install

# 3. Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser.  
Allow location permission when prompted for GPS auto-detection.

### Build for Production

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

---

## 🌐 Deployment on Vercel

This project is deployed on **Vercel** — the recommended platform for React + Vite apps.

### Option 1 — Vercel CLI (fastest)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy from project root
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → `weather-dashboard` (or any name)
- **In which directory is your code located?** → `./`

Vercel auto-detects Vite and sets the correct build command (`npm run build`) and output directory (`dist`).

### Option 2 — GitHub Integration (recommended for ongoing)

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Vercel auto-detects settings — click **Deploy**
5. Every `git push` to `main` triggers an automatic re-deploy

### Option 3 — Netlify (alternative)

```bash
npm run build
# Drag & drop the dist/ folder to netlify.com/drop
```

---

## 📝 Technical Notes

- **Sun Cycle chart**: Y-axis shows minutes since midnight for numeric plotting. Hover tooltips display the actual formatted IST time.
- **Browser GPS**: Requires HTTPS in production (Vercel provides this automatically). If denied, falls back to New Delhi with a warning banner.
- **`npm audit fix --force`**: Do not run this — it upgrades Vite from v5 to v8 which is incompatible with `@vitejs/plugin-react-swc`. The 2 vulnerability warnings from plain `npm install` are in dev dependencies only and are harmless.
- **Open-Meteo rate limits**: All endpoints are free with no API key. Rate limiting is generous for personal/demo use.

---


## 📜 License

MIT License © 2025 Vishesh Jaiswal

---

## 👨‍💻 Author

**Vishesh Jaiswal**
- GitHub: [@Visheshjais](https://github.com/Visheshjais)

---

<div align="center">

Made with ❤️ and lots of music by **Vishesh Jaiswal**

⭐ Star this repo if you liked it!
</div>
