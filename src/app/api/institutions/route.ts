import { NextRequest, NextResponse } from "next/server";

interface University {
  name: string;
  country: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL("http://universities.hipolabs.com/search");
  url.searchParams.set("name", query);

  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json({ results: [] }, { status: 502 });
  }

  const data = (await response.json()) as University[];
  const seen = new Set<string>();
  const results: string[] = [];
  for (const item of data.slice(0, 8)) {
    if (!seen.has(item.name)) {
      seen.add(item.name);
      results.push(item.name);
    }
  }

  return NextResponse.json({ results });
}
