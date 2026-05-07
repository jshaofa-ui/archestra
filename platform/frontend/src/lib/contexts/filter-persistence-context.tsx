"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface FilterState {
  scope?: "personal" | "team" | "org" | "built_in";
  teamIds?: string[];
  authorIds?: string[];
  excludeAuthorIds?: string[];
  labels?: Record<string, string[]>;
  name?: string;
}

interface FilterPersistenceContextValue {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  /** Merge URL params into the persisted filter state (called on page mount) */
  hydrateFromUrl: (urlParams: URLSearchParams) => void;
  /** Serialize current filters to URL params (called on filter change) */
  serializeToUrl: (baseParams?: URLSearchParams) => URLSearchParams;
}

const FilterPersistenceContext =
  createContext<FilterPersistenceContextValue | null>(null);

const STORAGE_KEY = "archestra-filters";

function loadFromStorage(): FilterState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as FilterState;
  } catch {
    return {};
  }
}

function saveToStorage(filters: FilterState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function FilterPersistenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [filters, setFiltersState] = useState<FilterState>(loadFromStorage);

  // Persist to localStorage whenever filters change
  useEffect(() => {
    saveToStorage(filters);
  }, [filters]);

  const setFilters = useCallback((partial: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hydrateFromUrl = useCallback((urlParams: URLSearchParams) => {
    const partial: Partial<FilterState> = {};

    const scope = urlParams.get("scope");
    if (scope) partial.scope = scope as FilterState["scope"];

    const teamIds = urlParams.get("teamIds");
    if (teamIds) partial.teamIds = teamIds.split(",").filter(Boolean);

    const authorIds = urlParams.get("authorIds");
    if (authorIds) partial.authorIds = authorIds.split(",").filter(Boolean);

    const excludeAuthorIds = urlParams.get("excludeAuthorIds");
    if (excludeAuthorIds)
      partial.excludeAuthorIds = excludeAuthorIds.split(",").filter(Boolean);

    const labels = urlParams.get("labels");
    if (labels) {
      try {
        const parsed: Record<string, string[]> = {};
        for (const entry of labels.split("||")) {
          const colonIdx = entry.indexOf(":");
          if (colonIdx === -1) continue;
          const key = entry.slice(0, colonIdx).trim();
          const values = entry
            .slice(colonIdx + 1)
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          if (key && values.length > 0) parsed[key] = values;
        }
        if (Object.keys(parsed).length > 0) partial.labels = parsed;
      } catch {
        // ignore malformed labels
      }
    }

    const name = urlParams.get("name");
    if (name) partial.name = name;

    if (Object.keys(partial).length > 0) {
      setFiltersState((prev) => ({ ...prev, ...partial }));
    }
  }, []);

  const serializeToUrl = useCallback(
    (baseParams?: URLSearchParams) => {
      const params = new URLSearchParams(baseParams?.toString() ?? "");

      if (filters.scope) {
        params.set("scope", filters.scope);
      } else {
        params.delete("scope");
      }

      if (filters.teamIds && filters.teamIds.length > 0) {
        params.set("teamIds", filters.teamIds.join(","));
      } else {
        params.delete("teamIds");
      }

      if (filters.authorIds && filters.authorIds.length > 0) {
        params.set("authorIds", filters.authorIds.join(","));
      } else {
        params.delete("authorIds");
      }

      if (filters.excludeAuthorIds && filters.excludeAuthorIds.length > 0) {
        params.set("excludeAuthorIds", filters.excludeAuthorIds.join(","));
      } else {
        params.delete("excludeAuthorIds");
      }

      if (filters.labels && Object.keys(filters.labels).length > 0) {
        const serialized = Object.entries(filters.labels)
          .filter(([, values]) => values.length > 0)
          .map(([key, values]) => `${key}:${values.join(",")}`)
          .join("||");
        params.set("labels", serialized);
      } else {
        params.delete("labels");
      }

      if (filters.name) {
        params.set("name", filters.name);
      } else {
        params.delete("name");
      }

      return params;
    },
    [filters],
  );

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      clearFilters,
      hydrateFromUrl,
      serializeToUrl,
    }),
    [filters, setFilters, clearFilters, hydrateFromUrl, serializeToUrl],
  );

  return (
    <FilterPersistenceContext.Provider value={value}>
      {children}
    </FilterPersistenceContext.Provider>
  );
}

export function useFilterPersistence(): FilterPersistenceContextValue {
  const ctx = useContext(FilterPersistenceContext);
  if (!ctx) {
    throw new Error(
      "useFilterPersistence must be used within a FilterPersistenceProvider",
    );
  }
  return ctx;
}
