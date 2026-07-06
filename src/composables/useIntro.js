// composables/useCities.js
import { ref } from "vue";
import { directus } from "@/js/directus";
import { readItems } from "@directus/sdk";

const introText = ref(null);
const isLoading = ref(false);
const error = ref(null);

function setIntroText(obj) {
  introText.value = obj;
}

async function fetchIntro() {
  if (isLoading.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    const data = await directus.request(
      readItems("intro_text")
    );
    
    introText.value = data;
  } catch (err) {
    console.error("Failed to fetch cities:", err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
}

/**
 * Composable API (returns handles to the shared state)
 */
export function useIntro() {
  return {
    introText,
    fetchIntro,
    setIntroText
  };
}
