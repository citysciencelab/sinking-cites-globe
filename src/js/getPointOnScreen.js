import * as THREE from "three";

export function getPointScreenPosition(point, radius, camera, canvas) {
  const latRad = THREE.MathUtils.degToRad(90 - point.lat);
  const lngRad = THREE.MathUtils.degToRad(90 -point.lng);

  const r = radius + (point.size || 0); // Optional Höhe einrechnen

  const x = r * Math.sin(latRad) * Math.cos(lngRad);
  const y = r * Math.cos(latRad);
  const z = r * Math.sin(latRad) * Math.sin(lngRad);

  const position = new THREE.Vector3(x, y, z).project(camera);

  const canvasRect = canvas.getBoundingClientRect();
  const screenX = (position.x + 1) / 2 * canvasRect.width + canvasRect.left;
  const screenY = (-position.y + 1) / 2 * canvasRect.height + canvasRect.top;

  return { x: screenX, y: screenY };
}