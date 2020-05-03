export {
  losePoint,
  endGame,
  generateRandomPosition,
  isMobile,
  updateStartButton,
  initSounds,
} from "./game.js";

export { loadPoseNet, guiState } from "./posenet.js";

export {
  fruitsModels,
  commonFruitProperties,
  trailOptions,
  scoreDivContent,
  canvas,
  flipHorizontal,
} from "./constants.js";

export {
  initScene,
  initRenderer,
  initLights,
  loadFruitsModels,
  generateFruits,
  render,
  resetCamera,
  initSceneGeometry,
  initTrailRenderers,
  draw3DHand,
  animate,
  camera,
} from "./scene.js";
