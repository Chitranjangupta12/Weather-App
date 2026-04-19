// Maps Open-Meteo WMO weather codes to a label, a Lucide icon name, and a theme key.
// https://open-meteo.com/en/docs (Weather variable documentation)

export type WeatherTheme =
  | "clear-day"
  | "clear-night"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "thunder";

export interface WeatherInfo {
  label: string;
  theme: WeatherTheme;
}

export function describeWeather(code: number, isDay: boolean): WeatherInfo {
  // 0 — Clear
  if (code === 0) {
    return { label: "Clear sky", theme: isDay ? "clear-day" : "clear-night" };
  }
  // 1, 2, 3 — Mainly clear, partly cloudy, overcast
  if (code === 1) return { label: "Mainly clear", theme: isDay ? "clear-day" : "clear-night" };
  if (code === 2) return { label: "Partly cloudy", theme: "cloudy" };
  if (code === 3) return { label: "Overcast", theme: "cloudy" };
  // 45, 48 — Fog
  if (code === 45 || code === 48) return { label: "Foggy", theme: "fog" };
  // 51-57 — Drizzle / freezing drizzle
  if (code >= 51 && code <= 57) return { label: "Drizzle", theme: "rain" };
  // 61-67 — Rain
  if (code >= 61 && code <= 67) return { label: "Rainy", theme: "rain" };
  // 71-77 — Snow
  if (code >= 71 && code <= 77) return { label: "Snow", theme: "snow" };
  // 80-82 — Rain showers
  if (code >= 80 && code <= 82) return { label: "Rain showers", theme: "rain" };
  // 85, 86 — Snow showers
  if (code === 85 || code === 86) return { label: "Snow showers", theme: "snow" };
  // 95-99 — Thunderstorm
  if (code >= 95 && code <= 99) return { label: "Thunderstorm", theme: "thunder" };
  return { label: "Unknown", theme: "cloudy" };
}

export const themeGradients: Record<WeatherTheme, string> = {
  "clear-day":
    "linear-gradient(135deg, oklch(0.78 0.15 70) 0%, oklch(0.7 0.18 240) 100%)",
  "clear-night":
    "linear-gradient(135deg, oklch(0.18 0.05 270) 0%, oklch(0.28 0.08 250) 100%)",
  cloudy:
    "linear-gradient(135deg, oklch(0.65 0.03 250) 0%, oklch(0.55 0.04 240) 100%)",
  fog: "linear-gradient(135deg, oklch(0.75 0.02 240) 0%, oklch(0.6 0.02 250) 100%)",
  rain: "linear-gradient(135deg, oklch(0.35 0.07 250) 0%, oklch(0.25 0.08 260) 100%)",
  snow: "linear-gradient(135deg, oklch(0.88 0.03 220) 0%, oklch(0.72 0.05 230) 100%)",
  thunder:
    "linear-gradient(135deg, oklch(0.22 0.04 280) 0%, oklch(0.32 0.1 290) 100%)",
};

export interface GeocodingResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
}

export async function geocodeCity(query: string): Promise<GeocodingResult> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("City not found");
  }
  const r = data.results[0];
  return {
    name: r.name,
    country: r.country ?? "",
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  };
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather request failed");
  const data = await res.json();
  const c = data.current;
  return {
    temperature: c.temperature_2m,
    apparentTemperature: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    weatherCode: c.weather_code,
    isDay: c.is_day === 1,
  };
}
