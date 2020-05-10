import {
  isMobile,
  loadPoseNet,
  updateStartButton,
  canvas,
  initScene,
  initRenderer,
  initLights,
  loadFruitsModels,
  initSounds,
  render,
  resetCamera,
  initSceneGeometry,
  initTrailRenderers,
  animate,
  camera,
} from "./utils/index.js";
import { backgroundNoise } from "./utils/game.js";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.onload = async () => {
  isMobile() && displayMobileScreen();

  initSounds();

  await loadPoseNet();

  initScene();
  initRenderer();
  initLights();
  loadFruitsModels();

  initSceneGeometry(function () {
    initTrailRenderers();
    updateStartButton();
  });
};

document.getElementsByTagName("button")[0].onclick = () => {
  document.getElementsByClassName("intro")[0].style.display = "none";
  document.getElementsByClassName("score")[0].style.display = "block";
  backgroundNoise.play();
  animate();
};

const displayMobileScreen = () => {
  const introSection = document.getElementsByClassName("intro")[0];
  introSection.style.display = "none";

  const mobileIntroSection = document.getElementsByClassName("mobile-intro")[0];
  mobileIntroSection.style.display = "block";
  return;
};

window.addEventListener(
  "resize",
  () => {
    camera && resetCamera();
    render();
  },
  false
);

console.log(
  "%c%s",
  "color: white; background: purple; font-size: 18px;",
  " Made by Charlie Gerard 🎉",
  "https://twitter.com/devdevcharlie"
);
