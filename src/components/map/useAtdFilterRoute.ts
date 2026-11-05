"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  atdPathnameSegments,
  atdSelectionFromPathname,
  atdSelectionPath,
} from "@/lib/atdRoute";
import { buildAtdSlugLookup } from "@/lib/atdSlug";
import {
  type AtdFilterIndex,
  type AtdFilterSelection,
  EMPTY_ATD_FILTER_SELECTION,
} from "@/prebuild/atdHierarchy";

function sameAtdSelection(
  left: AtdFilterSelection,
  right: AtdFilterSelection,
): boolean {
  return (
    left.gubernia === right.gubernia &&
    left.uezd === right.uezd &&
    left.volost === right.volost
  );
}

export function useAtdFilterRoute(index: AtdFilterIndex | null): {
  selection: AtdFilterSelection;
  ready: boolean;
  onChange: (selection: AtdFilterSelection) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const lookup = useMemo(
    () => (index ? buildAtdSlugLookup(index) : null),
    [index],
  );
  const routeSelection = useMemo(() => {
    if (!lookup) {
      return null;
    }
    return atdSelectionFromPathname(pathname, lookup);
  }, [lookup, pathname]);
  const routePath =
    lookup && routeSelection ? atdSelectionPath(routeSelection, lookup) : null;
  const [override, setOverride] = useState<AtdFilterSelection | null>(null);

  useEffect(() => {
    if (!routeSelection) {
      return;
    }
    setOverride((current) =>
      current && sameAtdSelection(current, routeSelection) ? null : current,
    );
  }, [routeSelection]);

  const onChange = useCallback(
    (next: AtdFilterSelection) => {
      if (!lookup || routePath == null) {
        return;
      }
      setOverride(next);
      const href = atdSelectionPath(next, lookup);
      if (href === routePath) {
        return;
      }
      router.push(href, { scroll: false });
    },
    [lookup, routePath, router],
  );

  return {
    selection: override ?? routeSelection ?? EMPTY_ATD_FILTER_SELECTION,
    ready: atdPathnameSegments(pathname).length === 0 || lookup != null,
    onChange,
  };
}
