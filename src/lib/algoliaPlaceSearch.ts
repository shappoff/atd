"use client";

import { liteClient } from "algoliasearch/lite";
import type { AlgoliaPlaceSearchHit } from "@/prebuild/algoliaPlaces";

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME;

const client = appId && apiKey ? liteClient(appId, apiKey) : null;

export function isAlgoliaSearchConfigured(): boolean {
  return client != null && Boolean(indexName);
}

export async function searchPlaces(
  query: string,
  pathTokens: string[],
): Promise<{ hits: AlgoliaPlaceSearchHit[]; totalHits: number }> {
  if (!client || !indexName) {
    throw new Error("Поиск не настроен: отсутствуют параметры Algolia.");
  }

  const { results } = await client.searchForHits<AlgoliaPlaceSearchHit>({
    requests: [
      {
        indexName,
        query,
        hitsPerPage: 100,
        queryLanguages: ["ru"],
        ...(pathTokens.length > 0
          ? {
              facetFilters: [
                pathTokens.map((token) => `atdPathTokens:${token}`),
              ],
            }
          : {}),
      },
    ],
  });
  const response = results[0];
  if (!response) {
    throw new Error("Algolia не вернула результат поиска.");
  }

  return {
    hits: response.hits,
    totalHits: response.nbHits ?? 0,
  };
}
