import {
  draw3DHand,
  moveHands,
  initRenderer,
  initLights,
  render,
  updateStartButton,
  initTrailOptions,
  loadPoseNet,
  initSounds,
  guiState,
  generateFruits,
  loadFruitsModels,
  onWindowResize,
  initSceneGeometry,
  initScene,
  initTrailRenderers,
  isMobile,
  losePoint,
} from "./utils.js";
const hands = [];
let handMesh;
let scoreDivContent = document.getElementsByClassName("score-number")[0];
let canvas = document.getElementById("output");
const flipHorizontal = false;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

window.onload = async () => {
  if (isMobile()) {
    const introSection = document.getElementsByClassName("intro")[0];
    introSection.style.display = "none";

    const mobileIntroSection = document.getElementsByClassName(
      "mobile-intro"
    )[0];
    mobileIntroSection.style.display = "block";
    return;
  }

  initSounds();

  lastTrailUpdateTime = performance.now();
  lastTrailResetTime = performance.now();

  await loadPoseNet();
  if (video) {
    detectPoseInRealTime(video);
  }

  initScene();
  initRenderer();
  initTrailOptions();
  initLights();
  loadFruitsModels();

  initSceneGeometry(function () {
    initTrailRenderers();
    updateStartButton();
  });
};

const detectPoseInRealTime = async (video) => {
  async function poseDetectionFrame() {
    const imageScaleFactor = guiState.input.imageScaleFactor;
    const outputStride = +guiState.input.outputStride;

    let poses = [];
    let minPoseConfidence;
    let minPartConfidence;
    switch (guiState.algorithm) {
      case "single-pose":
        const pose = await guiState.net.estimateSinglePose(
          video,
          imageScaleFactor,
          flipHorizontal,
          outputStride
        );
        poses.push(pose);

        minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;
        minPartConfidence = +guiState.singlePoseDetection.minPartConfidence;
        break;
    }
    poses.forEach(({ score, keypoints }) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          const leftWrist = keypoints.find((k) => k.part === "leftWrist");
          const rightWrist = keypoints.find((k) => k.part === "rightWrist");

          if (hands.length === 0) {
            if (rightWrist || leftWrist) {
              handMesh = draw3DHand();
              hands.push({
                mesh: handMesh,
                coordinates: rightWrist
                  ? rightWrist.position
                  : leftWrist.position,
                name: rightWrist ? "rightHand" : "leftHand",
              });
              scene.add(handMesh);
            }
          } else {
            hands[0].coordinates =
              hands[0].name === "rightHand"
                ? rightWrist.position
                : leftWrist.position;
          }
        }
      }
    });
    requestAnimationFrame(poseDetectionFrame);
  }
  poseDetectionFrame();
};

const animate = () => {
  frameLoop = requestAnimationFrame(animate);

  var time = performance.now();
  trailTarget && updateTrailTarget(time);

  if (fruitsObjects) {
    fruitsObjects.map((fruit, index) => {
      fruit.rotation.x += 0.1;
      fruit.rotation.y += 0.1;

      if (fruit.direction === "up") {
        fruit.position.y += fruit.speed;
      }
      if (
        fruit.position.y > fruit.thresholdBottomY &&
        !fruit.soundPlayed &&
        fruit.direction === "up"
      ) {
        fruit.name === "bomb" ? bombSlicedSound.play() : newFruitSound.play();
        fruit.soundPlayed = true;
      }

      if (fruit.position.y > fruit.thresholdTopY) {
        fruit.direction = "down";
      }
      if (fruit.direction === "down") {
        fruit.position.y -= fruit.speed;
      }

      if (
        fruit.position.y < fruit.thresholdBottomY &&
        fruit.direction === "down"
      ) {
        scene.remove(fruit);
        fruitsObjects.splice(fruit.index, 1);
        fruit.name !== "bomb" && losePoint();
        !gameOver && generateFruits(1);
      }
    });
  }

  if (hands.length) {
    let hasCollided = moveHands(hands, camera, fruitsObjects);
    //shouldn't be an array.
    if (hasCollided.includes(true)) {
      score += 1;
      scoreDivContent.innerHTML = score;
      fruitSliced.play();
    }
  }

  render();
};

window.addEventListener("resize", onWindowResize, false);

document.getElementsByTagName("button")[0].onclick = () => {
  document.getElementsByClassName("intro")[0].style.display = "none";
  document.getElementsByClassName("score")[0].style.display = "block";
  scene.add(trailTarget);
  animate();
};

const updateTrailTarget = (function updateTrailTarget() {
  var tempRotationMatrix = new THREE.Matrix4();
  var tempTranslationMatrix = new THREE.Matrix4();

  return function updateTrailTarget(time) {
    if (time - lastTrailUpdateTime > 10) {
      trail.advance();
      lastTrailUpdateTime = time;
    } else {
      trail.updateHead();
    }

    tempRotationMatrix.identity();
    tempTranslationMatrix.identity();
  };
})();
