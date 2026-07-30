import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the eclipse decision surface", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Eclipse \/ Asturias 2026 · Decision Support<\/title>/i);
  assert.match(html, /One eclipse\./);
  assert.match(html, /Four moves\./);
  assert.match(html, /NO ACTIONABLE RECOMMENDATION/);
  assert.match(html, /Thirty ways the plan can change—or fail\./);
  assert.match(html, /Known-capacity vehicle stress test/);
  assert.match(html, /WX01/);
  assert.match(html, /DT05/);
  assert.match(html, /Live road incident feed/i);
  assert.doesNotMatch(html, /Likely: 60–85%|Conditional disruption/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/i);
});

test("keeps live integrations server-side and starter metadata removed", async () => {
  const [page, layout, packageJson, weatherRoute, trafficRoute, warGameRaw] =
    await Promise.all([
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../app/api/weather/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/traffic/route.ts", import.meta.url), "utf8"),
      readFile(
        new URL("../app/data/war-game-assessment.json", import.meta.url),
        "utf8",
      ),
    ]);
  const warGame = JSON.parse(warGameRaw);

  assert.match(page, /fetch\("\/api\/weather"/);
  assert.match(page, /fetch\("\/api\/traffic"/);
  assert.match(page, /eclipse-live-gates-v2/);
  assert.match(page, /coast-west/);
  assert.match(page, /coast-east/);
  assert.match(page, /West corridor/);
  assert.match(page, /East corridor/);
  assert.doesNotMatch(page, /setChecksUpdatedAt/);
  assert.match(weatherRoute, /api\.open-meteo\.com/);
  assert.match(trafficRoute, /nap\.dgt\.es/);
  assert.match(trafficRoute, /situationRecord/);
  assert.match(trafficRoute, /extractAll\(record, "lse:municipality"\)/);
  assert.match(trafficRoute, /extractAll\(record, "lse:province"\)/);
  assert.match(trafficRoute, /incident\.municipalities\.some/);
  assert.match(trafficRoute, /tineu: "tineo"/);
  assert.match(trafficRoute, /ROUTE_CORRIDORS/);
  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.equal(warGame.scenarios.length, 30);
  assert.equal(warGame.routes.length, 10);
  assert.deepEqual(
    [...new Set(warGame.scenarios.map((scenario) => scenario.probability.kind))].sort(),
    ["E", "H", "K", "L"],
  );
  assert.ok(
    warGame.scenarios.every(
      (scenario) =>
        scenario.trigger &&
        scenario.action &&
        scenario.mitigation &&
        scenario.hardStop,
    ),
  );
});
