import { useState, useEffect } from "react";

/**
 * Reactive hook that returns `true` when the current theme is a light variant.
 * Re-renders automatically when the user changes theme via preferences.
 */
export function useIsLight(): boolean {
  const [isLight, setIsLight] = useState(
    () => document.body.classList.contains("light"),
  );

  useEffect(() => {
    const sync = () => setIsLight(document.body.classList.contains("light"));

    // Re-sync when theme engine fires its custom event
    window.addEventListener("preferences-updated", sync);

    // Also watch for direct body class mutations (safety net)
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("preferences-updated", sync);
      observer.disconnect();
    };
  }, []);

  return isLight;
}
