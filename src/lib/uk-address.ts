const POSTCODES_API = "https://api.postcodes.io";

/** ONS / ITL1 regions used on a UK address, including the three devolved nations. */
export const UK_REGIONS = [
  "North East",
  "North West",
  "Yorkshire and The Humber",
  "East Midlands",
  "West Midlands",
  "East of England",
  "London",
  "South East",
  "South West",
  "Wales",
  "Scotland",
  "Northern Ireland",
] as const;

const FULL_POSTCODE = /^(GIR ?0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i;

export type UkPlaceHit = {
  id: string;
  city: string | null;
  region: string;
  county: string | null;
  country: string;
  kind: string;
};

export type UkPostcodeHit = {
  postcode: string;
  city: string;
  region: string;
  district: string;
  country: string;
};

type PostcodeRecord = {
  postcode?: string;
  region?: string | null;
  country?: string | null;
  admin_district?: string | null;
};

type PlaceRecord = {
  code?: string;
  name_1?: string;
  local_type?: string | null;
  county_unitary?: string | null;
  region?: string | null;
  country?: string | null;
};

export function isFullUkPostcode(value: string) {
  return FULL_POSTCODE.test(value.trim());
}

export function formatUkPostcode(value: string) {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export function canonicalUkRegion(value: string) {
  const found = UK_REGIONS.find((region) => region.toLowerCase() === value.trim().toLowerCase());
  return found ?? null;
}

function cityFromPostcode(record: PostcodeRecord) {
  if (record.region === "London") return "London";
  return record.admin_district || record.region || record.country || "";
}

function regionFromPostcode(record: PostcodeRecord) {
  return canonicalUkRegion(record.region || "") || record.region || record.country || "";
}

async function readJson(url: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
        headers: { Accept: "application/json", "User-Agent": "Venzorah/1.0 (uk-address)" },
      });
      if (response.status === 404) return { missing: true as const, body: null };
      if (!response.ok) continue;
      return { missing: false as const, body: (await response.json()) as { result?: unknown } };
    } catch {
      if (attempt === 1) break;
    }
  }
  return { missing: false as const, body: null };
}

export async function lookupUkPostcode(raw: string): Promise<UkPostcodeHit | null | "unavailable"> {
  if (!isFullUkPostcode(raw)) return null;
  const compact = raw.replace(/\s+/g, "");
  try {
    const { missing, body } = await readJson(`${POSTCODES_API}/postcodes/${encodeURIComponent(compact)}`);
    if (missing) return null;
    const result = body?.result as PostcodeRecord | undefined;
    if (!result?.postcode) return "unavailable";
    const city = cityFromPostcode(result);
    const region = regionFromPostcode(result);
    if (!city || !region) return "unavailable";
    return {
      postcode: result.postcode,
      city,
      region,
      district: result.admin_district || city,
      country: result.country || "United Kingdom",
    };
  } catch {
    return "unavailable";
  }
}

export async function suggestUkPostcodes(prefix: string): Promise<string[] | "unavailable"> {
  const compact = prefix.replace(/\s+/g, "");
  if (compact.length < 2 || compact.length > 7) return [];
  try {
    const { missing, body } = await readJson(
      `${POSTCODES_API}/postcodes/${encodeURIComponent(compact)}/autocomplete?limit=6`,
    );
    if (missing) return [];
    if (!body || !Array.isArray(body.result)) return "unavailable";
    return body.result.filter((item): item is string => typeof item === "string");
  } catch {
    return "unavailable";
  }
}

export async function resolveUkAddress(input: { city: string; region: string; postcode: string }) {
  const city = input.city.trim();
  const regionInput = input.region.trim();
  if (!/^[A-Za-z][A-Za-z .'-]{1,60}$/.test(city)) return { error: "Choose a UK city." as const };
  const looked = await lookupUkPostcode(input.postcode);
  if (looked === null) return { error: "Enter a real UK postcode." as const };
  if (looked === "unavailable") {
    const region = canonicalUkRegion(regionInput);
    if (!isFullUkPostcode(input.postcode) || !region) {
      return { error: "Enter a real UK postcode and region." as const };
    }
    return { city, region, postcode: formatUkPostcode(input.postcode) };
  }
  const region = canonicalUkRegion(regionInput) || looked.region;
  if (!region) return { error: "Choose a UK region." as const };
  return { city, region, postcode: looked.postcode };
}

export async function searchUkPlaces(query: string): Promise<UkPlaceHit[] | "unavailable"> {
  const q = query.trim();
  if (q.length < 2) return [];
  const needle = q.toLowerCase();
  const regions: UkPlaceHit[] = UK_REGIONS.filter((region) => region.toLowerCase().includes(needle)).map((region) => ({
    id: `region:${region}`,
    city: null,
    region,
    county: null,
    country: "United Kingdom",
    kind: "Region",
  }));
  try {
    const { body } = await readJson(`${POSTCODES_API}/places?q=${encodeURIComponent(q)}&limit=8`);
    if (!body || !Array.isArray(body.result)) return regions.length ? regions : "unavailable";
    const places: UkPlaceHit[] = (body.result as PlaceRecord[])
      .filter((place) => place.name_1 && place.code)
      .map((place) => ({
        id: place.code as string,
        city: place.name_1 as string,
        region: canonicalUkRegion(place.region || "") || place.region || place.country || "United Kingdom",
        county: place.county_unitary || null,
        country: place.country || "United Kingdom",
        kind: place.local_type || "Place",
      }));
    const seen = new Set<string>();
    return [...regions, ...places]
      .filter((hit) => {
        const key = `${hit.kind}:${hit.city ?? ""}:${hit.region}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10);
  } catch {
    return regions.length ? regions : "unavailable";
  }
}
