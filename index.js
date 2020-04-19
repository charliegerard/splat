import {
  generateRandomSpeed,
  generateRandomXPosition,
  drawKeypoints,
  draw3DHand,
  moveHands,
} from "./utils.js";
const fruits = [];
const hands = [];
let scene;
let fruit;
let speed;
let sound;
let camera;
let handMesh;
let renderer;
const videoWidth = window.innerWidth;
const videoHeight = window.innerHeight;

const fruitsModels = [
  { model: "banana/Banana_01", material: "banana/Banana_01", name: "banana" },
  { model: "apple/Apple", material: "apple/Apple", name: "apple" },
];

const guiState = {
  algorithm: "single-pose",
  input: {
    mobileNetArchitecture: "0.75",
    outputStride: 16,
    imageScaleFactor: 0.5,
  },
  singlePoseDetection: {
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
  },
  output: {
    showVideo: false,
    showPoints: true,
  },
  net: null,
};

const generateFruits = () => {
  for (var i = 0; i < 4; i++) {
    // var geometry = new THREE.BoxGeometry();
    // var material = new THREE.MeshBasicMaterial({
    //   color: 0x00ff00,
    // });
    // cube = new THREE.Mesh(geometry, material);

    const randomFruit = fruitsModels[generateRandomXPosition(0, 1)];

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath("assets/");
    mtlLoader.load(`${randomFruit.material}.mtl`, function (materials) {
      materials.preload();

      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath("assets/");
      objLoader.load(`${randomFruit.model}.obj`, function (object) {
        fruit = object;

        fruit.position.x = generateRandomXPosition(-7, 7);
        fruit.position.y = generateRandomXPosition(-10, -5);

        fruit.rotation.set(-7.5, 2.5, -5);

        if (randomFruit.name === "apple") {
          fruit.scale.set(0.005, 0.005, 0.005);
        } else {
          fruit.scale.set(0.015, 0.015, 0.015);
        }

        speed = 0.05;
        fruit.speed = speed;
        fruit.name = "fruit";
        fruit.soundPlayed = false;
        fruit.direction = "up";
        fruits.push(fruit);

        scene.add(fruit);
        renderer.render(scene, camera);
      });
    });

    // cube.position.x = generateRandomXPosition(-10, 10);
    // cube.position.y = generateRandomXPosition(-10, -5);
    // speed = 0.05;
    // cube.speed = speed;
    // geometry.name = "fruit";
    // cube.soundPlayed = false;
    // cube.direction = "up";
    // cubes.push(cube);
    // scene.add(cube);
  }
};

const setupLights = () => {
  let ambientLight = new THREE.AmbientLight(
    new THREE.Color("rgb(255,255,255)")
  );
  ambientLight.position.set(10, 0, 50);
  scene.add(ambientLight);

  let spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(10, 0, 50);
  spotLight.castShadow = true;
  scene.add(spotLight);
};

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }

  const video = document.getElementById("video");
  video.width = videoWidth;
  video.height = videoHeight;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: videoWidth,
      height: videoHeight,
    },
  });
  video.srcObject = stream;

  return new Promise(
    (resolve) => (video.onloadedmetadata = () => resolve(video))
  );
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById("output");
  const ctx = canvas.getContext("2d");
  // since images are being fed from a webcam
  const flipHorizontal = false;

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  async function poseDetectionFrame() {
    // Scale an image down to a certain factor. Too large of an image will slow
    // down the GPU
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

    ctx.clearRect(0, 0, videoWidth, videoHeight);

    poses.forEach(({ score, keypoints }) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          const leftWrist = keypoints.find((k) => k.part === "leftWrist");
          const rightWrist = keypoints.find((k) => k.part === "rightWrist");

          // drawKeypoints([rightWrist, leftWrist], minPartConfidence, ctx);

          if (leftWrist) {
            const hasLeftHand = hands.find((hand) => hand.name === "leftHand");

            if (!hasLeftHand) {
              handMesh = draw3DHand();
              hands.push({
                mesh: handMesh,
                coordinates: leftWrist.position,
                name: "leftHand",
              });
              scene.add(handMesh);
            }

            const leftHandIndex = hands.findIndex(
              (hand) => hand.name === "leftHand"
            );

            leftHandIndex !== -1 &&
              (hands[leftHandIndex].coordinates = leftWrist.position);
          }

          if (rightWrist) {
            const hasRightHand = hands.find(
              (hand) => hand.name === "rightHand"
            );

            if (!hasRightHand) {
              handMesh = draw3DHand();
              hands.push({
                mesh: handMesh,
                coordinates: rightWrist.position,
                name: "rightHand",
              });
              scene.add(handMesh);
            }
            const rightHandIndex = hands.findIndex(
              (hand) => hand.name === "rightHand"
            );

            rightHandIndex !== -1 &&
              (hands[rightHandIndex].coordinates = rightWrist.position);
          }

          moveHands(hands, camera, fruits, scene);
        }
      }
    });
    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}

async function bindPage() {
  const net = await posenet.load({
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: 513,
    multiplier: 0.75,
  });

  let video;

  try {
    video = await loadVideo();
  } catch (e) {
    throw e;
  }

  guiState.net = net;
  detectPoseInRealTime(video, net);
}

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

const init = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  setupLights();

  generateFruits();

  camera.position.z = 5;

  var animate = function () {
    requestAnimationFrame(animate);

    if (fruits) {
      fruits.map((fruit, index) => {
        // fruit.rotation.x += 0.01;
        // fruit.rotation.y += 0.01;

        if (fruit.direction === "up") {
          fruit.position.y += fruit.speed;
        }

        if (
          fruit.position.y > 0 &&
          !fruit.soundPlayed &&
          fruit.direction === "up"
        ) {
          sound.play();
          fruit.soundPlayed = true;
        }

        if (fruit.position.y > 4) {
          fruit.direction = "down";
        }

        if (fruit.direction === "down") {
          fruit.position.y -= fruit.speed;
        }

        if (fruit.position.y < -10) {
          scene.remove(fruit);
          fruits.splice(index, 1);
        }
      });

      if (fruits.length === 0) {
        fruit && (fruit.direction = "up");
        fruit && generateFruits();
      }
    }

    renderer.render(scene, camera);
  };

  animate();
};

window.onload = () => {
  // init();
  // bindPage();
};

window.onclick = () => {
  sound = new Howl({
    src: ["fruit.m4a"],
  });
  init();
  bindPage();
};
