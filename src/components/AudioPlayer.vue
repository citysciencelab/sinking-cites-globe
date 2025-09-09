

<script setup>
import { ref, watch } from "vue";
import { useAudio } from "@/composables/useAudio.js";
import VolumeHigh from "vue-material-design-icons/VolumeHigh.vue";
import VolumeOff from "vue-material-design-icons/VolumeOff.vue";
import ArrowLeft from "vue-material-design-icons/ArrowLeft.vue";

const audioRef = ref(null);
const isPlaying = ref(false);
const ciColor = "#f5ec84";
const showHint = ref(false);

let hideTimerId = null;

const { src } = useAudio();

function toggle() {
  const el = audioRef.value;
  if (!el) return;

  if (isPlaying.value) {
    el.pause();
    isPlaying.value = false;
  } else {
    el.currentTime = 0;
    el.volume = 0.7;
    
    el.play().then(() => {
      isPlaying.value = true;
    }).catch(() => {
      isPlaying.value = false;
    });
  }
}

function fadeVolume(el, target, duration) {
  return new Promise((resolve) => {
    if (!el) return resolve();

    const start = el.volume;
    const delta = target - start;
    const steps = 50; // Anzahl Intervalle
    const stepTime = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      el.volume = start + (delta * (currentStep / steps));
      if (currentStep >= steps) {
        clearInterval(interval);
        el.volume = target;
        resolve();
      }
    }, stepTime);
  });
}

watch(src, async (newSrc, oldSrc) => {
  const el = audioRef.value;
  if (!el || !newSrc || newSrc === oldSrc) return;

  if (isPlaying.value) {
    await fadeVolume(el, 0, 5000);
    el.pause();
  }

  // switch to new source
  el.src = newSrc;
  el.currentTime = 0;
  el.volume = 0; // start leise

  try {
    await el.play();
    isPlaying.value = true;
    // fade in new track
    await fadeVolume(el, 0.7, 8000);
  } catch {
    isPlaying.value = false;
  }
});

watch(isPlaying, (now) => {
  if (now === true) {
    showHint.value = true;
    if (hideTimerId) clearTimeout(hideTimerId);
    hideTimerId = setTimeout(() => {
      showHint.value = false;
      hideTimerId = null;
    }, 7000);
  } else {
    showHint.value = false;
    if (hideTimerId) {
      clearTimeout(hideTimerId);
      hideTimerId = null;
    }
  }
});
</script>

<template>
  <div id="audioplayer">
    <button
      type="button"
      @click="toggle"
      :aria-pressed="isPlaying"
      :style="{ color: ciColor }"
    >
        <VolumeHigh
            v-if="isPlaying"
            :size="24"
            :fill="ciColor"
        />
        <VolumeOff
            v-else
            :size="24"
            :fill="ciColor"
        />
    </button>
    <div class="hint" :class="{show: showHint }" :style="{ color: ciColor }">
      <ArrowLeft :size="24" :fill="ciColor" />
      <p>You can disable the sound experience here.</p>
    </div>
    <audio ref="audioRef" autoplay loop>
        <source :src="src" type="audio/mpeg" />
    </audio>
  </div>
</template>

<style lang="scss" scoped>
#audioplayer {
  display:flex;
  flex-flow:row nowrap;
  align-items:center;
  justify-content: flex-start;
  padding-left:30px;

    button {
        background:none;
        outline:none;
        border-radius:50%;
        height:40px;
        width:40px;
        border:2px solid $color1;

        &:hover {
            cursor:pointer;
        }
    }

    .hint {
      background:rgba(0,0,0,0.5);
      backdrop-filter: blur(3px);
      @include dropshadow();
      border-radius:5px;
      padding: 0px 10px;
      box-sizing: border-box;
      pointer-events: none;
      display:flex;
      align-items:center;
      flex-flow:row wrap;
      justify-content: center;
      margin-left:30px;
      transform:translateX(-30px);
      opacity:0;
      transition:0.3s;

      span {
        margin-top:5px;
      }

      p {
        margin-left:10px;
        color:$color1;
        font-family:$cairo_base;
        font-weight:700;
      }

      &.show {
        transform:translateX(0);
        opacity:1;
        transition:opacity 0.3s ease, transform 0.3s ease;
      }
    }
}
</style>
