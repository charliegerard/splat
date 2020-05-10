import { frameLoop } from "./scene.js";

let hitScore = 0;

export var newFruitSound;
export var fruitSliced;
export var bombSlicedSound;
export var backgroundNoise;

export const initSounds = () => {
  newFruitSound = new Howl({ src: ["../assets/fruit.m4a"] });
  fruitSliced = new Howl({ src: ["../assets/splash.m4a"] });
  bombSlicedSound = new Howl({ src: ["../assets/bomb-sound.m4a"] });
  backgroundNoise = new Howl({
    src: ["../assets/background-noise.m4a"],
    loop: true,
  });
};

export const losePoint = () => {
  hitScore += 1;
  document.getElementsByClassName(
    "score-number"
  )[1].innerHTML = `${hitScore}/3`;

  hitScore === 3 && endGame();
};

export const endGame = () => {
  document.getElementsByClassName("game-over")[0].style.display = "flex";
  cancelAnimationFrame(frameLoop);
};

export const generateRandomPosition = (min, max) =>
  Math.round(Math.random() * (max - min)) + min;

const isAndroid = () => /Android/i.test(navigator.userAgent);

const isiOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

export const isMobile = () => isAndroid() || isiOS();

export const updateStartButton = () => {
  document.getElementsByTagName("button")[0].innerText = "Start";
  document.getElementsByTagName("button")[0].disabled = false;
};
