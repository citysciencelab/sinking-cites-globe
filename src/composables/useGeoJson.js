import { useMapControls } from "@/composables/useMapControls";

const BASE_URL =  process.env?.VUE_APP_DIRECTUS_URL;

// one controller per stepId so parallel slides don't collide
const controllers = new Map();

function assetUrl(id) {
  return `${BASE_URL}/assets/${id}`;
}

export async function loadGeojson(stepId, assetId) {
  const { setGeojsonPayload } = useMapControls();

  const prev = controllers.get(stepId);
  if (prev) prev.abort();

  if (!assetId) {
    setGeojsonPayload(null);
    return;
  }

  const controller = new AbortController();
  controllers.set(stepId, controller);

  try {
    const res = await fetch(assetUrl(assetId), { signal: controller.signal });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    setGeojsonPayload({
      id: `story-step-${stepId}-geojson`,
      data
    });
  }
  catch (err) {
    if (err.name !== "AbortError") {
      console.error("[GeoJSON] Fetch failed:", err);
      setGeojsonPayload(null);
    }
  }
}

// clears the GeoJSON layer for a given step and aborts any running fetch.
export function clearGeojson(stepId) {
  const { setGeojsonPayload } = useMapControls();

  const ctl = controllers.get(stepId);
  if (ctl) ctl.abort();

  controllers.delete(stepId);
  setGeojsonPayload(null);
}
