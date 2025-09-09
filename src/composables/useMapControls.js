import { ref } from "vue";

const selectedCity = ref(null);
const flyToRequest = ref(null); // { lng, lat, zoom }
const viewUpdater = ref(0);

export function useMapControls() {
  function selectCity(city) {
    selectedCity.value = city;

    console.log("CITY", city);
    if (city?.coordinates) {
      flyToRequest.value = {
        title: city.title,
        lng: city.coordinates.coordinates[0],
        lat: city.coordinates.coordinates[1],
        zoom: 10
      };
    }
  }

  function resetView () {
    viewUpdater.value += 1;
  }

  return {
    selectedCity,
    flyToRequest,
    selectCity,
    viewUpdater,
    resetView
  };
}
