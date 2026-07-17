import { useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

/**
 * WebKit fires a spurious extra "click" (with no preceding mousedown) on
 * whatever element ends up under the cursor after a selection causes the DOM
 * to reflow — e.g. clicking a dropdown suggestion, which unmounts the
 * dropdown and mounts something else at the same coordinates. This hook
 * tracks the real mousedown target so click handlers can reject that phantom
 * click (it has no matching mousedown on the same element).
 */
export function usePhantomClickGuard() {
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    function trackMouseDown(event: MouseEvent) {
      mouseDownTargetRef.current = event.target;
    }
    document.addEventListener("mousedown", trackMouseDown, true);
    return () => document.removeEventListener("mousedown", trackMouseDown, true);
  }, []);

  return function guardPhantomClick<E extends ReactMouseEvent>(
    handler: (event: E) => void,
  ) {
    return (event: E) => {
      if (mouseDownTargetRef.current !== event.currentTarget) return;
      mouseDownTargetRef.current = null;
      handler(event);
    };
  };
}
