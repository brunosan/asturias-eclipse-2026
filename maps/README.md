# Map set

Static map images are published once under `site/public/maps/` for both the web
application and repository review:

1. `site/public/maps/01-clear-near-soto.png` — closest clear-weather options and totality
   bearing.
2. `site/public/maps/02-coastal-west-east-options.png` — one-branch west/east coastal dodge.
3. `site/public/maps/03-low-cloud-height-ladder.png` — intermediate and high sites with
   operational status.
4. `site/public/maps/04-leon-cross-divide.png` — early south-side escape, managed and rejected
   options.
5. `site/public/maps/05-historical-cloud-regimes.png` — CERRA clear/light-cloud frequency at
   18:00 UTC.
6. `scenario-atlas.html` — interactive version; select a scenario, then a site
   to inspect its trigger, solar geometry, terrain clearance and hard stop.

Blue circles are recommended operational anchors, pink diamonds are conditional
and orange crosses are rejected for reactive use. Orange contours are the
official IGN 100- and 110-second totality-duration bands.

The basemap is Eurostat GISCO NUTS 2024 geometry. Routes are OSRM/OpenStreetMap
free-flow baselines. Full provenance and caveats are in
`docs/METHODS-AND-SOURCES.md`.
