import { useEffect, useRef, useState } from "react";

/** État synchronisé avec le stockage du navigateur (lu après le premier rendu). */
export function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const base = initialRef.current;
        setValue(
          base && typeof base === "object" && !Array.isArray(base) ? { ...base, ...parsed } : parsed,
        );
      }
    } catch {
      /* stockage illisible : on garde la valeur initiale */
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota dépassé */
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}
