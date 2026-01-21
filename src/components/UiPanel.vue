<script setup>
import { ref, watch } from "vue";
import AudioPlayer from "./AudioPlayer.vue"
import ProjectMenu from "./ProjectMenu.vue"
import AboutPanel from "./AboutPanel.vue";
import Close from "vue-material-design-icons/Close.vue";
import { usePopupState } from "@/composables/usePopup";
import { directus } from "@/js/directus";
import { readItems } from "@directus/sdk";

const openProjectMenu = ref(false);
const showAbout = ref(true);
const firstOpen = ref(true);

const { popupActive, togglePopupState } = usePopupState();
const errorColor = "#f288a4";

const legalPopup = ref(null);
const legalContent = ref("");
const legalTitle = ref("");
const directusPckg = ref(null);

async function openLegal(type) {

    if (!directusPckg.value) {
        const data = await directus.request(readItems("rechtliches"));

        directusPckg.value = data;
    }

    console.log(directusPckg.value, "thsi wosk");
    legalTitle.value = directusPckg.value[type].title
    legalContent.value = directusPckg.value[type].text_information;
    legalPopup.value = true;
}

function closeLegal() {
    legalPopup.value = false;
    legalContent.value = null;
}

watch(() => showAbout.value, () => {
    firstOpen.value = false;
})
</script>

<template>
    <AboutPanel :open="showAbout" @update:open="showAbout = false" :first-open="firstOpen" />
    <ProjectMenu :open="openProjectMenu" @update:open="openProjectMenu = false"/>
    <AudioPlayer />
    <div class="sinking_cities_logo">
        <!--<img src="images/icons/waves_yellow.png"/>
        <h1>Sinking Cities</h1>-->
        <img src="images/logos/sinking_cities_3.png"/>
    </div>
    <div class="imprint">
        <ul>
            <li><a @click="openLegal(0)">Imprint</a></li>
            <li><a @click="openLegal(1)">Privacy Policy</a></li>
        </ul>
    </div>
    <div
        v-if="!popupActive"
        class="menu_bottom_right"
    >
        <button @click="showAbout = true">About</button>
        <button @click="openProjectMenu = true">All projects</button>
    </div>
    <div
        v-if="popupActive"
        class="close_story"
    >
        <button @click="togglePopupState(false)">
            <Close :size="24" :fill="errorColor" />
            <p>Close Story</p>
        </button>
    </div>

    <div v-if="legalPopup" class="legal_popup" @click="closeLegal">
        <div class="legal_inner" @click.stop>
            <button class="close_legal" @click="closeLegal">
                <Close :size="24" :fill="errorColor" />
            </button>
            <div class="title">
                <h2>{{ legalTitle }}</h2>
            </div>
            <div class="legal_wrapper">
                <div class="content" v-html="legalContent"></div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #audioplayer {
        position: absolute;
        top:20px;
        left:20px;
        z-index:0;

        @media(max-width:500px) {
            top:10px;
            left:10px;
            padding:0;
        }
    }

    .sinking_cities_logo {
        display:flex;
        flex-flow:row wrap;
        justify-content: flex-start;
        align-items: center;
        position: absolute;
        bottom:30px;
        left:0;

        img {
            width:400px;
            height:auto;

            @media(max-width:1280px) {
                width:350px;
            }

            @media(max-width:500px) {
                width:200px;
            }
        }

        h1 {
            color:$color1;
            font-size:300%;
            font-family:$cairo-base;
            font-weight:"bold";
            text-transform:uppercase;
            margin-left:20px;
        }

        @media(max-height:760px) {
            bottom:10px;
        }
    }

    .imprint {
        position:absolute;
        bottom:30px;
        left:50%;
        transform:translateX(-50%);

        ul {
            list-style: none;
            display:flex;
            flex-flow:row wrap;
            justify-content: center;
            margin:0;

            li {
                margin:0px 5px;

                a {
                    color:$color1;
                    font-family:$cairo-base;
                    text-decoration: none;
                }

                &:hover {
                    cursor:pointer;

                    a {
                        text-decoration: underline;
                    }
                }
            }
        }

        @media(max-width:500px) {
            right:10px;
            left:auto;
            transform:translateX(0);
        }

        @media(max-width:360px) {
            right:0;
        }

        
        @media(max-height:760px) {
            bottom:5px;
        }
    }

    .menu_bottom_right {
        width:auto;
        position:absolute;
        bottom:30px;
        right:30px;
        display:flex;
        flex-flow:row wrap;
        justify-content: flex-end;
        align-items:center;
        z-index:3;

        button {
            outline:none;
            border:1px solid $color1;
            color:$color1;
            font-size:120%;
            text-transform: uppercase;
            padding:10px 20px;
            margin-left:10px;
            border-radius: 5px;
            background:rgba(0,0,0,0.15);
            backdrop-filter:blur(3px);
            font-family:$cairo-base;
            @include dropshadow();
            transition:0.3s;

            &:hover {
                cursor:pointer;
                transform:scale(1.05);
                background:rgba(0,0,0,0.65);
                transition:0.3s;
            }
        }

        @media(max-width:500px) {
            bottom:70px;
            right:auto;
            left:0;
            width:100%;
            justify-content: center;
        }
    }

    .legal_popup {
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        height:100vh;
        background:rgba(0,0,0,0.35);
        backdrop-filter: blur(2px);
        z-index:1000;

        .legal_inner {
            position: absolute;
            right:0;
            top:0;
            height:100vh;
            width:100%;
            max-width:600px;
            padding:30px;
            box-sizing: border-box;
            text-align: left;
            background:rgba(0,0,0,0.65);
            overflow:hidden;
            backdrop-filter: blur(5px);

            .close_legal {
                position:absolute;
                top:10px;
                right:10px;
                width:50px;
                height:50px;
                border:2px solid $color1;
                color:$color1;
                background:none;

                &:hover {
                    cursor:pointer;
                }
            }

            .title {
                color:$color1;
            }
            .legal_wrapper {
                height:90%;
                overflow:auto;
                padding-right:50px;
                margin-right:-50px;
                color:#ccc;

                :deep(strong) {
                    color:whitesmoke;
                }

                :deep(h1,h2,h3) {
                    color:$color1;
                }

                :deep(h4,h5) {
                    color:white;
                }

                :deep(a) {
                    color: $color_gold;
                    text-decoration: none;
                }
            }
        }
    }

    .close_story {
        position:absolute;
        top:10px;
        right:10px;
        
        button {
            display: flex;
            flex-flow:row wrap;
            justify-content: center;
            outline:none;
            border:1px solid $color_gold;
            color:$color3;
            font-size:120%;
            text-transform: uppercase;
            padding:10px 20px 5px 20px;
            margin-left:10px;
            border-radius: 5px;
            background:rgba($color_gold, 1);
            backdrop-filter:blur(3px);
            font-family:$cairo-base;
            @include dropshadow();
            transition:0.2s;

            &:hover {
                cursor:pointer;
                transform:scale(1.05);
                background:rgba($color3, 0.85);
                border:1px solid $color1;
                color:$color1;
                transition:0.3s;

                span {
                    color:$color_pink;
                }
            }

            span {
                margin-top:5px;
                color:$color3;
            }

            p {
                margin:0;
                margin-left:10px
            }
        }
    }
</style>