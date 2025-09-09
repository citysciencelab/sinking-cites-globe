<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import mapboxgl from "mapbox-gl";
import MainPopup from "./MainPopup.vue";
import SmallPopup from "./SmallPopup.vue";
import { useCities } from "@/composables/useCities";
import { useMapControls } from "@/composables/useMapControls";
import { useAudio } from "@/composables/useAudio";
import { directus } from "@/js/directus";
import { readItems } from "@directus/sdk";
import { hexToRgba } from "@/js/hexToRGBA";


// set mapbox api key
mapboxgl.accessToken = "pk.eyJ1IjoiYTNydGdtIiwiYSI6ImNtZWEydjN0NDA4dG8ybXM1NDRoeGN2cnAifQ.rlqfZJOAztuKNRuopOPmkQ";

// composables
const { cities, fetchCities } = useCities();
const { flyToRequest, viewUpdater } = useMapControls();
const { setSource } = useAudio();

// const mapEl = ref(null);
const map = ref(null);
const showPopup = ref(false);
const showSmallPopup = ref(false);
const selectedSunkenCity = ref(null);
const selectedHeritage = ref(null);
const autoRotate = ref(true);
const saveMapZoom = ref(3.5);

/* for test purposes only const currentMapZoom = computed(() => {
  if (map.value) {
    return map.value.getZoom();
  }

  return null;
});*/

let rotateHandle = null;

// data
const pointData = ref([]);
const pointData2 = ref([]);

const heritageCategoryColor = ref({
  heritage: "#F59A84",
  sci_resourc: "#84F5CE",
  other: "#A284F5"
})

/**
 * fetches cities from directus and normalize to GeoJSON
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
async function loadDirectusCities() {
  /*const cities = await directus.request(
    readItems("sinking_cities", {
      fields: ["id", "title", "coordinates", "city_color", "abstract"]
    })
  );*/

  await fetchCities();

  pointData.value = cities.value.map((r) => ({
    id: r.id,
    title: r.title,
    lng: r.coordinates.coordinates[0],
    lat: r.coordinates.coordinates[1],
    size: 2,
    color: hexToRgba(r.city_color, 0.25) || "rgba(220,120,80,0.25)",
    iconUrl: `/images/icons/${r.title.toLowerCase()}_icon.png`,
  }));

  return {
    type: "FeatureCollection",
    features: pointData.value.map((p) => ({
      type: "Feature",
      properties: {
        id: p.id,
        title: p.title,
        color: p.color,
        icon: `${p.title}-icon`,
      },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  };
}

/** fetches cultural heritages from directus and normalize to GeoJSON
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
async function loadDirectusHeritages() {
  const heritages = await directus.request(
    readItems("cultural_heritages", {
      fields: ["id", "title", "category", "coordinates"]
    })
  )

  pointData2.value = heritages.map((r) => ({
    id: r.id,
    title: r.title,
    lng: r.coordinates.coordinates[0],
    lat: r.coordinates.coordinates[1],
    category: r.category,
    size: 2,
    color: hexToRgba(heritageCategoryColor.value[r.category], 1)
  }));

  return {
    type: "FeatureCollection",
    features: pointData2.value.map((p) => ({
      type: "Feature",
      properties: {
        id: p.id,
        title: p.title,
        color: p.color,
        icon: `${p.category}_icon`,
        size: p.size
      },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] }
    }))
  };
}

/**
 * Add symbol + text layers for city icons & labels
 * @param {mapboxgl.Map} m
 * @param {GeoJSON.FeatureCollection} c
 */
async function addCityLayer(m, c) {
  if (!m.getSource("cities")) {
    m.addSource("cities", { type: "geojson", data: c });
  }

  // preload icon images for layer
  const uniqueIcons = [...new Set(pointData.value.map((p) => p.title))];
  await Promise.all(
    uniqueIcons.map(async (title) => {
      const iconId = `${title}-icon`;
      if (m.hasImage(iconId)) return;
      const url = `/images/icons/${title}_icon.png`;
      const img = await loadHtmlImage(url);
      m.addImage(iconId, img, { sdf: false });
    })
  );

  // icon layer
  if (!m.getLayer("sinking_cities")) {
    m.addLayer({
      id: "sinking_cities",
      type: "symbol",
      source: "cities",
      maxzoom:10.1,
      layout: {
        "icon-image": ["get", "icon"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 2, 0.35, 5, 0.5],
        "icon-allow-overlap": true,
        "symbol-z-order": "auto",
      },
      paint: {
        // keep icons always visible above atmosphere
      },
    });
  }

  // extra layer for labels
  if (!m.getLayer("city-labels")) {
    m.addLayer({
      id: "city-labels",
      type: "symbol",
      source: "cities",
      layout: {
        "text-field": ["get", "title"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 1, 10, 5, 16],
        "text-transform": "uppercase",
        "text-offset": [0, 1.5],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#f5ec84",
        "text-halo-color": "#000000",
        "text-halo-width": 0.6,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 1, 0, 2.2, 1],
      },
    });
  }
}

/**
 * Add symbol + text layers for city icons & labels
 * @param {mapboxgl.Map} m mapbox instance
 * @param {GeoJSON.FeatureCollection} h cultural heritage points
 */
async function addHeritageLayer (m, h) {
  if (!m.getSource("heritages")) {
    m.addSource("heritages", { type: "geojson", data: h });
  }

  // preload icon images
  const heritageIcons = [...new Set(pointData2.value.map((p) => p.category))];
  await Promise.all(
    heritageIcons.map(async (cat) => {
      const iconId = `${cat}_icon`;
      if (m.hasImage(iconId)) return;
      const url = `/images/icons/${cat}_icon.png`;
      const img = await loadHtmlImage(url);
      m.addImage(iconId, img, { sdf: false });
    })
  );

  if (!m.getLayer("cultural_heritages")) {
    m.addLayer({
      id: "cultural_heritages",
      type: "circle",
      source: "heritages",
      maxzoom:8,
      paint: {
        "circle-color": ["get", "color"],
        "circle-opacity": 1,
        "circle-radius": [
          "interpolate", ["exponential", 2], ["zoom"],
          2, 3,
          6, 10,
          8, 12
        ],
        "circle-emissive-strength": 1
      }
    })
  }

  if (!m.getLayer("cultural_heritages_icons")) {
    m.addLayer({
      id: "cultural_heritages_icons",
      type: "symbol",
      source: "heritages",
      minzoom: 8,
      layout: {
        "icon-image": ["get", "icon"],
        "icon-size": 0.2,
        "icon-allow-overlap": true,
        "symbol-z-order": "auto",
        "icon-anchor": "bottom"
      }
    })
  }
}

function addMapClicks (m) {
m.on("click", (e) => {
    const [cityF] = m.queryRenderedFeatures(e.point, { layers: ["sinking_cities"] });

    if (cityF) {
      const title = cityF.properties?.title;
      selectedSunkenCity.value = title;
      showPopup.value = true;
      showSmallPopup.value = false;  
      autoRotate.value = false;
      saveMapZoom.value = m.getZoom();

      const coords = Array.isArray(cityF.geometry?.coordinates) &&
                     typeof cityF.geometry.coordinates[0] === "number"
        ? cityF.geometry.coordinates
        : [e.lngLat.lng, e.lngLat.lat];

      m.flyTo({
        center: coords,
        zoom: 10,
        speed: 0.6,
        curve: 2,
        bearing: m.getBearing(),
        pitch: 0
      });
      return;
    }

    const [heritF] = m.queryRenderedFeatures(e.point, {
      layers: ["cultural_heritages", "cultural_heritages_icons"]
    });

    if (heritF) {
      const title = heritF.properties?.title;
      selectedHeritage.value = title;
      showSmallPopup.value = true; 
      autoRotate.value = false;
      saveMapZoom.value = m.getZoom();

      if (m.getZoom() < 8) {
        const coords = Array.isArray(heritF.geometry?.coordinates) &&
                       typeof heritF.geometry.coordinates[0] === "number"
          ? heritF.geometry.coordinates
          : [e.lngLat.lng, e.lngLat.lat];

        m.flyTo({
          center: coords,
          zoom: 8,
          speed: 0.6,
          curve: 2,
          bearing: m.getBearing(),
          pitch: 0
        });
      }
      return;
    }

    if (showPopup.value) {
      showPopup.value = false;
    }
  });
}

/**
 * Adds globe atmosphere and fog for a *planet* feel
 * @param {mapboxgl.Map} m
 */
function configureAtmosphere(m) {
  m.setFog({ 
     'range': [0.1, 5],
     'color': 'rgba(46, 32, 129, 0.5)',
     'horizon-blend': 0.025,
     'high-color': 'rgba(211, 245, 193, 0.25)',
     'space-color': 'rgba(0, 4, 22, 0.25)',
     'star-intensity': 0.1,
  });

  /* No Fog Rules m.setFog({
    color: "rgba(255,255,255,0)",   
    "high-color": "rgba(255,255,255,0)",
    "space-color": "rgba(0,0,0,0)",  
    "horizon-blend": 0.0,            
    range: [1, 1],                    
    "star-density": 1                  
  });*/

  //
  if (!m.getLayer("sky")) {
    m.addLayer({
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": [0.0, 0.0],
        "sky-atmosphere-sun-intensity": 5,
      },
    });
  }
}

// High-perf drifting clouds as Mapbox CanvasSource (no Three.js)
function addCloudsCanvasLayer(m, {
  id = "clouds",
  url = "https://raw.githubusercontent.com/turban/webgl-earth/master/images/fair_clouds_4k.png",
  beforeId,
  opacity = 0.3,
  width = 2048,
  height = 1024,
  speedU = -10,
  speedV = 1
} = {}) {
  const MAX_LAT = 85.05112878;
  const coordinates = [
    [-180,  MAX_LAT],
    [ 180,  MAX_LAT],
    [ 180, -MAX_LAT],
    [-180, -MAX_LAT]
  ];

  // Canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });

  // Texture
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;

  // Drift state
  let u = 0, v = 0;
  let lastT = performance.now();

  function drawTiled(offU, offV) {
    // draw 4 tiles for wrap-around (no seams)
    for (let dy = -1; dy <= 0; dy++) {
      for (let dx = -1; dx <= 0; dx++) {
        ctx.drawImage(img, offU + dx * width, offV + dy * height, width, height);
      }
    }
  }

  function drawFrame(dtMs) {
    const dt = dtMs / 1000;
    u = (u + speedU * dt) % width;
    v = (v + speedV * dt) % height;

    const offU = (u + width) % width;
    const offV = (v + height) % height;

    ctx.clearRect(0, 0, width, height);

    // 1) draw original texture, tiled with drift offsets
    ctx.globalCompositeOperation = "source-over";
    drawTiled(offU, offV);

    // 2) recolor visible pixels to pure white, preserve alpha
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // 3) reset for next frame
    ctx.globalCompositeOperation = "source-over";
  }

  function tick(tNow) {
    const dt = tNow - lastT;
    if (dt >= 33) { // ~30 FPS cap
      drawFrame(dt);
      m.triggerRepaint();
      lastT = tNow;
    }
    requestAnimationFrame(tick);
  }

  img.onload = () => {
    if (!m.getSource(id)) {
      m.addSource(id, { type: "canvas", canvas, coordinates });
    }

    if (!m.getLayer(id)) {
      m.addLayer({
        id,
        type: "raster",
        source: id,
        // Do NOT put "opacity" here; use paint.raster-opacity.
        // Also avoid maxzoom unless you really want to hide clouds > zX.
        paint: {
          "raster-opacity": opacity,
          "raster-fade-duration": 0,
          "raster-emissive-strength": 0.2
        }
      }, beforeId);
    }

    lastT = performance.now();
    requestAnimationFrame(tick);
  };
}


/**
 * Promise wrapper to load <img> and return ImageBitmap or HTMLImageElement
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadHtmlImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}


// AUTOROTATE HANDLING

function startAutorotate() {
  /*stopAutorotate();
  const step = () => {
    if (!autoRotate.value || !map.value) return;
    const bearing = (map.value.getBearing() + 0.015) % 360; 
    map.value.setBearing(bearing);
    rotateHandle = requestAnimationFrame(step);
  };

  autoRotate.value = true;
  rotateHandle = requestAnimationFrame(step);*/

  let secondsPerRevolution = 120
  let distancePerSecond = 360 / secondsPerRevolution;
  let maxSpinZoom = 5;
  let slowSpinZoom = 3;

  const zoom = map.value.getZoom();

  if (autoRotate.value && map.value && zoom < maxSpinZoom) {
      if (zoom > slowSpinZoom) {
          // slow spinning at higher zooms
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
      }

      const center = map.value.getCenter();
      center.lng -= distancePerSecond;
      map.value.easeTo({ center, duration: 1000, easing: (n) => n });
  }
}

function stopAutorotate() {
  if (rotateHandle) cancelAnimationFrame(rotateHandle);
  rotateHandle = null;
}

onMounted(async () => {
  // init mapbox
  map.value = new mapboxgl.Map({
    container: "map",
    //style: "mapbox://styles/mapbox/standard",
    // individual style 1: "mapbox://styles/a3rtgm/cmer5unao00wq01sda88e9x6d",
    style: "mapbox://styles/a3rtgm/cmfcf1mxx006o01s3grpa9f03",
    projection: "globe",
    center: [66, 20],
    zoom: 2.4,
    bearing: 0,
    pitch: 0,
    antialias: true,
  });

  // alter zoom 
  map.value.scrollZoom.setWheelZoomRate(1/200);

  // disable rotation
  map.value.dragRotate.disable();
  map.value.touchZoomRotate.disableRotation();

  // map interactions
  map.value.on('mousedown', () => {
      autoRotate.value = false;
  });

  map.value.on('mouseup', () => {
      autoRotate.value = true;
      startAutorotate();
  });

  map.value.on('dragend', () => {
      autoRotate.value = true;
      startAutorotate();
  });
  map.value.on('pitchend', () => {
      autoRotate.value = true;
      startAutorotate();
  });
  map.value.on('rotateend', () => {
      autoRotate.value = true;
      startAutorotate();
  });

  map.value.on('moveend', () => {
      startAutorotate();
  });

  map.value.on("wheel", () => {
    // stop autorotate while zoom
    stopAutorotate();
    autoRotate.value = false;

    setTimeout(() => {
      autoRotate.value = true;
      startAutorotate();
    }, 300)
  });

  map.value.addControl(new mapboxgl.NavigationControl());

  map.value.on("style.load", async () => {

    configureAtmosphere(map.value);
    addCloudsCanvasLayer(map.value);
    // stylize map view
    if (map.value.getLayer("satellite")) {
      map.value.setPaintProperty("satellite", "raster-saturation", -0.75);     // reducing saturation
      map.value.setPaintProperty("satellite", "raster-hue-rotate", 180);     // coloring blue
      map.value.setPaintProperty("satellite", "raster-brightness-max", 0.5);
      map.value.setPaintProperty("satellite", "raster-contrast", 0.25);
    }
  
    // load map points
    const sinkingCities = await loadDirectusCities();
    const culturalHeritages = await loadDirectusHeritages();

    // add point layers
    await addHeritageLayer(map.value, culturalHeritages);
    await addCityLayer(map.value, sinkingCities);
    await addMapClicks(map.value);

    // sky lights
    /*if (!map.value.getLayer("three-beams")) {
      map.value.addLayer(createBeamsCustomLayer());
    }*/

    // start autorotate of the globe
    startAutorotate();
  });

  // set hovers for mapbox layers
  ["sinking_cities", "cultural_heritages", "cultural_heritages_icons"].forEach((layerId) => {
      map.value.on("mouseenter", layerId, () => {
      map.value.getCanvas().style.cursor = "pointer";
    });
    
    map.value.on("mouseleave", layerId, () => {
      // reset cursor
      map.value.getCanvas().style.cursor = "";
    });
  });
});

onBeforeUnmount(() => {
  stopAutorotate();
  map.value?.remove();
});

// popup watcher
watch(showPopup, (val) => {
  if (val) {
    autoRotate.value = false;
    stopAutorotate();
  } else {
    setSource();
    autoRotate.value = true;
    map.value.flyTo({ center: map.value.getCenter(), zoom: saveMapZoom.value, speed: 0.8});
    startAutorotate();
  }
});

watch(flyToRequest, async (req) => {
  if (req && map.value) {
    showPopup.value = false;
    await nextTick();
    selectedSunkenCity.value = req.title;
    showPopup.value = true;
    autoRotate.value = false;

    saveMapZoom.value = map.value.getZoom();

    console.log(req, "here");
    map.value.flyTo({
      center: [req.lng, req.lat],
      zoom: req.zoom,
      speed: 0.6,
      curve: 2,
      bearing: map.value.getBearing(),
      pitch: 0
    });
  }
});

watch(viewUpdater, (newValue) => {
  if (newValue && map.value) {
    map.value.flyTo({
      curve: 2,
      center: [66, 20],
      zoom: 2.4,
      bearing: 0,
      pitch: 0
    })
  }
});
</script>

<template>
  <div class="comp_wrapper">
    <div  ref="globeEl" id="map" :class="['globe_container', { 'shifted': showPopup }]"></div>
  </div>
  <MainPopup v-if="showPopup" :title="selectedSunkenCity" @close="showPopup = false" />
  <SmallPopup v-if="showSmallPopup" :title="selectedHeritage" :narrow="showPopup" @close="showSmallPopup = false" />
  <!--<p id="zoomfortest">{{ currentMapZoom }}</p>-->
</template>

<style lang="scss" scoped>

    #zoomfortest {
      position:absolute;
      bottom:0;
      left:0;
      color:yellow;
    }
  .comp_wrapper {
    #map {
      display: block;
      width:100vw;
      height:100vh;
      position:fixed;
      background: radial-gradient(circle at 50% 50%, #0a1f3a 35%, #000 85%);
      top:0;
      left:0;
      transition:0.5s;

      &.shifted {
        width:70vw;
        transform:translateX(-50%);
        transition:0.8s;
        transition-delay:1s;
        overflow:hidden;
      }
    }

    .pointLabel {
      font-family:$cairo-base;
      text-transform:"uppercase";
      font-size:140%;
      color:#f5ec84 !important;
    }
  }
</style>
