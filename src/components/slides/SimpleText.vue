
<script setup>
import {defineProps, onMounted, onBeforeUnmount, watch} from "vue";
import { loadGeojson, clearGeojson } from "@/composables/useGeoJson";
import { useMapControls } from "@/composables/useMapControls";

const { requestMapShift } = useMapControls();

const props = defineProps({
  step: { type: Object, required: true },
  cityData: { type: Object, default: null },
  active: {type: Boolean, default: false },
  fullScreen: {type: String, default: "default"}
});

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
  <div class="slide_template simple_text">
    <div
      class="simple_text_wrapper"
      :class="{fullscreen: fullScreen === 'fullscreen', active: active}"  
    >
      <h2
        v-if="props.step?.display_title_in_frontend && props.step?.display_title_in_frontend.length !== 0"
        class="step_title"
        :class="{active: active}"
      >
        {{ props.step?.Story_Step_Title || "Title Is Missing!" }}
      </h2>
      <div v-if="props.step?.Text" v-html="props.step?.Text" class="simple_text_box html_div allow-scroll" :class="{active: active}"/>
  </div>  
</div>
</template>

<style lang="scss">
@import "@/styles/variables.scss";

.slide_template {
  position:relative;
  width:100%;
  height:100%;

  .simple_text_wrapper {
    position:absolute;
    top:50%;
    left:0;
    width:100%;
    height:50vh;
    display:flex;
    flex-flow:row wrap;
    justify-content:center;
    align-content: center;

    &.fullscreen {
      width:100%;
      height:100%;
      background:rgba(0,0,0,0);
      backdrop-filter: blur(3px);
      top:0;
      left:0;
      transition:0.3s;

      .simple_text_box {
        max-width:min(66%, 1280px);
        background:rgba(0,0,0,0);
        box-shadow: none;
        max-height:60vh;
      }

      &.active {
        background:rgba(0,0,0,0.65);
        transition:0.3s;
      }
    }

    @media(max-width:500px) {
      width:95%;
      left:2.5%;
    }
    
    h2.step_title {
      flex:1 0 100%;
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
      transition-delay:0.5s;
      transition:0.5s;

      @media(max-width:500px) {
        font-size:200%;
        margin-bottom:5px;
      }

      &.active {
        transform:translateY(0px);
        opacity:1;
        transition:1s;
        transition-delay:0.75s;
      }
    }

  .simple_text_box {
    font-family: $cairo-base;
    color: whitesmoke;
    line-height: 1.6;
    max-width: 800px;
    max-height:27.5vh;
    margin: 0 auto;
    padding: 1.5rem;
    background:rgba(0,0,0,0.35);
    backdrop-filter: blur(5px);
    border-radius: 10px;
    opacity:0;
    transform:translateY(30px);
    overflow:auto;
    @include dropshadow();

    p {
      strong {
        color:$color1;
      }
    }

    @media(max-width:500px) {
      p {
        font-size:100%;
      }
    }

    &.active {
      opacity:1;
      transform:translateY(0);
      transition:0.5s;
      transition-delay:0.5s;
    }
  }

    }
  }
</style>
