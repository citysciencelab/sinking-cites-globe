<script setup>
    import { onMounted, ref, watch, defineProps} from "vue";
    import { useCities } from "@/composables/useCities";
    import { useMapControls } from "@/composables/useMapControls";
    // import { ObserveVisibility } from "vue3-observe-visibility";
    import ChevronLeft from "vue-material-design-icons/ChevronLeft.vue";
    import ChevronRight from "vue-material-design-icons/ChevronRight.vue";
    import DataStory from "./DataStory.vue";

    const props = defineProps({
        title: String
    });

    // eslint-disable-next-line
    const emit = defineEmits(["close"]);

    // scroll observer and animations
    // const vObserveVisibility = ObserveVisibility;
    const scrollerRef = ref(null);
    const visOpts = ref(null);

    const cityPopup = ref(null);
    const city = ref(null);
    // const baseUrl = "https://sinkingcitiesadmin.citysciencelab.hamburg";

    const { cities, loadCityData } = useCities();
    const { selectCity } = useMapControls();

    /* const loadCityData = async () => {
    if (!props.title) return;
    const result = await directus.request(readItems("sinking_cities", {
        filter: { title: { _eq: props.title } },
        limit: 1
    }));
    city.value = result[0];
    };*/

    function onReveal(isVisible, entry) {
        if (!isVisible) return;
        const el = entry.target;
        el.classList.add("show");
        el.classList.remove("hidden");
    }

    function switchCity(step, currentCity) {
        const list = cities.value || [];
        const n = list.length;
        if (!n) return;

        const idx = currentCity
            ? list.findIndex(c =>
                (currentCity.id != null && c.id === currentCity.id) ||
                (currentCity.title && c.title === currentCity.title)
            )
            : -1;

        const base = idx >= 0 ? idx : (step > 0 ? -1 : 0);

        const nextIndex = ((base + step) % n + n) % n;

        selectCity(list[nextIndex]);
    }


    onMounted(async () => {
        city.value = await loadCityData(props.title);

        visOpts.value = {
            callback: onReveal,
            once: true,
            intersection: { root: scrollerRef.value, threshold: 0.2 }
        };
    });

    watch(() => props.title, loadCityData(props.title));
    watch(() => city.value, async (val) => {
        if (val) {
             cityPopup.value?.classList.remove("enter");

            /* AUDIO CONTROL VIA SLIDE NOW if (val.audio_1) {
                const audioSrc = "https://sinkingcitiesadmin.citysciencelab.hamburg/assets/" + val.audio_1;
                setSource(audioSrc);
            }*/

            setTimeout(function() {
                cityPopup.value?.classList.add("enter");
            }, 1000);
        }
    })
</script>


<template>
    <div class="popup_backdrop" @click.self="$emit('close')">
        <div class="popup_content" v-if="city" ref="cityPopup">
            <!-- main story-->

            <div class="story_overlay">
                <DataStory :city-data="city"></DataStory>
            </div>


            <!-- popup footer-->
            <div class="popup_footer">
                <div class="index">
                     {{ (cities.findIndex(c => (c.id && city?.id && c.title === city?.title)) + 1) + " / " + cities.length }}
                </div>
                <div class="prev_next_btns">
                    <div class="prev" @click="switchCity(-1, city)">
                        <ChevronLeft :size="24"></ChevronLeft>
                    </div>
                    <div class="next" @click="switchCity(1, city)">
                        <ChevronRight :size="24"></ChevronRight>
                    </div>
                </div>
                <h2>{{city.title}}</h2>
                <div class="wave_img">
                    <img src="images/icons/pink_wave.png"/>
                </div>
            </div>
        </div>
  </div>
</template>

<style lang="scss" scoped>
        .popup_backdrop {
            position:fixed;
            top:0;
            left:0;
            width:100vw;
            height:100vh;
            .popup_content {
                width:100%;
                height:100%;

                .story_overlay {
                    width:100%;
                    height:100%;
                }
                
                .popup_footer {
                    display:none;
                    //display:flex;
                    flex-flow:row wrap;
                    justify-content: flex-end;
                    align-items: center;
                    position: absolute;
                    width:100%;
                    bottom:30px;
                    right:0;
                    z-index:10;

                    .prev_next_btns {
                        display:flex;
                        flex-flow:row wrap;
                        justify-content: space-around;
                        margin:0px 10px;
                        color:$color1;

                        .prev, .next {
                            padding:5px;
                            box-sizing: border-box;
                            border-radius:5px;
                            border:1px solid $color1;
                            margin:3px;

                            &:hover {
                                cursor:pointer;
                                background:$color1;
                                color:$color3;
                            }
                        }
                    }

                    .wave_img {
                        flex:0 0 100px;

                        img {
                            width:100%;
                            height:auto;
                        }
                    }

                    h2 {
                        flex:0 0 auto;
                        color:$color1;
                        font-size:300%;
                        font-family:$cairo-base;
                        font-weight:"bold";
                        text-transform:uppercase;
                        line-height: 100%;
                        margin: 0 20px 0 0;
                    }

                    
                    @media(max-height:1280px) { 
                        h2 {
                            font-size: 240%;
                        }

                        .wave_img {
                            flex:0 0 80px;
                        }
                    }
                }

                &.enter {
                    transform:translateX(0);
                    transition:0.5s;

                    .abstract {
                        filter:blur(0) !important;
                        opacity:1 !important;
                        transform:translateY(0) !important;
                        transition: opacity 3s ease 1s, filter 3s ease 1s, transform 5s ease;
                    }
                }
            }
        }
</style>