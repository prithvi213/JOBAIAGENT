export async function searchCities(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const extras = "remote".startsWith(trimmed.toLowerCase()) ? ["Remote"] : [];

  const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
  if (!response.ok) return extras;

  const data = (await response.json()) as { results: string[] };
  return [...extras, ...data.results];
}
