import { ref } from "vue";

const selectedCity = ref(null);
const flyToRequest = ref(null); // { lng, lat, zoom }
const flyToCityRequest = ref(null); // { lng, lat, zoom }
const shiftMapRequest = ref(null);
const viewUpdater = ref(0);

// for certain text slides
const addDimLayer = ref(false);

// if user added geojson
const geojsonPayload = ref(null);
const geojsonHeritagePayload = ref(null);

export function useMapControls() {
  function selectCity(city) {
    selectedCity.value = city;

    if (city?.coordinates) {
      flyToCityRequest.value = {
        title: city.title,
        lng: city.coordinates.coordinates[0],
        lat: city.coordinates.coordinates[1],
        zoom: 10
      };
    }
  }

  function flyToCoordinates (payload) {
    flyToRequest.value =  {
      lng: payload.coords[0],
      lat: payload.coords[1],
      zoom: payload.zoom || 10,
      pin: payload.pin || false,
      place_name: payload.place_name || null
    }
  }
  
  function resetView () {
    viewUpdater.value += 1;
  }

  function toggleDimLayer (state) {
    addDimLayer.value = state;
  }

  function setGeojsonPayload(payload) {
    geojsonPayload.value = payload;
  }
  
  function setGeojsonHeritagePayload(payload) {
    geojsonPayload.value = payload;
  }

  function requestMapShift(side) {
    if (side !== "left" && side !== "right") {
      shiftMapRequest.value = null;
      return;
    }

    shiftMapRequest.value = {
      side,
      fy: 0.5,
      duration: 1000,
      ts: Date.now(),
    };
  }

  return {
    selectedCity,
    flyToRequest,
    flyToCityRequest,
    flyToCoordinates,
    selectCity,
    viewUpdater,
    addDimLayer,
    toggleDimLayer,
    resetView,
    geojsonPayload,
    geojsonHeritagePayload,
    setGeojsonPayload,
    setGeojsonHeritagePayload,
    shiftMapRequest,
    requestMapShift
  };
}
