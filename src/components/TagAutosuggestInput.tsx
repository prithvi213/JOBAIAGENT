"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useDebouncedSuggestions } from "@/lib/useDebouncedSuggestions";
import { usePhantomClickGuard } from "@/lib/usePhantomClickGuard";
import { useOutsideClick } from "@/lib/useOutsideClick";

const noopFetch = async () => [] as string[];

interface TagAutosuggestInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Static suggestion list, filtered client-side as the user types. */
  suggestions?: string[];
  /** Async suggestion source (e.g. an API call), debounced as the user types. */
  fetchSuggestions?: (query: string) => Promise<string[]>;
  placeholder?: string;
  maxSuggestions?: number;
  debounceMs?: number;
}

export default function TagAutosuggestInput({
  value,
  onChange,
  suggestions,
  fetchSuggestions,
  placeholder,
  maxSuggestions = 8,
  debounceMs = 300,
}: TagAutosuggestInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const guardPhantomClick = usePhantomClickGuard();
  const safeValue = value ?? [];

  const { results: remoteResults, loading } = useDebouncedSuggestions(
    fetchSuggestions ? inputValue : "",
    fetchSuggestions ?? noopFetch,
    debounceMs,
  );

  const filtered = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];
    const selected = new Set(safeValue.map((v) => v.toLowerCase()));
    if (fetchSuggestions) {
      return remoteResults
        .filter((s) => !selected.has(s.toLowerCase()))
        .slice(0, maxSuggestions);
    }
    return (suggestions ?? [])
      .filter(
        (s) => !selected.has(s.toLowerCase()) && s.toLowerCase().includes(query),
      )
      .slice(0, maxSuggestions);
  }, [inputValue, suggestions, remoteResults, fetchSuggestions, safeValue, maxSuggestions]);

  useOutsideClick(containerRef, isOpen, () => setIsOpen(false));

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const alreadySelected = safeValue.some(
      (v) => v.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!alreadySelected) onChange([...safeValue, trimmed]);
    setInputValue("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  function removeTag(index: number) {
    onChange(safeValue.filter((_, i) => i !== index));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (filtered.length > 0) {
        setIsOpen(true);
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
        addTag(filtered[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
      return;
    }
    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }
    if (event.key === "Backspace" && inputValue === "" && safeValue.length > 0) {
      removeTag(safeValue.length - 1);
    }
  }

  const showDropdown =
    isOpen && inputValue.trim().length > 0 && (filtered.length > 0 || loading);

  return (
    <div ref={containerRef} className="relative">
      <div className="input flex flex-wrap items-center gap-2">
        {safeValue.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-1 text-xs dark:bg-white/15"
          >
            {tag}
            <button
              type="button"
              onClick={guardPhantomClick(() => removeTag(index))}
              aria-label={`Remove ${tag}`}
              className="text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="min-w-[8ch] flex-1 bg-transparent outline-none"
          placeholder={safeValue.length === 0 ? placeholder : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {showDropdown && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-black/10 bg-white text-sm shadow-md dark:border-white/10 dark:bg-neutral-900">
          {filtered.length === 0 && loading && (
            <li className="px-3 py-2 text-black/50 dark:text-white/50">
              Searching…
            </li>
          )}
          {filtered.map((suggestion, index) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={guardPhantomClick(() => addTag(suggestion))}
                className={`block w-full px-3 py-2 text-left ${
                  index === highlightedIndex
                    ? "bg-black/10 dark:bg-white/10"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
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
