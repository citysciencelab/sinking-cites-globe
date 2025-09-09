<script setup>
import { ref, defineProps, defineEmits, watch, nextTick, onMounted } from "vue";
import { useIntro } from "@/composables/useIntro.js";
import { useAudio } from "@/composables/useAudio";
import { useMapControls } from "@/composables/useMapControls";

const props = defineProps({
    open: Boolean,
    firstOpen: Boolean
});

// emit to msg change to prop back to parent
const emit = defineEmits(["update:open"]);
const { introText, fetchIntro } = useIntro();
const { setSource } = useAudio();
const { resetView } = useMapControls();


const entering = ref(false);
const hideLoader = ref(false);

const closeMenu = () => {
    if (props.firstOpen) {
        setSource("/audio/sinking_cities_theme.mp3");
        resetView();
    }

    emit("update:open", false);
}

onMounted(() => {
    setTimeout(() => {
        hideLoader.value = true;
    }, 2000);
})

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      entering.value = false;
      return;
    }

    if (!introText.value) {
        await fetchIntro();
    }

    await nextTick();              
    requestAnimationFrame(() => {  
      entering.value = true;
    });
  },
  { immediate: true }
);
</script>

<template>
    <div v-if="!hideLoader" class="loader">
        <img src="images/gifs/rotate_load.gif" />
        <h1>SINKING CITIES</h1>
    </div>
    <div
        v-if="props.open"
        class="about_menu_wrapper"
        @click="closeMenu"    
    >
        <div
            v-if="introText"
            id="about_menu"
            :class="{ enter: entering }"    
        >
            <h2>{{ introText.title }}</h2>
            <div class="intro_text" v-html="introText.text"></div>
            <div v-if="props.firstOpen" class="start_exp" @click="closeMenu">
                <div class="border"></div>
                <div class="link_content">
                    <img src="images/gifs/rotate_blue.gif" />
                    Start The Experience
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .loader {
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        height:100vh;
        z-index:15;
        background:$color3;

        img {
            position: absolute;
            top:50%;
            left:50%;
            transform:translate(-50%,-50%);
            width:80px;
            height:80px;
        }

        h1 {
            position: absolute;
            top: calc(50% + 20px);
            left: 50%;
            transform: translateX(-50%);
            font-family: $cairo_base;
            font-size: 300%;
            text-transform: uppercase;

            color: transparent;
            background-image:
                linear-gradient($color1, $color1),  
                linear-gradient($color_blue, $color_blue);
            background-size: 100% 0%, 100% 100%; 
            background-position: bottom left, bottom left;
            background-repeat: no-repeat;
            -webkit-background-clip: text;
            background-clip: text;

            animation: fill-up 3.6s cubic-bezier(.2,.6,.2,1) forwards;
        }
    }

    .about_menu_wrapper {
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        height:100vh;
        background:rgba(0,0,0,0.5);
        backdrop-filter: blur(5px);
        z-index:10;

        #about_menu {
            position:absolute;
            top:50%;
            left:25%;
            transform:translate(-50%,-50%);
            width:33%;
            min-width:600px;
            max-width:1400px;
            display:flex;
            flex-flow:row wrap;
            justify-content:flex-start;
            
            h2 {
                font-family: $cairo_base;
                color:$color1;
                font-size:380%;
                text-shadow:2px 2px $color4;
                text-transform: uppercase;
                text-align:left;
                width:100%;
            }

            .intro_text {
                width:100%;
                text-align:left;
                font-size:120%;
                font-weight:500;
                color:$pcolor;

                strong {
                    color:whitesmoke;
                    font-weight:700;
                }
            }

            .start_exp {
                position: relative;
                background:rgba(0,0,0,0.5);
                color:$color1;
                width:400px;
                height:80px;
                line-height:80px;
                padding:10px 20px;
                border-radius: 5px;
                box-sizing: border-box;
                margin:50px 0 0 0;
                font-size:180%;
                text-transform: uppercase;
                font-family: $cairo_base;
                overflow:hidden;
                @include dropshadow();
                    transition:0.3s;

                .border {
                    position: absolute;
                    display: block;
                    top: -50%;
                    left: -50%;
                    z-index: -9;
                    display: block;
                    height: 800px;
                    width: 800px;
                    transform: rotate(-45deg);
                    overflow: hidden;
                    background: linear-gradient(to right, $color4 20%, $color4 40%, #ECD08C 50%, #ECD08C 55%, $color4 70%, $color4 100%);
                    background-size: 200% auto;
                    animation: shine 3s linear infinite;
                }

                .link_content {
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    display: block;
                    height: calc(100% - 4px);
                    width: calc(100% - 4px);
                    margin: auto;
                    align-self: center;
                    z-index: 1;
                    background:$color4;
                    display:flex;
                    flex-flow:row wrap;
                    justify-content: center;
                    align-items:center;

                    img {
                        flex:0 0 36px;
                        height:36px;
                        margin-right:20px;
                    }
                }

                &:hover {
                    cursor:pointer;
                    background:$color_blue;
                    transform:scale(1.05);
                    transition:0.3s;

                    .link_content {
                        background:transparent;
                    }
                }
            }

            &.enter .project_card {
                opacity: 1;
                transform: translateY(0);
            }

            @media(max-width:1280px) {
                left:33%; 

                h2 {
                    font-size:280%;
                }

                .intro_text {
                    font-size:110%;
                }

                .start_exp {
                    font-size:120%;
                }
            }
        }

        @keyframes shine {
            to {
            background-position: 200% center;
            }
        }

        
        @keyframes fill-up {
            to {
                background-size: 100% 100%, 100% 100%;
            }
        }
    }
</style>