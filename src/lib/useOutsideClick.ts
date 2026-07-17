import { useEffect } from "react";
import type { RefObject } from "react";

export function useOutsideClick(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onOutside: () => void,
) {
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        onOutside();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [containerRef, isOpen, onOutside]);
}
