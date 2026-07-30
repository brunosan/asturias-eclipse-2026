import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const checks = [];

const candidates = parseCsv(
  await fs.readFile(path.join(ROOT, "data", "candidate-sites.csv"), "utf8"),
);
const evidenceDocument = JSON.parse(
  await fs.readFile(
    path.join(ROOT, "data", "derived", "candidate-evidence.json"),
    "utf8",
  ),
);
const evidence = evidenceDocument.candidates;
const verdicts = parseCsv(
  await fs.readFile(
    path.join(ROOT, "data", "derived", "site-verdicts.csv"),
    "utf8",
  ),
);
const cloud = parseCsv(
  await fs.readFile(
    path.join(ROOT, "data", "derived", "cloud-climatology.csv"),
    "utf8",
  ),
);
const cloudJoint = parseCsv(
  await fs.readFile(
    path.join(ROOT, "data", "derived", "cloud-joint-scenarios.csv"),
    "utf8",
  ),
);
const forecast = parseCsv(
  await fs.readFile(
    path.join(ROOT, "data", "derived", "current-forecast-snapshot.csv"),
    "utf8",
  ),
);
const warGame = JSON.parse(
  await fs.readFile(
    path.join(ROOT, "site", "app", "data", "war-game-assessment.json"),
    "utf8",
  ),
);

check("candidate count", candidates.length === 26, `${candidates.length}/26`);
check(
  "candidate/evidence ids",
  sameIds(candidates, evidence),
  `${evidence.length} evidence rows`,
);
check(
  "candidate/verdict ids",
  sameIds(candidates, verdicts),
  `${verdicts.length} verdict rows`,
);
check(
  "all candidates total",
  evidence.every((row) => row.eclipse_kind === "total"),
  `${evidence.filter((row) => row.eclipse_kind === "total").length}/26`,
);
check(
  "all route baselines resolved",
  evidence.every((row) => row.routing_status === "ok"),
  `${evidence.filter((row) => row.routing_status === "ok").length}/26`,
);
check(
  "numeric terrain clearance",
  evidence.every((row) =>
    Number.isFinite(Number(row.minimum_totality_clearance_deg)),
  ),
  `${evidence.length} numeric values`,
);
check(
  "historical sample declaration",
  cloud.length === 12 && cloud.every((row) => Number(row.samples) === 600),
  `${cloud.length} locations`,
);
check(
  "joint cloud scenarios",
  cloudJoint.length === 18 &&
    cloudJoint.every((row) => Number(row.base_n) === 600) &&
    cloudJoint.find((row) => row.id === "nearby_gap_given_soto_partial")
      ?.conditional_pct === "17.3" &&
    cloudJoint.find((row) => row.id === "strict_low_any_ridge_clear")
      ?.conditional_pct === "54.3" &&
    cloudJoint.find((row) => row.id === "soto_overcast_any_south_clear")
      ?.conditional_pct === "61.6",
  `${cloudJoint.length} exact joint rows`,
);
check(
  "forecast snapshot segregated",
  forecast.length > 0 &&
    forecast.every((row) => row.status === "illustrative-only"),
  `${forecast.length} illustrative-only rows`,
);
check(
  "war-game scenario count",
  warGame.scenarios.length >= 20 &&
    warGame.meta.scenarioCount === warGame.scenarios.length,
  `${warGame.scenarios.length} scenarios`,
);
check(
  "war-game scenario ids unique",
  new Set(warGame.scenarios.map((scenario) => scenario.id)).size ===
    warGame.scenarios.length,
  `${new Set(warGame.scenarios.map((scenario) => scenario.id)).size} unique ids`,
);
check(
  "war-game probability provenance",
  warGame.scenarios.every((scenario) =>
    ["E", "L", "K", "H"].includes(scenario.probability.kind),
  ) &&
    warGame.scenarios
      .filter((scenario) => scenario.probability.kind === "E")
      .every((scenario) => Number.isFinite(scenario.probability.denominator)) &&
    warGame.scenarios
      .filter((scenario) => scenario.probability.kind === "H")
      .every(
        (scenario) =>
          !/\d+\s*[–-]\s*\d+%/.test(scenario.probability.label),
      ),
  "E/L/K/H declared; empirical denominators present; heuristic ranges qualitative",
);
check(
  "war-game operational responses",
  warGame.scenarios.every(
    (scenario) =>
      scenario.trigger &&
      scenario.action &&
      scenario.mitigation &&
      scenario.hardStop &&
      scenario.deadline,
  ),
  `${warGame.scenarios.length} complete response records`,
);
check(
  "route-pressure formulas",
  warGame.routes.length === warGame.meta.routeCount &&
    warGame.routes.every(
      (route) =>
        route.freeflowIsEta === false &&
        route.conditionalDisruption.calibrated === false &&
        route.conditionalDisruption.min == null &&
        route.conditionalDisruption.max == null &&
        scoreRoute(route.components) === route.pressureScore,
    ),
  `${warGame.routes.length} disclosed scores; no numeric disruption priors`,
);

const horizonFiles = (
  await fs.readdir(path.join(ROOT, "data", "derived", "horizon-profiles"))
).filter((file) => file.endsWith(".csv"));
check(
  "C2/maximum/C3 horizon profiles",
  horizonFiles.length === candidates.length * 3,
  `${horizonFiles.length}/${candidates.length * 3}`,
);

const routeFiles = (
  await fs.readdir(path.join(ROOT, "data", "derived", "routes"))
).filter((file) => file.endsWith(".geojson"));
check(
  "route geometry files",
  routeFiles.length === candidates.length,
  `${routeFiles.length}/${candidates.length}`,
);

const visualizationPath = path.join(
  ROOT,
  "maps",
  "scenario-atlas.fragment.html",
);
const visualization = await fs.readFile(visualizationPath, "utf8");
check(
  "inline atlas under 2 MB",
  Buffer.byteLength(visualization) < 2_000_000,
  `${Buffer.byteLength(visualization)} bytes`,
);
check(
  "inline atlas is a fragment",
  !/<(?:!doctype|html|head|body)\b/i.test(visualization),
  "no document wrapper",
);
check(
  "inline atlas placeholders resolved",
  !/__[A-Z_]+__/.test(visualization),
  "no unresolved placeholders",
);

const mapFiles = [
  "01-clear-near-soto.png",
  "02-coastal-west-east-options.png",
  "03-low-cloud-height-ladder.png",
  "04-leon-cross-divide.png",
  "05-historical-cloud-regimes.png",
];
for (const file of mapFiles) {
  const stat = await fs.stat(path.join(ROOT, "site", "public", "maps", file));
  check(`render ${file}`, stat.size > 50_000, `${stat.size} bytes`);
}

const reports = [
  "DECISION-PLAYBOOK.md",
  "COUNCIL-REVIEW.md",
  "METHODS-AND-SOURCES.md",
  "WAR-GAME-ASSESSMENT.md",
];
for (const file of reports) {
  const stat = await fs.stat(path.join(ROOT, "docs", file));
  check(`report ${file}`, stat.size > 1_000, `${stat.size} bytes`);
}

const passed = checks.filter((item) => item.passed).length;
const result = {
  generated_at: new Date().toISOString(),
  summary: {
    passed,
    failed: checks.length - passed,
    total: checks.length,
  },
  checks,
};
await fs.writeFile(
  path.join(ROOT, "validation", "atlas-validation.json"),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result.summary));
if (passed !== checks.length) process.exitCode = 1;

function check(name, passed, evidenceText) {
  checks.push({ name, passed, evidence: evidenceText });
}

function sameIds(left, right) {
  const leftIds = [...new Set(left.map((row) => row.id))].sort();
  const rightIds = [...new Set(right.map((row) => row.id))].sort();
  return (
    leftIds.length === left.length &&
    rightIds.length === right.length &&
    JSON.stringify(leftIds) === JSON.stringify(rightIds)
  );
}

function scoreRoute(components) {
  const weights = {
    resident: 0.1,
    tourism: 0.15,
    magnet: 0.15,
    seasonalLoad: 0.1,
    fragility: 0.2,
    overlap: 0.1,
    parking: 0.15,
    controls: 0.05,
  };
  const raw =
    (100 / 3) *
    Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + components[key] * weight,
      0,
    );
  return Math.round(raw / 5) * 5;
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
