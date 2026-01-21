
<script setup>
import {defineProps, onBeforeUnmount, watch} from "vue";
import { loadGeojson, clearGeojson } from "@/composables/useGeoJson";
import { useMapControls } from "@/composables/useMapControls";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";

const { requestMapShift } = useMapControls();

const BASE_URL = process.env?.VUE_APP_DIRECTUS_URL;
const props = defineProps({
  step: { type: Object, required: true },
  cityData: { type: Object, default: null },
  active: {type: Boolean, default: false }
});


function assetUrl(id) {
  return `${BASE_URL}/assets/${id}`;
}


watch(() => props.active, (value) => {
  if (value) {
    loadGeojson(props.step?.id, props.step?.include_geojson);
    requestMapShift(null);
  }
  else {
    clearGeojson(props.step?.id);
  }
});

watch(() => props.step?.include_geojson, (geojson) => loadGeojson(props.step?.id, geojson)
);

onBeforeUnmount(() => {
  clearGeojson(props.step?.id);
});

</script>

<template>
  <div class="slide_template slide_gallery">
    <div
        class="slide_gallery_wrapper"
        :class="{active: active}"    
    >
        <h2
            v-if="props.step?.display_title_in_frontend && props.step?.display_title_in_frontend.length !== 0"
            class="step_title"
            :class="{active: active}"
        >
            {{ props.step?.Story_Step_Title || "Title Is Missing!" }}
        </h2>
        <Swiper
            v-if="props?.step?.Gallery.length"
            :modules="[Autoplay]"
            :slides-per-view="'auto'"
            :space-between="30"
            :loop="true"
            :autoplay="{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: false, reverseDirection: false }"
            :speed="15000"
            free-mode
            class="gallery_swiper"
        >
            <SwiperSlide
                v-for="img in props?.step.Gallery"
                :key="img.directus_files_id"
                class="gallery_slide"
            >
                <template v-if="img.directus_files_id?.id">
                    <img :src="assetUrl(img.directus_files_id.id)" />
                    <template v-if="props.step?.display_img_description?.length">
                        <div class="description">{{ img.directus_files_id.description }}</div>
                    </template>
                </template>
            </SwiperSlide>
        </Swiper>
  </div>  
</div>
</template>

<style lang="scss">
@import "@/styles/variables.scss";

.slide_template {
    position:relative;
    width:100%;
    height:100%;

    .slide_gallery_wrapper {
        width:100%;
        height:100%;

        &:after {
            content:"";
            position:absolute;
            top:50%;
            left:50%;
            transform:translate(-50%,-50%);
            width:1%;
            height:1%;
            opacity:0;
            z-index:0;
            background:rgba(0,0,0,0.65);
            backdrop-filter:blur(10px);
            transition:width 0.3s linear 0s, height 0.3s linear 0s, opacity 0.5s linear 0s;
        }

        &.active {
            &:after {
                width:100%;
                height:100%;
                opacity:1;
                transition:1s;
                transition-delay:0.5s;
                transition:width 0s linear 0s, height 0s linear 0s, opacity 2s linear 1s;
            }
        }
        
        h2.step_title {
            position:absolute;
            left:0;
            bottom:10%;
            width:100%;
            color:$color1;
            text-shadow:2px 2px $color3;
            font-size:240%;
            font-family:$serif-base;
            text-transform: uppercase;
            text-align: center;
            margin:0;
            margin-bottom:20px;
            transform:translateY(50px);
            opacity:0;
            z-index:3;
            transition-delay:0.5s;
            transition:0.5s;

            &.active {
                transform:translateY(0px);
                opacity:1;
                transition:1s;
                transition-delay:0.75s;
            }
        }


        .gallery_swiper {
            position:absolute;
            top:50%;
            left:50%;
            transform:translate(-50%,-50%);
            border-radius:10px;
            height:60vh;
            width:80vw;
            z-index:3;

            .swiper-slide {
                max-width: min(1024px, 100%);
                height:100%;
                width:auto;
            }

            .gallery_slide {

                img {
                    width:100%;
                    height:100%;
                    object-fit: cover;
                    border-radius:10px;
                }

                .description {
                    position:absolute;
                    bottom:10px;
                    right:10px;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter:blur(3px);
                    box-sizing: border-box;
                    max-width:50%;
                    padding:10px;
                    border-radius:10px;
                    color:$color1;
                    font-family:$cairo_base;
                }
            }
        }
    }
}
</style>
