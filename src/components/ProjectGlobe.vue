<script setup>
import { onMounted, ref, watch } from "vue";
import Globe from "globe.gl";
import MainPopup from "./MainPopup.vue";
import * as THREE from "three";
// import { makeFancyLightColumn } from "@/js/lightcolumn";
import { hexToRgba } from "@/js/hexToRGBA";
import { initPointLabelOverlay } from "@/js/pointLabelOverlay";
import { updatePointVisibility } from "@/js/updatePoints";
import { directus } from "@/js/directus";
import { readItems } from "@directus/sdk";

const globeEl = ref(null);
const selectedSunkenCity = ref(null);
const showPopup = ref(false);
const globe = ref(null);

onMounted(async() => {
  const pointData = await loadDirectusPoints();
  globe.value = Globe()(globeEl.value)
    .globeImageUrl("/images/earth_blue.jpg")  
    // .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-night.jpg")
    .backgroundImageUrl("/images/night-sky.jpg")
    .pointOfView({ lat: 20, lng: 0, altitude: 2 });

  globe.value
    .showAtmosphere(true)
    .atmosphereColor("rgba(74,150,255,0.5)")
    .polygonCapColor(() => "#00000000")
    .polygonSideColor(() => "#00000000")
    // basic point data ex
    //.pointsData(pointData)
    .customLayerData(pointData)
    .pointsMerge(false)
    .pointsTransitionDuration(2000)
    //.pointAltitude(1000)
    //.pointColor("color")
    //.pointRadius("size");
    .customThreeObject((point) => createPointObject(point))
    .customThreeObjectUpdate((obj, point) => {
      obj.__data = point;
      obj.name = `point-${point.title}`;
    });

    // eslint-disable-next-line
  globe.value.onCustomLayerClick((point, event, obj) => {
    selectedSunkenCity.value = point.title;
    showPopup.value = true;

    globe.value.controls().autoRotate = true;
    globe.value.controls().autoRotateSpeed = 40;

    setTimeout(() => {

      globe.value.pointOfView(
        {
          lat: point.lat,
          lng: point.lng,
          altitude: 1.25
        },
        2000
      );

      globe.value.controls().autoRotate = false;
      globe.value.controls().autoRotateSpeed = 0.2;
    }, 1500);
  });

  //GLOBE ROTATION
  globe.value.controls().autoRotate = true;
  globe.value.controls().autoRotateSpeed = 0.2;

  initPointLabelOverlay({
    containerEl: globeEl.value.parentElement,
    globeInstance: globe.value,
    points: pointData,
    radius: 100
  });

  // ADD CLOUDS
  let cloudMesh = null;

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load("https://raw.githubusercontent.com/turban/webgl-earth/master/images/fair_clouds_4k.png",
  (cloudTexture) => {
      const cloudGeo = new THREE.SphereGeometry(101, 75, 75);
      const cloudMat = new THREE.MeshLambertMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.name = "clouds";

      globe.value.scene().add(cloudMesh);
    });
    
    const animateClouds = () => {
      requestAnimationFrame(animateClouds);

      if (cloudMesh) {
        cloudMesh.rotation.y -= 0.0001;
        cloudMesh.rotation.x += 0.0001
      }
    };
    animateClouds();

    // NIGHT LIGHTS 
    /*const globeGeo = new THREE.SphereGeometry(105, 75, 75);
    const lightsTexture = new THREE.TextureLoader().load("/images/earth_lights_lrg.jpg");
    const lightsMat = new THREE.MeshBasicMaterial({
      map: lightsTexture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lightsLayer = new THREE.Mesh(globeGeo.clone(), lightsMat);
    lightsLayer.name = "cityLights";

    lightsLayer.scale.set(1.001, 1.001, 1.001);
    globe.scene().add(lightsLayer);*/

    // ADD AMBIENT LIGHTING
    const atmosphereGeo = new THREE.SphereGeometry(101.25, 75, 75);
    const atmosphereMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.5, 0.5, 0.0)), 2.0);
          gl_FragColor = vec4(0.5, 0.7, 1.0, 0.15) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    atmosphereMesh.name = "atmosphere";
    globe.value.scene().add(atmosphereMesh);

    updatePointVisibility(globe.value);
}); // onMounted End

function createPointObject(point) {
  const group = new THREE.Group();
  group.name = `point-${point.title}`;
  const beamHeight = 1000;
  const baseRadius = point.size || 2;

  group.userData = {
    point,
    beamHeight,
    baseRadius
  };

  const latRad = THREE.MathUtils.degToRad(90 - point.lat);
  const lngRad = THREE.MathUtils.degToRad(90 - point.lng);
  const radius = 100;

  const x = radius * Math.sin(latRad) * Math.cos(lngRad);
  const y = radius * Math.cos(latRad);
  const z = radius * Math.sin(latRad) * Math.sin(lngRad);
  const position = new THREE.Vector3(x, y, z);
  const direction = position.clone().normalize();
  group.position.copy(position);

  const beamGeometry = new THREE.CylinderGeometry(0.3, 0.3, beamHeight, 6, 1, true);
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: point.color,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);

  beam.position.copy(direction.clone().multiplyScalar(beamHeight / 2));
  const up = new THREE.Vector3(0, 1, 0);

  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(up, direction);
  beam.quaternion.copy(quaternion);

  beam.name = "beam";
  group.add(beam);

  const iconTexture = new THREE.TextureLoader().load(`/images/icons/${point.title}_icon.png`);
  const iconMaterial = new THREE.SpriteMaterial({ map: iconTexture, transparent: true });
  const icon = new THREE.Sprite(iconMaterial);
  icon.scale.set(7, 7, 3);
  icon.position.copy(direction.clone().multiplyScalar(baseRadius + 1));
  icon.name = "icon";
  icon.visible = false;
  group.add(icon);

  return group;
}

async function loadDirectusPoints() {
  try {
    const data = await directus.request(readItems('sinking_cities', {
      // filter: { status: { _eq: 'published' } },
      // sort: ['-date_created'],
      fields: ['id', 'title', 'coordinates', "city_color"],
      // limit: 3
    }));

    console.log(data);

    const points = data.map(item => ({
        title: item.title,
        name: "point-" + item.title,
        lat: item.coordinates.coordinates[1],
        lng: item.coordinates.coordinates[0],
        size: 2, // z.B. kleiner Balken
        color: hexToRgba(item.city_color, 0.25) || (220, 120, 80, 0.25)
    }));

    console.log(points);
    return points;

  }
  catch (err) {
    console.error("Fehler beim Laden der Daten von Directus", err);
  }
}

watch(showPopup, (val) => {
  if (!val) {
    globe.value.controls().autoRotate = true;
  }
});
</script>

<template>
  <div class="comp_wrapper">
    <div  ref="globeEl" id="map" :class="['globe_container', { 'shifted': showPopup }]"></div>
  </div>
  <MainPopup v-if="showPopup" :title="selectedSunkenCity" @close="showPopup = false" />
</template>

<style lang="scss" scoped>
  .comp_wrapper {

    #map {
      display: block;
      width:100vw;
      height:100vh;
      position:fixed;
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
