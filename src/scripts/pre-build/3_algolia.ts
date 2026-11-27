import { algoliasearch } from "algoliasearch";
import { toAlgoliaPlaceRecords } from "@/prebuild/algoliaPlaces";
import { readPersistedPlaces } from "@/prebuild/persist";

const INDEX_SETTINGS = {
  searchableAttributes: ["title"],
  attributesForFaceting: ["filterOnly(atdPathTokens)"],
  attributesToRetrieve: [
    "objectID",
    "row",
    "title",
    "type",
    "lat",
    "lng",
    "atdPaths",
  ],
};

export default async function updateAlgoliaIndex(): Promise<void> {
  const apiKey = process.env.ALGOLIA_ADMIN_API_KEY;
  if (!apiKey) {
    console.warn(
      "Skipping Algolia index update: ALGOLIA_ADMIN_API_KEY is not configured.",
    );
    return;
  }

  const appId =
    process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const indexName =
    process.env.ALGOLIA_INDEX_NAME ||
    process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME;
  if (!appId || !indexName) {
    throw new Error(
      "Algolia index update requires ALGOLIA_APP_ID and ALGOLIA_INDEX_NAME (or their NEXT_PUBLIC counterparts).",
    );
  }

  const places = readPersistedPlaces();
  if (!places) {
    throw new Error(
      "Cannot update Algolia: public/atdPlaces.json does not exist.",
    );
  }

  const client = algoliasearch(appId, apiKey);
  const objects = toAlgoliaPlaceRecords(places);
  if (objects.length === 0) {
    throw new Error(
      "Refusing to replace the Algolia index with an empty set of places.",
    );
  }
  const settingsTask = await client.setSettings({
    indexName,
    indexSettings: INDEX_SETTINGS,
  });
  await client.waitForTask({ indexName, taskID: settingsTask.taskID });
  await client.replaceAllObjects({
    indexName,
    objects: objects.slice(0, 1000), // TODO: test
    batchSize: 1000,
    scopes: ["settings"],
  });
  console.log(
    `Updated Algolia index '${indexName}' with ${objects.length} places.`,
  );
}
