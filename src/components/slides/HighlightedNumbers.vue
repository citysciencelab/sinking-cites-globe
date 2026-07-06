
<script setup>
import {ref, defineProps, onBeforeUnmount, watch, nextTick} from "vue";
import { loadGeojson, clearGeojson } from "@/composables/useGeoJson";
import { useMapControls } from "@/composables/useMapControls";

const props = defineProps({
  step: { type: Object, required: true },
  cityData: { type: Object, default: null },
  active: {type: Boolean, default: false }
});

const { requestMapShift } = useMapControls();

// number counters/ helpers
const numberRef = ref(null);
const numberSpans = ref([]);

function wrapNumbers() {
  const el = numberRef.value;
  if (!el) return;

  let html = props.step.numbers_highlighted ?? "";

  // replace all numbers with span wrapper
  html = html.replace(/(\d+)/g, (match) => {
    return `<span class="animated_number" data-target="${match}">0</span>`;
  });

  el.innerHTML = html;
  numberSpans.value = [...el.querySelectorAll(".animated_number")];
}

function animateNumber(span) {
  const target = Number(span.dataset.target);
  const duration = 1200; // ms
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(progress * target);

    span.textContent = value;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      span.textContent = target;
    }
  }

  requestAnimationFrame(tick);
}

watch(() => props.active, async (value) => {
  if (value) {
    loadGeojson(props.step?.id, props.step?.include_geojson);

    // count numbers up:
    await nextTick();
    wrapNumbers();

    numberSpans.value.forEach((span) => animateNumber(span));
  }
  else {
    clearGeojson(props.step?.id);
    requestMapShift(null);
  }
});

watch(() => props.step?.include_geojson, (geojson) => loadGeojson(props.step?.id, geojson)
);

onBeforeUnmount(() => {
  clearGeojson(props.step?.id);
});
</script>

<template>
  <section class="slide_template highlighted_numbers">
    <div class="numbers_wrapper">
      <div class="numbers_box" v-html="step.numbers_highlighted" ref="numberRef"></div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

    .highlighted_numbers {
      position:relative;
      width:100%;
      height:100%;

      .numbers_wrapper {
        position:absolute;
        //bottom:100px;
        left:50%;
        top:50%;
        max-height: 80vh;
        transform: translate(-50%, -50%);
        background:rgba(black, 0.35);
        backdrop-filter:blur(5px);
        border-radius:10px;
        @include dropshadow();

        @media(max-width:1180px) {
          width:66%;
        }
        @media(max-width:1024px) {
          width:75%;
        }

        @media(max-width:500px) {
          width:90%;
        }

        .numbers_box {
          width:100%;
          height:auto;
          padding:30px;
          box-sizing: border-box;

          :deep(p) {
            font-size:160%;
            color:whitesmoke;
            font-family:$cairo_base;

            @media(max-width:500px) {
              font-size:120%;
            }

            strong {
              color:$color1;
              margin:0px 10px;
              font-size:120%;
              font-family:$serif_base;
              background:rgba($color_gold, 0.5);
              padding:10px;
              box-sizing: border-box;
              border-radius:10px;
              border-right:2px solid $color_gold;
              border-left:2px solid $color_gold;
            }

            span.animated_number {
              font-weight:1000;
              font-size:280%;

              @media(max-width:500px) {
                font-size:290%;
              }

              @media(max-width:360px) {
                font-size:190%;
              }
            }
          }

          @media(max-width:1370px) {
              font-size: 100%;
              line-height: 300%;
          }

          @media(max-width:1023px) {
              font-size: 80%;
              line-height: 300%;
          }
        }
      }
    }
</style>
