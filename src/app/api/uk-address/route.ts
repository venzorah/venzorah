import { lookupUkPostcode, searchUkPlaces, suggestUkPostcodes } from "@/lib/uk-address";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const postcode = url.searchParams.get("postcode")?.trim() ?? "";

  if (query) {
    const places = await searchUkPlaces(query);
    if (places === "unavailable") {
      return Response.json({ places: [], error: "UK place search is unavailable right now." });
    }
    return Response.json({ places, error: null });
  }

  if (postcode) {
    const match = await lookupUkPostcode(postcode);
    if (match === "unavailable") {
      const suggestions = await suggestUkPostcodes(postcode);
      return Response.json({
        postcode: null,
        suggestions: suggestions === "unavailable" ? [] : suggestions,
        error: "UK postcode search is unavailable right now.",
      });
    }
    if (match) return Response.json({ postcode: match, suggestions: [], error: null });
    const suggestions = await suggestUkPostcodes(postcode);
    if (suggestions === "unavailable") {
      return Response.json({ postcode: null, suggestions: [], error: "UK postcode search is unavailable right now." });
    }
    return Response.json({ postcode: null, suggestions, error: null });
  }

  return Response.json({ places: [], suggestions: [], postcode: null, error: null });
}
