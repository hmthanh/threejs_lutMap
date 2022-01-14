import "regenerator-runtime/runtime";
import * as THREE from "./three.module.js";

import Stats from "./stats.module.js";
import { GUI } from "./lil-gui.module.min.js";
import { OrbitControls } from "./OrbitControls.js";
import { GLTFLoader } from "./GLTFLoader.js";
import { RGBELoader } from "./RGBELoader.js";
import { EffectComposer } from "./EffectComposer.js";
import { RenderPass } from "./RenderPass.js";
import { ShaderPass } from "./ShaderPass.js";
import { LUTPass } from "./LUTPass.js";
import { LUTCubeLoader } from "./LUTCubeLoader.js";
import { LUT3dlLoader } from "./LUT3dlLoader.js";
import { GammaCorrectionShader } from "./GammaCorrectionShader.js";
import DamagedHelmet from "../assets/models/DamagedHelmet.glb";
import royal_esplanade_1k from "../assets/textures/royal_esplanade_1k.hdr";
import Bourbon from "../assets/luts/Bourbon 64.CUBE";
import Chemical from "../assets/luts/Chemical 168.CUBE";
import Clayton from "../assets/luts/Clayton 33.CUBE";
import Cubicle from "../assets/luts/Cubicle 99.CUBE";
import Remy from "../assets/luts/Remy 24.CUBE";
import Presetpro from "../assets/luts/Presetpro-Cinematic.3dl";

const params = {
  enabled: true,
  lut: "Bourbon 64.CUBE",
  intensity: 1,
  use2DLut: false,
};

const lutMap = {
  "Bourbon 64.CUBE": null,
  "Chemical 168.CUBE": null,
  "Clayton 33.CUBE": null,
  "Cubicle 99.CUBE": null,
  "Remy 24.CUBE": null,
  "Presetpro-Cinematic.3dl": null,
};

let gui;
let camera, scene, renderer;
let composer, lutPass;

init();
// render();

function init() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.25,
    20
  );
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new THREE.Scene();

  new RGBELoader().load(royal_esplanade_1k, function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    scene.background = texture;
    scene.environment = texture;

    // model

    const loader = new GLTFLoader();
    loader.load(DamagedHelmet, function (gltf) {
      scene.add(gltf.scene);
    });
  });

  let cubeLoader = new LUTCubeLoader();
  cubeLoader.load(Bourbon, function (result) {
    lutMap["Bourbon 64.CUBE"] = result;
  });
  cubeLoader.load(Chemical, function (result) {
    lutMap["Chemical 168.CUBE"] = result;
  });
  cubeLoader.load(Clayton, function (result) {
    lutMap["Clayton 33.CUBE"] = result;
  });
  cubeLoader.load(Cubicle, function (result) {
    lutMap["Cubicle 99.CUBE"] = result;
  });
  cubeLoader.load(Remy, function (result) {
    lutMap["Remy 24.CUBE"] = result;
  });

  let lut3dl = new LUT3dlLoader();
  lut3dl.load(Presetpro, function (result) {
    lutMap["Presetpro-Cinematic.3dl"] = result;
  });

  // "Bourbon 64.CUBE": null,
  // "Chemical 168.CUBE": null,
  // "Clayton 33.CUBE": null,
  // // "Cubicle 99.CUBE": null,
  // "Remy 24.CUBE": null,
  // "Presetpro-Cinematic.3dl"
  // Object.keys(lutMap).forEach((name) => {
  //   if (/\.CUBE$/i.test(name)) {
  //     new LUTCubeLoader().load("../assets/luts/" + name, function (result) {
  //       lutMap[name] = result;
  //     });
  //   } else {
  //     new LUT3dlLoader().load("../assets/luts/" + name, function (result) {
  //       lutMap[name] = result;
  //     });
  //   }
  // });

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  container.appendChild(renderer.domElement);

  const target = new THREE.WebGLRenderTarget({
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    encoding: THREE.sRGBEncoding,
  });

  composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(window.devicePixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass(GammaCorrectionShader));

  lutPass = new LUTPass();
  composer.addPass(lutPass);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 0, -0.2);
  controls.update();

  gui = new GUI();
  gui.width = 350;
  gui.add(params, "enabled");
  gui.add(params, "lut", Object.keys(lutMap));
  gui.add(params, "intensity").min(0).max(1);

  if (renderer.capabilities.isWebGL2) {
    gui.add(params, "use2DLut");
  } else {
    params.use2DLut = true;
  }

  window.addEventListener("resize", onWindowResize);
  render();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

  render();
}



function render() {
  requestAnimationFrame(render);

  lutPass.enabled = params.enabled && Boolean(lutMap[params.lut]);
  lutPass.intensity = params.intensity;
  if (lutMap[params.lut]) {
    const lut = lutMap[params.lut];
    lutPass.lut = params.use2DLut ? lut.texture : lut.texture3D;
  }

  composer.render();
}
