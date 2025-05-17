import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Shaders
import firefliesVertexShader from './shaders/fireflies/vertex.glsl';
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl';

//Portal
import portalVertexShader from './shaders/portal/vertex.glsl';
import portalFragmentShader from './shaders/portal/fragment.glsl';

/**
 * Base
 */
// Debug
const debugObject = {};
const gui = new GUI({
  width: 400,
});

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('draco/');

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Textures
 * */
const bakedTexture = textureLoader.load('baked.jpg');
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * Materials
 */
// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({
  map: bakedTexture,
});

// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({
  // 0xffffe5
  // 0xff8d00
  color: 0xffffe5,
});

// Portal color material
debugObject.portalColorStart = '#000000';
debugObject.portalColorEnd = '#ffffff';

gui.addColor(debugObject, 'portalColorStart').onChange(() => {
  portalMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart);
});
gui.addColor(debugObject, 'portalColorEnd').onChange(() => {
  portalMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd);
});

const portalMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
    uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
  side: THREE.DoubleSide,
});

/**
 * Load model
 */
gltfLoader.load('portal.glb', (gltf) => {
  const bakedMesh = gltf.scene.children.find((child) => child.name === 'baked');
  bakedMesh.material = bakedMaterial;

  const poleLightRightMesh = gltf.scene.children.find(
    (child) => child.name === 'poleLightRight'
  );
  poleLightRightMesh.material = poleLightMaterial;

  const poleLightLeftMesh = gltf.scene.children.find(
    (child) => child.name === 'poleLightLeft'
  );
  poleLightLeftMesh.material = poleLightMaterial;

  const portalMesh = gltf.scene.children.find(
    (child) => child.name === 'portalLight'
  );
  portalMesh.material = portalMaterial;

  scene.add(gltf.scene);
});

/**
 * Fireflies
 */
// Geomtry
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 30;
const positionArray = new Float32Array(firefliesCount * 3);
// we provide 1 value of scale for each of the fireflies
const scaleArray = new Float32Array(firefliesCount * 1);

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 1.5;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;

  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positionArray, 3)
);
firefliesGeometry.setAttribute(
  'aScale',
  new THREE.BufferAttribute(scaleArray, 1)
);

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 100 },
    uTime: { value: 0 },
  },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
});

gui
  .add(firefliesMaterial.uniforms.uSize, 'value', 0, 500)
  .name('Fireflies size');

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
fireflies.position.set(0, 0, 0);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update fireflies
  fireflies.material.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

debugObject.clearColor = '#201919';
renderer.setClearColor(debugObject.clearColor);
gui.addColor(debugObject, 'clearColor').onChange((value) => {
  renderer.setClearColor(value);
});

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update fireflies
  fireflies.material.uniforms.uTime.value = elapsedTime;

  // update portal
  portalMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
