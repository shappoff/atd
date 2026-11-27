"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  isAlgoliaSearchConfigured,
  searchPlaces,
} from "@/lib/algoliaPlaceSearch";
import {
  type AlgoliaPlaceSearchHit,
  atdPathToken,
} from "@/prebuild/algoliaPlaces";
import {
  type AtdFilterIndex,
  type AtdFilterSelection,
  hasAtdFilterSelection,
  pathMatchesSelection,
} from "@/prebuild/atdHierarchy";
import styles from "./PlacesSearchPanel.module.css";

type PlacesSearchPanelProps = {
  index: AtdFilterIndex | null;
  filter: AtdFilterSelection;
  onResultsChange: (results: AlgoliaPlaceSearchHit[] | null) => void;
  onSelectPlace: (place: AlgoliaPlaceSearchHit) => void;
};

function hasCoordinates(place: AlgoliaPlaceSearchHit): boolean {
  return (
    place.lat != null &&
    place.lng != null &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

function pathLabel(place: AlgoliaPlaceSearchHit): string {
  const path = place.atdPaths[0];
  if (!path) {
    return "";
  }
  return [path.gubernia, path.uezd, path.volost].filter(Boolean).join(" · ");
}

function NotOnMapIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 14s4.5-4.1 4.5-8A4.5 4.5 0 0 0 3.5 6c0 3.9 4.5 8 4.5 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="m3 13 10-10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlacesSearchPanel({
  index,
  filter,
  onResultsChange,
  onSelectPlace,
}: PlacesSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<AlgoliaPlaceSearchHit[] | null>(null);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRevision, setSearchRevision] = useState(0);
  const requestId = useRef(0);
  const latestSearchRevision = useRef(0);

  const pathTokens = useMemo(() => {
    if (!index || !hasAtdFilterSelection(filter)) {
      return [];
    }
    return index.paths
      .filter((path) => pathMatchesSelection(path, filter))
      .map(atdPathToken);
  }, [filter, index]);

  const mappedCount = results?.filter(hasCoordinates).length ?? 0;
  const unmappedCount = (results?.length ?? 0) - mappedCount;

  useEffect(() => {
    onResultsChange(results);
  }, [onResultsChange, results]);

  useEffect(() => {
    const revision = searchRevision;
    const request = ++requestId.current;
    if (!submittedQuery) {
      setResults(null);
      setTotalHits(0);
      setLoading(false);
      setError(null);
      return;
    }

    if (hasAtdFilterSelection(filter) && !index) {
      setResults([]);
      setTotalHits(0);
      setLoading(false);
      setError(null);
      return;
    }

    if (hasAtdFilterSelection(filter) && pathTokens.length === 0) {
      setResults([]);
      setTotalHits(0);
      setLoading(false);
      setError(null);
      return;
    }

    setResults([]);
    setTotalHits(0);
    setLoading(true);
    setError(null);
    void searchPlaces(submittedQuery, pathTokens)
      .then((response) => {
        if (
          request !== requestId.current ||
          revision !== latestSearchRevision.current
        ) {
          return;
        }
        setResults(response.hits);
        setTotalHits(response.totalHits);
      })
      .catch((cause: unknown) => {
        if (
          request !== requestId.current ||
          revision !== latestSearchRevision.current
        ) {
          return;
        }
        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось выполнить поиск. Попробуйте ещё раз.",
        );
        setResults([]);
      })
      .finally(() => {
        if (
          request === requestId.current &&
          revision === latestSearchRevision.current
        ) {
          setLoading(false);
        }
      });

    return () => {
      requestId.current += 1;
    };
  }, [filter, index, pathTokens, searchRevision, submittedQuery]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      setSubmittedQuery("");
      setResults(null);
      setError(null);
      return;
    }
    if (!isAlgoliaSearchConfigured()) {
      setSubmittedQuery("");
      setError("Поиск не настроен. Добавьте публичные параметры Algolia.");
      return;
    }
    setError(null);
    latestSearchRevision.current += 1;
    setSearchRevision(latestSearchRevision.current);
    setSubmittedQuery(nextQuery);
  }

  function clearSearch() {
    setQuery("");
    setSubmittedQuery("");
    setResults(null);
    setError(null);
  }

  return (
    <search className={styles.searchRegion}>
      <form className={styles.search} onSubmit={submit}>
        <input
          className={styles.input}
          type="search"
          value={query}
          placeholder="Название населённого пункта"
          aria-label="Поиск населённого пункта"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <button
            className={styles.clear}
            type="button"
            aria-label="Очистить поиск"
            onClick={clearSearch}
          >
            ×
          </button>
        ) : null}
        <button className={styles.submit} type="submit" disabled={loading}>
          {loading ? "Ищем…" : "Искать"}
        </button>
        {submittedQuery || loading || error ? (
          <div className={styles.results} aria-live="polite">
            {loading ? (
              <p className={styles.status} role="status">
                Ищем населённые пункты…
              </p>
            ) : null}
            {error ? (
              <p className={styles.status} role="alert">
                {error}
              </p>
            ) : null}
            {!loading && !error && results ? (
              <>
                <p className={styles.summary}>
                  <span>
                    {totalHits > results.length
                      ? `Показано ${results.length} из ${totalHits}`
                      : `Найдено: ${totalHits}`}
                    . На карте: {mappedCount}
                  </span>
                  <span className={styles.notMappedCount}>
                    <NotOnMapIcon />
                    Без координат: {unmappedCount}
                  </span>
                </p>
                {results.length === 0 ? (
                  <p className={styles.status}>Ничего не найдено.</p>
                ) : (
                  results.map((place) => (
                    <button
                      className={styles.result}
                      key={place.objectID}
                      type="button"
                      onClick={() => onSelectPlace(place)}
                    >
                      <span className={styles.title}>
                        {place.title}
                        {place.type ? `, ${place.type}` : ""}
                      </span>
                      {pathLabel(place) ? (
                        <span className={styles.details}>
                          {pathLabel(place)}
                        </span>
                      ) : null}
                      {!hasCoordinates(place) ? (
                        <span className={styles.notMapped}>
                          Нет на карте · откроется карточка
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </>
            ) : null}
          </div>
        ) : null}
      </form>
    </search>
  );
}
