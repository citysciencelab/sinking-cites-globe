<script setup>
import { ref, defineProps, defineEmits, watch, nextTick } from "vue";
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

const closeMenu = () => {
    if (props.firstOpen) {
        setSource("/audio/sinking_cities_theme.mp3");
        resetView();
    }

    emit("update:open", false);
}

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
                <div class="link_content">Start The Experience</div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
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
                    top: 1%;
                    left: 1%;
                    display: block;
                    height: 98%;
                    width: 98%;
                    margin: auto;
                    align-self: center;
                    z-index: 1;
                    background:$color4;
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
    }
</style>