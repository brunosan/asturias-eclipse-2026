import { chromium } from "playwright";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const standalone = await fs.readFile(
  path.join(ROOT, "maps", "scenario-atlas.html"),
);
const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(standalone);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }
    : {}),
});
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1.5,
});
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`page: ${error.message}`));

await page.goto(`http://127.0.0.1:${address.port}/`, {
  waitUntil: "networkidle",
});
await page.waitForFunction(
  () =>
    document.querySelector("#atlas-title")?.textContent?.length > 0 &&
    document.querySelectorAll(".region-layer path").length >= 6,
);

const snapshots = [
  ["clear", "01-clear-near-soto.png"],
  ["coast", "02-coastal-west-east-options.png"],
  ["low", "03-low-cloud-height-ladder.png"],
  ["leon", "04-leon-cross-divide.png"],
  ["climate", "05-historical-cloud-regimes.png"],
];

for (const [scenario, filename] of snapshots) {
  await page.locator(`[data-scenario="${scenario}"]`).click();
  await page.locator("#eclipse-atlas-2026").screenshot({
    path: path.join(ROOT, "site", "public", "maps", filename),
  });
}

await page.setViewportSize({ width: 360, height: 900 });
await page.locator('[data-scenario="clear"]').click();
await fs.mkdir(path.join(ROOT, "tmp"), { recursive: true });
await page.locator("#eclipse-atlas-2026").screenshot({
  path: path.join(ROOT, "tmp", "atlas-mobile-check.png"),
});

const audit = await page.evaluate(() => ({
  title: document.querySelector("#atlas-title")?.textContent,
  regions: document.querySelectorAll(".region-layer path").length,
  visibleMapWidth: document.querySelector(".atlas-map")?.getBoundingClientRect().width,
  pageScrollWidth: document.documentElement.scrollWidth,
  pageClientWidth: document.documentElement.clientWidth,
}));
await browser.close();
await new Promise((resolve, reject) =>
  server.close((error) => (error ? reject(error) : resolve())),
);

if (errors.length) {
  throw new Error(errors.join("\n"));
}
if (audit.pageScrollWidth > audit.pageClientWidth + 1) {
  throw new Error(`Horizontal overflow: ${JSON.stringify(audit)}`);
}
console.log(JSON.stringify(audit, null, 2));
