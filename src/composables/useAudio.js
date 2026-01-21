// composables/useAudioSource.js
import { ref } from "vue";

const src = ref("");
const audioState = ref(true);
const userAudioState = ref(true);

export function useAudio() {
  function setSource(url) {
    src.value = url || "/audio/sinking_cities_theme.mp3";
  }

  function setUserAudioState(value) {
    userAudioState.value = value;
  }

  function haltAudio() {
    audioState.value = false;
  }

  function resumeAudio() {
    audioState.value = true;
  }

  return {
    src,
    audioState,
    userAudioState,
    setSource,
    setUserAudioState,
    haltAudio,
    resumeAudio
  };
}
