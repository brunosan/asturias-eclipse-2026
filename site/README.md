# Eclipse / Asturias 2026

Mobile-first decision support for the 12 August 2026 total solar eclipse, using
Soto del Barco town centre as a public routing reference.

The site combines:

- four pre-audited movement scenarios and static suitability maps;
- timestamped Open-Meteo cloud-layer forecasts for 20:27 CEST;
- timestamped DGT DATEX II incident records tagged Asturias or León;
- device-local, expiring manual execution gates;
- official AEMET, DGT, 112 Asturias, mobility and fire-restriction links.

It is deliberately fail closed: stale or missing data, an expired movement
window, or an unchecked manual gate produces no actionable recommendation.

## Local verification

```bash
npm install
npm run lint
npm test
```

`npm test` builds the vinext/Cloudflare production artifact and checks the
server-rendered decision surface. No database or account is used.
