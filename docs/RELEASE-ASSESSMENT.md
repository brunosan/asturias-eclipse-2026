# Public release assessment

**Assessment date:** 29 July 2026

**Evidence cut:** 29 July 2026

**Release target:** public source and evidence repository

## Decision

The curated export is suitable for public source publication with the known
limitations below. It must use a fresh Git history: the private working
repositories and their hosting metadata are not part of this release.

This assessment does **not** certify the plan as an eclipse-day forecast, a
traffic plan, or a guarantee of access or clear sky.

## Published scope

- live-data web application source;
- project intent and fail-closed decision policy;
- decision playbook;
- simulated seven-persona council review, including dissent;
- methods, source URLs, definitions, and caveats;
- 26 candidate inputs, calculated evidence, and verdicts;
- 78 terrain horizon profiles and 26 free-flow route geometries;
- CERRA climatology and conditional cloud analysis;
- long-range forecast snapshot clearly marked illustrative-only;
- interactive atlas, five static map states, and validation receipt.

Raw third-party mirrors, downloaded PDFs, source screenshots, prompts,
transcripts, hidden reasoning, local runtime files, private hosting metadata,
and existing Git history are excluded.

## Privacy and secret gate

The curated tree was scanned for:

- local home-directory paths and user names;
- personal and common hosted-email patterns;
- API keys, tokens, passwords, authorization headers, and private keys;
- internal Sites project/version/deployment identifiers and domains;
- environment, key, and certificate files;
- symlinks and files near GitHub's 100 MB limit.

No credential, personal email, phone number, identity number, home address,
private URL, internal hosting identifier, or direct personal fact was found in
the release set.

The routing origin `43.5344336, -6.0691092` is explicitly identified as the
public Soto del Barco town-centre reference, not a residence. The simulated
council uses invented roles and personas and does not claim that outside
experts were contacted.

The public repository is initialized independently and uses a GitHub noreply
author. No private working commit is inherited.

## Verification results

### Evidence and atlas

`npm run check` passes **21 of 21** checks:

- 26 candidate, evidence, and verdict IDs match;
- all 26 candidates are within totality;
- all 26 free-flow route baselines resolved;
- terrain clearance values are numeric;
- 12 historical cloud locations each declare 600 samples;
- 24 long-range forecast rows remain segregated as illustrative-only;
- 78 C2/maximum/C3 horizon profiles are present;
- 26 route geometries are present;
- the inline atlas is below 2 MB and has no unresolved placeholders;
- five static map renders exceed the minimum artifact-size gate;
- the playbook, council review, and methods report pass the document gate.

The renderer exercised all five scenario controls. At 360 px it reported a
310 px visible map, 360 px page scroll width, and 360 px client width: no
horizontal overflow. The clear-local, low-cloud, and León renders were also
visually inspected after generation.

Machine-readable result:
`validation/atlas-validation.json`.

### Live-data site

- TypeScript: pass with `--noEmit --incremental false`.
- ESLint: pass.
- Production build: pass.
- Rendered-HTML tests: **2 passed, 0 failed**.
- Production smoke test: root HTML returned 200; the Open-Meteo route returned
  200 with 10 locations; the DGT route returned 200 with a live, timestamped
  regional snapshot.

The smoke result only proves retrieval at
`2026-07-29T17:36Z`. It is not evidence that either provider will be available
later.

## Known software risks

`npm audit --omit=dev` reports **3 high-severity transitive findings** through
the pinned Next.js stack: PostCSS and Sharp/libvips advisories are attributed
to the direct `next` dependency. The available automatic remediation proposes
an incompatible downgrade and was not applied.

Risk reduction in this release:

- CSS is repository-owned build input rather than user-controlled content;
- the unused Vinext image-optimization endpoint was removed from the Worker;
- no uploads, database, authentication, analytics, or account data are used;
- live providers are accessed through narrow server-side routes that return
  explicit unavailable states.

This reduces exposure but does not make the dependency findings disappear.
The dependency stack should be upgraded when Vinext/Next provide a compatible
fixed path. A full audit including development dependencies reports 2 low and
13 high findings.

## Known evidence and operational risks

- Forecast detail at this lead will change.
- Cloud fraction does not describe optical thickness.
- Cloud ceiling is cloud base; elevation only helps when cloud top is below the
  site and middle/high layers are clear.
- Terrain is a DEM screen, not a field survey of trees, buildings, or temporary
  structures.
- Free-flow route time is not an eclipse-day ETA.
- Official people capacity is not vehicle or parking capacity.
- No complete official parking inventory is available.
- Several traffic orders, shuttle/lift details, fire restrictions, and access
  controls remain unresolved.
- Coto Bello and Cuitunigru current numeric pins remain rejected.
- Villadangos remains a concept until a precise legal destination is secured.
- Provider failure must remain “unavailable,” never “clear.”

## Licensing risk

No top-level project licence was selected as part of this release. That avoids
silently relicensing third-party-derived material but limits reuse of the
original code and narrative. Any later licence choice should be explicit and
should preserve the source-specific terms and attributions in `NOTICE.md`.

## Release boundary

This release publishes the minimum reviewable public package. It deliberately
does not:

- make the separately hosted site public;
- change access controls on any existing deployment;
- publish the private working repositories;
- publish raw third-party mirrors or downloaded source imagery;
- assert that unresolved access and traffic gates are closed.
