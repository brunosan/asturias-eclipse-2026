# Methods, sources and audit trail

## Scope and assumptions

The atlas answers a decision-support question using Soto del Barco town centre
as a public routing reference on 12 August 2026. The exact origin is not a
residence or private address. The analysis assumes private-car mobility unless
an official shuttle, walking or public transport is explicitly preferred. It
does not assume access to private land, guaranteed parking, a special permit or
an unpublished road exemption.

The analysis separates four things that are often collapsed:

1. astronomical totality and solar position;
2. ground-terrain obstruction at the relevant azimuth;
3. cloud regime and forecast uncertainty;
4. whether a site can be reached and used legally under eclipse demand.

## Reproducible review surfaces

| Surface | What it contains |
|---|---|
| `data/candidate-sites.csv` | Human-entered candidate name, coordinate, declared status, capacity and access note |
| `data/derived/candidate-evidence.csv` | Calculated astronomy, terrain, municipal population and free-flow route baseline for all 26 candidates |
| `data/derived/site-verdicts.csv` | Recommendation status, trigger and hard stop for every mapped candidate |
| `data/derived/horizon-profiles/` | Every 200 m elevation sample used in each C2/maximum/C3 terrain result |
| `data/derived/cloud-climatology.csv` | Full 18:00 UTC CERRA location statistics |
| `data/derived/cloud-conditional.csv` | Conditional outcomes when the Soto grid cell was overcast or strictly low-cloud dominant |
| `data/derived/cloud-joint-scenarios.csv` | Fresh exact joint counts for coastal gradients, ridge outcomes and south-side escapes |
| `data/derived/current-forecast-snapshot.csv` | Long-range forecast snapshot, separated from climatology |
| `data/derived/cloud-method-metadata.json` | Exact model, date window, request template, definitions and caveats |
| `data/derived/official-site-data-audit.json` | Field-completeness audit of the 78-site Asturias feed |
| `site/app/data/war-game-assessment.json` | Thirty long-tail conditions, ten route-pressure assessments and probability provenance |
| `docs/WAR-GAME-ASSESSMENT.md` | Council review, joint-cloud interpretation and disclosed traffic model |
| `maps/` | Five static scenario maps, an interactive atlas and its template |
Raw external mirrors and source screenshots are deliberately omitted from this
public repository. Their exact upstream URLs and local verification hashes are
recorded in `data/SOURCES.md`. Derived evidence is published read-only and was
never used to overwrite source inputs.

## Astronomy

The official public timing source is the [IGN municipality
table](https://astronomia.ign.es/resources/informacion-astronomica/eclipses/tablas/eclipse-sol-12-08-2026-tabla.html).
The authoritative public explainer and viewer are the [IGN 12 August 2026
page](https://astronomia.ign.es/es/eclipses-de-sol-y-luna/eclipse-total-sol-de-12-de-agosto-2026)
and [IGN eclipse visualizer](https://visualizadores.ign.es/eclipses/2026).

Site-level C1, C2, maximum, C3, C4, altitude and true azimuth were calculated
with Astronomy Engine 2.1.19:

```text
observer = latitude, longitude, site elevation
event = SearchLocalSolarEclipse(after 2026-08-01)
horizontal Sun = Horizon(event time, observer, apparent equatorial Sun)
```

Astronomy Engine models a smooth lunar limb. Mountain valleys on the true lunar
limb can shift predicted contacts by several seconds. The map therefore rounds
unofficial site circumstances and defers public contact timing to IGN.

The official totality-duration and terrain-visibility source files were
downloaded from:

- `https://www.ign.es/web/resources/viewer/eclipses/durtot_estandard_2026.geojson`
- `https://www.ign.es/web/resources/viewer/eclipses/shadows_merged_18.291-18.567-2026-simplified-0.0001.geojson`

All 26 candidate coordinates fall within totality. The operational ranking does
not chase a few centreline seconds.

## Terrain horizon

Terrain comes from the official [IDEE elevation-profile
process](https://api-processes.idee.es/processes/elevationProfile), backed by
IGN MDT05. For every candidate, the script sends a 100 km geodesic ray at each
of the C2, maximum and C3 solar azimuths. It samples at 200 m.

For observer elevation \(z_0\), sample elevation \(z_i\), spherical Earth radius
\(R\), and surface distance \(d_i\), the apparent ground angle is:

```text
vertical   = (R + zi) cos(di / R) - (R + z0)
horizontal = (R + zi) sin(di / R)
angle_i    = atan2(vertical, horizontal)
horizon    = max(0, angle_i)
clearance  = minimum solar altitude during totality - corresponding horizon
```

This is ground terrain only. It contains no buildings, trees, temporary
structures or terrestrial-refraction correction. A site scout remains
mandatory. The exact samples behind every number are in
`data/derived/horizon-profiles/`.

This check rejected or qualified important pins:

- Playa del Aguilar: roughly 7.34° terrain horizon, leaving only about 3.05°
  during totality;
- Coto Bello numeric pin: roughly 8.12° horizon and 1.75° clearance;
- Cuitunigru numeric pin: sampled elevation 1639 m rather than the declared
  1850 m, with about 1.74° clearance;
- Sotres–La Caballar: about 5.28° clearance and severe access constraints.

The Coto Bello result is coordinate-sensitive: the separate coordinate text in
the official feed, roughly 200 m west, falls in IGN's fully visible class. The
atlas rejects the current pin, not the wider official event.

## Routing, population and crowd pressure

Routes use the public OSRM service over OpenStreetMap with `overview=full` and
the planning origin 43.5344336, -6.0691092. Every route GeoJSON retains the
query URL and retrieval time in `data/derived/routes/`.

The values are **free-flow baselines**. OSRM does not know eclipse traffic,
closures, parking searches, shuttles or emergency controls. No multiplier was
applied, and no baseline is presented as an eclipse-day ETA.

Municipal population uses the INE 1 January 2025 totals:

- [Asturias table 2886](https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/2886)
- [León table 2877](https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/2877)

Population is retained as context, not used as an attendance forecast. Summer
visitors and eclipse travel dominate local resident counts.

The 30 July war game adds a deliberately uncalibrated **route-pressure triage**
model. It combines eight published 0–3 components: residents, May 2026 INE
tourist-bed intensity, site attraction, summer arterial load, last-mile
fragility, competing-route overlap, parking confidence and control state.
Every component, weight, imputation and hard override is published in
[`WAR-GAME-ASSESSMENT.md`](WAR-GAME-ASSESSMENT.md) and the machine-readable
register. The result is a low/guarded/high/severe/critical pressure band—not a
travel time.

The tourism proxy comes from [INE tourist dwellings and beds, May
2026](https://www.ine.es/jaxiT3/Tabla.htm?t=39363). It is not occupancy, total
tourism or car demand. Where the official people capacity is complete, the site
also shows a wide vehicle-demand **stress test** using declared assumptions; it
is not an attendance forecast.

Live corridor membership uses OSRM step road references plus official IGN
municipality-boundary intersections. DGT records are matched against every
province and municipality value they supply. Road and municipality sets are
independent filters rather than kilometre-accurate segments, so they may
overmatch and can never prove a route clear.

The [official Asturias observation-site
API](https://eclipseasturias2026.ficyt.es/api/eclipse_observation_spots.php)
contained 78 sites on 29 July. Forty-two had a populated `aforo`; none had a
populated parking, accessibility, toilet, supplies, lighting or overnight
field. Empty fields are missing data, not evidence of absence. `Aforo` is
people, not cars.

Operational statuses are therefore categorical and checkable:

- **recommended:** good geometry plus a credible operational role;
- **conditional:** usable only when the named trigger and access checks pass;
- **pre-position/transit only:** cannot be treated as a reactive drive;
- **rejected/current pin rejected:** a hard geometry, capacity, access or
  legality problem remains.

## Historical cloud

### Independent official benchmark

AEMET's [29 May eclipse-cloud
study](https://www.aemet.es/es/noticias/2026/05/estudio_nubosidad_eclipse)
uses bias-corrected ERA5 and NWC-SAF satellite Cloud Mask data for 2010–2025,
11–13 August, 17:00–20:00 UTC. It reports roughly 30–50% clear/lightly cloudy
frequency along the Cantabrian coast and 50–70% across much of Castilla y León.
The source image used for visual comparison is identified by hash in
`data/SOURCES.md` but is not redistributed. AEMET explicitly says this is
climatology, not the 12 August forecast.

### Reproducible point sensitivity analysis

The atlas also queries CERRA through the Open-Meteo Historical Weather API:

- 1991–2020 inclusive;
- 1–20 August each year;
- 18:00 UTC;
- 600 observations per location;
- total, low, middle and high cloud cover.

Request template:

```text
https://archive-api.open-meteo.com/v1/archive?latitude={LAT_LIST}&longitude={LON_LIST}&elevation={ELEVATION_LIST}&start_date={YEAR}-08-01&end_date={YEAR}-08-20&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&timezone=UTC&models=cerra
```

Definitions:

- clear/lightly cloudy: total cloud cover ≤20%;
- overcast: total cloud cover ≥80%;
- CERRA low layer: surface–2500 m;
- middle layer: 2500–5000 m;
- high layer: above 5000 m.

These are instantaneous grid-area fractions. Layers can overlap and do not sum
to total cloud. Open-Meteo's default land-cell selection shifted some requested
coordinates; requested and returned coordinates are both recorded.

Headline clear/lightly-cloudy shares:

| Grid cell | Share |
|---|---:|
| Soto/airport-area coast | 37.7% |
| Cabo Vidio coast | 39.0% |
| Tapia coast | 32.3% |
| Leitariegos ridge | 37.2% |
| La Cubilla ridge | 27.8% |
| San Isidro ridge | 20.0% |
| Fuente Dé/Picos | 18.3% |
| Astorga plain | 68.3% |
| León plain | 64.5% |
| Sahagún plain | 62.3% |

When the Soto grid cell was overcast (125 cases), another sampled coastal cell
was clear/light in only 0–6.4% of cases; Leitariegos/Cubilla/San
Isidro/Fuente Dé were clear in 8–14.4%; Astorga was clear in 49.6%, León in
38.4%, and Sahagún in 44.0%.

The strict shallow-low-cloud screen has only 35 cases, so it is directional,
not a probability claim. In those cases, the high ridges were clear in
25.7–42.9% and the south plain in 68.6–91.4%.

The exact joint recomputation is published separately in
`data/derived/cloud-joint-scenarios.csv`. It adds the operationally relevant
distinctions:

- with partial cloud at Soto, any other sampled coast was clear in 42.6% of
  cases but the nearby Vidio-or-Peñas pair in only 17.3%;
- with Soto overcast, any other sampled coast was clear in 8.0% and the nearby
  pair in 0.8%;
- under the strict shallow-deck signature, any sampled ridge was clear in
  54.3%, all ridges failed in 45.7%, and any sampled south point was clear in
  all 35 cases;
- when all sampled coast cells were non-clear, a sampled south point was clear
  in 63.2% of cases.

These scenarios overlap and cannot be added to 100%.

The main inference is robust but limited: another coastal point is not an
independent escape when Soto is deeply clouded; a cross-divide branch changes
the weather regime more than a Picos altitude chase.

## Current forecast snapshot

The current snapshot was retrieved on 29 July for 12 August at 18:00 UTC. It is
kept separate from climatology.

- ECMWF deterministic IFS 0.25°, initialized 29 July 00:00 UTC:
  [exact request](https://single-runs-api.open-meteo.com/v1/forecast?latitude=43.535,43.57,43.59,43.655,43.42,42.996,43.033,43.06,43.144,42.455,42.6,42.371&longitude=-6.07,-6.943,-6.242,-5.85,-4.75,-6.414,-5.967,-5.39,-4.812,-6.055,-5.57,-5.029&elevation=50,40,90,100,20,1525,1683,1520,1823,870,840,820&run=2026-07-29T00:00&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&models=ecmwf_ifs025&timezone=UTC&forecast_days=15)
- Open-Meteo GFS Ensemble Seamless, 31 returned fields:
  [exact request](https://ensemble-api.open-meteo.com/v1/ensemble?latitude=43.535,43.57,43.59,43.655,43.42,42.996,43.033,43.06,43.144,42.455,42.6,42.371&longitude=-6.07,-6.943,-6.242,-5.85,-4.75,-6.414,-5.967,-5.39,-4.812,-6.055,-5.57,-5.029&elevation=50,40,90,100,20,1525,1683,1520,1823,870,840,820&hourly=cloud_cover&models=gfs_seamless&timezone=UTC&forecast_days=16)

The GFS endpoint exposes no initialization timestamp, and the seamless product
can change resolution with lead time. The ECMWF 51-field ensemble ended at
14:00 UTC, exactly four hours before the target. These limitations are why the
snapshot is labelled `illustrative-only`.

## Live forecast stack

Use the following sources in decreasing time horizon:

1. [AEMET Asturias and mountain
   forecasts](https://www.aemet.es/en/eltiempo/prediccion/montana?p=peu1&w=4)
2. [AEMET HARMONIE-AROME
   viewer](https://www.aemet.es/es/eltiempo/prediccion/modelosnumericos/harmonie_arome?opc2=pybal&opc3=nb)
3. [AEMET visible
   satellite](https://www.aemet.es/es/eltiempo/observacion/satelite/visible)
4. Meteosat Third Generation cloud type/top products and ridge webcams
5. direct observation along the 280° up-sun corridor

The operational rule uses three consecutive 10-minute satellite frames to
avoid reacting to one transient image. By D-4, AEMET's 2.5 km
HARMONIE-AROME becomes the main local model; on the day, satellite and direct
observations outweigh long-range climatology.

## Traffic, access and regulatory sources

- [Principado 16 July operation: 700 staff, 78 sites and special
  transport](https://actualidad.asturias.es/-/eclipse1607)
- [Asturias eclipse mobility
  plan](https://eclipseasturias2026.ficyt.es/movilidad.php)
- [DGT summer 2026 eclipse
  operation](https://www.dgt.es/comunicacion/notas-de-prensa/20260630-trafico-activa-operacion-verano-2026/)
- [BOE 2026 special traffic resolution](https://www.boe.es/buscar/act.php?id=BOE-A-2026-1255)
- [DGT live cameras](https://www.dgt.es/conoce-el-estado-del-trafico/camaras-de-trafico/)
- [112 Asturias road
  status](https://www.112asturias.es/v_portal/apartados/apartado.asp?te=60)
- [Asturias fire-use
  rules](https://www.asturias.es/temas/agricultura-gestion-forestal/incendios-forestales-prevencion/uso-del-fuego)
- [Lagos de Covadonga summer
  access](https://parquenacionalpicoseuropa.es/regulacion-del-acceso-a-lagos-de-covadonga-en-transporte-publico-desde-el-28-de-marzo/)
- [Picos visit
  rules](https://parquenacionalpicoseuropa.es/visitas/prepara-tu-visita/)
- [ESA official León
  event](https://www.esa.int/Space_in_Member_States/Spain/Vive_el_eclipse_solar_total_con_la_ESA_en_Leon)
- [City of León venue page: about 400 parking
  spaces](https://leon.es/mas-leon/palacio-de-exposiciones/)
- [Junta Castilla y León eclipse
  portal](https://www.jcyl.es/web/es/portada/eclipse-solar.html)
- [AP-66 Negrón summer
  works](https://www.europapress.es/castilla-y-leon/noticia-obras-ap-66-leon-asturias-provocaran-cortes-alternativos-tunel-negron-julio-noviembre-20260630125007.html)
- [A-8/A-64 tunnel works and summer
  diversions](https://www.europapress.es/asturias/noticia-obras-autovias-64-transportes-anuncia-cortes-desvios-veraniegos-siete-tuneles-asturias-20260703121312.html)

The BOE resolution lists every road in Asturias and Castilla y León under the
12 August special plan. It does not itself specify that every road will close.
Exact municipal orders and site-level controls must be rechecked.

The reviewed León tourism brochure is a recommendation brochure, not a parking
or traffic plan. The downloaded copy is not redistributed. Its sites were not
treated as managed events unless independently confirmed.

## Geographic map sources

The map projects, with d3-geo:

- Eurostat GISCO NUTS 2024 1:1 million regional geometry:
  `https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326.geojson`
- IGN official 100- and 110-second duration polygons;
- OSRM/OpenStreetMap route geometries;
- source coordinates from the official Asturias feed and cited León sources.

The embedded map geometry is simplified only for rendering. The raw source
files are omitted from the public repository; their URLs and hashes are in
`data/SOURCES.md`, and simplified geometry is in
`data/derived/map-*.geojson`.

## Rebuild and validation

From the project root, after restoring the omitted raw source files where a
data rebuild requires them:

```text
npm run build:data
npm run build:map-data
npm run build:atlas
npm run render:maps
npm run verify
```

The last command opens the rendered atlas, exercises all five scenario
controls, captures each state and checks the 360 px layout for horizontal
overflow and runtime errors.

## Limitations

- No current dataset supports a credible eclipse-day traffic ETA.
- Route-pressure scores are disclosed structured judgments converted to
  ordinal bands, not event frequencies or delay probabilities.
- INE tourist-bed counts are a demand-intensity proxy, not occupancy or cars.
- No populated official parking inventory exists in the Asturias feed.
- Terrain is a DEM screen, not a field survey.
- Cloud fraction does not encode optical thickness.
- CERRA is point/grid-cell climatology, not a continuous local map.
- The strict low-cloud conditional sample is small.
- Long-range forecast detail will change.
- Exact municipal controls, fire restrictions and several shuttle/lift plans
  remain unpublished or unverified.
- The plan reduces uncertainty; it cannot guarantee a clear Sun.
