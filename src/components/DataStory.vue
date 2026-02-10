<script setup>
import { onMounted, onBeforeUnmount, ref, watch, defineAsyncComponent, defineProps} from "vue";
import { useStorySteps } from "@/composables/useStorySteps";
import { useMapControls } from "@/composables/useMapControls";
import { useAudio } from "@/composables/useAudio";
import ChevronUp from "vue-material-design-icons/ChevronUp.vue";
import ChevronDown from "vue-material-design-icons/ChevronDown.vue";

const { storySteps, fetchStorySteps } = useStorySteps();
const { flyToCoordinates, toggleDimLayer } = useMapControls();
const { setSource, haltAudio, resumeAudio } = useAudio();

// swiper imports
import { Swiper, SwiperSlide } from "swiper/vue";
import { Mousewheel, Keyboard, Pagination, Scrollbar } from "swiper/modules";
import "swiper/css";

const modules = [Mousewheel, Keyboard, Pagination, Scrollbar];
const activeSwiperIndex = ref(0);

const swiper = ref(null);
function onSwiperInit(instance) {
  swiper.value = instance;

  activeSwiperIndex.value = instance.activeIndex ?? 0;
  toggleDimLayer(true)
}

const props = defineProps({
    cityData: Object
});

// hooks
onMounted(async () => {
    if (props.cityData) {
        await fetchStorySteps(props.cityData.id);
        console.log("THIS AFTER FETCH", storySteps.value);
    }
});

onBeforeUnmount(() => {
  toggleDimLayer(false)
});

// async components

const SlideFullsizeVid = defineAsyncComponent(() => import(/* webpackChunkName: "slide-fullsize-vid" */ "@/components/slides/FullsizeVid.vue"));
const SlideSimpleText = defineAsyncComponent(() => import(/* webpackChunkName: "slide-simple-text" */ "@/components/slides/SimpleText.vue"));
const SlideImgText = defineAsyncComponent(() => import(/* webpackChunkName: "slide-img-text" */ "@/components/slides/ImgText.vue"));
// const SlideVideoText  = defineAsyncComponent(() => import(/* webpackChunkName: "slide-video-text" */ "@/components/slides/VidText.vue"));
const SlideNumbers = defineAsyncComponent(() => import(/* webpackChunkName: "slide-highlighted-numbers" */ "@/components/slides/HighlightedNumbers.vue"));
const SlideQuote = defineAsyncComponent(() => import(/* webpackChunkName: "slide-quote" */ "@/components/slides/SlideQuote.vue"));
const SlideGallery = defineAsyncComponent(() => import(/* webpackChunkName: "slide-quote" */ "@/components/slides/SlideGallery.vue"));

// register slide components by slide.Layout
const registry = {
  "fullsize_vid": SlideFullsizeVid,
  "simple_text": SlideSimpleText,
  "fullscreen_text": SlideSimpleText,
  "img_txt_left": SlideImgText,
  "img_text_right": SlideImgText,
  "video_text_left": SlideImgText,
  "video_text_right": SlideImgText,
  "highlighted_numbers": SlideNumbers,
  "quote": SlideQuote,
  "gallery": SlideGallery
};

// FUNCTIONS 
function resolveSlideComponent(step) {
  const key = getLayout(step);

  return registry[key] ?? SlideSimpleText;
}

// normalize possible Layout formats
function getLayout(step) {
  const raw = step?.layout ?? step?.Layout ?? "";
  return String(raw).trim().toLowerCase();
}

// check for left/ right variants
function resolveSide(step) {
  const l = getLayout(step);
  if (l.endsWith("_left")) return "left";
  if (l.endsWith("_right")) return "right";
  return undefined;
}

// check for different media types (vid/ img)
function resolveMediaType(step) {
  const l = getLayout(step);

  if (!l) return undefined;

  if (l.startsWith("img_")) return "img";
  if (l.startsWith("video_")) return "vid";

  return undefined;
}

// check for fullscreen mode?
function resolveFullScreen(step) {
  const l = getLayout(step);

  if (l.startsWith("fullscreen_")) return "fullscreen";
  
  return "default";
}

function goNextSlide() {
  if (!swiper.value) {
    console.warn("Swiper not ready yet");
    return;
  }
  swiper.value.slideNext();
}

function goPrevSlide() {
  if (!swiper.value)  {
    console.warn("Swiper not ready yet");
    return;
  }

  swiper.value.slidePrev();
}

// functions: logic on slide updates

function onSlideChange(swiper) {
  const active = swiper?.activeIndex ?? 0;
  activeSwiperIndex.value = swiper?.activeIndex ?? 0;

  // no offset -1 since first slide is added manually
  const stepIndex = active -1;

  const step = storySteps.value[stepIndex];

  if (!step) {
    resumeAudio();
    return;
  }

  if (stepIndex === 0 || step.Layout === "highlighted_numbers" || step.Layout === "quote") {
    toggleDimLayer(true)
  }
  else {
    toggleDimLayer(false)
  }

  // toggle Audio
  if (step.play_audio_file) {
    setSource("https://admin.sinkingcities.online/assets/" + step.play_audio_file);
  }

  // Include_Coordinate?
  const includeCoord = notNull(step?.Include_Coordinate);

  if (includeCoord) {
    const mapInstead = step?.map_instead_coordinates ?? null;

    const includePin = notNull(step?.include_pin);
    const includePlaceName = notNull(step?.include_place_name);

    let x,y;

    if (!notNull(mapInstead)) {
      x = step?.coordinate_x;
      y = step?.coordinate_y;
    } else {
        // use map_coordinates.coordinates[i]
        const coordsArray = step?.map_coordinates?.coordinates;

        x = coordsArray[0];
        y = coordsArray[1];
    }

    const payload = {
        coords: [x,y],
        zoom: step?.map_zoom || 10,
        ...(includePin ? { pin: true } : {}),
        ...(includePlaceName ? { place_name: step?.place_name } : {}),
    }

    console.log(payload, props.cityData);
    flyToCoordinates(payload);
  }
  else {
    const payload = {
        coords: props.cityData.coordinates.coordinates,
        zoom: 10
    }

    flyToCoordinates(payload);
  }

  const hasAutoplayVideo = notNull(step?.autoplay_video);

  if (hasAutoplayVideo) {
    haltAudio();
  } else {
    resumeAudio();
  }
}

// helpers
function notNull(value) {
  return value !== null && value !== undefined && value !== "";
}

// watchers
watch(() => props.cityData?.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchStorySteps(newId);
    }
  },
  { immediate: false }
);
    
/*function assetUrl(id) {
    return `${baseUrl}/assets/${id}?format=webp&quality=85`;
}*/
</script>

<template>
    <div id="main_story">
        <Swiper
            ref="swiperRef"
            :modules="modules"
            direction="vertical"
            :slides-per-view="1"
            :mousewheel="{ forceToAxis: true, releaseOnEdges: true, sensitivity: 1 }"
            :keyboard="{ enabled: true, onlyInViewport: true }"
            :pagination="{ clickable: true }"
            :scrollbar="{ draggable: true }"
            :speed="600"
            :simulate-touch="true"
            :touch-ratio="1"
            :threshold="5"
            @swiper="onSwiperInit"
            @slideChange="onSlideChange"
            class="main_story_swiper"
        >
            <SwiperSlide 
                class="intro_slide ms_slide"
            >
              <div class="city_title_slide">
                <span>
                  <h1>{{ cityData.title }}</h1>
                  <h3>{{ cityData.sub_title }}</h3>
                </span>
              </div>
              <div class="city_abstract_slide">
                <div class="flex_wrapper">
                  <p>{{ cityData.abstract }}</p>
                  
                  <button
                    @click="goNextSlide"
                    class="start_story"  
                  >
                    Start {{ cityData.title }}'s Story
                    <img src="images/gifs/scrolldown.gif" />
                  </button>
                </div>
              </div>
            </SwiperSlide>
            <template 
                v-if="storySteps"
            >
              <SwiperSlide
                  v-for="(step, i) in storySteps"
                  :key="step.id ?? i"
                  class="story_slide ms_slide"
              >
                  <component
                      :is="resolveSlideComponent(step)"
                      :step="step"
                      :city-data="cityData"
                      :active="activeSwiperIndex === i + 1"
                      :side="resolveSide(step)"
                      :media-type="resolveMediaType(step)"
                      :full-screen="resolveFullScreen(step)"
                  />
              </SwiperSlide>
            </template>
      
        </Swiper>
        <div class="swiper_nav">
          <span class="nav_counter">
            {{ activeSwiperIndex + 1 }} / {{ swiper?.slides?.length }}
          </span>

          <button
            class="nav_btn prev"
            @click="goPrevSlide"
            :class="{disabled: activeSwiperIndex === 0}"
          >
            <ChevronUp :size="24" fill="#0c1b3b" />
          </button>

          <button
            class="nav_btn next"
            @click="goNextSlide"
            :class="{ disabled: (swiper?.slides?.length ?? 0) <= 1 }"
          >
            <ChevronDown :size="24" fill="#0c1b3b" />
          </button>
        </div>
    </div>
</template>


<style lang="scss" scoped>
    #main_story {
        width:100%;
        height:100%;
        padding:0;
        margin:0;
        overflow:hidden;

        .main_story_swiper {
            width:100%;
            height:100%;
            padding:0;
            margin:0;
            z-index:5;
            
            .ms_slide {
                width:100% !important;
                height:100% !important;
            }

            .intro_slide {
              &.swiper-slide-active {
                
                .city_title_slide {
                  opacity:1;
                  transform:translateY(0px);
                  transition:opacity 0.5s ease-in 0.5s, transform 0.75s linear 0.3s;
                }

                .city_abstract_slide {
                  transform:translateY(0);
                  opacity:1;
                  transition:opacity 0.5s ease-in 0.5s, transform 0.75s linear 0.3s;
                }

              }

              .city_title_slide {
                display:flex;
                flex-flow:row wrap;
                width:100%;
                height:50vh;
                justify-content: center;
                align-items: center;
                opacity:0;
                transform:translateY(80px);
                transition:0.3s;

                h1 {
                  color:$color1;
                  text-shadow:2px 2px black;
                  width:100%;
                  font-size:380%;
                  font-family:$serif-base;
                  text-transform: uppercase;
                  text-align: center;
                  margin:0;
                  margin-top:30px;
                }

                h3 {
                  color:$color3;
                  text-shadow:2px 2px $color_gold;
                  font-family:$cairo-base;
                  text-align: center;
                  text-transform:uppercase;

                  margin:0;
                  font-size:220%;
                }
                
                @media(max-width:1023px) {
                  h3 {
                    font-size:180%;
                  }
                }

                @media(max-width:500px) {
                  h1 {
                    font-size:280%;
                  }

                  h3 {
                    font-size:165%;
                  }
                }
              }

              .city_abstract_slide {
                display:flex;
                flex-flow:row wrap;
                width:100%;
                height:50vh;
                justify-content: center;
                align-items: center;
                transform:translateY(-80px);
                opacity:0;

                @media(max-width:500px) {
                  height:55vh;
                }

                .flex_wrapper {
                  display:flex;
                  flex-flow:row wrap;
                  width:100%;
                  justify-content: center;
                  align-items: stretch;

                  p {
                    color:$color1;
                    width:100%;
                    font-size:140%;
                    font-family:$cairo-base;
                    max-width: min(60vw, 800px);
                    text-align: left;
                    background:rgba(0,0,0,0.5);
                    padding:30px 50px;
                    border-top-left-radius:10px;
                    border-bottom-left-radius:10px;
                    backdrop-filter: blur(3px);
                    box-sizing: border-box;
                    margin:0;
                    margin-top:-30px;

                    @media(max-width:1366px) {
                      font-size:110%;
                    }

                    @media(max-width:1180px) {
                      font-size:100%;
                    }

                    @media(max-width:500px) {
                      border-radius:0px;
                      border-top-left-radius:10px;
                      border-top-right-radius:10px;
                      padding:10px 30px;
                      max-width:90%;
                    }

                    @media(max-width:360px) {
                      padding:10px 20px;
                      max-width:95%;
                    }

                  }

                  button.start_story {
                    outline:none;
                    border:none;
                    background:rgba($color_gold,0.95);
                    backdrop-filter: blur(3px);
                    color:$color3;
                    font-family:$cairo-base;
                    font-size:140%;
                    text-transform: uppercase;
                    padding:10px 20px;
                    border-top-right-radius:10px;
                    border-bottom-right-radius:10px;
                    margin-top:-30px;

                    img {
                      display:block;
                      width:40px;
                      height:40px;
                      margin:5px auto;
                      opacity:0.7;
                    }

                    @media(max-width:1372px) {
                      font-size:120%;
                    }
                    
                    @media(max-width:1024px) {
                      font-size:110%;
                    }
                    
                    @media(max-width:500px) {
                      display:flex;
                      flex-flow:row wrap;
                      justify-content:center;
                      border-radius:0;
                      border-bottom-right-radius:10px;
                      border-bottom-left-radius:10px;
                      width:90%;
                      margin-top:0px;

                      img {
                        width:30px;
                        height:30px;
                        margin:0px 10px;
                      }
                    }

                    
                    @media(max-width:360px) {
                      width:95%;
                    }
                  }
                }
              }

            }
        }

        .swiper_nav {
          display:flex;
          flex-flow:row wrap;
          justify-content: flex-end;
          align-items:center;
          align-content: center;
          position:absolute;
          bottom:10px;
          right:10px;
          z-index:10;

          .nav_counter {
            margin-right:10px;
            color:$color1;
            font-size:140%;
            font-family: $cairo_base;
          }

          button {
            background:rgba($color_gold,0.8);
            flex:0 0 40px;
            height:40px;
            border-radius:5px;
            margin:0px 3px;
            outline:none;
            border:1px solid $color_gold;

            &:hover {
              border:2px solid $color1;
              cursor:pointer;
            }

            &.disabled {
              opacity:0.1;
              pointer-events:none;
            }
          }

          @media(max-width:500px) {
            top:80px;
            bottom:auto;
          }
        }
    }
</style>