import * as THREE from "three";

export function updatePointVisibility(globe) {
    const camera = globe.camera();
    const customLayerObjects = globe.customLayerData();
    const globeCenter = new THREE.Vector3(0, 0, 0);
    const cameraToCenter = camera.position.distanceTo(globeCenter);

    requestAnimationFrame(() => updatePointVisibility(globe));

    customLayerObjects.forEach((point) => {
        const pointGroup = globe.scene().getObjectByName(`point-${point.title}`);

        if (!pointGroup) return;

        if (!(pointGroup instanceof THREE.Group)) return;

        const icon = pointGroup.getObjectByName("icon");
        const beam = pointGroup.getObjectByName("beam");

        if (icon && beam) {
            const distanceToPoint = camera.position.distanceTo(pointGroup.position);
            const isVisible = distanceToPoint < cameraToCenter * 0.8;

            icon.visible = isVisible;
            beam.visible = !isVisible;
        }
        
    });
}