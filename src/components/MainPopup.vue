<script setup>
    import { onMounted, ref, watch, defineProps } from "vue";
    import { directus } from "@/js/directus";
    import { readItems } from "@directus/sdk";

    const props = defineProps({
        title: String
    });

    // eslint-disable-next-line
    const emit = defineEmits(["close"]);

    const cityPopup = ref(null);
    const city = ref(null);

    const loadCityData = async () => {
    if (!props.title) return;
    const result = await directus.request(readItems("sinking_cities", {
        filter: { title: { _eq: props.title } },
        limit: 1
    }));
    city.value = result[0];
    };

    onMounted(() => {
        loadCityData();
    });
    watch(() => props.title, loadCityData);
    watch(() => city.value, async (val) => {
        if (val) {
             cityPopup.value?.classList.remove("enter");
             console.log("siddy", city);

            setTimeout(function() {
                console.log("WORKX");
                cityPopup.value?.classList.add("enter");
            }, 1000);
        }
    })
</script>


<template>
    <div class="popup_backdrop" @click.self="$emit('close')">
        <div class="popup_content" v-if="city" ref="cityPopup">
            <h2 :style="{color: city.city_color}">{{ city?.title }}</h2>
            <div class="popup_wrapper">
                <div class="header">
                    <template v-if="city.intro_video">
                        bla
                    </template>
                    <template v-else>
                        <img class="title_img" :src="`https://admin.sinkingcities.online/assets/${city.title_img}`"/>
                    </template>
                </div>
                <p v-if="city">{{ city.abstract }}</p>
                <p v-else>Lade Daten...</p>
            </div>

            <div class="popup_footer">
                <h2>{{city.title}}</h2>
                <img src="images/icons/waves_yellow.png"/>
            </div>
        </div>
  </div>
</template>

<style lang="scss" scoped>
    .popup_backdrop {
        position: fixed;
        inset: 0;
        // background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .popup_content {
        background: $color3;
        position:absolute;
        top:0;
        right:0;
        width:65vw;
        height:100vh;
        transform:translateX(100%);
        box-sizing:border-box;
        overflow-y: auto;
        transition:0.3s;

        h2 {
            position:absolute;
            top:20px;
            left:50px;
            text-transform:uppercase;
            font-size:200%;
            font-weight:bold;
        }

        .header {
            .title_img {
                width:100%;
                height:30vh;
                object-fit:cover;
            }
        }
        .popup_wrapper {
            padding:100px;
        }

        .popup_footer {
            display:flex;
            flex-flow:row wrap;
            justify-content: flex-start;
            align-items: center;
            position: absolute;
            bottom:10px;
            right:0;

            img {
                width:100px;
                height:auto;
            }

            h2 {
                color:$color1;
                font-size:300%;
                font-family:$cairo-base;
                font-weight:"bold";
                text-transform:uppercase;
                margin-right:20px;
            }
        }

        &.enter {
            transform:translateX(0);
            transition:0.5s;
        }
    }
</style>