import { ref } from "vue";

const popupActive = ref(false);

function togglePopupState(state) {
    popupActive.value = state;
}

export function usePopupState () {
    return {
        popupActive,
        togglePopupState
    }
}