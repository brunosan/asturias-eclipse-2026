const ECLIPSE_DATE = "2026-08-12";
const ECLIPSE_LOCAL_MINUTE = 27;

const LOCATIONS = [
  { id: "soto", name: "Soto / Los Quebrantos", latitude: 43.535, longitude: -6.07, group: "local" },
  { id: "vidio", name: "Cabo Vidio", latitude: 43.593, longitude: -6.243, group: "west" },
  { id: "caroyas", name: "Caroyas", latitude: 43.546, longitude: -6.478, group: "west" },
  { id: "espartal", name: "El Espartal", latitude: 43.587, longitude: -5.943, group: "east" },
  { id: "xago", name: "Xagó", latitude: 43.604, longitude: -5.919, group: "east" },
  { id: "tineo", name: "Casa El Puerto", latitude: 43.364, longitude: -6.398, group: "height" },
  { id: "cobertoria", name: "La Cobertoria", latitude: 43.147, longitude: -5.907, group: "height" },
  { id: "leon", name: "León", latitude: 42.593, longitude: -5.584, group: "south" },
  { id: "villadangos", name: "Villadangos plain", latitude: 42.517, longitude: -5.767, group: "south" },
  { id: "astorga", name: "Astorga plain", latitude: 42.455, longitude: -6.055, group: "south" },
] as const;

type OpenMeteoPoint = {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current?: Record<string, number | string | null>;
  hourly?: {
    time?: string[];
    cloud_cover?: Array<number | null>;
    cloud_cover_low?: Array<number | null>;
    cloud_cover_mid?: Array<number | null>;
    cloud_cover_high?: Array<number | null>;
    visibility?: Array<number | null>;
    precipitation_probability?: Array<number | null>;
    temperature_2m?: Array<number | null>;
    wind_speed_10m?: Array<number | null>;
    wind_gusts_10m?: Array<number | null>;
  };
};

export const dynamic = "force-dynamic";

export async function GET() {
  const params = new URLSearchParams({
    latitude: LOCATIONS.map((location) => location.latitude).join(","),
    longitude: LOCATIONS.map((location) => location.longitude).join(","),
    current: [
      "temperature_2m",
      "cloud_cover",
      "cloud_cover_low",
      "cloud_cover_mid",
      "cloud_cover_high",
      "visibility",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m",
    ].join(","),
    hourly: [
      "temperature_2m",
      "cloud_cover",
      "cloud_cover_low",
      "cloud_cover_mid",
      "cloud_cover_high",
      "visibility",
      "precipitation_probability",
      "wind_speed_10m",
      "wind_gusts_10m",
    ].join(","),
    timezone: "Europe/Madrid",
    start_date: ECLIPSE_DATE,
    end_date: ECLIPSE_DATE,
    models: "best_match",
  });

  const sourceUrl = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const retrievedAt = new Date().toISOString();

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Weather provider returned ${response.status}`);
    }

    const payload = (await response.json()) as OpenMeteoPoint | OpenMeteoPoint[];
    const points = Array.isArray(payload) ? payload : [payload];
    if (points.length !== LOCATIONS.length) {
      throw new Error(`Expected ${LOCATIONS.length} forecast points, received ${points.length}`);
    }

    const locations = LOCATIONS.map((location, index) => {
      const point = points[index];
      const time20 = `${ECLIPSE_DATE}T20:00`;
      const time21 = `${ECLIPSE_DATE}T21:00`;
      const index20 = point.hourly?.time?.indexOf(time20) ?? -1;
      const index21 = point.hourly?.time?.indexOf(time21) ?? -1;

      return {
        ...location,
        returnedLatitude: point.latitude,
        returnedLongitude: point.longitude,
        elevation: point.elevation,
        current: point.current
          ? {
              time: point.current.time,
              temperature: point.current.temperature_2m,
              totalCloud: point.current.cloud_cover,
              lowCloud: point.current.cloud_cover_low,
              midCloud: point.current.cloud_cover_mid,
              highCloud: point.current.cloud_cover_high,
              visibilityKm: nullableRound(
                divideNullable(point.current.visibility as number | null, 1000),
                1,
              ),
              weatherCode: point.current.weather_code,
              wind: point.current.wind_speed_10m,
              gusts: point.current.wind_gusts_10m,
            }
          : null,
        eclipse: {
          time: `${ECLIPSE_DATE}T20:27:00+02:00`,
          temperature: interpolate(point.hourly?.temperature_2m, index20, index21),
          totalCloud: interpolate(point.hourly?.cloud_cover, index20, index21),
          lowCloud: interpolate(point.hourly?.cloud_cover_low, index20, index21),
          midCloud: interpolate(point.hourly?.cloud_cover_mid, index20, index21),
          highCloud: interpolate(point.hourly?.cloud_cover_high, index20, index21),
          visibilityKm: nullableRound(
            divideNullable(
              interpolateRaw(point.hourly?.visibility, index20, index21),
              1000,
            ),
            1,
          ),
          precipitation: interpolate(
            point.hourly?.precipitation_probability,
            index20,
            index21,
          ),
          wind: interpolate(point.hourly?.wind_speed_10m, index20, index21),
          gusts: interpolate(point.hourly?.wind_gusts_10m, index20, index21),
        },
      };
    });

    return Response.json(
      {
        ok: true,
        retrievedAt,
        targetTime: `${ECLIPSE_DATE}T20:27:00+02:00`,
        timezone: "Europe/Madrid",
        provider: "Open-Meteo Best Match",
        providerNote:
          "Model-derived point data. Best Match can combine forecast models; model initialization time is not exposed.",
        locations,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        retrievedAt,
        message:
          error instanceof Error ? error.message : "Live forecast is temporarily unavailable",
        provider: "Open-Meteo Best Match",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

function interpolate(
  values: Array<number | null> | undefined,
  index20: number,
  index21: number,
) {
  return nullableRound(interpolateRaw(values, index20, index21), 0);
}

function interpolateRaw(
  values: Array<number | null> | undefined,
  index20: number,
  index21: number,
) {
  if (!values || index20 < 0) return null;
  const first = values[index20];
  const second = index21 >= 0 ? values[index21] : null;
  if (first == null) return second ?? null;
  if (second == null) return first;
  const fraction = ECLIPSE_LOCAL_MINUTE / 60;
  return first + (second - first) * fraction;
}

function divideNullable(value: number | null | undefined, divisor: number) {
  return value == null ? null : value / divisor;
}

function nullableRound(value: number | null | undefined, digits: number) {
  if (value == null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
