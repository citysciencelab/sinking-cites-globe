
<script setup>
import {defineProps} from "vue";
const props = defineProps({
  step: { type: Object, required: true },
  cityData: { type: Object, default: null },
  side: { type: String, default: null },
});
</script>

<template>
  <section class="slide_template vid_txt">
    <h2>{{ props.step?.title || "Untitled Slide" }}</h2>
    <p>{{ props.step?.text || "No content yet." }}</p>

    <div v-if="side" class="side-info">
      Side: <strong>{{ side }}</strong>
    </div>
  </section>
</template>

<style scoped>
    .slide-template {
    display: grid;
    place-items: center;
    text-align: center;
    width: 100%;
    height: 100%;
    background: #222;
    color: #fff;
    padding: 2rem;
    }

    h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    }

    p {
    opacity: 0.9;
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
    }

    .side-info {
    margin-top: 1.5rem;
    font-size: 0.9rem;
    opacity: 0.7;
    }
</style>
