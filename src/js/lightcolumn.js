import * as THREE from "three";

export function makeFancyLightColumn(point) {
  const height = point.size * 5;
  const geometry = new THREE.CylinderGeometry(0.05, 0.05, height, 6, 1, true);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      color: { value: new THREE.Color(point.color) },
    },
    vertexShader: `
      varying float vHeight;
      void main() {
        vHeight = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vHeight;
      void main() {
        float alpha = 1.0 - smoothstep(0.0, 1.0, vHeight);
        gl_FragColor = vec4(color, alpha * 0.6);
      }
    `
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.lookAt(0, 0, 0); // richtet die Säule zum Mittelpunkt aus
  mesh.position.y = height / 2; // damit sie aus der Oberfläche herausragt

  return mesh;
}
