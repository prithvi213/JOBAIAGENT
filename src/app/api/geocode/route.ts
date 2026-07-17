import { NextRequest, NextResponse } from "next/server";

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
}

interface NominatimResult {
  display_name: string;
  address?: NominatimAddress;
}

function formatPlace(item: NominatimResult): string | null {
  const address = item.address;
  if (!address) return null;
  const city =
    address.city || address.town || address.village || address.municipality;
  if (!city) return null;
  return [city, address.state, address.country === "United States" ? undefined : address.country]
    .filter(Boolean)
    .join(", ");
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "job-ai-agent/0.1 (personal project)",
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ results: [] }, { status: 502 });
  }

  const data = (await response.json()) as NominatimResult[];
  const seen = new Set<string>();
  const results: string[] = [];
  for (const item of data) {
    const place = formatPlace(item);
    if (place && !seen.has(place)) {
      seen.add(place);
      results.push(place);
    }
  }

  return NextResponse.json({ results });
}
