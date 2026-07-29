import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW = path.join(ROOT, "data", "raw");
const DERIVED = path.join(ROOT, "data", "derived");
const REGION_IDS = new Set([
  "ES120",
  "ES112",
  "ES130",
  "ES412",
  "ES413",
  "ES414",
]);
const ROUTE_IDS = new Set([
  "soto-quebrantos",
  "espiritu-santo",
  "muros-aguilar",
  "mirador-penona",
  "pico-viso",
  "cabo-vidio",
  "caroyas",
  "frexulfe",
  "serantes",
  "espartal",
  "xago",
  "faro-luces",
  "tineo-casa-puerto",
  "santuario-acebo",
  "cobertoria",
  "farrapona",
  "camposagrado",
  "leon-palacio",
  "villadangos",
]);

await fs.mkdir(DERIVED, { recursive: true });

const nuts = JSON.parse(
  await fs.readFile(path.join(RAW, "eurostat-nuts-2024-1m.geojson"), "utf8"),
);
const regions = {
  type: "FeatureCollection",
  source:
    "Eurostat GISCO NUTS 2024, 1:1 million, EPSG:4326, downloaded 2026-07-29",
  features: nuts.features
    .filter((feature) => REGION_IDS.has(feature.properties.NUTS_ID))
    .map((feature) => ({
      type: "Feature",
      properties: {
        id: feature.properties.NUTS_ID,
        name: feature.properties.NAME_LATN,
      },
      geometry: simplifyGeometry(feature.geometry, 0.003),
    })),
};
await fs.writeFile(
  path.join(DERIVED, "map-regions.geojson"),
  JSON.stringify(regions),
);

const duration = JSON.parse(
  await fs.readFile(path.join(RAW, "ign-totality-duration-2026.geojson"), "utf8"),
);
const totality = {
  type: "FeatureCollection",
  source:
    "Instituto Geografico Nacional 2026 totality-duration GeoJSON, downloaded 2026-07-29",
  features: duration.features
    .filter((feature) => [100, 110].includes(feature.properties.DuracionTotalSeg))
    .map((feature) => ({
      type: "Feature",
      properties: {
        duration_seconds: feature.properties.DuracionTotalSeg,
      },
      geometry: simplifyGeometry(feature.geometry, 0.008),
    })),
};
await fs.writeFile(
  path.join(DERIVED, "map-totality.geojson"),
  JSON.stringify(totality),
);

const routeFiles = await fs.readdir(path.join(DERIVED, "routes"));
const routeFeatures = [];
for (const file of routeFiles.sort()) {
  const id = file.replace(/\.geojson$/, "");
  if (!ROUTE_IDS.has(id)) continue;
  const route = JSON.parse(
    await fs.readFile(path.join(DERIVED, "routes", file), "utf8"),
  );
  const sourceFeature =
    route.type === "FeatureCollection" ? route.features[0] : route;
  routeFeatures.push({
    type: "Feature",
    properties: { id },
    geometry: simplifyGeometry(sourceFeature.geometry, 0.0003),
  });
}
const routes = {
  type: "FeatureCollection",
  source:
    "OSRM route geometry over OpenStreetMap, retrieved 2026-07-29; free-flow planning baseline only",
  features: routeFeatures,
};
await fs.writeFile(
  path.join(DERIVED, "map-routes.geojson"),
  JSON.stringify(routes),
);

console.log(
  `Wrote ${regions.features.length} regions, ${totality.features.length} duration bands and ${routeFeatures.length} routes.`,
);

function simplifyGeometry(geometry, tolerance) {
  if (geometry.type === "LineString") {
    return { ...geometry, coordinates: simplifyLine(geometry.coordinates, tolerance) };
  }
  if (geometry.type === "MultiLineString") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((line) =>
        simplifyLine(line, tolerance),
      ),
    };
  }
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring, index) =>
        windRing(
          closeRing(simplifyLine(openRing(ring), tolerance)),
          index === 0 ? "clockwise" : "counterclockwise",
        ),
      ),
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) =>
        polygon.map((ring, index) =>
          windRing(
            closeRing(simplifyLine(openRing(ring), tolerance)),
            index === 0 ? "clockwise" : "counterclockwise",
          ),
        ),
      ),
    };
  }
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

function openRing(ring) {
  if (
    ring.length > 1 &&
    ring[0][0] === ring.at(-1)[0] &&
    ring[0][1] === ring.at(-1)[1]
  ) {
    return ring.slice(0, -1);
  }
  return ring;
}

function closeRing(ring) {
  if (!ring.length) return ring;
  return [...ring, ring[0]];
}

function windRing(ring, direction) {
  let signedArea = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    signedArea +=
      ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  const isCounterclockwise = signedArea > 0;
  const shouldBeCounterclockwise = direction === "counterclockwise";
  return isCounterclockwise === shouldBeCounterclockwise
    ? ring
    : [...ring].reverse();
}

function simplifyLine(points, tolerance) {
  if (points.length <= 2) return points;
  const sqTolerance = tolerance * tolerance;
  const kept = new Uint8Array(points.length);
  kept[0] = 1;
  kept[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxDistance = 0;
    let index = 0;
    for (let i = first + 1; i < last; i += 1) {
      const distance = squaredSegmentDistance(
        points[i],
        points[first],
        points[last],
      );
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    if (maxDistance > sqTolerance) {
      kept[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, index) => kept[index]);
}

function squaredSegmentDistance(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t =
      ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}
