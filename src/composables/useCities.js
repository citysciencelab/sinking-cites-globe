// composables/useCities.js
import { ref } from "vue";
import { directus } from "@/js/directus";
import { readItems } from "@directus/sdk";

const cities = ref([]);
const isLoading = ref(false);
const error = ref(null);

function setCities(list) {
  cities.value = Array.isArray(list) ? list : [];
}

async function fetchCities() {
  if (isLoading.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    const data = await directus.request(
      readItems("sinking_cities", {
        fields: ["id", "title", "coordinates", "city_color", "title_img", "abstract"]
      })
    );
    cities.value = data;
  } catch (err) {
    console.error("Failed to fetch cities:", err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
}

async function loadCityData(title) {
  if (!title) return null;

  try {
    const result = await directus.request(
      readItems("sinking_cities", {
        filter: { title: { _eq: title } },
        limit: 1,
        fields: [
            "*",
            { gallery_1: ["directus_files_id"] },
            { gallery_2: ["directus_files_id"] },
            { gallery_3: ["directus_files_id"] }
        ]
      })
    );
    const city = result[0];
    if (!city) return null;

    const idx = cities.value.findIndex((c) => c.title === title);
    if (idx !== -1) {
      cities.value[idx] = { ...cities.value[idx], ...city };
    } else {
      cities.value.push(city);
    }
    return city;
  } catch (err) {
    console.error("Failed to load city data:", err);
    error.value = err;
    return null;
  }
}

function getCityByTitle(title) {
  return cities.value.find((c) => c.title === title) || null;
}

/**
 * Composable API (returns handles to the shared state)
 */
export function useCities() {
  return {
    cities,
    isLoading,
    error,
    fetchCities,
    loadCityData,
    setCities,
    getCityByTitle
  };
}
