<script setup></script>

<template>
    <div class="sinking_cities_logo">
        <img src="images/icons/waves_yellow.png"/>
        <h1>Sinking Cities</h1>
    </div>
</template>

<style lang="scss" scoped>
    .sinking_cities_logo {
        display:flex;
        flex-flow:row wrap;
        justify-content: flex-start;
        align-items: center;
        position: absolute;
        bottom:10px;
        left:0;

        img {
            width:100px;
            height:auto;
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
</style>