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
  assert.match(html, /Live road incident feed/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/i);
});

test("keeps live integrations server-side and starter metadata removed", async () => {
  const [page, layout, packageJson, weatherRoute, trafficRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/api/weather/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/traffic/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /fetch\("\/api\/weather"/);
  assert.match(page, /fetch\("\/api\/traffic"/);
  assert.match(weatherRoute, /api\.open-meteo\.com/);
  assert.match(trafficRoute, /nap\.dgt\.es/);
  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
