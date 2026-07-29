# Data source manifest

The public repository contains candidate inputs and derived evidence, but not
the downloaded third-party source mirrors. This keeps the repository compact
and avoids extending a project licence to material governed by source-specific
terms.

The hashes below identify the exact local inputs used for the 29 July 2026
evidence cut. They are verification records, not download guarantees: upstream
files can change.

| Expected local filename | Upstream source | SHA-256 |
|---|---|---|
| `asturias-official-observation-spots-2026-07-29.json` | [Asturias official observation-site API](https://eclipseasturias2026.ficyt.es/api/eclipse_observation_spots.php) | `36242e4c475ce9d297f832e9b55227cf5a0e56dc3f709a4326acbb1e3fbb2bca` |
| `eurostat-nuts-2024-1m.geojson` | [Eurostat GISCO NUTS 2024, 1:1 million](https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326.geojson) | `bd8c1ae4b5447926aacf1414f11146c2711b4249a88ee1b5f9a1bd1fdf579e60` |
| `ign-obscuration-2026.geojson` | [IGN 2026 eclipse visualizer](https://visualizadores.ign.es/eclipses/2026) | `4492b5ebcde5713632a17878e45b2a1b6f401d033a3c435a949a7cf9dd09cf5d` |
| `ign-terrain-visibility-shadow-2026.geojson` | [IGN eclipse viewer terrain shadow](https://www.ign.es/web/resources/viewer/eclipses/shadows_merged_18.291-18.567-2026-simplified-0.0001.geojson) | `6c1d67cc53ee9b5d0e4dad1881f9176de2fbd54cebfe567e6b58798f481b0025` |
| `ign-totality-duration-2026.geojson` | [IGN totality-duration data](https://www.ign.es/web/resources/viewer/eclipses/durtot_estandard_2026.geojson) | `43d177b6bd4a9fe17857ea4fb49df31607b66f1db90ab93b5192d518195c26f7` |
| `ine-asturias-municipal-population-table-2886-2025.json` | [INE table 2886](https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/2886) | `82ef4e07ae07a343fa42935fe676dd72ab3ad84808615b9053c01a7e3d5b22b2` |
| `ine-leon-municipal-population-table-2877-2025.json` | [INE table 2877](https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/2877) | `2b6c60ed7b9e48dafb648da797c26f38b94207ffff43c7e73134a395c8672723` |
| `ign-aemet-clear-frequency-11-13-aug-17-20utc.jpg` | [AEMET eclipse cloud study](https://www.aemet.es/es/noticias/2026/05/estudio_nubosidad_eclipse) | `b6ce4774343737e60107456916c6e85e1ec987acfd9f04a18b342218d5562242` |

`scripts/build-data.mjs` expects the official-site and INE JSON files under
`data/raw/`; `scripts/build-map-data.mjs` expects the Eurostat and IGN
totality-duration GeoJSON files there. The current derived outputs are already
published, so those mirrors are not required to inspect or validate this
evidence cut.

The obscuration, terrain-shadow, and AEMET image inputs are documented for
provenance but are not required by the published rebuild helpers.
