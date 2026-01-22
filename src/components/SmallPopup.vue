<script setup>
    import { onMounted, ref, watch, defineProps } from "vue";
    import { directus } from "@/js/directus";
    import { readItems } from "@directus/sdk";
    import { loadHeritageGeojson } from "@/composables/useGeoJson";

    const props = defineProps({
        title: String,
        narrow: Boolean
    });

    // check img src for link on hover
    const linkHover = ref(false);
    
    const heritageCategoryColor = ref({
        heritage: "#F59A84",
        sci_resourc: "#84F5CE",
        other: "#A284F5"
    })

    // eslint-disable-next-line
    const emit = defineEmits(["close"]);

    const smallPopup = ref(null);
    const heritage = ref(null);

    const loadHeritageData = async () => {
        if (!props.title) return;
        const result = await directus.request(readItems("cultural_heritages", {
            filter: { title: { _eq: props.title } },
            limit: 1
        }));
        heritage.value = result[0];

        if (heritage.value.geojson) {
            console.log("this happens", heritage.value.geojson)
            loadHeritageGeojson(heritage.value.geojson);
        }
    };

    onMounted(() => {
        loadHeritageData();
    });
    watch(() => props.title, loadHeritageData);
    watch(() => heritage.value, async (val) => {
        if (val) {
            // removing popup class to enable css enter transition
            smallPopup.value?.classList.remove("enter");

            // add enter class again
            setTimeout(function() {
                smallPopup.value?.classList.add("enter");
            }, 400);
        }
    })
</script>


<template>
    <div
        class="small_popup_backdrop"
        @click.self="$emit('close')"
        :class="{narrow: props.narrow}"    
    >
        <div class="small_popup_content" v-if="heritage" ref="smallPopup">
            <div class="small_popup_wrapper">
                <div class="popup_close"></div>
                <div class="small_header" :class="{small: !heritage.image}">
                        <div class="icon_box">
                            <img class="icon_left" :src="`images/icons/${heritage.category}_icon_2.png`" />
                        </div>
                        <div class="tags_year">
                            <div v-if="heritage.tags" class="tags">
                                <li
                                    v-for="(tag, index) in heritage.tags?.split(',')"
                                    :key="index"
                                >
                                    {{ tag.trim() }}
                                </li>
                            </div>
                            <div v-if="heritage.year" class="year">
                                <span><img src="/images/icons/year.png"></span>{{  heritage.year }}
                            </div>
                        </div>
                        <img v-if="heritage.image" class="small_title_img" :src="`https://admin.sinkingcities.online/assets/${heritage.image}?width=800`"/>
                </div>
                <PerfectScrollbar>
                    <div
                        class="body"
                        :class="{bottom_space: heritage.link_for_more_information}"
                    >
                        <h2>{{ heritage?.title }}</h2>
                        <div v-if="heritage" v-html="heritage.text" class="heritage_content"></div>
                        <p v-else>Lade Daten...</p>
                    </div>
                </PerfectScrollbar>
            </div>

            <div class="popup_footer" v-if="heritage.link_for_more_information">
                <a 
                    :style="{
                        backgroundColor: heritageCategoryColor[heritage.category]
                    }"
                    :href="heritage.link_for_more_information" target="_blank"
                    @mouseenter="linkHover = true"
                    @mouseleave="linkHover = false"
                    @focus="linkHover = true"
                    @blur="linkHover = false"    
                >Click here for more information</a>
                <img
                    :src="linkHover
                        ? 'images/icons/blue_wave.png'
                        : `images/icons/${heritage.category}_wave.png`"
                />
            </div>
        </div>
  </div>
</template>

<style lang="scss">
    .small_popup_backdrop {
        position: fixed;
        inset: 0;
        // background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;

        &.narrow {
            width:35vw;
            backdrop-filter: blur(3px);
            background:rgba(0,0,0,0.5);

            .small_popup_content {
                left:50%;
            }

            @media(max-width:1499px) {
                width:100vw;
                background:transparent;

                .small_popup_content {
                    left:25%;
                }
            }
        }
        

        @media(max-width:500px) {
            backdrop-filter: blur(10px);
        }
    }

    .small_popup_content {
        background: rgba(5,5,21,0.85);
        position:absolute;
        top:50%;
        left:75%;
        width:30vw;
        height:auto;
        max-height:80vh;
        min-width:480px;
        max-width:700px;
        height:auto;
        border-radius:10px;
        backdrop-filter:blur(5px);
        transform:translateX(-50%) translateY(40px);
        opacity:0;
        transition:0.3s;
        box-sizing:border-box;
        overflow: hidden;
        @include dropshadow();


        .small_popup_wrapper {
            max-height:80vh;
            overflow:hidden;
        }

        .small_header {
            position: relative;
            width:100%;
            height:300px; 
            max-height: 30vh;
            overflow:hidden;

            @media(max-height:768px) {
                height:200px;
            }

            &:after {
                content:"";
                position:absolute;
                top:100%;
                left:0;
                height:150px;
                width:100%;
                background:linear-gradient(180deg, rgba(5,5,21,0.85), rgba(5,5,21,0));
                z-index:10;
            }

            &.small {
                height:80px;
            }

            .icon_box {
                width:80px;
                height:40px;
                position:absolute;
                left:0;
                z-index:5;
                padding:20px 20px 20px 0px;
                background: rgba(4,4,35,0.9);
                //border-top-right-radius: 10px;
                border-bottom-right-radius: 30px;

                .icon_left {
                    width:80px;
                    height:auto;
                }
            }

            .tags_year {
                position:absolute;
                right: 10px;
                top: 10px;
                display:flex;
                flex-flow:row wrap;

                .tags {
                    list-style: none;
                    display: flex;
                    flex-flow:row wrap;
                    justify-content: flex-start;                    
                    
                    li {
                        background: rgba(0, 0, 0, 0.65);
                        padding: 5px 10px;
                        font-size: 90%;
                        color:$color1;
                        margin: 0px 3px;
                        backdrop-filter: blur(3px);
                        border-radius: 5px;
                    }
                }

                .year {
                    display:flex;
                    flex-flow:row wrap;
                    align-items: center;
                    background:rgba($color_blue,0.75);
                    backdrop-filter: blur(3px);
                    padding:3px;
                    font-size: 90%;
                    color:$color1;
                    border:1px solid $color1;
                    border-radius:5px 10px;
                    margin:0px 3px;

                    img {
                        width:20px;
                        height:20px;
                    }
                }
            }

            .small_title_img {
                width:100%;
                height:100%;
                object-fit:cover;
            }

            @media(max-width:1279px) {
                .icon_box {
                    transform: scale(0.75);
                    transform-origin: top left;
                }
            }
        }

        .ps {
            height:auto;
            max-height:500px;
            padding:100px 50px;

            @media(max-height:1024px) {
                max-height:400px;
                padding:50px 50px;
            }
            
            @media(max-height:768px) {
                padding:30px 50px;
            }

            @media(max-width:500px) {
                padding:10px 20px;
            }
        }

        .body {
            // padding:100px 50px;
            &.bottom_space {
                padding-bottom:100px;

                @media(max-width:1183px) {
                    padding-bottom:200px;
                }
            }
            // overflow:auto;

            h2 {
                width:100%;
                text-align:left;
                color: $color1;
                text-transform:uppercase;
                font-size:200%;
                font-weight:bold;
                font-family:$cairo-base;

                @media(max-width:1024px) {
                    font-size:160%;
                    margin:5px 0px;
                }
            }

            
            .heritage_content {
                text-align:left;
                font-size:130%;
                font-family:$cairo-base;
                line-height:130%;
                color: $pcolor;

                strong {
                    color:whitesmoke;
                }

                a {
                    color:$color_gold;
                }

                :deep(p) {
                    text-align:left;
                    font-size:130%;
                    font-family:$cairo-base;
                    line-height:130%;
                    color: $pcolor;
                    
                    strong {
                        color:whitesmoke;
                    }

                    @media(max-width:1279px) {
                        font-size:110%;
                        line-height:110%;
                    }

                    @media(max-width:1024px) {
                        font-size:105%;
                        line-height:105%;
                    }

                    @media(max-width:500px) {
                        font-size:100%;
                        line-height:100%;
                    }
                }

                @media(max-width:1372px) {
                    :deep(h2) {
                        font-size:150%;
                    }
                }

                
                @media(max-width:1279px) {
                    :deep(h2) {
                        font-size:130%;
                    }
                    
                    font-size:110%;
                    line-height:110%;
                }

                
                @media(max-width:1024px) {
                    font-size:105%;
                    line-height:105%;
                }

                @media(max-width:500px) {
                    font-size:100%;
                    line-height:100%;
                }
            }
        }

        .popup_footer {
            display:flex;
            width:100%;
            flex-flow:row wrap;
            justify-content: flex-end;
            align-items: center;
            position: absolute;
            bottom:0px;
            padding:10px 0px;
            background:rgba(5,5,21,0.85);
            backdrop-filter: blur(2px);
            right:0;

            &:before {
                content:"";
                position:absolute;
                bottom:100%;
                left:0;
                height:150px;
                width:100%;
                background:linear-gradient(180deg, rgba(5,5,21,0), rgba(5,5,21,0.85));
                z-index:10;

                @media(max-height:800px) {
                    height:50px;
                }
            }

            img {
                width:150px;
                height:auto;
            }

            a {
                margin-right:0px;
                height:70px;
                padding:20px 20px;
                box-sizing: border-box;
                color: $color4;
                border-radius:5px;
                text-decoration: none;
                text-transform: uppercase;
                font-weight:700;
                font-family:$cairo-base;

                &:hover {
                    background:#3d5b99!important;
                    color:whitesmoke;
                }
            }

            @media(max-width:1919px) {
                img {
                    width:80px;
                }

                a {
                    height:50px;
                    padding:10px 20px;
                }
            }

            @media(max-width:1024px) {
                  transform: scale(0.75);
                transform-origin: bottom right;
                width: 200%;
            }

            @media(max-width:500px) {
                img {
                    display:none;
                }

                a {
                    margin:0px auto;
                }
            }
        }

        &.enter {
            transform:translateX(-50%) translateY(-50%);
            opacity:1;
            transition:opacity 0.5s linear, transform 0.8s ease;
        }

        @media(max-width:1180px) {
            left:auto;
            right:50px;
            max-height: calc(100vh - 200px);
            top: 45%;
            transform:translateX(0) translateY(-50%) !important;
        }
        @media(max-width:500px) {
            left:2.5%;
            right:2.5%;
            width:95%;
            min-width:0px;
            max-width:100%;
            transform:translateY(-50%) !important;
        }
    }
</style>