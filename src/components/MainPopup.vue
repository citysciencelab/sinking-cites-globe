<script setup>
    import { onMounted, ref, watch, defineProps} from "vue";
    import { useCities } from "@/composables/useCities";
    import { useAudio } from "@/composables/useAudio";
    import { useMapControls } from "@/composables/useMapControls";
    import { ObserveVisibility } from "vue3-observe-visibility";
    import ChevronLeft from "vue-material-design-icons/ChevronLeft.vue";
    import ChevronRight from "vue-material-design-icons/ChevronRight.vue";

    // swiper imports
    import { Swiper, SwiperSlide } from "swiper/vue";
    import "swiper/css";
    import "swiper/css/autoplay";
    import { Autoplay } from "swiper/modules";

    const props = defineProps({
        title: String
    });

    // eslint-disable-next-line
    const emit = defineEmits(["close"]);

    // scroll observer and animations
    const vObserveVisibility = ObserveVisibility;
    const scrollerRef = ref(null);
    const visOpts = ref(null);

    const cityPopup = ref(null);
    const city = ref(null);
    const baseUrl = "https://admin.sinkingcities.online";

    const { cities, loadCityData } = useCities();
    const { setSource } = useAudio();
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
    
    function assetUrl(id) {
        return `${baseUrl}/assets/${id}?format=webp&quality=85`;
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

             console.log("city data", val);
            if (val.audio_1) {
                const audioSrc = "https://admin.sinkingcities.online/assets/" + val.audio_1;
                setSource(audioSrc);
            }

            setTimeout(function() {
                cityPopup.value?.classList.add("enter");
            }, 1000);
        }
    })
</script>


<template>
    <div class="popup_backdrop" @click.self="$emit('close')">
        <div class="popup_content" v-if="city" ref="cityPopup">
            <PerfectScrollbar>
                <div class="popup_wrapper" ref="scrollerRef">
                    <div class="header">
                        <div class="titles">
                            <h2 :style="{color: city.city_color}">{{ city.title }}</h2>
                            <h3 v-if="city.sub_title">{{ city.sub_title }}</h3>
                        </div>
                        <template v-if="city.intro_video">
                            bla
                        </template>
                        <template v-else>
                           <img
                                class="title_img"
                                :src="`https://admin.sinkingcities.online/assets/${city.title_img}`"
                            />
                        </template>
                    </div>
                    <div class="body" v-if="city">
                        <div v-if="city.abstract" class="abstract">
                            <p>{{ city.abstract }}</p>
                        </div>
                        <div
                            v-if="city.content_block_1"
                            class="cnt_1 cnt_block el"
                            v-html="city.content_block_1"
                            v-observe-visibility="visOpts"    
                        ></div>
                        <Swiper
                            v-if="city.gallery_1"
                            :modules="[Autoplay]"
                            :slides-per-view="'auto'"
                            :space-between="20"
                            :loop="true"
                            :autoplay="{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true }"
                            :speed="15000"
                            :allow-touch-move="false"
                            free-mode
                            class="auto_swiper"
                        >
                            <SwiperSlide
                                v-for="(img, i) in city.gallery_1"
                                :key="i"
                                class="!w-auto auto_swiper_slide"
                            >
                                <img
                                    :src="assetUrl(img.directus_files_id)"
                                    :alt="`gallery-${i}`"
                                    class="w-auto object-contain"
                                    loading="lazy"
                                />
                            </SwiperSlide>
                        </Swiper>
                        <div
                            v-if="city.findings"
                            class="findings intermezzo el"
                            v-observe-visibility="visOpts"       
                        >
                            <p>{{ city.findings }}</p>
                        </div>
                        <div
                            v-if="city.content_block_2"
                            class="cnt_2 cnt_block el"
                            v-html="city.content_block_2"
                            v-observe-visibility="visOpts"       
                        ></div>
                        <Swiper
                            v-if="city.gallery_2"
                            :modules="[Autoplay]"
                            :slides-per-view="'auto'"
                            :space-between="20"
                            :loop="true"
                            :autoplay="{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true, reverseDirection: true }"
                            :speed="15000"
                            :allow-touch-move="false"
                            free-mode
                            class="auto_swiper"
                        >
                            <SwiperSlide
                                v-for="(img, i) in city.gallery_2"
                                :key="i"
                                class="!w-auto auto_swiper_slide"
                            >
                                <img
                                    :src="assetUrl(img.directus_files_id)"
                                    :alt="`gallery-${i}`"
                                    class="w-auto object-contain"
                                    loading="lazy"
                                />
                            </SwiperSlide>
                        </Swiper>
                        <div
                            v-if="city.content_block_3"
                            class="cnt_3 cnt_block el show"
                            v-html="city.content_block_3"
                            v-observe-visibility="visOpts"
                        ></div>
                        <Swiper
                            v-if="city.gallery_3"
                            :modules="[Autoplay]"
                            :slides-per-view="'auto'"
                            :space-between="20"
                            :loop="true"
                            :autoplay="{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true }"
                            :speed="15000"
                            :allow-touch-move="false"
                            free-mode
                            class="auto_swiper"
                        >
                            <SwiperSlide
                                v-for="(img, i) in city.gallery_3"
                                :key="i"
                                class="!w-auto auto_swiper_slide"
                            >
                                <img
                                    :src="assetUrl(img.directus_files_id)"
                                    :alt="`gallery-${i}`"
                                    class="w-auto object-contain"
                                    loading="lazy"
                                />
                            </SwiperSlide>
                        </Swiper>
                        <div v-if="city.climate_findings" class="climate_findings findings intermezzo el" v-html="city.climate_findings">
                        </div>
                    </div>
                    <img class="waves_gif" src="/images/gifs/waves.gif" />
                </div>
            </PerfectScrollbar>
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
        position: fixed;
        inset: 0;
        // background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        width:65vw;
        right:0;
        left:auto;
        top:0;
    }

    .popup_content {
        background: $color3;
        position:absolute;
        top:0;
        right:0;
        width:100%;
        height:100vh;
        transform:translateX(100%);
        box-sizing:border-box;
        overflow-y: auto;
        overflow:hidden;
        transition:0.3s;

        /*h2 {
            position:absolute;
            top:20px;
            left:50px;
            text-transform:uppercase;
            font-size:200%;
            font-weight:bold;
        }*/

        .header {
            position:relative;
            z-index:3;

            .titles {
                position:absolute;
                width:100%;
                top:50%;
                left:0;
                transform:translateY(-50%);
                z-index:5;

                h2 {
                    color:$color1;
                    text-align:center;
                    text-transform: uppercase;
                    font-family:$cairo_base;
                    text-shadow:5px 5px $color4;
                    font-size:600%;
                    line-height:100%;
                    margin:0;
                }

                h3 {
                    color:$color4;
                    text-shadow:1px 1px $color1;
                    text-transform:uppercase;
                    font-family:$cairo_base;
                    font-size:290%;
                    margin:0;
                }

                @media(max-width:1280px) {
                    h2 {font-size:480%}
                    h3 {font-size:200%}
                }
            }

            .title_img {
                width:100%;
                height:auto;
                max-height:75vh;
                object-fit:cover;
                overflow: clip;
                filter:saturate(0.5);
            }

            &:after {
                content:"";
                position:absolute;
                left:0;
                top:0;
                width:100%;
                height:100%;
                background:linear-gradient(180deg, rgba(0,0,18,0), rgba(0,0,18,0.3), rgb(0,0,18,1));
            }
        }

        .ps {
            height:100vh;
        }

        .popup_wrapper {
            position:relative;
            width:100%;
            height:100%;
            // overflow:auto;

            .body {
                position:relative;
                padding:30px;
                height:auto;
                box-sizing: border-box;
                z-index:3;

                .el {
                    margin:10vh auto;

                    :deep(h3) {
                        font-size:160%;
                        font-weight:900;
                        text-transform: uppercase;
                        font-family:$cairo-base;
                        width:80%;
                        max-width:1024px;
                        margin:50px auto;
                        color:whitesmoke;
                    }

                    :deep(p) {
                        width:80%;
                        max-width:1024px;
                        text-align:left;
                        font-size:150%;
                        font-family:$cairo-base;
                        line-height:120%;
                        color: $pcolor;
                        margin:50px auto;

                        strong {
                            color:$color1;
                            line-height:200%;
                        }

                        @media(max-width:1280px) {
                            font-size:120%;
                        }
                    }

                    &.intermezzo {
                        width:calc(100% + 100px);
                        margin-left:-50px;
                        background:$color_blue;
                        padding:100px 30px;
                    }

                    &.cnt_block {
                        :deep(img) {
                            max-width:120%;
                            margin-left:-10%;
                            height:auto;
                            object-fit: contain;
                            filter:saturate(0.5);
                            transition:0.5s;

                            &:hover {
                                filter:saturate(0.8);
                                transition:0.5s;
                            }
                        }

                        :deep(video) {
                            width: 68vw;
                            height: auto;
                            position: relative;
                            margin: -250px 0 -250px -12.5vw;
                            /* background: black; */
                            opacity: 0.2;
                            background-blend-mode: screen;
                            z-index: -1;
                        }
                    }
                }
                .abstract {
                    width: 80%;
                    max-width: 1024px;
                    text-align: justify;
                    margin: 50px auto;
                    opacity:0;
                    transform:translateY(80px);
                    filter:blur(10px);

                    p {
                        font-family:$cairo-base;
                        color:$color_pink;
                        font-weight:900;
                        font-size:150%;
                        line-height:120%;
                    }

                    @media(max-width:1280px) {
                        p {
                            font-size:120%;
                            font-weight:700;
                        }
                    }
                }

                .auto_swiper {
                    height:650px;
                    margin:50px auto;
                    background:rgba(0,0,0,0.5);
                    backdrop-filter: blur(5px);

                    @media(max-height:1280px) {
                        height:450px;

                        .auto_swiper_slide {
                            height:450px;

                            img {
                                height:350px;
                            }
                        }
                    }

                    .auto_swiper_slide {
                        width:auto;
                        height:650px;
                        filter:grayscale(1);
                        transition:0.5s;

                        img {
                            margin:50px 0px;
                            height:550px;
                            filter:contrast(1.1);
                            width:auto;
                            transition:0.5s;
                        }

                        &:hover {
                            z-index:5;
                            filter:grayscale(0);

                            img {
                                transform:scale(1.3);
                                @include dropshadow();
                                transition:transform 3s ease, filter 3s ease;
                            }
                        }
                    }
                }

                .auto_swiper :deep(.swiper-wrapper) {
                    transition-timing-function: linear !important;
                }

                .auto_swiper :deep(.swiper-wrapper:hover .swiper-slide img) {
                    filter: blur(4px);
                    transition:transform 3s ease, filter 3s ease;
                }

                .auto_swiper :deep(.swiper-slide:hover img) {
                    filter: blur(0) !important;
                    transition:transform 3s ease, filter 3s ease;
                }

                .cnt_1, .cnt_2, .cnt_3 {
                    opacity:0;
                    transform:translateY(100px);

                    &.show {
                        opacity:1;
                        transform:translateY(0);
                        transition:opacity 3s ease, transform 3s ease;
                    }
                }
            }

            .waves_gif {
                position:absolute;
                top:0;
                left:0;
                width:100%;
                height:100%;
                object-fit:cover;
                z-index:0;
                opacity:0.6;
                filter:blur(10px);
                mix-blend-mode: plus-lighter;
            }
        }

        .popup_footer {
            display:flex;
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
</style>