<script setup>
import { ref, defineProps, defineEmits, watch, nextTick } from "vue";
import { useCities } from "@/composables/useCities.js";
import { useMapControls } from "@/composables/useMapControls";

const props = defineProps({
    open: Boolean
});

// emit to msg change to prop back to parent
const emit = defineEmits(["update:open"]);
const { cities } = useCities();
const { selectCity } = useMapControls();

const entering = ref(false);
const hasEntered = ref(false);

const closeMenu = () => {
    emit("update:open", false);
}

function handleCityClick (city) {
    selectCity(city);
    closeMenu();
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      entering.value = false;
      return;
    }
    await nextTick();              
    requestAnimationFrame(() => {  
      entering.value = true;
    });

    setTimeout(() => {
        hasEntered.value = true;
    }, 3000);
  },
  { immediate: true }
);
</script>

<template>
    <div
        v-if="props.open"
        class="project_menu_wrapper"
        @click="closeMenu"    
    >
        <div
            id="project_menu"
            :class="{ enter: entering }"    
        >
            <div 
                class="close_project_menu"
                @click="closeMenu"
            ></div>
            <div
                v-for="(city, i) in cities"
                :key="city.title"
                class="project_card"
                :class="{entered: hasEntered}"
                @click="handleCityClick(city)"
                :style="{ '--stagger': `${i * 0.5}s` }"    
            >
                <div class="card_wrapper">
                    <div class="img_wrapper">
                        <img
                            class="city_title_img"
                            :src="`https://admin.sinkingcities.online/assets/${city.title_img}?width=500`"
                        />
                    </div>
                    <div class="text_block">
                        <h3>{{ city.title }}</h3>
                        <p>{{ city.abstract }}</p>
                    </div>
                    <img class="waves_gif" src="/images/gifs/waves.gif" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .project_menu_wrapper {
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        height:100vh;
        background:rgba(0,0,0,0.5);
        backdrop-filter: blur(5px);
        z-index:10;

        #project_menu {
            position:absolute;
            top:50%;
            left:50%;
            transform:translate(-50%,-50%);
            width:80%;
            max-width:1400px;
            display:flex;
            flex-flow:row wrap;
            justify-content:space-around;

            .project_card {
                flex: 0 0 30%;
                border-radius:10px;
                border:1px solid $color4;
                overflow:hidden;
                background:rgba(0,0,0,0.85);
                backdrop-filter:blur(5px);
                @include dropshadow();
                transform: translateY(50px);
                opacity:0;
                transition: opacity .6s ease, transform .6s ease;
                transition-delay: 0.2s;

                &.entered {
                    transition-delay:0s !important;
                }

                .card_wrapper {
                    position: relative;
                    width:calc(100% - 4px);
                    height:calc(100% - 4px);
                    margin:2px;
                    background:transparent;
                    border-radius: 10px;
                    overflow: hidden;
                    z-index:5;
                }

                .img_wrapper {
                    position: relative;
                    width: 100%;
                    height:300px;
                    overflow: hidden;
                }
                .city_title_img {
                    position:relative;
                    height: 300px;
                    width: 100%;
                    object-fit: cover;
                    z-index:3;
                    filter:saturate(0.6);
                    transition:0.3s;
                }

                .text_block {
                    position:relative;
                    padding:0px 30px 20px 30px;
                    box-sizing: border-box;
                    z-index:3;

                    h3 {
                        font-size:200%;
                        font-family:$cairo-base;
                        color:$color1;
                        text-shadow:2px 2px black;
                        text-align:left;
                    }

                    p {
                        color:$pcolor;
                        text-align:left;
                        font-family:$cairo-base;
                        font-size:120%;
                        line-height:120%;
                    }
                }

                &:after {
                    content: "";
                    display: block;
                    background: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(254, 255, 174, 0.986) 50%,
                        rgba(255, 255, 255, 0) 100%
                    );
                    height: 100%;
                    width: 100%;
                    transform: translate(0);
                    position: absolute;
                    z-index: 0;
                    top: 50%;
                    opacity:0;
                    transform-origin: top center;
                }
                
                &:hover {
                    cursor:pointer;
                    transform:scale(1.075) !important;
                    transition:0.3s;
                    transition-delay:0 !important;
                    z-index:10;

                    .card_wrapper {
                        background:$color3;
                    }

                    .city_title_img {
                        transform:scale(1.15);
                        filter:saturate(1);
                        transition:0.3s;
                    }

                    &:after {
                        opacity:1;
                        animation: rotate 5s linear forwards infinite;
                    }

                    .waves_gif {
                        opacity:0.5;
                    }
                }

                .waves_gif {
                    position:absolute;
                    top:0;
                    left:0;
                    z-index:0;
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    filter:blur(1px);
                    opacity:0.3;
                }
            }

            @media(max-width:1280px) {
                width:95%;

                .project_card {
                    flex:0 0 32%;
                }
            }

            &.enter .project_card {
                opacity: 1;
                transform: translateY(0);
                transition:opacity 0.8s ease var(--stagger, 0s), transform 1.2s ease var(--stagger, 0s);
            }
        }

        @keyframes rotate {
            from {
                transform: rotate(0);
            }

            to {
                transform: rotate(360deg);
            }
        }
    }
</style>