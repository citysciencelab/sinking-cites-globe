// composables/useStorySteps.js
import { ref } from "vue";
import { directus } from "@/js/directus";
import { readItems } from "@directus/sdk";

const storySteps = ref([]);
const currentCityId = ref(null);
const isLoading = ref(false);
const error = ref(null);

/**
 * Sets the cached story steps list.
 * @param {Array} list
 */
function setStorySteps(list) {
  storySteps.value = Array.isArray(list) ? list : [];
}

/**
 * fetches story steps for a given city
 * only if id changes or storySteps is empty
 * @param {number|string} cityId
 * @param {boolean} [force=false]
 * @returns {Promise<Array>}
 */
async function fetchStorySteps(cityId, force = false) {
  if (!cityId) return [];

  // Prevent redundant loading if we already have the right data
  if (!force && currentCityId.value === cityId && storySteps.value.length > 0) {
    return storySteps.value;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const data = await directus.request(
      readItems("story_step", {
        filter: { City: { _eq: cityId } }, 
        fields: ["*", 
        {
          Image: [
            "id",
            "description",
          ]
        },  
        { Gallery: [
          "id",
          {
            directus_files_id: ["id", "title", "description"]
          }
        ]}],
        sort: ["sort_steps", "id"],
        limit: -1,
      })
    );

    storySteps.value = Array.isArray(data) ? data : [];
    currentCityId.value = cityId;

    console.log("HERE THE OG STEPS COME!", storySteps.value)
    return storySteps.value;
  } catch (err) {
    console.error("Failed to fetch story steps:", err);
    error.value = err;
    storySteps.value = [];
    return [];
  } finally {
    isLoading.value = false;
  }
}

/**
 * Force-reload story steps for the current city.
 * @returns {Promise<Array>}
 */
async function reloadStorySteps() {
  if (!currentCityId.value) return storySteps.value;
  return fetchStorySteps(currentCityId.value, true);
}

/**
 * Clears the current cache (forces reload next time).
 */
function clearStorySteps() {
  storySteps.value = [];
}

/**
 * Composable API (returns shared reactive handles)
 */
export function useStorySteps() {
  return {
    storySteps,
    currentCityId,
    isLoading,
    error,
    fetchStorySteps,
    reloadStorySteps,
    clearStorySteps,
    setStorySteps,
  };
}
