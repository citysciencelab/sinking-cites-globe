<template>
  <ProjectGlobe/>
  <UiPanel/>
</template>

<script>
import ProjectGlobe from './components/ProjectGlobe.vue';
import UiPanel from './components/UiPanel.vue';

export default {
  name: 'App',
  components: {
    ProjectGlobe,
    UiPanel
  }
}
</script>

<style lang="scss">
// variables

$color1: #fbe392;
$color2: #524dab;

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

body {
  background:#00000c;
}
</style>
