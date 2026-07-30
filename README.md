# Asturias Eclipse 2026

Public decision support for the total solar eclipse of 12 August 2026, using
Soto del Barco town centre as a public routing reference.

This repository combines a live-data web interface with a scenario atlas,
derived evidence, an operational playbook, a simulated council review, and a
release assessment. It is designed to help choose one safe branch early—not to
encourage a last-minute cloud chase.

## Decision model

The plan has four mutually exclusive movement branches:

1. stay near Soto del Barco when the coast and the 280° up-sun corridor are
   clear;
2. make one early west-or-east coastal move when a broad, stable clear slot is
   materially better;
3. use a measured height ladder only when cloud **top** is below the selected
   site and middle/high layers are clear;
4. cross the Cantabrian divide early when observations and models show a
   persistent south-side advantage and a legal destination is confirmed.

Missing or stale weather, unknown access, unresolved restrictions, or an
expired movement gate must produce **no actionable recommendation**. The site
cannot guarantee a clear Sun.

## Audit surfaces

- [Project intent](docs/PROJECT-INTENT.md)
- [Decision playbook](docs/DECISION-PLAYBOOK.md)
- [Council review](docs/COUNCIL-REVIEW.md)
- [Long-tail war-game assessment](docs/WAR-GAME-ASSESSMENT.md)
- [Methods and sources](docs/METHODS-AND-SOURCES.md)
- [Public release assessment](docs/RELEASE-ASSESSMENT.md)
- [Candidate inputs](data/candidate-sites.csv)
- [Calculated candidate evidence](data/derived/candidate-evidence.csv)
- [Site verdicts](data/derived/site-verdicts.csv)
- [Historical cloud analysis](data/derived/cloud-climatology.csv)
- [Joint cloud-regime scenarios](data/derived/cloud-joint-scenarios.csv)
- [Machine-readable 30-scenario and route-pressure register](site/app/data/war-game-assessment.json)
- [Atlas validation receipt](validation/atlas-validation.json)
- [Interactive scenario atlas](maps/scenario-atlas.html)
- [Web application source](site/)

The exact planning origin, `43.5344336, -6.0691092`, is a public town-centre
routing reference. It is not a residence or private address.

## Repository layout

```text
docs/        intent, playbook, council review, methods, release assessment
data/        candidate inputs and derived, reviewable evidence
maps/        interactive atlas source and standalone HTML
scripts/     evidence, map, rendering, and validation helpers
site/        live-data web application
validation/  machine-readable verification receipt
```

Raw third-party mirrors, downloaded PDFs, source screenshots, private hosting
metadata, prompts, transcripts, and local runtime artifacts are deliberately
excluded. [Data source notes](data/SOURCES.md) record the omitted inputs,
retrieval locations, and hashes used for the 29 July evidence cut.

## Local verification

Atlas and evidence:

```bash
npm ci
npm run check
```

To regenerate the five static map states, install Playwright's Chromium once
and run the renderer:

```bash
npx playwright install chromium
npm run render:maps
```

Alternatively, set `PLAYWRIGHT_CHROME_PATH` to a local Chromium-compatible
browser executable before running the renderer.

Live-data site:

```bash
cd site
npm ci
npm run lint
npm test
```

The site reads Open-Meteo forecast data and the DGT DATEX II incident feed at
runtime. It matches every non-expired DGT situation record to the road
references used by ten assessed routes before truncating the display. Provider
failure or zero route matches remain visible and are never interpreted as clear
weather or a clear road.

## Publication boundary

The public evidence cut is 29 July 2026. Forecasts, warnings, access rules,
traffic controls, shuttle plans, and fire restrictions are time-sensitive and
must be rechecked against the linked official sources.

No top-level project licence has been selected. Public visibility is not a
blanket licence for the code, narrative, or third-party-derived material; see
[NOTICE.md](NOTICE.md).
