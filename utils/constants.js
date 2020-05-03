export const fruitsModels = [
  { model: "banana/Banana_01", material: "banana/Banana_01", name: "banana" },
  { model: "apple/Apple_01", material: "apple/Apple_01", name: "apple" },
  {
    model: "bomb/bomb",
    material: "bomb/bomb",
    name: "bomb",
  },
];

export const commonFruitProperties = {
  soundPlayed: false,
  direction: "up",
  hit: false,
  speed: 6,
  banana: {
    thresholdTopY: 200,
  },
  bomb: {
    thresholdTopY: 150,
  },
  apple: {
    thresholdTopY: 150,
  },
};

export const trailOptions = {
  headRed: 1.0,
  headGreen: 0.0,
  headBlue: 1.0,
  headAlpha: 0.75,
  tailRed: 0.0,
  tailGreen: 1.0,
  tailBlue: 1.0,
  tailAlpha: 0.35,
  trailLength: 7,
  textureTileFactorS: 10.0,
  textureTileFactorT: 0.8,
  dragTexture: false,
  depthWrite: false,
};

export const scoreDivContent = document.getElementsByClassName(
  "score-number"
)[0];
export const canvas = document.getElementById("output");
export const flipHorizontal = false;
