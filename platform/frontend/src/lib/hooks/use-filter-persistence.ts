"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useFilterPersistence, type FilterState } from "@/lib/contexts/filter-persistence-context";

interface UseFilterPersistenceOptions {
  /** Keys to sync between URL and context. Defaults to all filter keys. */
  keys?: (keyof FilterState)[];
  /** Whether to reset URL params on unmount. Defaults to false. */
  resetOnUnmount?: boolean;
}

/**
 * Syncs filter state between URL search params and the global FilterPersistenceContext.
 *
 * On mount: hydrates context from URL params (if context is empty)
 * On context change: updates URL params
 * On URL change: updates context
 *
 * This ensures filters persist when navigating between pages.
 */
export function usePageFilterSync(options?: UseFilterPersistenceOptions) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { filters, setFilters, hydrateFromUrl, serializeToUrl } =
    useFilterPersistence();

  const keys = options?.keys;

  // On mount: hydrate from URL if context has relevant filters
  useEffect(() => {
    hydrateFromUrl(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync context → URL when filters change
  const updateUrl = useCallback(
    (newFilters: FilterState) => {
      const params = serializeToUrl();
      if (params.has("page")) {
        params.set("page", "1");
      }
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [serializeToUrl, router, pathname],
  );

  // Listen for filter changes and sync to URL
  useEffect(() => {
    const hasRelevantFilters =
      !keys ||
      keys.some((key) => {
        const val = filters[key];
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "object" && val !== null)
          return Object.keys(val).length > 0;
        return !!val;
      });

    if (hasRelevantFilters) {
      updateUrl(filters);
    }
  }, [filters, keys, updateUrl]);

  return { filters, setFilters };
}
