import type { PlacesGeoJson } from "@/prebuild/placesGeoJson";

export function readPlacesGeoJson(
  url: string,
  signal: AbortSignal,
  onProgress: (value: number | null) => void,
): Promise<PlacesGeoJson> {
  return fetch(url, { signal }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to load places: ${response.status}`);
    }

    const total = Number(response.headers.get("content-length"));
    if (!response.body || !Number.isFinite(total) || total <= 0) {
      onProgress(null);
      return response.json() as Promise<PlacesGeoJson>;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      received += value.byteLength;
      onProgress(Math.min(100, Math.round((received / total) * 100)));
    }

    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return JSON.parse(new TextDecoder().decode(bytes)) as PlacesGeoJson;
  });
}
