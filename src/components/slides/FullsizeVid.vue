
<script setup>
import {ref, defineProps, onBeforeUnmount, nextTick, watch} from "vue";
import { loadGeojson, clearGeojson } from "@/composables/useGeoJson";
import { useMapControls } from "@/composables/useMapControls";

const { requestMapShift } = useMapControls();

const BASE_URL = process.env?.VUE_APP_DIRECTUS_URL;

const videoRef = ref(null);

const props = defineProps({
  step: { type: Object, required: true },
  cityData: { type: Object, default: null },
  active: {type: Boolean, default: false }
});

function assetUrl(id) {
  return `${BASE_URL}/assets/${id}`;
}

watch(() => props.active, async (value) => {
  if (value) {
    loadGeojson(props.step?.id, props.step?.include_geojson);
    requestMapShift(null);

    
    await nextTick();
    const video = videoRef.value;
    if (video && props.step?.autoplay_video && props.step?.fullsize_video) {
      try {
        video.currentTime = 0;
        await video.play();
      } catch (err) {
        console.warn("Video autoplay blocked:", err);
      }
    }
  }
  else {
    clearGeojson(props.step?.id);

    const video = videoRef.value;

    if (video) {
      video.pause();
    }
  }
});

watch(() => props.step?.include_geojson, (geojson) => loadGeojson(props.step?.id, geojson)
);

onBeforeUnmount(() => {
  clearGeojson(props.step?.id);
});
</script>

<template>
  <div class="slide_template fullsize_vid">
    <div
      class="video_container"
      :class="{active: active}"  
    >
      <video
        v-if="props.step?.fullsize_video"
        ref="videoRef"
        :src="assetUrl(props.step?.fullsize_video)"
        playsinline
        :autoplay="props.step?.autoplay_video && active"
        loop
        preload="metadata"
      />
      <h2
        v-if="props.step?.display_title_in_frontend && props.step?.display_title_in_frontend.length !== 0"
        :class="{active: active}"
      >
        {{ props.step?.Story_Step_Title || "Title Is Missing!" }}
      </h2>
    </div>

    <!--<p>{{ props.step?.text || "No content yet." }}</p>-->


  </div>
</template>

<style lang="scss" scoped>
    .slide_template {
      position:relative;
      width:100%;
      height:100%;
      margin:0;

      .video_container {
        width:10%;
        height:10%;
        background:rgba(0,0,0,0.95);
        backdrop-filter:blur(3px);
        position:absolute;
        top:50%;
        left:50%;
        transform: translate(-50%,-50%);
        margin:0;
        overflow: hidden;
        opacity:0;
        transition:width 0.75s ease-in-out 0.3s, height 0.75s ease-in-out 0.3s, opacity 0.3s ease-out;

        video {
          width:100%;
          height:100%;
          object-fit: cover;
        }

        &.active {
          width:calc(100% - 50px);
          height:calc(100% - 200px);
          opacity:1;
          transition:width 0.75s ease-in-out 0.3s, height 0.75s ease-in-out 0.3s, opacity 0.5s linear 0.1s;
        }
      }


      h2 {
        color:$color1;
        text-shadow:2px 2px black;
        font-size:280%;
        font-family:$serif-base;
        text-transform: uppercase;
        text-align: center;
        margin:0;
        position:absolute;
        bottom:50px;
        right:5%;
        transform:translateY(50px);
        opacity:0;
        transition-delay:0.5s;
        transition:0.5s;

        &.active {
          transform:translateY(0px);
          opacity:1;
          transition:1s;
          transition-delay:1.25s;
        }
      }
    }
</style>
