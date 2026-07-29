import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEMPLATE = path.join(ROOT, "maps", "atlas-fragment.template.html");
const FRAGMENT_OUTPUT = path.join(
  ROOT,
  "maps",
  "scenario-atlas.fragment.html",
);
const STANDALONE_OUTPUT = path.join(ROOT, "maps", "scenario-atlas.html");

const regions = JSON.parse(
  await fs.readFile(path.join(ROOT, "data", "derived", "map-regions.geojson"), "utf8"),
);
const totality = JSON.parse(
  await fs.readFile(path.join(ROOT, "data", "derived", "map-totality.geojson"), "utf8"),
);
const routes = JSON.parse(
  await fs.readFile(path.join(ROOT, "data", "derived", "map-routes.geojson"), "utf8"),
);
const evidence = JSON.parse(
  await fs.readFile(path.join(ROOT, "data", "derived", "candidate-evidence.json"), "utf8"),
).candidates;
const verdicts = indexBy(
  parseCsv(await fs.readFile(path.join(ROOT, "data", "derived", "site-verdicts.csv"), "utf8")),
  "id",
);
const cloudRows = parseCsv(
  await fs.readFile(path.join(ROOT, "data", "derived", "cloud-climatology.csv"), "utf8"),
);

const points = evidence.map((point) => {
  const verdict = verdicts.get(point.id);
  return {
    id: point.id,
    name: point.name,
    branch: verdict.branch,
    operational_status: verdict.operational_status,
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
    dem_elevation_m: Number(point.dem_elevation_m),
    freeflow_drive_min: Number(point.freeflow_drive_min),
    maximum_altitude_deg: Number(point.maximum_altitude_deg),
    maximum_azimuth_deg: Number(point.maximum_azimuth_deg),
    minimum_totality_clearance_deg: Number(point.minimum_totality_clearance_deg),
    minimum_trigger: verdict.minimum_trigger,
    hard_stop: verdict.hard_stop,
  };
});

const cloudNames = {
  "soto-leas": "Soto",
  tapia: "Tapia",
  "cabo-vidio": "Vidio",
  "cabo-penas": "Peñas",
  llanes: "Llanes",
  leitariegos: "Leitariegos",
  cubilla: "Cubilla",
  "san-isidro": "San Isidro",
  "fuente-de": "Fuente Dé",
  astorga: "Astorga",
  leon: "León",
  sahagun: "Sahagún",
};
const clouds = cloudRows.map((row) => ({
  id: row.id,
  short_label: cloudNames[row.id],
  latitude: Number(row.cerra_grid_latitude),
  longitude: Number(row.cerra_grid_longitude),
  clear_pct: Number(row.clear_or_lightly_cloudy_pct),
}));

let fragment = await fs.readFile(TEMPLATE, "utf8");
const replacements = {
  __REGIONS_JSON__: JSON.stringify(regions),
  __TOTALITY_JSON__: JSON.stringify(totality),
  __ROUTES_JSON__: JSON.stringify(routes),
  __POINTS_JSON__: JSON.stringify(points),
  __CLOUD_JSON__: JSON.stringify(clouds),
};
for (const [placeholder, value] of Object.entries(replacements)) {
  if (!fragment.includes(placeholder)) {
    throw new Error(`Template placeholder missing: ${placeholder}`);
  }
  fragment = fragment.replace(placeholder, value);
}
if (/__[A-Z_]+__/.test(fragment)) {
  throw new Error("Unresolved template placeholder");
}
const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>Asturias Eclipse Decision Atlas</title>
</head>
<body>
${fragment}
</body>
</html>
`;

await fs.writeFile(FRAGMENT_OUTPUT, fragment);
await fs.writeFile(STANDALONE_OUTPUT, standalone);
console.log(
  `Wrote ${path.relative(ROOT, FRAGMENT_OUTPUT)} and ${path.relative(
    ROOT,
    STANDALONE_OUTPUT,
  )} (${Buffer.byteLength(standalone)} bytes)`,
);

function indexBy(rows, key) {
  return new Map(rows.map((row) => [row[key], row]));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...values] = rows;
  return values.map((valueRow) =>
    Object.fromEntries(header.map((key, index) => [key, valueRow[index] || ""])),
  );
}
