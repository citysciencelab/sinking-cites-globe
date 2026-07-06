
<script setup>
import {ref, defineProps, onMounted, onBeforeUnmount, nextTick, watch} from "vue";
import { loadGeojson, clearGeojson } from "@/composables/useGeoJson";
import { useMapControls } from "@/composables/useMapControls";

const BASE_URL = process.env?.VUE_APP_DIRECTUS_URL;

const props = defineProps({
  step: { type: Object, required: true },
  cityData: { type: Object, default: null },
  side: { type: String, default: null },
  mediaType: {type: String, default: null},
  active: {type: Boolean, default: false }
});

const { requestMapShift } = useMapControls();

const mediaWrapper = ref(null);
const textWrapper = ref(null);

const videoRef = ref(null);

function assetUrl(id) {
  return `${BASE_URL}/assets/${id}`;
}

function updateTextHeight() {
  if (!mediaWrapper.value || !textWrapper.value) return;

  const parent = mediaWrapper.value.parentElement;
  if (!parent) return;

  const parentHeight = parent.clientHeight;
  const mediaHeight = mediaWrapper.value.offsetHeight;

  const newHeight = parentHeight - mediaHeight;

  textWrapper.value.style.height = `${newHeight}px`;
}

onMounted(() => {
  const scrollAreas = document.querySelectorAll(".allow-scroll");

  scrollAreas.forEach((el) => {
    el.addEventListener("wheel", (e) => {
      const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight;
      const canScrollUp = el.scrollTop > 0;

      if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) {
        e.stopPropagation();
      }
    });
  });
});

watch(() => props.active, async (value) => {
  if (value) {
    updateTextHeight();
    loadGeojson(props.step?.id, props.step?.include_geojson);

    await nextTick();
    const video = videoRef.value;
    if (video && props.step?.autoplay_video && props.step?.video) {
      try {
        video.currentTime = 0;
        await video.play();
      } catch (err) {
        console.warn("Video autoplay blocked:", err);
      }
    }
    setTimeout(() => {
      requestMapShift(props.side);
    }, 500);
  }
  else {
    clearGeojson(props.step?.id);
    requestMapShift(null);

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
  <section class="slide_template img_txt">
    <div class="img_text_wrapper" :class="[{ active: active }, props.side]">
      <div class="text_wrapper allow-scroll" :class="{active: active}" ref="textWrapper">
        <h2
          v-if="props.step?.display_title_in_frontend && props.step?.display_title_in_frontend.length !== 0"
          class="step_title"
          :class="{active: active}"
        >
          {{ props.step?.Story_Step_Title || "Title Is Missing!" }}
        </h2>
        <div v-if="props.step?.Text" v-html="props.step?.Text" class="img_text_box html_div" :class="{active: active}"/>
      </div>
      <div class="media_wrapper" :class="{active: active}" ref="mediaWrapper">
        <template v-if="mediaType === 'img' && props.step?.Image">
          <div class="img_wrapper">
            <img :src="assetUrl(props.step?.Image?.id)" />
            <div class="description">{{ props.step?.Image.description }}</div>
          </div>
        </template>
        <template v-if="mediaType === 'vid' && props.step?.video">
          <video :src="assetUrl(props.step?.video)" ref="videoRef" :autoplay="props.step?.autoplay_video && active" playsinline controls/>
        </template>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.slide_template {
  position:relative;
  width:100%;
  height:100%;

  .img_text_wrapper {
    display:flex;
    flex-flow:row wrap;
    justify-content: center;
    position: absolute;
    width:60%;
    max-width: min(60vw, 800px);
    max-height:calc(100% - 160px);
    top:50%;
    transform:translateY(-50%);
    // padding:100px 30px;
    box-sizing: border-box;
    background:rgba(0,0,0,0.35);
    backdrop-filter:blur(3px);
    border-radius:10px;
    overflow:hidden;
    @include dropshadow;

    @media(max-width:1366px) {
      width:50%;
    }

    @media(max-width:500px) {
      max-width:90%;
      width:90%;
      left:5% !important;
      right: auto !important;

      &:hover {
        background:transparent;
        background-image:none !important;
        backdrop-filter:none;
        border:1px solid $color_gold;
        transition:0.3s;

        .text_wrapper {
          opacity:0 !important;
        }

        .media_wrapper {
          opacity:0 !important;
        }
      }
    }
    

    .text_wrapper {
      /*position: absolute;
      bottom:15%;
      max-width: min(60vw, 800px);
      background:rgba(0,0,0,0.65);
      backdrop-filter:blur(3px);
      border-radius:10px;*/
      // padding: 1.5rem;
      flex: 1 0 100%;
      width:100%;
      padding: 30px;
      order:1;
      box-sizing: border-box;
      overflow:auto;
      z-index:3;

      h2.step_title {
        flex:1 0 100%;
        color:$color1;
        font-size:200%;
        font-family:$serif-base;
        text-transform: uppercase;
        text-align: left;
        margin:0;
        margin-bottom:20px;
        transform:translateY(50px);
        opacity:0;
        transition-delay:0.65s;
        transition:0.65s;

        &.active {
          transform:translateY(0px);
          opacity:1;
          transition:1s;
          transition-delay:0.75s;
        }
      }
    }

    .media_wrapper {
      position:relative;
      width:100%;
      flex:1 0 100%;
      height:auto;
      max-height:40vh;
      order:0;
      z-index:1;
      overflow:hidden;
      opacity:0;

      .img_wrapper {
        position:relative;
        max-height:100%;
        height:100%;

        &:hover {
          .description {
            opacity:1;
          }
        }

        .description {
          position:absolute;
          bottom:0;
          left:0;
          opacity:0;
          background:rgba(0,0,0,0.25);
          color:#ccc;
          font-size: 90%;;
          padding:5px;
        }
      }

      img {
        width:100%;
        height:100%;
        // border-radius:10px;
        object-fit: cover;
      }

      video {
        width:100%;
        height:100%;
        object-fit:cover;
      }

      &.active {
        transform:translateY(0) !important;
        opacity:1;
        transition:transform 0.3s linear 0.5s, opacity 0.5s ease-in 0.5s;
      }

      @media(max-height:1024px) {
        max-height:30vh;
      }

      @media(max-height:820px) {
        max-height:30vh;
      }

    }

    &.left {
      left:50px;
      right:auto;
      
      background-image: linear-gradient(90deg, black, rgba(0,0,0,0));
      background-repeat: no-repeat;
      background-size: 0% 100%;
      background-position: left center;
      transition: background-size 1s ease-in-out 1s;

      &.active {
        background-size: 100% 100%;
      }

      .media_wrapper {
        transform:translateY(80px);
        margin:0 auto 0 0;
      }
    }


    &.right {
      right:50px;
      left:auto;
      
      background-image: linear-gradient(270deg, black, rgba(0,0,0,0));
      background-repeat: no-repeat;
      background-size: 0% 100%;
      background-position: right center;
      transition: background-size 1s ease-in-out 1s;

      &.active {
        background-size: 100% 100%;
      }
      
      .text_wrapper {
        h2 {
          text-align:right;
        }

        p {
          text-align:right;
        }
      }

      .media_wrapper {
        transform:translateY(100px);
        margin:0 0 0 auto;
      }
    }
    
  }
}
</style>
