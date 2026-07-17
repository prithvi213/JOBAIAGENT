"use client";

import { useMemo, useRef, useState } from "react";
import { useDebouncedSuggestions } from "@/lib/useDebouncedSuggestions";
import { usePhantomClickGuard } from "@/lib/usePhantomClickGuard";
import { useOutsideClick } from "@/lib/useOutsideClick";

const noopFetch = async () => [] as string[];

interface SingleAutosuggestInputProps {
  value: string;
  onChange: (next: string) => void;
  /** Static suggestion list, filtered client-side as the user types. */
  suggestions?: string[];
  /** Async suggestion source (e.g. an API call), debounced as the user types. */
  fetchSuggestions?: (query: string) => Promise<string[]>;
  placeholder?: string;
  className?: string;
  maxSuggestions?: number;
  debounceMs?: number;
}

export default function SingleAutosuggestInput({
  value,
  onChange,
  suggestions,
  fetchSuggestions,
  placeholder,
  className,
  maxSuggestions = 8,
  debounceMs = 300,
}: SingleAutosuggestInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const guardPhantomClick = usePhantomClickGuard();
  const safeValue = value ?? "";

  const { results: remoteResults, loading } = useDebouncedSuggestions(
    fetchSuggestions ? safeValue : "",
    fetchSuggestions ?? noopFetch,
    debounceMs,
  );

  useOutsideClick(containerRef, isOpen, () => setIsOpen(false));

  const filtered = useMemo(() => {
    const query = safeValue.trim().toLowerCase();
    if (!query) return [];
    if (fetchSuggestions) {
      return remoteResults.slice(0, maxSuggestions);
    }
    return (suggestions ?? [])
      .filter((s) => s.toLowerCase().includes(query))
      .slice(0, maxSuggestions);
  }, [safeValue, suggestions, remoteResults, fetchSuggestions, maxSuggestions]);

  const showDropdown =
    isOpen && safeValue.trim().length > 0 && (filtered.length > 0 || loading);

  return (
    <div ref={containerRef} className="relative">
      <input
        className={className ?? "input w-full"}
        placeholder={placeholder}
        value={safeValue}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {showDropdown && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-black/10 bg-white text-sm shadow-md dark:border-white/10 dark:bg-neutral-900">
          {filtered.length === 0 && loading && (
            <li className="px-3 py-2 text-black/50 dark:text-white/50">
              Searching…
            </li>
          )}
          {filtered.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={guardPhantomClick(() => {
                  onChange(suggestion);
                  setIsOpen(false);
                })}
                className="block w-full px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
