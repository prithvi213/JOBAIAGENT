import { useEffect, useRef, useState } from "react";

export function useDebouncedSuggestions(
  query: string,
  fetchSuggestions: (query: string) => Promise<string[]>,
  debounceMs = 300,
) {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = (query ?? "").trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    const timer = setTimeout(() => {
      fetchSuggestions(trimmed)
        .then((next) => {
          if (requestIdRef.current === requestId) setResults(next);
        })
        .catch(() => {
          if (requestIdRef.current === requestId) setResults([]);
        })
        .finally(() => {
          if (requestIdRef.current === requestId) setLoading(false);
        });
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions, debounceMs]);

  return { results, loading };
}
