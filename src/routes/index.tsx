import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Loader2,
  Moon,
  Search,
  Sun,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type CurrentWeather,
  type GeocodingResult,
  type WeatherTheme,
  describeWeather,
  fetchCurrentWeather,
  geocodeCity,
  themeGradients,
} from "@/lib/weather";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weather Now — Real-time forecasts for any city" },
      {
        name: "description",
        content:
          "Search any city to see real-time temperature, humidity, wind, and conditions. Free, fast, no signup.",
      },
      { property: "og:title", content: "Weather Now — Real-time forecasts" },
      {
        property: "og:description",
        content:
          "Search any city to see real-time temperature, humidity, wind, and conditions.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: WeatherPage,
});

const STORAGE_KEY = "weather-app:last-city";

interface WeatherResult {
  location: GeocodingResult;
  weather: CurrentWeather;
}

function iconForTheme(theme: WeatherTheme, className: string) {
  switch (theme) {
    case "clear-day":
      return <Sun className={className} />;
    case "clear-night":
      return <Moon className={className} />;
    case "cloudy":
      return <CloudSun className={className} />;
    case "fog":
      return <CloudFog className={className} />;
    case "rain":
      return <CloudRain className={className} />;
    case "snow":
      return <CloudSnow className={className} />;
    case "thunder":
      return <Zap className={className} />;
    default:
      return <Cloud className={className} />;
  }
}

function WeatherPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const search = async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const location = await geocodeCity(city);
      const weather = await fetchCurrentWeather(location.latitude, location.longitude);
      setResult({ location, weather });
      try {
        localStorage.setItem(STORAGE_KEY, city);
      } catch {
        /* ignore storage errors */
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(
        message === "City not found"
          ? "Couldn't find that city — try another?"
          : "Failed to fetch weather. Please try again.",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load last searched city
  useEffect(() => {
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last) {
        setQuery(last);
        void search(last);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const theme: WeatherTheme = useMemo(() => {
    if (!result) return "clear-day";
    return describeWeather(result.weather.weatherCode, result.weather.isDay).theme;
  }, [result]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    void search(trimmed);
  };

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main
      className="min-h-screen w-full transition-[background] duration-700 ease-out"
      style={{ background: themeGradients[theme] }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-start gap-6 px-4 py-10 sm:py-16">
        <header className="w-full text-center text-white">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Weather Now
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {dateLabel} · {timeLabel}
          </p>
        </header>

        <form onSubmit={onSubmit} className="flex w-full gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a city…"
            aria-label="City name"
            className="h-11 border-white/30 bg-white/15 text-white placeholder:text-white/60 backdrop-blur focus-visible:ring-white/50"
          />
          <Button
            type="submit"
            disabled={loading || query.trim().length === 0}
            className="h-11 shrink-0 bg-white/90 text-slate-900 hover:bg-white"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Search />
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </Button>
        </form>

        <section className="w-full">
          {loading && <WeatherSkeleton />}

          {!loading && error && (
            <div
              role="alert"
              className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-white/20 bg-white/10 p-5 text-center text-white backdrop-blur-md"
            >
              {error}
            </div>
          )}

          {!loading && !error && result && (
            <WeatherCard result={result} theme={theme} />
          )}

          {!loading && !error && !result && (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 text-center text-white/90 backdrop-blur-md">
              <CloudSun className="mx-auto mb-3 h-12 w-12 opacity-80" />
              <p className="text-sm">Search for a city to see the current weather.</p>
            </div>
          )}
        </section>

        <footer className="mt-auto pt-6 text-center text-xs text-white/60">
          Data by Open-Meteo · No API key required
        </footer>
      </div>
    </main>
  );
}

function WeatherCard({ result, theme }: { result: WeatherResult; theme: WeatherTheme }) {
  const { location, weather } = result;
  const info = describeWeather(weather.weatherCode, weather.isDay);
  const place = [location.name, location.admin1, location.country]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      key={`${location.latitude},${location.longitude}`}
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-3xl border border-white/20 bg-white/15 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold leading-tight sm:text-2xl">
            {location.name}
          </h2>
          <p className="mt-0.5 text-xs text-white/70 sm:text-sm">{place}</p>
        </div>
        {iconForTheme(theme, "h-14 w-14 sm:h-16 sm:w-16 drop-shadow")}
      </div>

      <div className="mt-6 flex items-end gap-3">
        <span className="text-6xl font-light leading-none tracking-tighter sm:text-7xl">
          {Math.round(weather.temperature)}°
        </span>
        <span className="pb-2 text-base text-white/85">{info.label}</span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        <Stat
          icon={<Thermometer className="h-4 w-4" />}
          label="Feels like"
          value={`${Math.round(weather.apparentTemperature)}°`}
        />
        <Stat
          icon={<Droplets className="h-4 w-4" />}
          label="Humidity"
          value={`${Math.round(weather.humidity)}%`}
        />
        <Stat
          icon={<Wind className="h-4 w-4" />}
          label="Wind"
          value={`${Math.round(weather.windSpeed)} km/h`}
        />
      </div>
    </article>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
      <div className="flex items-center justify-center gap-1 text-[11px] uppercase tracking-wide text-white/70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-base font-medium sm:text-lg">{value}</div>
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-white/30" />
          <div className="h-3 w-24 rounded bg-white/20" />
        </div>
        <div className="h-14 w-14 rounded-full bg-white/30" />
      </div>
      <div className="mt-6 h-16 w-32 rounded bg-white/30" />
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="h-16 rounded-2xl bg-white/15" />
        <div className="h-16 rounded-2xl bg-white/15" />
        <div className="h-16 rounded-2xl bg-white/15" />
      </div>
      <div className="sr-only">
        <CloudDrizzle /> Loading weather…
      </div>
    </div>
  );
}
