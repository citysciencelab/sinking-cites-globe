import * as THREE from "three";
import { getPointScreenPosition } from "./getPointOnScreen";

/**
 * Creates labels for all visible cities in the camera center.
 * @param {Object} options
 * @param {HTMLElement} options.containerEl
 * @param {Object} options.globeInstance
 * @param {Array} options.points - Array with points {lat, lng, title}
 * @param {Number} [options.radius=100] - Globe radius
 * @param {Number} [options.focusThreshold=0.05] - Fokus-Radius (Anteil vom Globe-Radius)
 */
export function initPointLabelOverlay({
  containerEl,
  globeInstance,
  points,
  radius = 100
}) {
  if (!containerEl || !globeInstance || !points?.length) return;

  const camera = globeInstance.camera();
  const canvas = globeInstance.renderer().domElement;

  // label per point
  const labels = points.map((p) => {
    const el = document.createElement("div");
    el.classList = "pointlabel";
    el.style.position = "absolute";
    el.style.color = "#f3e7ae";
    el.style.fontSize = "20px";
    el.style.fontWeight = "bold";
    el.style.transform = "translateX(-50%)";
    el.style.pointerEvents = "none";
    el.style.textTransform = "uppercase";
    el.style.zIndex = "999";
    el.style.textShadow = "2px 2px rgba(0,0,0,0.8)";
    el.style.display = "none";
    el.textContent = p.title;
    containerEl.appendChild(el);
    return { point: p, el };
  });

  const updateLabels = () => {
    requestAnimationFrame(updateLabels);

    const focusVec = new THREE.Vector3();
    camera.getWorldDirection(focusVec);
    focusVec.add(camera.position); // Zielpunkt vor der Kamera

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    for (const { point, el } of labels) {
      const {x, y} = getPointScreenPosition(point, radius, camera, canvas);
      const focusSize = 250;
      const isFocused = Math.abs(x - width / 2) <= focusSize && Math.abs(y - height / 2) <= focusSize;

      if (isFocused) {
        // const projected = pointVec.clone().project(camera);

        el.style.left = `${x}px`;
        el.style.top = `${y + 30}px`;
        el.style.display = "block";
      } else {
        el.style.display = "none";
      }
    }
  };

  updateLabels();
}
