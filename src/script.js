import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * Base
 */
// Debug
const debugObject = {}
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

const portalMaterial = new THREE.MeshBasicMaterial({
  // 0xff00ff
  color: 0xffffff,
  side: THREE.DoubleSide,
});

/**
 * Load model
 */
gltfLoader.load('portal.glb', (gltf) => {
    const bakedMesh = gltf.scene.children.find(child => child.name === 'baked');
    bakedMesh.material = bakedMaterial;

    const poleLightRightMesh = gltf.scene.children.find(child => child.name === 'poleLightRight');
    poleLightRightMesh.material = poleLightMaterial;

    const poleLightLeftMesh = gltf.scene.children.find(child => child.name === 'poleLightLeft');
    poleLightLeftMesh.material = poleLightMaterial;

    const portalMesh = gltf.scene.children.find(child => child.name === 'portalLight');
    portalMesh.material = portalMaterial;

    scene.add(gltf.scene);
});

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

debugObject.clearColor = '#201919'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor').onChange(value => {
  renderer.setClearColor(value)
})

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
