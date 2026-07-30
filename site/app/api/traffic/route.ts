const DGT_FEED =
  "https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v37.xml";

type Incident = {
  id: string;
  updatedAt: string | null;
  road: string;
  municipality: string;
  municipalities: string[];
  province: string;
  provinces: string[];
  type: string;
  startAt: string | null;
  endAt: string | null;
  management: string | null;
};

const ROUTE_CORRIDORS = [
  {
    id: "local-quebrantos",
    name: "Los Quebrantos",
    roads: ["SB-3"],
    municipalities: ["Soto del Barco"],
  },
  {
    id: "west-vidio",
    name: "Cabo Vidio",
    roads: ["N-632", "A-8", "CU-8"],
    municipalities: [
      "Soto del Barco",
      "Muros de Nalón",
      "Pravia",
      "Cudillero",
    ],
  },
  {
    id: "west-caroyas",
    name: "Caroyas",
    roads: ["N-632", "A-8", "N-634", "N-632A"],
    municipalities: [
      "Soto del Barco",
      "Muros de Nalón",
      "Pravia",
      "Cudillero",
      "Valdés",
    ],
  },
  {
    id: "east-espartal",
    name: "El Espartal",
    roads: ["N-632", "N-632A"],
    municipalities: ["Soto del Barco", "Castrillón"],
  },
  {
    id: "east-xago",
    name: "Xagó",
    roads: ["N-632", "AS-17", "AS-238", "AS-328", "AS-329", "GO-15"],
    municipalities: [
      "Soto del Barco",
      "Castrillón",
      "Avilés",
      "Gozón",
    ],
  },
  {
    id: "height-tineo",
    name: "Casa El Puerto",
    roads: ["AS-16", "N-634", "A-63", "AS-216", "AS-359"],
    municipalities: ["Soto del Barco", "Pravia", "Salas", "Tineo"],
  },
  {
    id: "height-farrapona",
    name: "Farrapona",
    roads: ["AS-16", "AS-15", "AS-227", "SD-1", "SD-2"],
    municipalities: [
      "Soto del Barco",
      "Pravia",
      "Salas",
      "Belmonte de Miranda",
      "Somiedo",
      "San Emiliano",
    ],
  },
  {
    id: "picos-sotres",
    name: "Sotres",
    roads: ["N-632", "A-81", "A-8", "LLN-11", "AS-115", "AS-114", "AS-264"],
    municipalities: [
      "Soto del Barco",
      "Castrillón",
      "Corvera de Asturias",
      "Carreño",
      "Gijón",
      "Villaviciosa",
      "Colunga",
      "Caravia",
      "Ribadesella",
      "Llanes",
      "Cabrales",
      "Onís",
    ],
  },
  {
    id: "south-leon",
    name: "León",
    roads: ["N-632", "A-81", "A-8", "A-66", "AP-66", "A-66R", "N-120"],
    municipalities: [
      "Soto del Barco",
      "Castrillón",
      "Corvera de Asturias",
      "Carreño",
      "Gijón",
      "Llanera",
      "Siero",
      "Oviedo",
      "Ribera de Arriba",
      "Mieres",
      "Lena",
      "Sena de Luna",
      "Los Barrios de Luna",
      "Soto y Amío",
      "Carrocera",
      "Rioseco de Tapia",
      "Cimanes del Tejar",
      "Valverde de la Virgen",
      "San Andrés del Rabanedo",
      "León",
    ],
  },
  {
    id: "south-villadangos",
    name: "Villadangos",
    roads: [
      "N-632",
      "A-81",
      "A-8",
      "A-66",
      "AP-66",
      "A-66R",
      "AP-71",
      "N-120",
      "LE-413",
    ],
    municipalities: [
      "Soto del Barco",
      "Castrillón",
      "Corvera de Asturias",
      "Carreño",
      "Gijón",
      "Llanera",
      "Siero",
      "Oviedo",
      "Ribera de Arriba",
      "Mieres",
      "Lena",
      "Sena de Luna",
      "Los Barrios de Luna",
      "Soto y Amío",
      "Carrocera",
      "Rioseco de Tapia",
      "Cimanes del Tejar",
      "Valverde de la Virgen",
      "Chozas de Abajo",
      "Villadangos del Páramo",
    ],
  },
] as const;

const PLACE_ALIASES: Record<string, string> = {
  tineu: "tineo",
};

export const dynamic = "force-dynamic";

export async function GET() {
  const retrievedAt = new Date().toISOString();

  try {
    const response = await fetch(DGT_FEED, {
      cache: "no-store",
      headers: { Accept: "application/xml, text/xml" },
    });
    if (!response.ok) {
      throw new Error(`DGT returned ${response.status}`);
    }

    const xml = await response.text();
    const publicationTime = extract(xml, "com:publicationTime");
    if (!publicationTime) {
      throw new Error("DGT publication timestamp missing");
    }

    const regional: Incident[] = [];
    const situations =
      xml.match(/<sit:situation\b[\s\S]*?<\/sit:situation>/g) ?? [];

    for (const situation of situations) {
      const situationId =
        situation.match(/<sit:situation\b[^>]*\bid="([^"]+)"/)?.[1] ??
        "unknown";
      const records =
        situation.match(
          /<sit:situationRecord\b[\s\S]*?<\/sit:situationRecord>/g,
        ) ?? [];

      for (const record of records) {
        const provinces = extractAll(record, "lse:province");
        if (!provinces.some(isTargetProvince)) continue;

        const endAt = extract(record, "com:overallEndTime");
        if (isExpired(endAt, publicationTime)) continue;

        const management = extractFirstOrNull(record, [
          "sit:roadOrCarriagewayOrLaneManagementType",
          "sit:laneUsage",
        ]);
        const recordId =
          record.match(/<sit:situationRecord\b[^>]*\bid="([^"]+)"/)?.[1] ??
          `${regional.length}`;
        const municipalities = extractAll(record, "lse:municipality");
        regional.push({
          id: `${situationId}:${recordId}`,
          updatedAt: extract(record, "sit:situationRecordVersionTime"),
          road: extract(record, "loc:roadName") ?? "Road not supplied",
          municipality:
            municipalities.join(" → ") || "Municipality not supplied",
          municipalities,
          province: provinces.join(" → ") || "Province not supplied",
          provinces,
          type: extractFirst(record, [
            "sit:roadMaintenanceType",
            "sit:constructionWorkType",
            "sit:accidentType",
            "sit:environmentalObstructionType",
            "sit:generalObstructionType",
            "sit:disturbanceActivityType",
            "sit:equipmentOrSystemFaultType",
            "sit:causeType",
          ]),
          startAt: extract(record, "com:overallStartTime"),
          endAt,
          management,
        });
      }
    }

    const ageSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(publicationTime).getTime()) / 1000),
    );
    const status = ageSeconds > 900 ? "unavailable" : ageSeconds > 300 ? "stale" : "live";

    const sorted = regional.sort((a, b) =>
      (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
    );
    const corridors = ROUTE_CORRIDORS.map((corridor) => {
      const matches = sorted.filter((incident) =>
        corridor.roads.some((road) => sameRoad(incident.road, road)) &&
        incident.municipalities.some((recordMunicipality) =>
          corridor.municipalities.some((routeMunicipality) =>
            samePlace(recordMunicipality, routeMunicipality),
          ),
        ),
      );
      return {
        ...corridor,
        recordCount: matches.length,
        incidents: matches.slice(0, 4),
      };
    });
    const routeCriticalIds = new Set(
      corridors.flatMap((corridor) =>
        corridor.incidents.map((incident) => incident.id),
      ),
    );
    const displayIncidents = [
      ...sorted.filter((incident) => routeCriticalIds.has(incident.id)),
      ...sorted.filter((incident) => !routeCriticalIds.has(incident.id)),
    ].slice(0, 16);

    return Response.json(
      {
        ok: status !== "unavailable",
        status,
        retrievedAt,
        publicationTime,
        ageSeconds,
        provider: "DGT DATEX II 3.7",
        sourceUrl: DGT_FEED,
        regionalCount: sorted.length,
        incidents: displayIncidents,
        corridors,
        caveat:
          "Every non-expired situation record tagged Asturias or León is matched against audited principal road references and every supplied municipality before the display is truncated. The road and municipality sets do not encode kilometre segments, and zero matches never means that a route is clear.",
      },
      {
        status: status === "unavailable" ? 503 : 200,
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=180",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "unavailable",
        retrievedAt,
        provider: "DGT DATEX II 3.7",
        sourceUrl: DGT_FEED,
        message:
          error instanceof Error
            ? error.message
            : "DGT traffic feed is temporarily unavailable",
        caveat: "Traffic availability is unknown. Do not infer that a route is clear.",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

function extract(xml: string, tag: string) {
  const expression = new RegExp(
    `<${escapeRegExp(tag)}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapeRegExp(tag)}>`,
  );
  const value = expression.exec(xml)?.[1];
  return value ? decodeEntities(value.trim()) : null;
}

function extractAll(xml: string, tag: string) {
  const expression = new RegExp(
    `<${escapeRegExp(tag)}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapeRegExp(tag)}>`,
    "g",
  );
  return [
    ...new Set(
      [...xml.matchAll(expression)]
        .map((match) => decodeEntities(match[1].trim()))
        .filter(Boolean),
    ),
  ];
}

function extractFirst(xml: string, tags: string[]) {
  return extractFirstOrNull(xml, tags) ?? "Active traffic situation";
}

function extractFirstOrNull(xml: string, tags: string[]) {
  for (const tag of tags) {
    const value = extract(xml, tag);
    if (value) return value;
  }
  return null;
}

function isTargetProvince(province: string) {
  const normalized = normalizeText(province);
  return normalized === "asturias" || normalized === "leon";
}

function isExpired(endAt: string | null, publicationTime: string) {
  if (!endAt) return false;
  const end = new Date(endAt).getTime();
  const publication = new Date(publicationTime).getTime();
  return (
    Number.isFinite(end) &&
    Number.isFinite(publication) &&
    end < publication - 60_000
  );
}

function sameRoad(left: string, right: string) {
  return normalizeText(left) === normalizeText(right);
}

function samePlace(left: string, right: string) {
  return normalizePlace(left) === normalizePlace(right);
}

function normalizePlace(value: string) {
  const normalized = normalizeText(value);
  return PLACE_ALIASES[normalized] ?? normalized;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}
