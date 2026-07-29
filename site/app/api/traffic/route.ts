const DGT_FEED =
  "https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v37.xml";

type Incident = {
  id: string;
  updatedAt: string | null;
  road: string;
  municipality: string;
  province: string;
  type: string;
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
      const province = extract(situation, "lse:province");
      if (province !== "Asturias" && province !== "León") continue;

      regional.push({
        id:
          situation.match(/<sit:situation\b[^>]*\bid="([^"]+)"/)?.[1] ??
          "unknown",
        updatedAt: extract(situation, "sit:situationRecordVersionTime"),
        road: extract(situation, "loc:roadName") ?? "Road not supplied",
        municipality:
          extract(situation, "lse:municipality") ?? "Municipality not supplied",
        province,
        type: extractFirst(situation, [
          "sit:accidentType",
          "sit:roadMaintenanceType",
          "sit:constructionWorkType",
          "sit:environmentalObstructionType",
          "sit:generalObstructionType",
          "sit:disturbanceActivityType",
          "sit:equipmentOrSystemFaultType",
          "sit:causeType",
        ]),
      });
    }

    const ageSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(publicationTime).getTime()) / 1000),
    );
    const status = ageSeconds > 900 ? "unavailable" : ageSeconds > 300 ? "stale" : "live";

    return Response.json(
      {
        ok: status !== "unavailable",
        status,
        retrievedAt,
        publicationTime,
        ageSeconds,
        provider: "DGT DATEX II 3.7",
        sourceUrl: DGT_FEED,
        regionalCount: regional.length,
        incidents: regional
          .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
          .slice(0, 8),
        caveat:
          "Only active feed records tagged Asturias or León are counted. No listed incident does not mean a route is clear.",
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

function extractFirst(xml: string, tags: string[]) {
  for (const tag of tags) {
    const value = extract(xml, tag);
    if (value) return value;
  }
  return "Active traffic situation";
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
