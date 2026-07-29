# Eclipse decision playbook

**Planning origin:** Soto del Barco

**Eclipse:** Wednesday, 12 August 2026

**Evidence cut:** 29 July 2026

**Default transport assumption:** private car, except where an official shuttle,
walking or public transport is explicitly safer

## Operational call

If the coast is genuinely clear, stay near Soto del Barco and use **Playa de
Los Quebrantos** by foot or official shuttle. It is the closest robust option:
4.2 km and 9 minutes in free-flow routing from the town-centre planning origin,
with an essentially open west-northwest terrain horizon.

Do not build the plan around an afternoon chase. Choose one of four branches,
commit once, and stop moving:

1. local clear coast;
2. one west-or-east coastal dodge;
3. verified shallow low cloud with a clear ridge above it;
4. an early crossing to the León plain.

The Picos de Europa are **not** the generic low-cloud answer. Famous high
viewpoints can have the totality Sun behind western relief, and their roads and
parking cannot absorb a reactive influx.

## The geometry correction

At Soto del Barco, the official IGN municipality circumstances are:

- totality starts about **20:26:52 CEST**;
- maximum is about **20:27:46 CEST**;
- totality ends about **20:28:40 CEST**;
- duration is **108 seconds**;
- the Sun is about **10.5° above the geometric horizon** at true azimuth
  **280.5°**, west-northwest.

Totality is roughly an hour before nominal sunset. A location with a good view
of the sunset point is not automatically good: the totality Sun is roughly 11°
north of the later sunset bearing. Check the sightline around **279.5–282.5°
true**, not due west and not the sunset point.

The site-level map values use Astronomy Engine as a smooth-lunar-limb
cross-check. Public contact times should use IGN; the two calculations can
differ by several seconds.

## Branch table

| Branch | Observable trigger | Primary | Backup | Latest commitment | Reject |
|---|---|---|---|---|---|
| A — clear local | Coast and the 280° up-sun corridor are clear in forecast, satellite and direct observation | Los Quebrantos | Espíritu Santo; Aguilar only after a sightline scout | Be on foot, parked or on the shuttle by 16:00 | Driving to an iconic headland for a marginal view |
| B — coastal dodge | A broad, stable clear slot is materially better west or east in at least three consecutive 10-minute satellite frames | West: Cabo Vidio, then Caroyas. East: El Espartal, then Xagó | Serantes west or Faro de Luces east only as an early pre-commitment | Direction locked by 14:00; destination by 16:00 | Porcía and Cabo Peñas as spontaneous fallbacks |
| C — above shallow low cloud | Cloud **top**, not ceiling, is at least 200 m below the site; middle/high layers clear; ridge webcam/observation clear | Casa El Puerto, Tineo | Peñona or Pico Viso for a shallow deck; La Cobertoria for a higher deck | Locked by early afternoon | Coto Bello and Cuitunigru current pins; Sotres; a reactive Farrapona run |
| D — south of the divide | North side remains clouded through the relevant layers while the León/Astorga plain has a persistent, observed and multi-model advantage | A pre-confirmed legal plain site near Villadangos/Astorga | Palacio ESA only by transit or pre-positioning; Camposagrado only with an official access plan | Cross-divide call by 11:00–12:00 | Driving into León or La Camperona after an afternoon cloud surprise |

If high cloud covers both Asturias and León, altitude does not solve the
problem. Stop chasing and choose the safest confirmed site. Thin high cloud may
still permit an experience; road risk cannot create a clear sky.

## Height ladder for low cloud

An airport “ceiling” reports the cloud base. It does not say where the cloud
ends. The ridge branch requires an estimated cloud top from satellite products,
forecast profiles, webcams and direct observation.

| Site | DEM height | Terrain clearance during totality | Minimum planning cloud-top rule | Free-flow baseline | Status |
|---|---:|---:|---:|---:|---|
| Mirador de la Peñona | 465 m | 10.0° | below about 265 m | 16 min | Conditional local rung |
| Pico el Viso | 681 m | 9.7° | below about 480 m | 36 min | Conditional intermediate rung |
| Casa El Puerto, Tineo | 1008 m | 10.5° | below about 800 m | 49 min | Primary high-ground anchor |
| La Cobertoria | 1223 m | 9.2° | below about 1000 m | 67 min | Secondary |
| La Farrapona | 1708 m | 6.3° | below about 1500 m | 97 min | Pre-position only |

The 200 m margin is an operational buffer, not a physical law. Do not use this
table unless middle and high cloud are also absent and the site itself is
observed clear.

## Current weather status — 29 July

It is too early for a venue decision. AEMET explicitly says an eclipse-day
forecast becomes useful only a few days beforehand.

The retained long-range snapshot weakly favors the south side:

- deterministic ECMWF IFS at 18:00 UTC: Soto 22% total cloud, León 11%,
  Astorga 5%;
- the 31-field Open-Meteo GFS Ensemble Seamless sample: 55% of fields at or
  below 20% cloud near Soto, 74% near León and 71% near Astorga;
- the ECMWF 51-field ensemble did not yet expose the exact 18:00 UTC target.

This is **illustrative only**. It is evidence for keeping the León branch alive,
not evidence for choosing it now. The exact snapshot and query limitations are
in `data/derived/current-forecast-snapshot.csv` and
`data/derived/cloud-method-metadata.json`.

## Current authority and transport status

On 16 July, the Principado announced an operation of roughly 700 emergency,
volunteer and environmental staff, 78 recommended sites, 36 special transport
itineraries and eclipse shuttles operating as late as 23:00 on selected routes.
It also announced an afternoon telecabina opening for Cuitunigru. These are
regional commitments, not final site-level timetables or parking allocations.

On 30 June, DGT said it expected important vehicle and people concentrations
and was preparing concrete eclipse measures for later publication. The BOE
already places every road in Asturias and Castilla y León under the 12 August
special-road-safety framework. The atlas therefore treats final traffic orders
as a live gate rather than assuming today's road state will persist.

## Forecast and movement gates

### Now through 7 August

- Pre-scout Los Quebrantos, Espíritu Santo and the exact standing area at
  Aguilar.
- Pre-scout one intermediate-height site and Casa El Puerto.
- If a south-side plan is desired, secure a cancellable overnight/public
  transport plan or a precise managed parking location. “Open field near
  Villadangos” is not yet a destination.
- Download offline maps and save the official traffic, shuttle, fire-risk and
  municipal pages.

### 8–10 August

- Compare AEMET, HARMONIE-AROME and ensemble forecasts by broad regime, not a
  single map pixel.
- Change region only when a meaningful advantage persists across consecutive
  model cycles and agrees with the physical pattern.
- Confirm the final municipal traffic orders, shuttle timetables, fire
  restrictions, telecabina rules and any beach/promenade closures.

### 11 August

- Name one primary branch and one abort branch.
- Fuel, charge, pack and decide who has authority to call the branch.
- Record the exact legal arrival and parking point; do not rely on a road
  shoulder, rural track or dry field.

### 12 August

| Time CEST | Decision |
|---|---|
| 08:00 | Read AEMET warnings, mountain forecast, fire-risk level, DGT/112 road status and official shuttle changes. |
| 10:00 | Compare forecast profiles and north/south satellite structure. Eliminate illegal or inaccessible sites. |
| 11:00–12:00 | **Hard cross-divide gate.** If León is the chosen branch, go now; otherwise remove it from the day plan. |
| 14:00 | **Hard coast-versus-height gate.** Choose west, east, local or verified high ground once. |
| 16:00 | Be parked, on foot or committed to the official shuttle. |
| 18:00 | No regional relocation. Only safe, walk-scale adjustment inside the managed area. |
| 19:30 | Partial phase begins near Soto; certified eye protection required. |
| 20:27 | Totality near Soto. Remove filters only during complete totality and replace them immediately as the bright photosphere returns. |

## Shortlist with the numbers that matter

| Site | Role | Drive baseline | Sun at maximum | Terrain clearance | Capacity/access reality |
|---|---|---:|---:|---:|---|
| Los Quebrantos | Default local | 9 min | 10.5° at 280.5° | 10.0° | Official pedestrian/shuttle corridor; parking unpublished |
| Espíritu Santo | Local alternate | 7 min | 10.5° at 280.5° | 10.4° | Official shuttle observation site; capacity unpublished |
| Cabo Vidio | West primary | 18 min | 10.7° at 280.4° | 10.5° | 4000 declared people; local-road last mile |
| Caroyas | West secondary | 29 min | 10.8° at 280.3° | 10.6° | 9000 declared people; parking unpublished |
| El Espartal | East primary | 17 min | 10.5° at 280.6° | 10.3° | Strong geometry; high Avilés/Salinas pressure |
| Xagó | East secondary | 28 min | 10.4° at 280.6° | 10.3° | Special shuttle; do not assume road parking |
| Casa El Puerto | Low-cloud primary | 49 min | 10.7° at 280.4° | 10.5° | 10000 declared people; parking unpublished |
| La Cobertoria | Low-cloud secondary | 67 min | 10.2° at 280.8° | 9.2° | 2000 declared people; pass congestion |
| Villadangos concept | South plain | 117 min | 9.8° at 281.2° | 9.2° | No managed site or legal parcel yet confirmed |
| Palacio ESA, León | Managed south option | 119 min | 9.7° at 281.3° | 8.5° | Free official event; capacity unpublished; about 400 venue spaces; transit/pre-position only |

Every drive value is an OSRM/OpenStreetMap free-flow baseline. None is an
eclipse-day ETA.

## Traffic and regulation rule

Population is a weak crowd proxy in August. The official Asturias API contains
78 recommended sites, but only 42 currently have a declared people capacity;
none has a populated parking field. A venue capacity is not a car capacity.
Accordingly, the atlas does not fabricate queue times.

The DGT has a national 12 August special-road-safety plan covering all roads in
Asturias and Castilla y León. This is authority to regulate, not a blanket
closure and not confirmation that an unlisted road will be unrestricted.
Municipal traffic orders and final DGT measures remain a live input.

Additional hard constraints:

- the AP-66 Negrón works may reduce resilience of the Asturias–León corridor;
- eastern A-8/A-64 tunnel works may reduce resilience of an eastward dodge;
- summer private-car restrictions apply at Lagos de Covadonga;
- protected-area, fire-risk, track, camping and drone restrictions can change
  what is legal on 11–12 August;
- never park on a carriageway, shoulder, emergency lane, rural/forest track or
  dry field.

## Unresolved blockers to close before 12 August

1. Exact Soto promenade access after the reported rockfall-sector closure.
2. Final Los Quebrantos/Aguilar/Xagó shuttle boarding points and timetables.
3. Exact Coto Bello viewing polygon; the current numeric pin is not robust.
4. Exact Cuitunigru upper platform, telecabina tickets, hours, capacity, wind
   threshold and evacuation plan.
5. Farrapona eclipse shuttle extension after the normal return window.
6. A legal, managed Villadangos/Astorga-area south-plain parking destination.
7. Final municipal traffic orders, DGT measures, fire-risk restrictions and
   roadworks status.

Until these are resolved, the map deliberately labels the affected sites
conditional or rejected rather than silently assuming access.
