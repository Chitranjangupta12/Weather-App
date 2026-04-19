
## Weather App

A clean, modern weather app built as a TanStack Start single-page route, using **Open-Meteo** (no API key needed) for both city geocoding and current weather.

### Core flow
1. User types a city name into a search input
2. On submit: geocode city → fetch current weather → display results
3. Last searched city is saved to `localStorage` and auto-loaded on next visit

### Displayed information
- **City name** + country (from geocoding response)
- **Current date and time** (live updating clock)
- **Large weather icon** (Lucide icon mapped from Open-Meteo weather code)
- **Temperature** in °C
- **Weather condition** label (Clear, Cloudy, Rainy, Snow, Thunderstorm, etc.)
- **Humidity** (%)
- **Wind speed** (km/h)
- **"Feels like"** temperature as a small bonus stat

### UI / UX
- Centered glassmorphism card on a full-screen gradient background
- **Background changes based on weather condition** (sunny = warm orange/blue, cloudy = soft grays, rainy = deep blue, snow = icy white-blue, night = dark navy)
- Smooth fade/slide-in animations when new weather data loads
- Skeleton loading state while fetching
- Inline error message for invalid city names ("Couldn't find that city — try another?")
- Fully mobile responsive (works at 304px width and up), shadcn `Input` + `Button`

### Tech bits
- Single route file: `src/routes/index.tsx` replaces the placeholder
- Per-page SEO meta (title, description, og tags)
- All API calls client-side via `fetch` — no backend or secrets needed
- Loading state managed with React `useState`; live clock via `useEffect` + `setInterval`
