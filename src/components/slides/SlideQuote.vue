
<script setup>
import {ref,defineProps, onBeforeUnmount, watch} from "vue";
import { loadGeojson, clearGeojson } from "@/composables/useGeoJson";
import { useMapControls } from "@/composables/useMapControls";

const { requestMapShift } = useMapControls();

const props = defineProps({
  step: { type: Object, required: true },
  cityData: { type: Object, default: null },
  active: {type: Boolean, default: false }
});


const typedQuote = ref("");
const showCursor = ref(true);

let typingTimeoutId = null;
let cursorIntervalId = null;

const authorActive = ref(false);

function startCursorBlink() {
  if (cursorIntervalId) {
    clearInterval(cursorIntervalId);
  }
  cursorIntervalId = setInterval(() => {
    showCursor.value = !showCursor.value;
  }, 500);
}

function stopCursorBlink() {
  if (cursorIntervalId) {
    clearInterval(cursorIntervalId);
    cursorIntervalId = null;
  }
  showCursor.value = true;
}

function startTyping() {
  const fullText = props.step?.quote_text ?? "";
  const min = 15;
  const max = 50;

  if (typingTimeoutId) {
    clearTimeout(typingTimeoutId);
    typingTimeoutId = null;
  }

  typedQuote.value = "";

  // function for typing down quote text
  function typeNext(index) {
    const speed = Math.floor(Math.random() * (max - min + 1) + min); // ms per letter

    if (index > fullText.length) {    
      authorActive.value = true;
      return;
    }

    typedQuote.value = fullText.slice(0, index);

    if (index <= fullText.length) {
      typingTimeoutId = setTimeout(() => typeNext(index + 1), speed);
    }
  }

  typeNext(1);
}

function handleActiveChange(isActive) {
  if (isActive) {
    startCursorBlink();
    startTyping();
  } else {
    if (typingTimeoutId) {
      clearTimeout(typingTimeoutId);
      typingTimeoutId = null;
    }
    stopCursorBlink();
  }
}

watch(() => props.active, (value) => {
  if (value) {
    handleActiveChange(value);

    loadGeojson(props.step?.id, props.step?.include_geojson);
    requestMapShift(null);
  }
  else {
    authorActive.value = false;
    clearGeojson(props.step?.id);
  }
});

watch(() => props.step?.include_geojson, (geojson) => loadGeojson(props.step?.id, geojson)
);

onBeforeUnmount(() => {
  clearGeojson(props.step?.id);
  stopCursorBlink();
});

</script>

<template>
  <section
    class="slide_template slide_quote"
    :class="{blend_background: active}"
    >
    <div class="quote_wrapper">
      <div class="quote">{{ typedQuote }}<span class="cursor" v-if="showCursor">|</span></div>
      <div
        class="author"
        :class="{active: authorActive}"  
      >{{  props.step.author }}</div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
    .slide_quote {
      position:relative;
      width:100%;
      height:100%;

      &:after {
        content:"";
        position:absolute;
        z-index:0;
        width:1%;
        height:1%;
        top:50%;
        left:50%;
        transform: translate(-50%,-50%);
        opacity:0;
        background:rgba(0,0,0,0.65);
        backdrop-filter:blur(10px);
        transition:width 0.3s linear 0s, height 0.3s linear 0s, opacity 0.5s linear 0s;
      }

      &.blend_background {
        &:after {
          width:100%;
          height:100%;
          opacity:1;
          transition:1s;
          transition-delay:0.5s;
          transition:width 0s linear 0s, height 0s linear 0s, opacity 2s linear 1s;
        }
      }

      .quote_wrapper {
        position:absolute;
        top:50%;
        left:50%;
        transform: translate(-50%,-50%);
        z-index:1;

        .quote {
          color:$color1;
          text-align:left;
          max-width:min(680px, 80vw);
          font-size:140%;
          font-weight:700;
          font-family:$serif_base;

        }

        .author {
          margin-top:20px;
          color:$color_gold;
          font-size:150%;
          font-weight:700;
          font-family:$cairo_base;
          transform: translateY(20px);
          opacity:0;
          transition:transform 0.3s ease 0s, opacity 0.3s ease 0s;

          &.active {
            transform:translateY(0);
            opacity:1;
            transition:transform 1.5s linear 0s, opacity 2s linear 0s;
          }
        }
        
          @media(max-width:500px) {
            width:80%;
            .quote {
              max-width:100vw;
            }
          }

      }
    }
</style>
