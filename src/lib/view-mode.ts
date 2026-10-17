import { useEffect, useState } from "react";

export type ViewMode = "desktop" | "mobile";
const KEY = "view-mode";
const EVENT = "view-mode-change";

export function useViewMode() {
  const [mode, setMode] = useState<ViewMode>("desktop");

  useEffect(() => {
    const read = () => {
      const saved = window.localStorage.getItem(KEY);
      if (saved === "desktop" || saved === "mobile") setMode(saved);
      else setMode(window.innerWidth < 768 ? "mobile" : "desktop");
    };
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);

  const update = (next: ViewMode) => {
    window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event(EVENT));
  };

  return [mode, update] as const;
}
