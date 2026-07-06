<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import mapboxgl from "mapbox-gl";
import MainPopup from "./MainPopup.vue";
import SmallPopup from "./SmallPopup.vue";
import { usePopupState } from "@/composables/usePopup";
import { useCities } from "@/composables/useCities";
import { useMapControls } from "@/composables/useMapControls";
import { useAudio } from "@/composables/useAudio";
import { addGeoJsonLayer, removeGeoJsonLayer } from "@/js/geojsonLayer";
import { directus } from "@/js/directus";
import { readItems } from "@directus/sdk";
import { hexToRgba } from "@/js/hexToRGBA";
import { clearGeojson } from "@/composables/useGeoJson";


// set mapbox api key
mapboxgl.accessToken = "pk.eyJ1IjoiYTNydGdtIiwiYSI6ImNtZWEydjN0NDA4dG8ybXM1NDRoeGN2cnAifQ.rlqfZJOAztuKNRuopOPmkQ";

// composables
const { popupActive, togglePopupState } = usePopupState();
const { cities, fetchCities } = useCities();
const { flyToRequest, flyToCityRequest, viewUpdater, addDimLayer, geojsonPayload, geojsonHeritagePayload, shiftMapRequest } = useMapControls();
const { setSource } = useAudio();

// const mapEl = ref(null);
const map = ref(null);
const showPopup = ref(false);
const showSmallPopup = ref(false);
const selectedSunkenCity = ref(null);
const selectedHeritage = ref(null);
const autoRotate = ref(true);
const saveMapZoom = ref(3.5);

// helperLayer information:
const FLYTO_SRC_ID   = "flyto-poi-src";
const FLYTO_PIN_ID   = "flyto-poi-pin";
const FLYTO_NAME_ID  = "flyto-poi-name";

//dimLayer
const DIM_LAYER_ID = "basemap-dim";
const DIM_SRC_ID = "basemap-dim-src";

// timer for map resize debounce
let resizeTimer = null;
// searchfield debouncer
let t = null;

let rotateHandle = null;

// data
const pointData = ref([]);
const pointData2 = ref([]);

/* const heritageCategoryColor = ref({
  heritage: "#F59A84",
  sci_resourc: "#84F5CE",
  other: "#A284F5"
})*/

const heritagesGeojson = ref(null);
const heritageSearch = ref("");
const heritagesSearchLength = ref(0);

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

/** getLngLat from comma seperated strings of coords
 * 'lng,lat'
*/
function getLngLat(record) {
  if (
    record.coordinates &&
    Array.isArray(record.coordinates.coordinates) &&
    record.coordinates.coordinates.length === 2
  ) {
    const [lng, lat] = record.coordinates.coordinates;
    return { lng, lat };
  }

  if (typeof record.coordinates_alternative === "string") {
    const parts = record.coordinates_alternative
      .split(",")
      .map(v => Number(v.trim()));

    if (parts.length === 2 && parts.every(n => Number.isFinite(n))) {
      const [lng, lat] = parts;
      return { lng, lat };
    }
  }

  return null;
}

/** fetches cultural heritages from directus and normalize to GeoJSON
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
async function loadDirectusHeritages() {
  const heritages = await directus.request(
    readItems("cultural_heritages", {
      fields: ["id", "title", "category", "tags", "year", "Source", "coordinates", "coordinates_alternative"]
    })
  )

  pointData2.value = heritages.map((r) => {
    const coords = r?.coordinates?.coordinates
      ? {
          lng: r.coordinates.coordinates[0],
          lat: r.coordinates.coordinates[1]
        }
      : getLngLat({ coordinates_alternative: r.coordinates_alternative });

    if (!coords) return null;
    return {
      id: r.id,
      title: r.title,
      lng: coords.lng,
      lat: coords.lat,
      category: r.category,
      tags: r.tags ?? "",
      year: r.year ?? "", 
      source: r.Source ?? "",
      size: 2,
      // color: hexToRgba(heritageCategoryColor.value[r.category], 1)
      color: hexToRgba("#ff5100", 1)
    };
  }).filter(Boolean);

  const fc = {
    type: "FeatureCollection",
    features: pointData2.value.map((p) => ({
      type: "Feature",
      id: p.id,
      properties: {
        id: p.id,
        title: p.title,
        color: p.color,
        icon: "new_icon",
        current_icon: "new_icon",
        category: p.category,
        tags: p.tags ?? "",
        year: p.year ?? "", 
        source: p.source ?? "",
        // icon: `${p.category?.toLowerCase()}_icon` || "other_icon",
        // current_icon:`${p.category?.toLowerCase()}_icon` || "other_icon",
        match_icon: "match_icon",
        size: p.size
      },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] }
    }))
  };

  heritagesGeojson.value = fc;
  return fc;
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
      const url = `/images/icons/${title.toLowerCase()}_icon.png`;
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
      maxzoom:9.9,
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
      maxzoom:9.9,
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

  m.addImage("match_icon", await loadHtmlImage("/images/icons/match_icon.png"), { sdf: false });

  // preload icon images
  const heritageIcons = [...new Set(pointData2.value.map((p) => p.category))];
  await Promise.all(
    heritageIcons.map(async (cat) => {
      if (cat) {
        // const iconId = `${cat.toLowerCase()}_icon`;
        const iconId = "new_icon";

        if (m.hasImage(iconId)) return;
        //const url = `/images/icons/${cat.toLowerCase()}_icon.png`;
        const url = `/images/icons/new_icon.png`;
        const img = await loadHtmlImage(url);
        m.addImage(iconId, img, { sdf: false });
      }
    })
  );

  if (!m.getLayer("cultural_heritages")) {
    m.addLayer({
      id: "cultural_heritages",
      type: "circle",
      source: "heritages",
      maxzoom:8,
      paint: {
        "circle-color": [
            "case",
            ["boolean", ["feature-state", "match"], false],
            "#50c3ff",          // match color
            ["get", "color"]    // default
        ],
        "circle-stroke-color": [
          "case",
          ["boolean", ["feature-state", "match"], false],
          "#ffffff",
          "rgba(0,0,0,0)"
        ],
         "circle-stroke-width": [
          "case",
          ["boolean", ["feature-state", "match"], false],
          3,
          0
        ],
        "circle-opacity": 1,
        "circle-radius": [
          "interpolate", ["exponential", 2], ["zoom"],
          2, 7,
          6, 13,
          8, 15
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
        "icon-image": ["get", "current_icon"],
        "icon-size": 0.2,
        "icon-allow-overlap": true,
        "symbol-z-order": "auto",
        "icon-anchor": "bottom"
      }
    })
  }
}

/** clicks on globe for sinkingcities und heritages */
function addMapClicks (m) {
  m.on("click", (e) => {
    // features from sinkingcities layer
    const [cityF] = m.queryRenderedFeatures(e.point, { layers: ["sinking_cities"] });

    if (cityF) {
      const title = cityF.properties?.title;
      selectedSunkenCity.value = title;
      showPopup.value = true;
      togglePopupState(true);
      showSmallPopup.value = false;  
      autoRotate.value = false;
      saveMapZoom.value = m.getZoom();

      // get coords of city
      const coords = Array.isArray(cityF.geometry?.coordinates) &&
                     typeof cityF.geometry.coordinates[0] === "number"
        ? cityF.geometry.coordinates
        : [e.lngLat.lng, e.lngLat.lat];

      // fly to city
      m.flyTo({
        center: coords,
        zoom: 9.9,
        speed: 0.6,
        curve: 2,
        bearing: m.getBearing(),
        pitch: 0
      });
      return;
    }

    // features from cultural_heritages_layer
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

        // fly to heritage
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
      togglePopupState(false);
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

// drifting clouds as mapbox CanvasSource
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

  // canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });

  // texture
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;

  // drift state
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

    // draw original texture, tiled with drift offsets
    ctx.globalCompositeOperation = "source-over";
    drawTiled(offU, offV);

    // recolor visible pixels to pure white, preserve alpha
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // reset for next frame
    ctx.globalCompositeOperation = "source-over";
  }

  function tick(tNow) {
    const dt = tNow - lastT;
    if (dt >= 33) { // 33 FPS cap
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
        // Do NOT put "opacity" here; use paint.raster-opacity
        // Also avoid maxzoom unless you really want to hide clouds
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
 * promise wrapper to load <img> and return imagebitmap or HTMLImageElement
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

// stop globe autorotating i.e city or heritage click
function stopAutorotate() {
  if (rotateHandle) cancelAnimationFrame(rotateHandle);
  rotateHandle = null;
}

// HELPER LAYERS (FOR PINS AND NAMES)
function removeHelperLayer() {
  if (map.value.getLayer(FLYTO_NAME_ID)) map.value.removeLayer(FLYTO_NAME_ID);
  if (map.value.getLayer(FLYTO_PIN_ID))  map.value.removeLayer(FLYTO_PIN_ID);
  if (map.value.getSource(FLYTO_SRC_ID)) map.value.removeSource(FLYTO_SRC_ID);
}

function addHelperLayer(req) {
  removeHelperLayer();

  // create mapbox feature
  const feature = {
    type: "Feature",
    properties: { name: req.place_name ?? "" },
    geometry: { type: "Point", coordinates: [req.lng, req.lat] }
  };

  // add layer sauce
  map.value.addSource(FLYTO_SRC_ID, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [feature] }
  });

  if (req.pin) {
    const canUseSprite = !!map.value.getStyle()?.sprite;

    const ICON_ID = "helper-marker";
    const ICON_PATH = "/images/icons/new_icon.png";
    
    // add marker if it does not exist yet
    if (!map.value.hasImage(ICON_ID)) {
      map.value.loadImage(ICON_PATH, (error, image) => {
        if (error) {
          console.error("Error loading marker image:", error);
        }

        if (!map.value.hasImage(ICON_ID)) {
          map.value.addImage(ICON_ID, image, { sdf: false });
        }
      });
    }

    // ADD PIN
    if (canUseSprite) {
      map.value.addLayer({
        id: FLYTO_PIN_ID,
        type: "symbol",
        source: FLYTO_SRC_ID,
        layout: {
          "icon-image": ICON_ID,
          "icon-size": ["interpolate", ["linear"], ["zoom"], 2, 0.1, 5, 0.25],
          "icon-allow-overlap": true,
          "symbol-z-order": "auto",
        },
      });
    } else {
      // fallback to circle
      map.value.addLayer({
        id: FLYTO_PIN_ID,
        type: "circle",
        source: FLYTO_SRC_ID,
        paint: {
          "circle-radius": 8,
          "circle-color": "#e74c3c",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2
        }
      });
    }
  }

  // ADD NAME
  if (req.place_name) {
    map.value.addLayer({
      id: FLYTO_NAME_ID,
      type: "symbol",
      source: FLYTO_SRC_ID,
      layout: {
        "text-field": ["get", "name"],
        "text-size": 20,
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-anchor": "top",
        "text-offset": [0, 2.2],
        "text-allow-overlap": true,
        "text-transform": "uppercase"
      },
      paint: {
        "text-color": "#f5ec84",
        "text-halo-color": "#00000c",
        "text-halo-width": 1
      }
    });
  }
}

// init layer for heritage geojsons (quick fix)
function ensureHeritageHighlight() {
  map.value.addSource("heritage-highlight", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });

  // polygon fill
  map.value.addLayer({
    id: "heritage-highlight-fill",
    type: "fill",
    source: "heritage-highlight",
    paint: {
      "fill-color": "#ffffff",
      "fill-opacity": 0.18
    },
    filter: ["any", ["==", ["geometry-type"], "Polygon"], ["==", ["geometry-type"], "MultiPolygon"]]
  });

  // outline
  map.value.addLayer({
    id: "heritage-highlight-line",
    type: "line",
    source: "heritage-highlight",
    paint: {
      "line-color": "#ffffff",
      "line-width": 2
    }
  });
}

// mounted life cycle hook
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

  const onResize = () => {
  // check that mapbox obj really exists
  if (!map.value || map.value._removed) {
    return;
  }

  // check that map canvas really exists
  const canvas = map.value.getCanvas?.();
  if (!canvas) return;

  // trailing debounce: only run after resize stops
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }

  resizeTimer = setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!map.value || map.value._removed) return;
        map.value.resize();
      });
    });
  }, 250);
  };

  // alter zoom 
  map.value.scrollZoom.setWheelZoomRate(1/200);

  // disable rotation
  map.value.dragRotate.disable();
  map.value.touchZoomRotate.disableRotation();

  // map interactions
  // stop autorotate on user interaction
  map.value.on('mousedown', () => {
      autoRotate.value = false;
  });

  // restart autorotate
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

  // resizes mapbox map/canvas on window resize
  map.value.once("load", () => {
    window.addEventListener("resize", onResize, { passive: true });
    ensureHeritageHighlight();
  })
});

/*
* adds dimLayer
*/
function addBasemapDim(mapInstance, opacity = 0.3, beforeId = "sinking_cities") {
  const worldPoly = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-180, -85],
        [180, -85],
        [180, 85],
        [-180, 85],
        [-180, -85]
      ]]
    }
  };

  // src
  if (!mapInstance.getSource(DIM_SRC_ID)) {
    mapInstance.addSource(DIM_SRC_ID, {
      type: "geojson",
      data: worldPoly
    });
  }

  // add layer
  mapInstance.addLayer(
    {
      id: DIM_LAYER_ID,
      type: "fill",
      source: DIM_SRC_ID,
      paint: {
        "fill-color": "#000000",
        "fill-opacity": opacity,
        "fill-opacity-transition": { duration: 5000 }
      }
    },
    beforeId // id where to inject layer in zIndex
  );
}

/**
 * removes dimLayer
 */
function removeBasemapDim(mapInstance) {
  if (!mapInstance) return;
  if (mapInstance.getLayer(DIM_LAYER_ID)) mapInstance.removeLayer(DIM_LAYER_ID);
  if (mapInstance.getSource(DIM_SRC_ID)) mapInstance.removeSource(DIM_SRC_ID);
}

onBeforeUnmount(() => {
  stopAutorotate();
  map.value?.remove();
});

// HELPER FUNCTIONS FOR SHIFT REQUEST
function computeOffsetForSide(map, side, fy = 0.33) {
  const w = map.getCanvas().width;
  const h = map.getCanvas().height;
  const fx = side === "left" ?  0.33 : 0.66;
  return [(0.5 - fx) * w, (0.5 - fy) * h]; 
}

function applyShiftSide(map, { side, fy = 0.33, duration = 700 }) {
  const offset = computeOffsetForSide(map, side, fy);
  map.easeTo({
    center: map.getCenter(),
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
    offset,
    duration,
    essential: true,
  });
}

/**
 * Updates match highlight for cultural heritages.
 * @param {mapboxgl.Map} m
 * @param {string} q
 */
function updateHeritageSearchHighlight(q) {
  const query = String(q ?? "").toLowerCase().trim();
  const fc = heritagesGeojson.value;

  if (!map.value || !map.value.getSource?.("heritages") || !fc) return;

  let matchCount = 0;

  for (const p of pointData2.value) {
    map.value.setFeatureState({ source: "heritages", id: String(p.id) }, { match: false });
  }

  for (const f of fc.features) {
    const props = f.properties || {};
    const hay = `${props.title ?? ""} ${props.category ?? ""} ${props.tags ?? ""} ${props.year ?? ""}`
      .toLowerCase();

    const isMatch = query ? hay.includes(query) : false;

    if (isMatch) {
      // eslint-disable-next-line
      matchCount += 1;
    }

    // feature-state for point-layer
    map.value.setFeatureState(
      { source: "heritages", id: String(props.id ?? f.id) },
      { match: isMatch }
    );

    // icon switching via data
    props.icon_current = isMatch
      ? (props.match_icon || props.icon)
      : props.icon;
  }

  map.value.getSource("heritages").setData(fc);
  heritagesSearchLength.value = query ? matchCount : 0;
}

// searchfield watcher
watch(heritageSearch, (v) => {
  if (t) clearTimeout(t);
    t = setTimeout(() => {
      if (!map.value) return;
      updateHeritageSearchHighlight(v);
  }, 120);
});

// popup watcher
watch(showPopup, (val) => {
  const m = map.value;
  if (!m) return;

  const layersToToggle = [
    "cultural_heritages",
    "cultural_heritages_icons"
  ];

  layersToToggle.forEach((id) => {
    if (m.getLayer(id)) {
      m.setLayoutProperty(
        id,
        "visibility",
        val ? "none" : "visible"
      );
    }
  });

  if (val) {
    autoRotate.value = false;
    stopAutorotate();
  } else {
    setSource();
    // remove dim maps
    removeBasemapDim(map.value);
    // remove pin layers
    removeHelperLayer();
    // remove geojsons
  
    autoRotate.value = true;
    map.value.flyTo({ center: map.value.getCenter(), zoom: saveMapZoom.value, speed: 0.8});
    startAutorotate();
  }
});

watch(popupActive, (val) => {
  showPopup.value = val;
});

// dimlayer watcher set in state by data story step components
watch(addDimLayer, (val) => {
  if (val) {
    addBasemapDim(map.value, 0.5);
  }
  else {
    removeBasemapDim(map.value);
  }
});

watch(flyToRequest, async(req) => {
  if (req && map.value) {
    map.value.flyTo({
      center: [req.lng, req.lat],
      zoom: req.zoom,
      duration: 1500,
      curve:1,
      bearing: map.value.getBearing(),
      pitch:0
    })

    const wantsPin  = !!req.pin;
    const wantsName = !!req.place_name && req.place_name !== "";

    // place pin on map?
    if (wantsPin || wantsName) {
      addHelperLayer(req);
    }
    else {
      removeHelperLayer();
    }
  }
});

// shift map to left or right on certain story steps
watch(shiftMapRequest, (req) => {
  if (!req || !map.value) return;

  // only shift map at horizotal screensizes
  if (window.innerWidth <= 719) return;

  if (map.value.isMoving()) {
    const once = () => {
      map.value.off("moveend", once);
      applyShiftSide(map.value, req);
    };
    map.value.on("moveend", once);
  } else {
    applyShiftSide(map.value, req);
  }
});

// fly to city on outside req (menu click)
watch(flyToCityRequest, async (req) => {
  if (req && map.value) {
    showPopup.value = false;
    togglePopupState(false);
    await nextTick();
    selectedSunkenCity.value = req.title;
    showPopup.value = true;
    togglePopupState(true);
    autoRotate.value = false;

    saveMapZoom.value = map.value.getZoom();

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

watch(() => geojsonPayload.value, (newValue) => {
    if (!newValue) {
      removeGeoJsonLayer(map.value, { sourceId: "story-geojson-source", layerId: "story-geojson-layer" });
      return;
    }

    addGeoJsonLayer(map.value, newValue);
  },
  { immediate: true }
);

watch(() => showSmallPopup.value, (newValue) => {
  if (newValue) {
    console.log(geojsonHeritagePayload.value);
    if (geojsonHeritagePayload.value) {
      console.log("i rec this");
      map.value.getSource("heritage-highlight").setData(geojsonHeritagePayload.value);
    }
  }
  else {
    clearGeojson();
  }
})

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
  <div v-if="!showPopup" class="search_wrapper">
      <div v-if="heritagesSearchLength" class="hits">
        {{ heritagesSearchLength}} hits are <span>highlighted</span> on the map!
      </div>
      <img class="search_icon" src="/images/icons/search_icon.png">
      <input
        v-model="heritageSearch"
        id="heritage_search"
        class="heritage-search"
        type="search"
        placeholder="Search tags, category, year..."
        autocomplete="off"
        spellcheck="false"
      />
      <!--<div v-if="heritagesSearchLength" class="hits">({{ heritagesSearchLength }})</div>-->
  </div>
  <div class="comp_wrapper">
    <div  ref="globeEl" id="map" :class="['globe_container', { 'shifted': showPopup }]"></div>
  </div>
  <MainPopup v-if="showPopup" :title="selectedSunkenCity" @close="showPopup = false; togglePopupState(false)" />
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

  .search_wrapper {
    position:fixed;
    bottom:90px;
    left:80px;
    width:310px;
    display: flex;
    flex-flow:row wrap;
    justify-content:flex-start;
    align-items: center;
    z-index:1;

    .search_icon {
      width:auto;
      height:25px;
      position: absolute;
      top:50%;
      transform: translateY(-50%);
      left:0px;
      z-index:3;
    }

    #heritage_search {
      background:rgba(0,0,0,0.65);
      backdrop-filter: blur(3px);
      color:#f5ec84;
      padding:0px 10px 0px 60px;
      box-sizing: border-box;
      border-radius:5px;
      width:310px;
      border:1px solid black;
      outline:none;
      height:50px;
      line-height:50px;
      border-radius: 10px;
      font-size: 100%;

      &:focus {
        border:1px solid #f5ec84;
      }
    }

    .hits {
      position:absolute;
      top:-25px;
      color:#f5ec84;
      left:0px;

      span {
        font-weight:500;
        color:#50c3ff;
      }
    }
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

      /*&.shifted {
        width:70vw;
        transform:translateX(-50%);
        transition:0.8s;
        transition-delay:1s;
        overflow:hidden;
      }*/
    }

    .pointLabel {
      font-family:$cairo-base;
      text-transform:"uppercase";
      font-size:140%;
      color:#f5ec84 !important;
    }
  }
</style>
