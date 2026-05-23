import { useCallback, useEffect, useState } from "react";

/**
 * Brand favourites — localStorage only (no auth, no DB) for this iteration.
 * Stores an array of brand slugs under "pt-brand-favorites" (same naming
 * convention as "pt-cart" / "pt-selected-scooter").
 *
 * Distinct from the DB-backed `useFavorites` hook (which is part-based).
 */
const STORAGE_KEY = "pt-brand-favorites";

const readFavorites = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
};

export const useBrandFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>(readFavorites);

  // Persist on every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [favorites]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(readFavorites());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites]
  );

  const toggle = useCallback((slug: string) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  return { favorites, isFavorite, toggle };
};
