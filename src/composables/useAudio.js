// composables/useAudioSource.js
import { ref } from "vue";

const src = ref("");

export function useAudio() {
  function setSource(url) {
    src.value = url || "/audio/sinking_cities_theme.mp3";
  }

  return {
    src,
    setSource
  };
}
