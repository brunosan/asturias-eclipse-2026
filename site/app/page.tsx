"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const ECLIPSE_AT = new Date("2026-08-12T20:27:46+02:00");
const DATA_CUT = "29 Jul 2026";

type ScenarioId = "clear" | "coast" | "low" | "leon";
type GateKey =
  | "access"
  | "satellite"
  | "direct"
  | "cloudTop"
  | "ridge"
  | "southLegal"
  | "ap66"
  | "southObserved";

type ForecastLocation = {
  id: string;
  name: string;
  group: string;
  elevation: number;
  current: {
    time: string;
    temperature: number | null;
    totalCloud: number | null;
    lowCloud: number | null;
    midCloud: number | null;
    highCloud: number | null;
    visibilityKm: number | null;
    wind: number | null;
    gusts: number | null;
  } | null;
  eclipse: {
    time: string;
    temperature: number | null;
    totalCloud: number | null;
    lowCloud: number | null;
    midCloud: number | null;
    highCloud: number | null;
    visibilityKm: number | null;
    precipitation: number | null;
    wind: number | null;
    gusts: number | null;
  };
};

type WeatherPayload = {
  ok: boolean;
  retrievedAt: string;
  targetTime?: string;
  provider: string;
  providerNote?: string;
  message?: string;
  locations?: ForecastLocation[];
};

type TrafficIncident = {
  id: string;
  updatedAt: string | null;
  road: string;
  municipality: string;
  province: string;
  type: string;
};

type TrafficPayload = {
  ok: boolean;
  status: "live" | "stale" | "unavailable";
  retrievedAt: string;
  publicationTime?: string;
  provider: string;
  sourceUrl?: string;
  regionalCount?: number;
  incidents?: TrafficIncident[];
  message?: string;
  caveat: string;
};

type Scenario = {
  id: ScenarioId;
  tab: string;
  title: string;
  thesis: string;
  map: string;
  mapAlt: string;
  primary: string;
  backup: string;
  trigger: string;
  hardStop: string;
  gateTime: string;
  liveIds: string[];
  requiredGates: GateKey[];
};

const SCENARIOS: Scenario[] = [
  {
    id: "clear",
    tab: "Stay local",
    title: "Clear coast",
    thesis: "Lowest movement wins. Walk or shuttle to Los Quebrantos.",
    map: "/maps/01-clear-near-soto.png",
    mapAlt: "Map of clear-weather options around Soto del Barco",
    primary: "Playa de Los Quebrantos",
    backup: "Mirador del Espíritu Santo",
    trigger:
      "Forecast, three satellite frames and a direct view all show the 280° up-sun corridor clear.",
    hardStop:
      "No closed promenade or dune access. Be parked, walking or on the shuttle by 16:00.",
    gateTime: "16:00 arrival gate",
    liveIds: ["soto"],
    requiredGates: ["access", "satellite", "direct"],
  },
  {
    id: "coast",
    tab: "Coastal dodge",
    title: "One west-or-east move",
    thesis: "Choose a broad stable gap once. Never reverse direction.",
    map: "/maps/02-coastal-west-east-options.png",
    mapAlt: "Map of west and east coastal eclipse options",
    primary: "West: Cabo Vidio → Caroyas",
    backup: "East: El Espartal → Xagó",
    trigger:
      "A broad west or east gap is materially better in three consecutive 10-minute satellite frames.",
    hardStop:
      "Direction locked by 14:00. Porcía and Cabo Peñas are not spontaneous overflow sites.",
    gateTime: "14:00 branch gate",
    liveIds: ["vidio", "caroyas", "espartal", "xago"],
    requiredGates: ["access", "satellite", "direct"],
  },
  {
    id: "low",
    tab: "Go above low cloud",
    title: "Verified shallow low deck",
    thesis: "Use a height ladder—not an automatic Picos run.",
    map: "/maps/03-low-cloud-height-ladder.png",
    mapAlt: "Map of intermediate and high sites for shallow low cloud",
    primary: "Casa El Puerto, Tineo · 1008 m",
    backup: "Peñona → Pico Viso → La Cobertoria",
    trigger:
      "Cloud top is known and at least 200 m below the site; middle/high cloud absent; ridge directly observed clear.",
    hardStop:
      "A reported ceiling is only the cloud base. Farrapona is pre-position only; current Coto Bello and Cuitunigru pins are rejected.",
    gateTime: "14:00 branch gate",
    liveIds: ["tineo", "cobertoria"],
    requiredGates: ["access", "satellite", "cloudTop", "ridge"],
  },
  {
    id: "leon",
    tab: "Cross to León",
    title: "Persistent south-side advantage",
    thesis: "Cross early or remove León from the day plan.",
    map: "/maps/04-leon-cross-divide.png",
    mapAlt: "Map of the early cross-divide route and León-side options",
    primary: "Pre-confirmed legal south-plain site",
    backup: "Palacio ESA by transit or pre-positioning",
    trigger:
      "Persistent multi-model and observed south advantage, viable AP-66, and a precise legal destination.",
    hardStop:
      "Decision by 11:00–12:00. Villadangos is a concept until a legal parcel is confirmed. La Camperona is rejected.",
    gateTime: "11:00–12:00 hard gate",
    liveIds: ["leon", "villadangos", "astorga"],
    requiredGates: ["southLegal", "ap66", "southObserved"],
  },
];

const GATE_LABELS: Record<GateKey, string> = {
  access: "Official access / parking or shuttle confirmed",
  satellite: "Three consecutive satellite frames agree",
  direct: "Direct view or camera agrees with the forecast",
  cloudTop: "Cloud top—not ceiling—is known with ≥200 m margin",
  ridge: "Ridge camera or direct observation is clear",
  southLegal: "Exact legal south-side destination confirmed",
  ap66: "AP-66 and final road controls checked viable",
  southObserved: "Observed and multi-model south advantage persists",
};

const OFFICIAL_LINKS = [
  {
    name: "AEMET visible satellite",
    label: "Cloud evolution",
    href: "https://www.aemet.es/es/eltiempo/observacion/satelite/visible",
  },
  {
    name: "HARMONIE-AROME",
    label: "High-resolution forecast",
    href: "https://www.aemet.es/es/eltiempo/prediccion/modelosnumericos/harmonie_arome?opc2=pybal&opc3=nb",
  },
  {
    name: "DGT traffic cameras",
    label: "Road state",
    href: "https://www.dgt.es/conoce-el-estado-del-trafico/camaras-de-trafico/",
  },
  {
    name: "112 Asturias roads",
    label: "Incidents and closures",
    href: "https://www.112asturias.es/v_portal/apartados/apartado.asp?te=60",
  },
  {
    name: "Asturias mobility plan",
    label: "Shuttles and official sites",
    href: "https://eclipseasturias2026.ficyt.es/movilidad.php",
  },
  {
    name: "Fire-use restrictions",
    label: "Legal access gate",
    href: "https://www.asturias.es/temas/agricultura-gestion-forestal/incendios-forestales-prevencion/uso-del-fuego",
  },
];

export default function Home() {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>("clear");
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [traffic, setTraffic] = useState<TrafficPayload | null>(null);
  const [trafficStatus, setTrafficStatus] = useState<
    "loading" | "live" | "stale" | "unavailable"
  >("loading");
  const [clock, setClock] = useState<Date | null>(null);
  const [checks, setChecks] = useState<Partial<Record<GateKey, boolean>>>({});
  const [checksUpdatedAt, setChecksUpdatedAt] = useState<string | null>(null);

  const refreshWeather = useCallback(async () => {
    setWeatherStatus((current) => (current === "ready" ? "ready" : "loading"));
    try {
      const response = await fetch("/api/weather", { cache: "no-store" });
      const data = (await response.json()) as WeatherPayload;
      setWeather(data);
      setWeatherStatus(response.ok && data.ok ? "ready" : "error");
    } catch {
      setWeather({
        ok: false,
        retrievedAt: new Date().toISOString(),
        provider: "Open-Meteo Best Match",
        message: "Live forecast is temporarily unavailable",
      });
      setWeatherStatus("error");
    }
  }, []);

  const refreshTraffic = useCallback(async () => {
    setTrafficStatus((current) => (current === "live" ? "live" : "loading"));
    try {
      const response = await fetch("/api/traffic", { cache: "no-store" });
      const data = (await response.json()) as TrafficPayload;
      setTraffic(data);
      setTrafficStatus(data.status ?? (response.ok ? "live" : "unavailable"));
    } catch {
      setTraffic({
        ok: false,
        status: "unavailable",
        retrievedAt: new Date().toISOString(),
        provider: "DGT DATEX II 3.7",
        message: "DGT traffic feed is temporarily unavailable",
        caveat: "Traffic availability is unknown. Do not infer that a route is clear.",
      });
      setTrafficStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      setClock(new Date());
      void refreshWeather();
      void refreshTraffic();
      const stored = window.localStorage.getItem("eclipse-live-gates");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as {
            checks?: Partial<Record<GateKey, boolean>>;
            updatedAt?: string;
          };
          if (parsed.checks) {
            setChecks(parsed.checks);
            setChecksUpdatedAt(parsed.updatedAt ?? null);
          }
        } catch {
          // Ignore malformed device-local state.
        }
      }
    }, 0);
    const clockTimer = window.setInterval(() => setClock(new Date()), 30_000);
    const weatherTimer = window.setInterval(() => void refreshWeather(), 5 * 60_000);
    const trafficTimer = window.setInterval(() => void refreshTraffic(), 2 * 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(clockTimer);
      window.clearInterval(weatherTimer);
      window.clearInterval(trafficTimer);
    };
  }, [refreshTraffic, refreshWeather]);

  const active = SCENARIOS.find((scenario) => scenario.id === activeScenario)!;
  const weatherById = useMemo(
    () => new Map((weather?.locations ?? []).map((location) => [location.id, location])),
    [weather],
  );
  const daysOut = clock
    ? Math.max(0, (ECLIPSE_AT.getTime() - clock.getTime()) / 86_400_000)
    : null;
  const countdown = clock ? formatCountdown(ECLIPSE_AT.getTime() - clock.getTime()) : "—";
  const modelSignal = useMemo(
    () => deriveModelSignal(weather?.locations ?? [], daysOut),
    [weather, daysOut],
  );
  const requiredComplete = active.requiredGates.filter((gate) => checks[gate]).length;
  const executionWindow = movementWindow(clock);
  const activeBranchWindow = branchWindow(active.id, clock);
  const weatherFresh =
    weatherStatus === "ready" &&
    isRecent(weather?.retrievedAt, clock, 15 * 60_000);
  const checksFresh = isRecent(checksUpdatedAt, clock, 60 * 60_000);
  const branchModelSupported = modelSignal.scenario === active.id && modelSignal.actionable;
  const actionable =
    weatherFresh &&
    branchModelSupported &&
    requiredComplete === active.requiredGates.length &&
    checksFresh &&
    activeBranchWindow === "open";
  const sourceState =
    weatherFresh && trafficStatus === "live"
      ? "ready"
      : weatherStatus === "loading" || trafficStatus === "loading"
        ? "loading"
        : weatherFresh
          ? "partial"
          : "error";

  function toggleGate(gate: GateKey) {
    const next = { ...checks, [gate]: !checks[gate] };
    const updatedAt = new Date().toISOString();
    setChecks(next);
    setChecksUpdatedAt(updatedAt);
    window.localStorage.setItem(
      "eclipse-live-gates",
      JSON.stringify({ checks: next, updatedAt }),
    );
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#today" aria-label="Eclipse decision home">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <strong>ECLIPSE / ASTURIAS</strong>
            <small>Decision support · 12 Aug 2026</small>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#today">Today</a>
          <a href="#scenarios">Scenarios</a>
          <a href="#live">Live data</a>
          <a href="#evidence">Evidence</a>
        </nav>
        <div className={`source-health source-health--${sourceState}`}>
          <span aria-hidden="true" />
          {sourceState === "ready"
            ? "2 live sources"
            : sourceState === "partial"
              ? "Traffic needs review"
              : sourceState === "loading"
              ? "Connecting"
              : "Live data incomplete"}
        </div>
      </header>

      <section className="hero" id="today">
        <div className="hero-copy">
          <p className="eyebrow">SOTO DEL BARCO · TOTALITY AT 20:27 CEST</p>
          <h1>
            One eclipse.
            <br />
            Four moves.
            <br />
            <em>One safe call.</em>
          </h1>
          <p className="hero-lede">
            Totality is about <strong>10.5° high at 280.5° true</strong>—not at the
            sunset point. Start local, move once, and let missing evidence stop the
            recommendation.
          </p>
          <div className="hero-actions">
            <a className="button button--primary" href="#scenarios">
              Compare scenarios
            </a>
            <a className="button button--quiet" href="#live">
              Inspect live inputs
            </a>
          </div>
          <div className="geometry-strip" aria-label="Eclipse geometry">
            <span>
              <small>Totality</small>
              108 seconds
            </span>
            <span>
              <small>Sun altitude</small>
              10.5°
            </span>
            <span>
              <small>True azimuth</small>
              280.5° WNW
            </span>
          </div>
        </div>

        <aside className="decision-card" aria-live="polite">
          <div className="eclipse-orbit" aria-hidden="true">
            <span />
          </div>
          <div className="decision-meta">
            <span className="decision-label">CURRENT DECISION STATE</span>
            <span className={`freshness freshness--${modelSignal.tone}`}>
              {modelSignal.window}
            </span>
          </div>
          <h2>
            {executionWindow === "stop"
              ? "STOP MOVING"
              : weatherFresh
                ? modelSignal.headline
                : "NO ACTIONABLE RECOMMENDATION"}
          </h2>
          <p>
            {executionWindow === "stop"
              ? "Regional movement is closed. Make only a safe walk-scale adjustment inside the managed area."
              : weatherFresh
                ? modelSignal.detail
                : "Timestamped model data are missing or stale. Climatology is not substituted."}
          </p>
          <div className="countdown">
            <span>{countdown}</span>
            <small>until totality</small>
          </div>
          <div className="gate-row">
            <span>
              <small>South gate</small>
              11:00–12:00
            </span>
            <span>
              <small>Coast / height</small>
              14:00
            </span>
            <span>
              <small>Parked</small>
              16:00
            </span>
          </div>
          <p className="decision-disclaimer">
            Model signal, never a navigation instruction. Access, satellite and direct
            observation gates must also pass.
          </p>
        </aside>
      </section>

      <section className="section scenario-section" id="scenarios">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE BRANCH SYSTEM</p>
            <h2>Choose once. Stop chasing.</h2>
          </div>
          <p>
            Static suitability and live weather are deliberately separate. A blue map
            marker is not a live recommendation.
          </p>
        </div>

        <div className="scenario-tabs" role="tablist" aria-label="Eclipse scenarios">
          {SCENARIOS.map((scenario, index) => (
            <button
              key={scenario.id}
              type="button"
              role="tab"
              aria-selected={activeScenario === scenario.id}
              onClick={() => setActiveScenario(scenario.id)}
            >
              <span>0{index + 1}</span>
              {scenario.tab}
            </button>
          ))}
        </div>

        <div className="scenario-stage">
          <figure className="map-panel">
            <div className="map-crop">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.map} alt={active.mapAlt} />
            </div>
            <figcaption>
              Evidence map · cut {DATA_CUT}. Routes are free-flow baselines, never
              eclipse-day ETAs.
            </figcaption>
          </figure>

          <aside className="scenario-detail">
            <p className="scenario-number">
              SCENARIO {String(SCENARIOS.findIndex((item) => item.id === active.id) + 1).padStart(2, "0")}
            </p>
            <h3>{active.title}</h3>
            <p className="scenario-thesis">{active.thesis}</p>

            <dl className="scenario-facts">
              <div>
                <dt>Primary</dt>
                <dd>{active.primary}</dd>
              </div>
              <div>
                <dt>Backup</dt>
                <dd>{active.backup}</dd>
              </div>
              <div>
                <dt>Observable trigger</dt>
                <dd>{active.trigger}</dd>
              </div>
              <div>
                <dt>Hard stop</dt>
                <dd>{active.hardStop}</dd>
              </div>
            </dl>

            <div className="scenario-live">
              <div className="scenario-live-heading">
                <span>Target-time model</span>
                <small>20:27 CEST</small>
              </div>
              <div className="mini-forecast-row">
                {active.liveIds.map((id) => {
                  const point = weatherById.get(id);
                  return (
                    <span key={id}>
                      <small>{point?.name ?? id}</small>
                      {formatPercent(point?.eclipse.totalCloud)}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="gate-checklist">
              <div className="gate-checklist-heading">
                <span>Manual live gates</span>
                <small>
                  {requiredComplete}/{active.requiredGates.length} confirmed
                </small>
              </div>
              {active.requiredGates.map((gate) => (
                <label key={gate}>
                  <input
                    type="checkbox"
                    checked={Boolean(checks[gate])}
                    onChange={() => toggleGate(gate)}
                  />
                  <span>{GATE_LABELS[gate]}</span>
                </label>
              ))}
              <p>
                Device-local ·{" "}
                {checksUpdatedAt
                  ? `last changed ${formatMadridTime(checksUpdatedAt)}`
                  : "not yet timestamped"}
                {checksUpdatedAt && !checksFresh ? " · expired after 60 min" : ""}
              </p>
            </div>

            <div
              className={`branch-state ${
                actionable ? "branch-state--ready" : "branch-state--blocked"
              }`}
            >
              <strong>
                {actionable
                  ? "BEST-SUPPORTED BRANCH"
                  : activeBranchWindow === "hold"
                    ? "HOLD POSITION"
                    : activeBranchWindow === "stop"
                      ? "STOP MOVING"
                      : activeBranchWindow === "expired"
                        ? "BRANCH GATE EXPIRED"
                        : "NO ACTIONABLE RECOMMENDATION"}
              </strong>
              <span>
                {actionable
                  ? "Model, time and manual execution gates currently align. Recheck official sources before moving."
                  : branchBlockReason(
                      weatherFresh,
                      branchModelSupported,
                      requiredComplete,
                      active.requiredGates.length,
                      checksFresh,
                      activeBranchWindow,
                    )}
              </span>
            </div>
          </aside>
        </div>
      </section>

      <section className="section live-section" id="live">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LIVE MODEL DATA</p>
            <h2>The 20:27 forecast, layer by layer.</h2>
          </div>
          <div className="refresh-block">
            <span>
              {weather?.retrievedAt
                ? `Fetched ${formatMadridTime(weather.retrievedAt)}`
                : "Awaiting first update"}
            </span>
            <button type="button" onClick={() => void refreshWeather()}>
              Refresh now
            </button>
          </div>
        </div>

        {weatherStatus === "error" ? (
          <div className="live-error">
            <strong>Live forecast unavailable.</strong>
            <span>
              No branch is inferred from climatology. Use the official links below and
              try again.
            </span>
          </div>
        ) : (
          <div className="forecast-grid" aria-busy={weatherStatus === "loading"}>
            {(weather?.locations ?? []).map((location) => (
              <article className="forecast-card" key={location.id}>
                <div className="forecast-card-heading">
                  <div>
                    <small>{location.group}</small>
                    <h3>{location.name}</h3>
                  </div>
                  <strong>{formatPercent(location.eclipse.totalCloud)}</strong>
                </div>
                <div className="cloud-stack" aria-label="Cloud layers">
                  <span
                    className="cloud-low"
                    style={{ width: `${location.eclipse.lowCloud ?? 0}%` }}
                  />
                  <span
                    className="cloud-mid"
                    style={{ width: `${location.eclipse.midCloud ?? 0}%` }}
                  />
                  <span
                    className="cloud-high"
                    style={{ width: `${location.eclipse.highCloud ?? 0}%` }}
                  />
                </div>
                <div className="layer-values">
                  <span>
                    <i className="key-low" /> Low {formatPercent(location.eclipse.lowCloud)}
                  </span>
                  <span>
                    <i className="key-mid" /> Mid {formatPercent(location.eclipse.midCloud)}
                  </span>
                  <span>
                    <i className="key-high" /> High {formatPercent(location.eclipse.highCloud)}
                  </span>
                </div>
                <div className="weather-detail">
                  <span>
                    <small>Visibility</small>
                    {formatValue(location.eclipse.visibilityKm, " km")}
                  </span>
                  <span>
                    <small>Wind / gust</small>
                    {formatValue(location.eclipse.wind, "")} /{" "}
                    {formatValue(location.eclipse.gusts, " km/h")}
                  </span>
                  <span>
                    <small>Rain</small>
                    {formatPercent(location.eclipse.precipitation)}
                  </span>
                </div>
              </article>
            ))}
            {weatherStatus === "loading" &&
              Array.from({ length: 6 }).map((_, index) => (
                <div className="forecast-skeleton" key={index} aria-hidden="true" />
              ))}
          </div>
        )}

        <div className="provider-note">
          <strong>{weather?.provider ?? "Open-Meteo Best Match"}</strong>
          <span>
            {weather?.providerNote ??
              "Model-derived point data. Model detail is planning-only at long lead."}
          </span>
        </div>

        <div className="traffic-panel">
          <div className="traffic-heading">
            <div>
              <p className="eyebrow">LIVE ROAD INCIDENT FEED</p>
              <h3>DGT · Asturias and León tags</h3>
            </div>
            <span className={`traffic-status traffic-status--${trafficStatus}`}>
              {trafficStatus}
            </span>
          </div>
          <div className="traffic-summary">
            <strong>
              {trafficStatus === "live" || trafficStatus === "stale"
                ? `${traffic?.regionalCount ?? 0} active regional record${
                    traffic?.regionalCount === 1 ? "" : "s"
                  }`
                : "Traffic state unavailable"}
            </strong>
            <span>
              {traffic?.publicationTime
                ? `Feed published ${formatMadridTime(traffic.publicationTime)}`
                : traffic?.message ?? "Connecting to the official DATEX feed"}
            </span>
            <button
              type="button"
              onClick={() => {
                void refreshTraffic();
                void refreshWeather();
              }}
            >
              Refresh all live data
            </button>
          </div>
          {(traffic?.incidents?.length ?? 0) > 0 && (
            <div className="incident-list">
              {traffic?.incidents?.map((incident) => (
                <article key={incident.id}>
                  <span>{incident.road}</span>
                  <strong>{humanizeIncident(incident.type)}</strong>
                  <small>
                    {incident.municipality}, {incident.province}
                    {incident.updatedAt
                      ? ` · updated ${formatMadridTime(incident.updatedAt)}`
                      : ""}
                  </small>
                </article>
              ))}
            </div>
          )}
          <p className="traffic-caveat">
            {traffic?.caveat ??
              "No listed incident never means that a route is clear; feed data can be incomplete."}
          </p>
        </div>

        <div className="official-grid">
          {OFFICIAL_LINKS.map((link) => (
            <a key={link.name} href={link.href} target="_blank" rel="noreferrer">
              <small>{link.label}</small>
              <strong>{link.name}</strong>
              <span>Open official source ↗</span>
            </a>
          ))}
        </div>
        <p className="official-caveat">
          Link availability is not a green gate. AEMET, DGT, 112, fire restrictions
          and site access must be read and timestamped before movement.
        </p>
      </section>

      <section className="section evidence-section" id="evidence">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EVIDENCE, NOT ORACLE</p>
            <h2>Why the south branch exists.</h2>
          </div>
          <p>
            Climatology ranks regimes. It cannot select the site on 12 August.
          </p>
        </div>

        <div className="evidence-layout">
          <figure className="evidence-map">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/maps/05-historical-cloud-regimes.png"
              alt="Historical CERRA clear and lightly cloudy frequency across Asturias and León"
            />
            <figcaption>
              CERRA 1991–2020 · 600 August samples per point · 18:00 UTC · evidence
              cut {DATA_CUT}
            </figcaption>
          </figure>
          <div className="evidence-copy">
            <h3>Altitude is not immunity.</h3>
            <p>
              Clear/light-cloud frequency was approximately 38% near Soto, 37% at
              Leitariegos, 28% at La Cubilla, 65% near León and 68% near Astorga.
              Several high Cantabrian ridges were historically worse than the coast.
            </p>
            <div className="evidence-rule">
              <strong>When Soto was overcast</strong>
              <span>
                Another sampled coastal point was clear in only 0–6% of cases. Astorga
                was clear in 50%; León in 38%.
              </span>
            </div>
            <div className="audit-numbers">
              <span>
                <strong>26</strong>
                sites screened
              </span>
              <span>
                <strong>78</strong>
                terrain profiles
              </span>
              <span>
                <strong>600</strong>
                samples / cell
              </span>
              <span>
                <strong>0</strong>
                official parking fields
              </span>
            </div>
          </div>
        </div>

        <div className="council">
          <div>
            <p className="eyebrow">COUNCIL VERDICT</p>
            <h3>Local first. One branch. Fail closed.</h3>
          </div>
          <div className="council-columns">
            <p>
              <strong>Consensus</strong>
              Los Quebrantos if viable; Vidio/Caroyas west or Espartal/Xagó east;
              Casa El Puerto only above a verified shallow deck; León only as an
              early, executable south plan.
            </p>
            <p>
              <strong>Dissent retained</strong>
              Farrapona is optically attractive if already pre-positioned and proven
              above cloud. The operational majority refuses to call it a reactive
              fallback.
            </p>
            <p>
              <strong>Unresolved</strong>
              Final municipal traffic orders, fire restrictions, some shuttles,
              Soto promenade access, Coto/Cuitunigru exact pins, and a legal
              Villadangos/Astorga parcel.
            </p>
          </div>
        </div>
      </section>

      <footer>
        <div>
          <strong>ECLIPSE / ASTURIAS 2026</strong>
          <span>Decision support from Soto del Barco · evidence cut {DATA_CUT}</span>
        </div>
        <p>
          This site cannot guarantee a clear Sun. Certified eclipse glasses are
          required whenever any bright solar surface remains visible.
        </p>
      </footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <a href="#today">Today</a>
        <a href="#scenarios">Scenarios</a>
        <a href="#live">Live</a>
        <a href="#evidence">Evidence</a>
      </nav>
    </main>
  );
}

function deriveModelSignal(
  locations: ForecastLocation[],
  daysOut: number | null,
): {
  scenario: ScenarioId | null;
  actionable: boolean;
  headline: string;
  detail: string;
  window: string;
  tone: "early" | "watch" | "live";
} {
  if (!locations.length || daysOut == null) {
    return {
      scenario: null,
      actionable: false,
      headline: "NO ACTIONABLE RECOMMENDATION",
      detail: "Waiting for timestamped model data. Climatology is not substituted.",
      window: "DATA PENDING",
      tone: "early",
    };
  }

  const byId = new Map(locations.map((location) => [location.id, location]));
  const total = (id: string) => byId.get(id)?.eclipse.totalCloud ?? 100;
  const average = (ids: string[]) =>
    ids.reduce((sum, id) => sum + total(id), 0) / ids.length;
  const regimes = [
    { scenario: "clear" as const, label: "Soto", value: total("soto") },
    {
      scenario: "coast" as const,
      label: "west coast",
      value: average(["vidio", "caroyas"]),
    },
    {
      scenario: "coast" as const,
      label: "east coast",
      value: average(["espartal", "xago"]),
    },
    {
      scenario: "low" as const,
      label: "Tineo / Cobertoria",
      value: average(["tineo", "cobertoria"]),
    },
    {
      scenario: "leon" as const,
      label: "León / Astorga plain",
      value: average(["leon", "villadangos", "astorga"]),
    },
  ].sort((a, b) => a.value - b.value);

  const leader = regimes[0];
  const soto = byId.get("soto");
  const south = regimes.find((regime) => regime.scenario === "leon")!;
  const west = regimes.find((regime) => regime.label === "west coast")!;
  const east = regimes.find((regime) => regime.label === "east coast")!;
  const height = regimes.find((regime) => regime.scenario === "low")!;
  const lowDominant =
    (soto?.eclipse.lowCloud ?? 0) >= 60 &&
    (soto?.eclipse.midCloud ?? 100) <= 25 &&
    (soto?.eclipse.highCloud ?? 100) <= 25;

  const window =
    daysOut > 7
      ? "PLANNING SIGNAL"
      : daysOut > 4
        ? "REGIONAL GUIDANCE"
        : daysOut > 1
          ? "OPERATIONAL WINDOW"
          : "NOWCAST WINDOW";
  const tone = daysOut > 7 ? "early" : daysOut > 4 ? "watch" : "live";

  if (daysOut > 7) {
    return {
      scenario: leader.scenario,
      actionable: false,
      headline: "HOLD ALL BRANCHES",
      detail: `${leader.label} leads the current long-range point model at ${Math.round(
        leader.value,
      )}% total cloud. This is too early for movement or venue selection.`,
      window,
      tone,
    };
  }

  if (total("soto") <= 30) {
    return {
      scenario: "clear",
      actionable: daysOut <= 4,
      headline: "LOCAL BRANCH LEADS",
      detail: `Soto is modelled near ${Math.round(total("soto"))}% total cloud. Lowest movement remains preferred.`,
      window,
      tone,
    };
  }

  if (south.value <= 35 && total("soto") - south.value >= 25) {
    return {
      scenario: "leon",
      actionable: daysOut <= 4,
      headline: "SOUTH SIGNAL—EARLY GATE",
      detail: `The sampled south plain is ${Math.round(
        total("soto") - south.value,
      )} cloud points better than Soto. It is actionable only with a legal destination and viable AP-66.`,
      window,
      tone,
    };
  }

  if (
    lowDominant &&
    height.value <= 35 &&
    total("soto") - height.value >= 20
  ) {
    return {
      scenario: "low",
      actionable: daysOut <= 4,
      headline: "POSSIBLE SHALLOW-DECK BRANCH",
      detail:
        "Layer data favor height, but model cloud fraction cannot supply cloud top. The cloud-top and ridge-observation gates remain mandatory.",
      window,
      tone,
    };
  }

  const coast = west.value <= east.value ? west : east;
  if (coast.value <= 40 && total("soto") - coast.value >= 25) {
    return {
      scenario: "coast",
      actionable: daysOut <= 4,
      headline: `${coast.label.toUpperCase()} SIGNAL`,
      detail: `${coast.label} is ${Math.round(
        total("soto") - coast.value,
      )} cloud points better than Soto in the point model. A broad observed gap must confirm it.`,
      window,
      tone,
    };
  }

  return {
    scenario: null,
    actionable: false,
    headline: "NO CLEAN MODEL BRANCH",
    detail:
      "No regime clears the fail-closed thresholds. Preserve the local plan and wait for better evidence.",
    window,
    tone,
  };
}

type ExecutionWindow = "open" | "expired" | "hold" | "stop";

function movementWindow(now: Date | null): "open" | "hold" | "stop" {
  if (now && now.getTime() > ECLIPSE_AT.getTime()) return "stop";
  const madrid = madridClock(now);
  if (!madrid || madrid.date !== "2026-08-12") return "open";
  if (madrid.minutes >= 18 * 60) return "stop";
  if (madrid.minutes >= 16 * 60) return "hold";
  return "open";
}

function branchWindow(scenario: ScenarioId, now: Date | null): ExecutionWindow {
  const global = movementWindow(now);
  if (global !== "open") return global;
  const madrid = madridClock(now);
  if (!madrid || madrid.date !== "2026-08-12") return "open";
  if (scenario === "leon" && madrid.minutes >= 12 * 60) return "expired";
  if ((scenario === "coast" || scenario === "low") && madrid.minutes >= 14 * 60) {
    return "expired";
  }
  return "open";
}

function madridClock(now: Date | null) {
  if (!now) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    minutes,
  };
}

function isRecent(
  timestamp: string | null | undefined,
  now: Date | null,
  maxAge: number,
) {
  if (!timestamp || !now) return false;
  const age = now.getTime() - new Date(timestamp).getTime();
  return age >= -60_000 && age <= maxAge;
}

function branchBlockReason(
  weatherFresh: boolean,
  modelSupported: boolean,
  complete: number,
  total: number,
  checksFresh: boolean,
  window: ExecutionWindow,
) {
  if (window === "stop") return "Regional movement closed after 18:00.";
  if (window === "hold") return "Movement gate expired after 16:00.";
  if (window === "expired") return "This branch-specific decision deadline has passed.";
  if (!weatherFresh) return "Live model data missing or stale.";
  if (!modelSupported) return "This branch does not pass the current model threshold.";
  if (complete < total) return `${total - complete} required live gate${total - complete === 1 ? "" : "s"} unconfirmed.`;
  if (!checksFresh) return "Manual gate confirmations are older than 60 minutes.";
  return "Required evidence is incomplete.";
}

function formatCountdown(milliseconds: number) {
  if (milliseconds <= 0) return "Eclipse complete";
  const days = Math.floor(milliseconds / 86_400_000);
  const hours = Math.floor((milliseconds % 86_400_000) / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  return `${days}d ${hours}h ${minutes}m`;
}

function formatPercent(value: number | null | undefined) {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function formatValue(value: number | null | undefined, suffix: string) {
  return value == null ? "—" : `${Math.round(value)}${suffix}`;
}

function formatMadridTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function humanizeIncident(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (first) => first.toUpperCase());
}
