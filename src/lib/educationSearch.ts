async function searchApi(path: string, query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const response = await fetch(`${path}?q=${encodeURIComponent(trimmed)}`);
  if (!response.ok) return [];

  const data = (await response.json()) as { results: string[] };
  return data.results;
}

export function searchInstitutions(query: string): Promise<string[]> {
  return searchApi("/api/institutions", query);
}
