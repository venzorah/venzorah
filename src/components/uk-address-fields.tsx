"use client";

import { useEffect, useId, useState } from "react";
import { Field, Input } from "@/components/ui";
import { formatUkPostcode, isFullUkPostcode, type UkPlaceHit, type UkPostcodeHit } from "@/lib/uk-address";

type Props = {
  line1Name: string;
  cityName: string;
  regionName: string;
  postcodeName: string;
  defaultLine1?: string;
  defaultCity?: string;
  defaultRegion?: string;
  defaultPostcode?: string;
};

function placeTitle(hit: UkPlaceHit) {
  return hit.city ?? hit.region;
}

function placeDetail(hit: UkPlaceHit) {
  if (!hit.city) return "Region";
  return [hit.kind, hit.county && hit.county !== hit.city ? hit.county : null, hit.region].filter(Boolean).join(" · ");
}

export function UkAddressFields({
  line1Name,
  cityName,
  regionName,
  postcodeName,
  defaultLine1 = "",
  defaultCity = "",
  defaultRegion = "",
  defaultPostcode = "",
}: Props) {
  const searchId = useId();
  const postcodeId = useId();
  const [line1, setLine1] = useState(defaultLine1);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<UkPlaceHit[]>([]);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [placeStatus, setPlaceStatus] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [region, setRegion] = useState(defaultRegion);
  const [postcode, setPostcode] = useState(defaultPostcode);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const [postcodeStatus, setPostcodeStatus] = useState("");
  const [postcodeTone, setPostcodeTone] = useState<"muted" | "success" | "error">("muted");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setPlaces([]);
      setPlaceStatus("");
      return;
    }
    const timer = window.setTimeout(async () => {
      setPlaceStatus("Searching UK cities and regions…");
      try {
        const response = await fetch(`/api/uk-address?q=${encodeURIComponent(q)}`);
        const body = (await response.json()) as { places?: UkPlaceHit[]; error?: string | null };
        setPlaces(body.places ?? []);
        setPlacesOpen(true);
        setPlaceStatus(body.error || (body.places?.length ? "" : "No matching UK city or region."));
      } catch {
        setPlaces([]);
        setPlaceStatus("UK place search is unavailable right now.");
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const value = postcode.trim();
    if (value.replace(/\s+/g, "").length < 2) {
      setSuggestions([]);
      setPostcodeStatus("");
      setPostcodeTone("muted");
      return;
    }
    const timer = window.setTimeout(async () => {
      setPostcodeStatus(isFullUkPostcode(value) ? "Checking this UK postcode…" : "Searching UK postcodes…");
      setPostcodeTone("muted");
      try {
        const response = await fetch(`/api/uk-address?postcode=${encodeURIComponent(value)}`);
        const body = (await response.json()) as {
          postcode?: UkPostcodeHit | null;
          suggestions?: string[];
          error?: string | null;
        };
        if (body.postcode) {
          setPostcode(body.postcode.postcode);
          setCity(body.postcode.city);
          setRegion(body.postcode.region);
          setSuggestions([]);
          setPostcodeOpen(false);
          const district =
            body.postcode.district && body.postcode.district !== body.postcode.city
              ? ` · ${body.postcode.district}`
              : "";
          setPostcodeStatus(`${body.postcode.city}, ${body.postcode.region}${district}`);
          setPostcodeTone("success");
          return;
        }
        setSuggestions(body.suggestions ?? []);
        setPostcodeOpen((body.suggestions ?? []).length > 0);
        if (body.error) {
          setPostcodeStatus(body.error);
          setPostcodeTone("error");
        } else if (isFullUkPostcode(value)) {
          setPostcodeStatus("That is not a UK postcode.");
          setPostcodeTone("error");
        } else {
          setPostcodeStatus("");
          setPostcodeTone("muted");
        }
      } catch {
        setPostcodeStatus("UK postcode search is unavailable right now.");
        setPostcodeTone("error");
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [postcode]);

  function choosePlace(hit: UkPlaceHit) {
    if (hit.city) setCity(hit.city);
    setRegion(hit.region);
    setQuery("");
    setPlaces([]);
    setPlacesOpen(false);
    setPlaceStatus(hit.city ? `${hit.city}, ${hit.region}` : `${hit.region}. Choose a city in this region.`);
  }

  function choosePostcode(value: string) {
    setPostcode(formatUkPostcode(value));
    setSuggestions([]);
    setPostcodeOpen(false);
  }

  const toneClass = {
    muted: "text-muted",
    success: "text-success",
    error: "text-error",
  }[postcodeTone];

  return (
    <>
      <Field label="Address line 1">
        <Input
          name={line1Name}
          value={line1}
          onChange={(event) => setLine1(event.target.value)}
          required
          autoComplete="address-line1"
        />
      </Field>
      <div className="grid gap-1.5 text-sm">
        <label htmlFor={searchId} className="font-medium text-ink">
          Search city or region
        </label>
        <div className="relative">
        <Input
          id={searchId}
          value={query}
          role="combobox"
          aria-expanded={placesOpen}
          aria-controls={`${searchId}-list`}
          aria-autocomplete="list"
          placeholder="Start typing, for example Leeds or Yorkshire"
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setPlacesOpen(true);
          }}
          onFocus={() => {
            if (places.length) setPlacesOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setPlacesOpen(false);
          }}
        />
        {placesOpen && places.length ? (
          <ul
            id={`${searchId}-list`}
            role="listbox"
            className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg"
          >
            {places.map((hit) => (
              <li key={hit.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-surface"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choosePlace(hit)}
                >
                  <span className="block text-sm font-semibold text-ink">{placeTitle(hit)}</span>
                  <span className="block text-xs text-muted">{placeDetail(hit)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        </div>
        <span className="text-xs text-muted">UK cities, towns, and regions.</span>
        {placeStatus ? <span className="text-xs text-muted">{placeStatus}</span> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City">
          <Input
            name={cityName}
            value={city}
            onChange={(event) => setCity(event.target.value)}
            required
            autoComplete="address-level2"
          />
        </Field>
        <Field label="Region">
          <Input
            name={regionName}
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            required
            autoComplete="address-level1"
          />
        </Field>
      </div>
      <div className="grid gap-1.5 text-sm">
        <label htmlFor={postcodeId} className="font-medium text-ink">
          Postcode
        </label>
        <div className="relative">
        <Input
          id={postcodeId}
          name={postcodeName}
          value={postcode}
          role="combobox"
          aria-expanded={postcodeOpen}
          aria-controls={`${postcodeId}-list`}
          aria-autocomplete="list"
          required
          autoComplete="postal-code"
          placeholder="SW1A 1AA"
          onChange={(event) => setPostcode(event.target.value.toUpperCase())}
          onBlur={() => {
            if (isFullUkPostcode(postcode)) setPostcode(formatUkPostcode(postcode));
          }}
          onFocus={() => {
            if (suggestions.length) setPostcodeOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setPostcodeOpen(false);
          }}
        />
        {postcodeOpen && suggestions.length ? (
          <ul
            id={`${postcodeId}-list`}
            role="listbox"
            className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg"
          >
            {suggestions.map((suggestion) => (
              <li key={suggestion} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-surface"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choosePostcode(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        </div>
        <span className="text-xs text-muted">A full postcode fills the city and region.</span>
        {postcodeStatus ? <span className={`text-xs ${toneClass}`}>{postcodeStatus}</span> : null}
      </div>
    </>
  );
}
