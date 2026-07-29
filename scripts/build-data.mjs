import fs from "node:fs/promises";
import path from "node:path";
import * as Astronomy from "astronomy-engine";

const ROOT = path.resolve(import.meta.dirname, "..");
const CANDIDATES_PATH = path.join(ROOT, "data", "candidate-sites.csv");
const DERIVED_DIR = path.join(ROOT, "data", "derived");
const HORIZON_DIR = path.join(DERIVED_DIR, "horizon-profiles");
const ROUTE_DIR = path.join(DERIVED_DIR, "routes");
const IDEE_PROFILE_URL =
  "https://api-processes.idee.es/processes/elevationProfile/execution";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
const START = {
  name: "Sotu town centre (non-private planning origin)",
  latitude: 43.5344336,
  longitude: -6.0691092,
};
const EARTH_RADIUS_M = 6_371_000;
const PROFILE_LENGTH_M = 100_000;
const PROFILE_SPACING_M = 200;

await fs.mkdir(HORIZON_DIR, { recursive: true });
await fs.mkdir(ROUTE_DIR, { recursive: true });

const candidates = parseCsv(await fs.readFile(CANDIDATES_PATH, "utf8"));
const asturiasSpots = JSON.parse(
  await fs.readFile(
    path.join(
      ROOT,
      "data",
      "raw",
      "asturias-official-observation-spots-2026-07-29.json",
    ),
    "utf8",
  ),
);
const asturiasPopulation = populationIndex(
  JSON.parse(
    await fs.readFile(
      path.join(
        ROOT,
        "data",
        "raw",
        "ine-asturias-municipal-population-table-2886-2025.json",
      ),
      "utf8",
    ),
  ),
);
const leonPopulation = populationIndex(
  JSON.parse(
    await fs.readFile(
      path.join(
        ROOT,
        "data",
        "raw",
        "ine-leon-municipal-population-table-2877-2025.json",
      ),
      "utf8",
    ),
  ),
);

const astronomy = candidates.map((site) => calculateAstronomy(site));
const horizonJobs = astronomy.flatMap((site) =>
  ["c2", "peak", "c3"].map((phase) => ({ site, phase })),
);

console.log(
  `Calculating ${horizonJobs.length} official MDT05 horizon profiles...`,
);
const horizonResults = await mapLimit(horizonJobs, 4, async ({ site, phase }) => {
  const phaseAzimuth = site[`${phase}_azimuth_deg`];
  const result = await calculateHorizon(site, phase, phaseAzimuth);
  console.log(
    `${site.id} ${phase}: ${result.horizon_angle_deg.toFixed(2)}° horizon`,
  );
  return result;
});

const horizonsBySite = new Map();
for (const horizon of horizonResults) {
  if (!horizonsBySite.has(horizon.id)) horizonsBySite.set(horizon.id, {});
  horizonsBySite.get(horizon.id)[horizon.phase] = horizon;
}

console.log(`Calculating ${candidates.length} free-flow route baselines...`);
const routes = await mapLimit(candidates, 2, async (site) => {
  const route = await calculateRoute(site);
  console.log(
    `${site.id}: ${(route.distance_m / 1000).toFixed(1)} km / ${(
      route.duration_s / 60
    ).toFixed(0)} min`,
  );
  return route;
});
const routeBySite = new Map(routes.map((route) => [route.id, route]));

const evidence = astronomy.map((site) => {
  const official = nearestOfficialSpot(site, asturiasSpots);
  const phases = horizonsBySite.get(site.id);
  const worstTotalityClearance = Math.min(
    site.c2_altitude_deg - phases.c2.horizon_angle_deg,
    site.peak_altitude_deg - phases.peak.horizon_angle_deg,
    site.c3_altitude_deg - phases.c3.horizon_angle_deg,
  );
  const population =
    site.region === "Asturias"
      ? asturiasPopulation.get(normalize(site.municipality))
      : leonPopulation.get(normalize(site.municipality));
  const route = routeBySite.get(site.id);

  return {
    ...site,
    municipality_population_2025: population ?? "",
    eclipse_kind: site.eclipse_kind,
    c1_local: site.c1_local,
    c2_local: site.c2_local,
    maximum_local: site.maximum_local,
    c3_local: site.c3_local,
    c4_local: site.c4_local,
    engine_totality_s: site.engine_totality_s,
    official_totality_s: official?.duracion_totalidad_segundos ?? "",
    c2_altitude_deg: round(site.c2_altitude_deg, 3),
    maximum_altitude_deg: round(site.peak_altitude_deg, 3),
    c3_altitude_deg: round(site.c3_altitude_deg, 3),
    c2_azimuth_deg: round(site.c2_azimuth_deg, 3),
    maximum_azimuth_deg: round(site.peak_azimuth_deg, 3),
    c3_azimuth_deg: round(site.c3_azimuth_deg, 3),
    dem_elevation_m: round(phases.peak.observer_elevation_m, 1),
    c2_horizon_deg: round(phases.c2.horizon_angle_deg, 3),
    maximum_horizon_deg: round(phases.peak.horizon_angle_deg, 3),
    c3_horizon_deg: round(phases.c3.horizon_angle_deg, 3),
    minimum_totality_clearance_deg: round(worstTotalityClearance, 3),
    nearest_obstruction_km: round(
      phases.peak.horizon_distance_m / 1000,
      2,
    ),
    freeflow_distance_km: round(route.distance_m / 1000, 1),
    freeflow_drive_min: Math.round(route.duration_s / 60),
    routing_status: route.status,
  };
});

await fs.writeFile(
  path.join(DERIVED_DIR, "candidate-evidence.csv"),
  toCsv(evidence),
);
await fs.writeFile(
  path.join(DERIVED_DIR, "candidate-evidence.json"),
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      planning_origin: START,
      caveats: {
        astronomy:
          "Astronomy Engine 2.1.19 uses a smooth lunar limb; official IGN durations can differ by a few seconds.",
        horizon:
          "IGN MDT05 ground terrain only. Buildings, vegetation, temporary structures and terrestrial refraction are not represented.",
        routing:
          "OSRM/OpenStreetMap free-flow baseline. It has no eclipse traffic, closure, parking or shuttle delay.",
        population:
          "Official INE municipal population at 1 January 2025; it is not an eclipse attendance forecast.",
      },
      candidates: evidence,
    },
    null,
    2,
  ),
);

console.log(
  `Wrote ${path.relative(
    ROOT,
    path.join(DERIVED_DIR, "candidate-evidence.csv"),
  )}`,
);

function calculateAstronomy(site) {
  const observer = new Astronomy.Observer(
    Number(site.latitude),
    Number(site.longitude),
    Number(site.declared_elevation_m || 0),
  );
  const eclipse = Astronomy.SearchLocalSolarEclipse(
    new Date("2026-08-01T00:00:00Z"),
    observer,
  );
  if (eclipse.kind !== "total" || !eclipse.total_begin || !eclipse.total_end) {
    throw new Error(`${site.id} is not total according to Astronomy Engine`);
  }
  const phases = {
    c2: eclipse.total_begin,
    peak: eclipse.peak,
    c3: eclipse.total_end,
  };
  const horizontal = {};
  for (const [name, event] of Object.entries(phases)) {
    const equatorial = Astronomy.Equator(
      Astronomy.Body.Sun,
      event.time,
      observer,
      true,
      true,
    );
    horizontal[name] = Astronomy.Horizon(
      event.time,
      observer,
      equatorial.ra,
      equatorial.dec,
      "normal",
    );
  }

  return {
    ...site,
    eclipse_kind: eclipse.kind,
    c1_local: localTime(eclipse.partial_begin.time.date),
    c2_local: localTime(eclipse.total_begin.time.date),
    maximum_local: localTime(eclipse.peak.time.date),
    c3_local: localTime(eclipse.total_end.time.date),
    c4_local: localTime(eclipse.partial_end.time.date),
    engine_totality_s: round(
      (eclipse.total_end.time.date - eclipse.total_begin.time.date) / 1000,
      1,
    ),
    c2_altitude_deg: horizontal.c2.altitude,
    peak_altitude_deg: horizontal.peak.altitude,
    c3_altitude_deg: horizontal.c3.altitude,
    c2_azimuth_deg: horizontal.c2.azimuth,
    peak_azimuth_deg: horizontal.peak.azimuth,
    c3_azimuth_deg: horizontal.c3.azimuth,
  };
}

async function calculateHorizon(site, phase, bearingDeg) {
  const cachedPath = path.join(HORIZON_DIR, `${site.id}-${phase}.csv`);
  try {
    const cachedRows = parseCsv(await fs.readFile(cachedPath, "utf8"));
    const validRows = cachedRows.filter(
      (row) => row.apparent_terrain_angle_deg !== "",
    );
    if (validRows.length) {
      const obstruction = validRows.reduce((best, row) =>
        Number(row.apparent_terrain_angle_deg) >
        Number(best.apparent_terrain_angle_deg)
          ? row
          : best,
      );
      const observerRow = cachedRows.find((row) => row.elevation_m !== "");
      return {
        id: site.id,
        phase,
        bearing_deg: bearingDeg,
        observer_elevation_m: Number(observerRow?.elevation_m || 0),
        horizon_angle_deg: Math.max(
          0,
          Number(obstruction.apparent_terrain_angle_deg),
        ),
        horizon_distance_m: Number(obstruction.distance_m),
        cached: true,
      };
    }
  } catch {
    // No reusable profile yet.
  }

  const end = destinationPoint(
    Number(site.latitude),
    Number(site.longitude),
    bearingDeg,
    PROFILE_LENGTH_M,
  );
  const profile = await fetchJsonWithRetry(
    IDEE_PROFILE_URL,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          distance: PROFILE_SPACING_M,
          geom: JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [
                    Number(site.longitude),
                    Number(site.latitude),
                  ],
                },
              },
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [end.longitude, end.latitude],
                },
              },
            ],
          }),
          formato: "geojson",
          crs: 4326,
          withCoord: true,
          withDistances: true,
        },
      }),
    },
    `${site.id}-${phase}`,
  );
  if (!Array.isArray(profile.values) || profile.values.length < 2) {
    throw new Error(`Invalid elevation profile for ${site.id}-${phase}`);
  }

  const firstValid = profile.values.find((row) => Number(row[2]) > -1000);
  const observerElevation =
    Number(firstValid?.[2]) ||
    Number(site.declared_elevation_m || 0);
  let maxAngle = -90;
  let maxDistance = 0;
  let cumulative = 0;
  const rows = [];

  for (let index = 0; index < profile.values.length; index += 1) {
    const [longitude, latitude, elevationRaw] = profile.values[index].map(
      Number,
    );
    if (index > 0) {
      const previous = profile.values[index - 1];
      cumulative += haversineMeters(
        Number(previous[1]),
        Number(previous[0]),
        latitude,
        longitude,
      );
    }
    const elevation = elevationRaw <= -1000 ? null : elevationRaw;
    const angle =
      elevation === null || cumulative < 1
        ? null
        : sphericalElevationAngle(
            observerElevation,
            elevation,
            cumulative,
          );
    if (angle !== null && angle > maxAngle) {
      maxAngle = angle;
      maxDistance = cumulative;
    }
    rows.push({
      distance_m: round(cumulative, 1),
      longitude: round(longitude, 7),
      latitude: round(latitude, 7),
      elevation_m: elevation === null ? "" : round(elevation, 1),
      apparent_terrain_angle_deg:
        angle === null ? "" : round(angle, 4),
    });
  }

  if (!Number.isFinite(maxAngle) || maxAngle === -90) {
    maxAngle = 0;
  }
  await fs.writeFile(
    path.join(HORIZON_DIR, `${site.id}-${phase}.csv`),
    toCsv(rows),
  );

  return {
    id: site.id,
    phase,
    bearing_deg: bearingDeg,
    observer_elevation_m: observerElevation,
    horizon_angle_deg: Math.max(0, maxAngle),
    horizon_distance_m: maxDistance,
  };
}

async function calculateRoute(site) {
  const coordinates = `${START.longitude},${START.latitude};${site.longitude},${site.latitude}`;
  const url = `${OSRM_URL}/${coordinates}?overview=full&geometries=geojson&steps=false`;
  try {
    const response = await fetchJsonWithRetry(url, {}, `route-${site.id}`);
    const route = response.routes?.[0];
    if (!route) throw new Error("No route returned");
    const snapshot = {
      id: site.id,
      source_url: url,
      retrieved_at: new Date().toISOString(),
      distance_m: route.distance,
      duration_s: route.duration,
      geometry: route.geometry,
      status: "ok",
    };
    await fs.writeFile(
      path.join(ROUTE_DIR, `${site.id}.geojson`),
      JSON.stringify(
        {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                id: site.id,
                distance_m: route.distance,
                duration_s: route.duration,
                source_url: url,
                retrieved_at: snapshot.retrieved_at,
              },
              geometry: route.geometry,
            },
          ],
        },
        null,
        2,
      ),
    );
    return snapshot;
  } catch (error) {
    return {
      id: site.id,
      distance_m: haversineMeters(
        START.latitude,
        START.longitude,
        Number(site.latitude),
        Number(site.longitude),
      ),
      duration_s: "",
      geometry: null,
      status: `route-error: ${error.message}`,
    };
  }
}

async function fetchJsonWithRetry(url, options, label) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": "eclipse26-decision-atlas/1.0",
          ...(options.headers || {}),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const value = await response.json();
      if (value.code && value.description) {
        throw new Error(`${value.code}: ${value.description}`);
      }
      return value;
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 750));
      }
    }
  }
  throw new Error(`${label}: ${lastError?.message || "request failed"}`);
}

function populationIndex(series) {
  const index = new Map();
  for (const item of series) {
    if (!item.Nombre?.includes(". Total. Total habitantes. Personas.")) {
      continue;
    }
    const population = item.Data?.find((datum) => datum.Anyo === 2025)?.Valor;
    const municipality = item.MetaData?.find(
      (meta) => meta.T3_Variable === "Municipios",
    )?.Nombre;
    if (municipality && Number.isFinite(population)) {
      const normalized = normalize(municipality);
      index.set(normalized, population);
      const trailingArticle = normalized.match(/^(.+) (el|la|los|las)$/);
      if (trailingArticle) {
        index.set(
          `${trailingArticle[2]} ${trailingArticle[1]}`,
          population,
        );
      }
    }
  }
  return index;
}

function nearestOfficialSpot(site, spots) {
  if (site.region !== "Asturias") return null;
  let nearest = null;
  let nearestDistance = Infinity;
  for (const spot of spots) {
    const distance = haversineMeters(
      Number(site.latitude),
      Number(site.longitude),
      Number(spot.lat),
      Number(spot.lng),
    );
    if (distance < nearestDistance) {
      nearest = spot;
      nearestDistance = distance;
    }
  }
  return nearestDistance <= 500 ? nearest : null;
}

function destinationPoint(latitude, longitude, bearingDeg, distanceM) {
  const angularDistance = distanceM / EARTH_RADIUS_M;
  const bearing = toRadians(bearingDeg);
  const latitude1 = toRadians(latitude);
  const longitude1 = toRadians(longitude);
  const latitude2 = Math.asin(
    Math.sin(latitude1) * Math.cos(angularDistance) +
      Math.cos(latitude1) *
        Math.sin(angularDistance) *
        Math.cos(bearing),
  );
  const longitude2 =
    longitude1 +
    Math.atan2(
      Math.sin(bearing) *
        Math.sin(angularDistance) *
        Math.cos(latitude1),
      Math.cos(angularDistance) -
        Math.sin(latitude1) * Math.sin(latitude2),
    );
  return {
    latitude: toDegrees(latitude2),
    longitude: toDegrees(longitude2),
  };
}

function sphericalElevationAngle(observerM, targetM, distanceM) {
  const centralAngle = distanceM / EARTH_RADIUS_M;
  const observerRadius = EARTH_RADIUS_M + observerM;
  const targetRadius = EARTH_RADIUS_M + targetM;
  const vertical = targetRadius * Math.cos(centralAngle) - observerRadius;
  const horizontal = targetRadius * Math.sin(centralAngle);
  return toDegrees(Math.atan2(vertical, horizontal));
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function localTime(date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(" ", "T");
}

function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => csvCell(row[header] ?? "")).join(","),
    ),
  ].join("\n") + "\n";
}

function csvCell(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function mapLimit(items, limit, callback) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await callback(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

function round(value, digits) {
  if (value === "" || value === null || value === undefined) return "";
  const scale = 10 ** digits;
  return Math.round(Number(value) * scale) / scale;
}

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function toDegrees(value) {
  return (Number(value) * 180) / Math.PI;
}
