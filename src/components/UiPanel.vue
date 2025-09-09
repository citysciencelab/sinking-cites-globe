<script setup>
import { ref, watch } from "vue";
import AudioPlayer from "./AudioPlayer.vue"
import ProjectMenu from "./ProjectMenu.vue"
import AboutPanel from "./AboutPanel.vue";

const openProjectMenu = ref(false);
const showAbout = ref(true);
const firstOpen = ref(true);

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
        <img src="images/logos/sinking_cities_pink.png"/>
    </div>
    <div class="menu_bottom_right">
        <button @click="showAbout = true">About</button>
        <button @click="openProjectMenu = true">All projects</button>
    </div>
</template>

<style lang="scss" scoped>
    #audioplayer {
        position: absolute;
        top:20px;
        left:20px;
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
            width:450px;
            height:auto;

            @media(max-width:1280px) {
                width:350px;
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

            &:hover {
                cursor:pointer;
                transform:scale(1.05);
                transition:0.3s;
            }
        }
    }
</style>