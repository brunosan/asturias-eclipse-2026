# Long-tail war-game assessment

Evidence cut: **30 July 2026**. Planning origin: the public Soto del Barco
town-centre routing reference.

The implementation-ready register is
[`site/app/data/war-game-assessment.json`](../site/app/data/war-game-assessment.json).
It contains 30 cross-cutting scenarios, 10 route-pressure assessments, all
inputs displayed by the site, and a source dictionary. The scenarios are not 30
destinations and are not mutually exclusive.

## Probability grammar

Every scenario declares what kind of probability statement it makes:

| Code | Meaning | Permitted interpretation |
|---|---|---|
| `E` | Empirical | Frequency in the named historical CERRA sample, with denominator |
| `L` | Live-only | No defensible prior rate; decide from timestamped observations |
| `K` | Known condition | A current or branch-dependent fact, not a frequency |
| `H` | Heuristic | Uncalibrated structured judgment for planning |

These values must not be added to 100%. Weather regimes overlap with access,
traffic, data and human failures. Critical legal and safety vetoes outrank a
probability-times-impact calculation.

## Direct answers to the two weather questions

The historical sensitivity sample contains 600 CERRA observations at 18:00 UTC:
1–20 August, 1991–2020.

### Does moving along the coast help in scattered cloud?

Sometimes—but only when a broad, observed gradient exists.

- Soto was clear/light in 226/600 cases (37.7%), partly cloudy in 249/600
  (41.5%), and overcast in 125/600 (20.8%).
- When Soto was partly cloudy, at least one other sampled coastal cell was clear
  in 106/249 cases (42.6%). Restricting the test to the nearer Vidio-or-Peñas
  pair cut that to 43/249 (17.3%).
- When Soto was overcast, any other sampled coastal cell was clear in only
  10/125 cases (8.0%); the nearby pair succeeded in 1/125 (0.8%).

This supports one early coastal move behind a broad gap in three consecutive
satellite frames. It rejects sequential beach hopping when the coast is broadly
clouded.

### Does going high help?

Not generically.

- Baseline clear/light frequency was 37.7% at Soto, 37.2% at Leitariegos, 27.8%
  at La Cubilla, 20.0% at San Isidro and 18.3% at Fuente Dé/Picos.
- The strict shallow-low-cloud signature occurred in only 35/600 cases (5.8%).
  In that subset at least one of four sampled ridges was clear in 19/35 (54.3%),
  but every ridge failed in 16/35 (45.7%).
- Individual ridge success in the same subset was 25.7–42.9%. At least one
  sampled south-plain cell was clear in all 35 cases; individual south points
  were clear in 68.6–91.4%.
- The coast was clear while every sampled ridge was not clear in 71/600 cases
  (11.8%).

Height is therefore a conditional tool. It requires the **cloud top**, not the
reported ceiling/cloud base, to sit at least 200 m below the exact site; middle
and high layers must be clear; and the ridge and 280° sightline must be directly
confirmed. The small 35-case denominator makes this directional evidence, not a
Casa El Puerto probability.

The joint counts were recomputed from the exact CERRA query documented in
[`cloud-method-metadata.json`](../data/derived/cloud-method-metadata.json) and
cross-checked against the published marginal and conditional rows:

- [`cloud-climatology.csv`](../data/derived/cloud-climatology.csv)
- [`cloud-conditional.csv`](../data/derived/cloud-conditional.csv)

## Council

This is a simulated seven-person advisory council. It does not claim that
outside experts were contacted.

| Persona | Role | Independent finding |
|---|---|---|
| Marta Nubes | Mountain meteorology | “Higher” is wrong without a proven cloud top, clear upper layers and a clear ridge |
| Inés Vega | Eclipse geometry and terrain | Every weather branch still needs the exact 279.5–282.5° true sightline |
| Luis Tráfico | Civil protection | Population/tourism can estimate pressure, not travel time |
| Ana Parque | Access and protected land | Legality, fire controls and shuttle rules are vetoes, not weighted preferences |
| Tomás Duda | Statistics and uncertainty | Empirical, live, known and heuristic probabilities must remain visibly distinct |
| Irene Casa | Group execution | Thirty conditions must modify four branches, not create thirty choices |
| Elena Flujo | Product and decision UX | Critical vetoes first; filter the long tail by branch/family; never bury the stop rules |

### Roundtable

**Vega:** A ridge already above a shallow deck can be the best optical result.

**Nubes:** Yes, but the trigger existed in only 35 cases, and the sampled ridges
were individually clear in 25.7–42.9%. The platform must not transfer that rate
to an unsampled site.

**Duda:** Show the numerator, denominator and provenance. Do not call an airport
ceiling a cloud top.

---

**Flujo:** People will still ask for a traffic number.

**Tráfico:** Give them an ordinal route-pressure band with every factor
disclosed. Without parking, throughput and live flow, numeric disruption
probabilities or delay minutes would be fiction.

**Parque:** A closed route, unconfirmed shuttle or illegal parcel overrides the
score.

---

**Casa:** Thirty cards can recreate cloud-chase paralysis.

**Flujo:** The first-order choice remains stay local, one coastal direction,
verified height or south early. The cards explain why a branch can fail.

**Council:** A passed time gate is not reopened by a later alert unless safety
requires a stop.

### Verdict

Consensus:

1. coast-hopping is justified only by a broad, stable, observed gap;
2. high ground is not a generic improvement and Picos is not a reactive Soto
   fallback;
3. the south plain is the stronger historical regime change, but AP-66 and a
   legal endpoint must be cleared before the early gate;
4. access and safety failures are hard vetoes;
5. traffic output must show pressure, uncertainty and missing supply—not an ETA;
6. one decision owner freezes the branch at the published deadlines.

Dissent retained: Vega would elevate Farrapona if the group is already
pre-positioned, return transport is confirmed, cloud top is demonstrably below
the site and the exact WNW view is clear. The operational majority refuses to
present it as a day-of fallback from Soto.

## Traffic-pressure model

The model answers:

> How fragile is this route if this branch is chosen and nominally open?

It does not answer eclipse-day ETA, queue length, parking availability, or the
probability that a weather branch will be selected.

### Inputs

Each route has eight 0–3 components:

| Component | Weight | 0 → 3 meaning |
|---|---:|---|
| Resident context | 10% | under 2,000 → 50,000+ |
| Tourism proxy | 15% | under 100 VUT beds and under 20/1,000 → 1,500+ or 150+/1,000 |
| Site magnet | 15% | not promoted → 3,000+, iconic or free named event |
| Seasonal arterial load | 10% | walk/no arterial → over 20,000 vehicles/day or urban core |
| Network fragility | 20% | walk/transit mesh → dead-end, pass or constrained tunnel |
| Competing-route overlap | 10% | under 5 km → over 50 km |
| Parking confidence | 15% | reserved/live count → unmanaged or illegal |
| Control state | 5% | final order clear → active restriction/closure |

Formula:

```text
pressure =
round_to_5(
  100 / 3 × (
    .10 resident +
    .15 tourism +
    .15 magnet +
    .10 seasonal_load +
    .20 fragility +
    .10 overlap +
    .15 parking +
    .05 controls
  )
)
```

Bands: 0–24 low; 25–44 guarded; 45–64 high; 65–79 severe; 80–100
critical.

Hard overrides:

- route closed → `NO_GO`;
- legal parking false/unconfirmed at an unmanaged site → `NO_GO_BY_CAR`;
- shuttle-only with unconfirmed service → `NO_GO`;
- south departure after 12:00 → `NO_GO_AS_FALLBACK`;
- new regional movement after 16:00 → `NO_GO`;
- DGT publication older than 15 minutes → `UNKNOWN`, never clear.

Scenario modifiers are ordinal: a widely promoted clear slot or a west/east
reversal raises one pressure band; safe pre-positioning lowers one band. Hard
overrides still outrank every band.

### Demand inputs and their limits

- Resident totals are the official INE 1 January 2025 municipal figures:
  [table 29005](https://www.ine.es/jaxiT3/Tabla.htm?t=29005).
- Tourism intensity uses INE advertised tourist dwellings and beds in May 2026:
  [table 39363](https://www.ine.es/jaxiT3/Tabla.htm?t=39363). This is a demand
  proxy, not an occupancy or car forecast.
- The official Asturias API still had 78 sites, 42 populated people-capacity
  fields and **zero populated parking fields** on 30 July:
  [official feed](https://eclipseasturias2026.ficyt.es/api/eclipse_observation_spots.php).
  People capacity is not car capacity.

Where a route’s relevant people capacity is complete, the site shows a vehicle
stress interval:

```text
published people capacity
× 25–75% capacity use
× 45–75% private-car share
÷ 2.0–2.6 people per car
```

It is explicitly a stress test, not an attendance forecast.

### Seasonal road evidence

Normal summer demand is already elevated:

- A-8 permanent station pk 468 recorded 19,474 vehicles/day in August 2024
  versus 12,383 annual IMD; pk 499 recorded 17,029 versus 10,640:
  [MITMA permanent stations](https://cdn.transportes.gob.es/portal-web-transportes/carreteras/nuestrared/movilidad/RCE/trafico_en_estaciones_permanentes_2024.pdf).
- AP-66 recorded 14,953 vehicles/day in August 2024 versus 6,148 in January:
  [MITMA toll-road traffic](https://cdn.transportes.gob.es/portal-web-transportes/carreteras/nuestrared/movilidad/RCE/trafico_en_las_autopistas_de_peaje_2024.pdf).

These are corridor proxies, not Soto counts and not eclipse-day forecasts.

### Live corridor matching

The ten route monitors use principal road references from fresh OSRM
`steps=true` results for the saved route endpoints. Municipality allowlists
come from line/polygon intersection with the official IGN `Límites de
Municipios` FeatureServer, updated 12 February and published 10 July 2026:
[IGN municipality service](https://services1.arcgis.com/nCKYwcSONQTkPA4K/arcgis/rest/services/muni/FeatureServer/0).

The parser retains every province and municipality supplied by each DGT
situation record and normalizes the observed `Tinéu`/`Tineo` variant. Matching
uses a road-reference set and a municipality set, not an exact road segment or
kilometre interval. That can conservatively overmatch; it cannot prove that an
unmatched route is clear.

### Current AP-66 finding

At DGT publication time `2026-07-30T09:39:07+02:00`, situation IDs `20852308`
and `20854520` contained AP-66 roadworks with lane/carriageway management in
Lena/Sena de Luna, valid through `2026-08-31T23:59:00+02:00`. This establishes
reduced resilience for planning; it does not establish the exact 12 August lane
state. The application now parses every nested situation record and matches it
to route road references before truncating the display:
[DGT DATEX II](https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v37.xml).

### Route results

No calibrated data support a numeric eclipse-day disruption probability. The
table therefore publishes only the reproducible weighted score and its ordinal
pressure band. A hard override still outranks the band.

| Route/mode | Pressure | Exposure condition | Primary response |
|---|---:|---|---|
| Los Quebrantos by foot/shuttle | 40 guarded | Chosen by foot or confirmed shuttle | Stage by 16:00; do not drive without managed parking |
| Cabo Vidio by car | 70 severe | Branch chosen and nominally open | Lock west by 14:00; reject unpublished last-mile access |
| Caroyas by car | 70 severe | Branch chosen and nominally open | Same-side backup only; capacity is not parking |
| Espartal by car | 60 high | Chosen by car and nominally open | Current route is mainly N-632/Avilés; recompute that day |
| Xagó | 60 high | Mode dependent | Confirm boarding/time; do not infer beach parking |
| Casa El Puerto | 60 high | Selected above a verified shallow deck | Move only behind all shallow-deck gates |
| Farrapona | 65 severe | Reactive use rejected | Pre-position only |
| Sotres/La Caballar | 75 severe | Reactive use rejected | Reject as a Soto fallback |
| AP-66 to León/Palacio | 90 critical | Mode and endpoint dependent | Cross early once; transit/pre-position preferred |
| Villadangos concept | 55 high | Precise legal parcel required | Otherwise `NO_GO_BY_CAR` |

Free-flow baselines remain geometry checks, never ETAs. The route review also
corrected an earlier assumption: current OSRM step routes to Espartal and Xagó
mainly use N-632/Avilés, not a generic “A-8 east” path.

## Thirty-scenario register

The JSON contains the complete observable trigger, immediate action, impact
mitigation, hard stop, deadline and sources for each row.

| ID | Scenario | Probability assessment | Impact |
|---|---|---|---:|
| WX01 | Local coast clear/light | E: 37.7%, n=600 | 1 positive |
| WX02 | Stable west/east gap | L: live-only | 4 |
| WX03 | Overcast Soto, illusory coastal escape | E: 20.8%; escape 0.8–8.0% | 4 veto |
| WX04 | Shallow deck with viable height rung | E: signature 5.8%; any ridge 54.3%, n=35 | 4 |
| WX05 | Ridge embedded/worse than coast | E: material historical failure | 5 veto |
| WX06 | South clear while Soto overcast | E: 38.4–49.6% per south point, n=125 | 4 |
| WX07 | South advantage under shallow deck | E: 68.6–91.4% per point, n=35 | 4 |
| WX08 | Middle/high cloud both sides | H: plausible, uncalibrated | 4 veto |
| WX09 | Coastal edge collapses after commitment | H: plausible, uncalibrated | 4 |
| WX10 | Wind/rain/ridge cap | H: unlikely to plausible | 5 veto |
| TR01 | Shared coastal corridor saturation | H: likely exposure | 4 |
| TR02 | AP-66/Negrón disruption | K: reduced resilience known | 5 veto |
| TR03 | Single-road last-mile gridlock | H: likely at fragile sites | 5 veto |
| TR04 | Parking/shuttle mismatch | K: supply currently unknown | 4 veto |
| TR05 | Forecast-induced herding | H: plausible to likely | 4 |
| TR06 | Synchronized dusk exodus | H: high exposure; no calibrated rate | 5 |
| AC01 | Soto promenade/rockfall closure | K: unresolved blocker | 4 veto |
| AC02 | Fire-risk/dry-field prohibition | H: seasonal/live-controlled | 5 veto |
| AC03 | Protected/shuttle-only access | K: certain where applicable | 4 veto |
| AC04 | Lift/shuttle cancellation | H: plausible | 5 veto |
| AC05 | South endpoint unconfirmed/saturated | K: currently unresolved | 5 veto |
| HU01 | Decision deadlock/late reversal | H: plausible to likely | 5 veto |
| HU02 | Separation/network overload | H: plausible | 4 |
| HU03 | Heat/fatigue/medication/mobility failure | H: plausible | 5 veto |
| HU04 | Missing/damaged eclipse glasses | H: unlikely to plausible | 5 veto |
| DT01 | Weather API stale/wrong target | H: plausible | 4 veto |
| DT02 | Empty DGT feed creates false reassurance | H: plausible to likely | 5 veto |
| DT03 | Models disagree/flip | H: likely before nowcast | 4 veto |
| DT04 | GPS/battery/clock/saved-gate failure | H: plausible | 4 |
| DT05 | DEM/pin differs from standing point | K: known limitation | 5 veto |

## Update and verification protocol

1. Recompute live route matches from the DGT feed; publication older than 15
   minutes is `UNKNOWN`.
2. Recheck municipal orders, official shuttles, return times, fire controls and
   exact parking/boarding points on 11 August and again before movement.
3. Keep long-range models at planning status. From D-4 compare higher-resolution
   forecasts and ensembles; on the day weight satellite and direct observation.
4. Do not change a route score silently: publish every 0–3 component, imputed
   field and active modifier.
5. Validate the 30 scenarios and ten route formulas with `npm run check`.

Material limitations:

- the route probabilities are structured judgment, not calibrated frequencies;
- VUT beds are not total tourists, occupancy or vehicles;
- the official feed lacks parking supply and shuttle throughput;
- current DGT records can change before 12 August;
- the CERRA low-cloud subset is small and grid-cell cloud fraction does not
  encode optical thickness;
- terrain remains a model screen, not an exact field sightline.
