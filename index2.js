import {
  generateRandomSpeed,
  generateRandomXPosition,
  drawKeypoints,
  draw3DHand,
  moveHands,
} from "./utils.js";
const fruits = [];
const fruitsObjects = [];
const hands = [];
let scene;
let fruit;
let speed;
let newFruitSound;
let fruitSliced;
let camera;
let handMesh;
let renderer;
let score = 0;
let net;
let canvas = document.getElementById("output");
let ctx = canvas.getContext("2d");
let video;
let fruitModel;
const videoWidth = window.innerWidth;
const videoHeight = window.innerHeight;
var trailTarget;
let trail;
let baseTrailMaterial;
let texturedTrailMaterial;
let trailHeadGeometry;
let trailMaterial;
let rendererContainer;
let lastTrailUpdateTime;
let lastTrailResetTime;

let options;

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

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

window.onload = async () => {
  newFruitSound = new Howl({ src: ["fruit.m4a"] });
  fruitSliced = new Howl({ src: ["splash.m4a"] });

  lastTrailUpdateTime = performance.now();
  lastTrailResetTime = performance.now();

  await loadPoseNet();
  initScene();
  initTrailOptions();
  initLights();
  loadFruitsModels();

  updateStartButton();

  // trail
  initSceneGeometry(function () {
    initTrailRenderers(function () {
      initRenderer();
      animate();
    });
  });
};

const resetCamera = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  camera.position.set(0, 200, 400);
  camera.lookAt(scene.position);
};

const initRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  rendererContainer = document.getElementsByClassName("game")[0];
  rendererContainer.appendChild(renderer.domElement);
};

const generateFruits = () => {
  for (var i = 0; i < 10; i++) {
    const randomFruit = fruits[generateRandomXPosition(0, 1)];
    const randomXPosition = generateRandomXPosition(-1000, 1000);
    const randomYPosition = generateRandomXPosition(-850, -800);
    let newFruit = randomFruit.clone();
    newFruit.position.x = randomXPosition;
    newFruit.position.y = randomYPosition;
    newFruit.position.z = 100;

    if (randomFruit.name === "apple") {
      newFruit.position.z = -300;
    }

    speed = 10;
    newFruit.speed = speed;
    newFruit.soundPlayed = false;
    newFruit.direction = "up";
    fruitsObjects.push(newFruit);

    scene.add(newFruit);
    renderer.render(scene, camera);
  }
};

const initLights = () => {
  let ambientLight = new THREE.AmbientLight(
    new THREE.Color("rgb(255,255,255)")
  );
  ambientLight.position.set(10, 0, 50);
  scene.add(ambientLight);

  let pointLight = new THREE.PointLight(0xffffff, 2, 1000, 1);
  pointLight.position.set(0, 40, 0);
  scene.add(pointLight);
};

const setupCamera = async () => {
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
};

const loadVideo = async () => {
  const video = await setupCamera();
  video.play();

  return video;
};

const detectPoseInRealTime = (video, net) => {
  // since images are being fed from a webcam
  const flipHorizontal = false;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

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

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    // ctx.fillRect(0, 0, videoWidth, videoWidth);

    poses.forEach(({ score, keypoints }) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          const leftWrist = keypoints.find((k) => k.part === "leftWrist");
          const rightWrist = keypoints.find((k) => k.part === "rightWrist");

          drawKeypoints([rightWrist, leftWrist], minPartConfidence, ctx);

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

          // moveHands(hands, camera, fruitsObjects);
        }
      }
    });
    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
};

const render = () => {
  renderer.render(scene, camera);
};

const animate = () => {
  requestAnimationFrame(animate);
  // detectPoseInRealTime(video, net);

  var time = performance.now();
  updateTrailTarget(time);

  if (fruitsObjects) {
    fruitsObjects.map((fruit, index) => {
      // fruit.rotation.x += 0.02;
      // fruit.rotation.y += 0.02;

      if (fruit.direction === "up") {
        fruit.position.y += fruit.speed;
      }
      if (
        fruit.position.y > -700 &&
        !fruit.soundPlayed &&
        fruit.direction === "up"
      ) {
        newFruitSound.play();
        fruit.soundPlayed = true;
      }
      if (fruit.position.y > 500) {
        fruit.direction = "down";
      }
      if (fruit.direction === "down") {
        fruit.position.y -= fruit.speed;
      }

      if (fruit.position.y < -900) {
        scene.remove(fruit);
        fruitsObjects.splice(index, 1);
      }
    });
    if (fruitsObjects.length === 0) {
      fruit && (fruit.direction = "up");
      fruit && generateFruits();
    }
  }

  window.onmousemove = (e) => {
    var vec = new THREE.Vector3(); // create once and reuse
    var pos = new THREE.Vector3(); // create once and reuse

    vec.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
      100
    );

    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    var distance = -camera.position.z / vec.z;
    let newPos = pos.copy(camera.position).add(vec.multiplyScalar(distance));

    trailTarget.position.x = vec.x;
    trailTarget.position.y = vec.y;
    trailTarget.position.z = vec.z;

    if (hands) {
      let test = moveHands(hands, camera, fruitsObjects, e);

      if (test.includes(true)) {
        console.log("touched fruit");
        fruitSliced.play();
        document.querySelector(".score span").innerText = score++;
      }
    }
  };

  // if (hands.length) {
  //   let test = moveHands(hands, camera, fruitsObjects);

  //   if (test.includes(true)) {
  //     console.log("touched fruit");
  //     fruitSliced.play();
  //     document.querySelector(".score span").innerText = score++;
  //   }
  // }

  render();
};

const updateStartButton = () => {
  document.getElementsByTagName("button")[0].innerText = "Start";
  document.getElementsByTagName("button")[0].disabled = false;
};

const loadPoseNet = async () => {
  net = await posenet.load({
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: 513,
    multiplier: 0.75,
  });

  try {
    video = await loadVideo();
  } catch (e) {
    throw e;
  }

  guiState.net = net;
};

const loadFruitsModels = () => {
  return fruitsModels.map((fruit) => {
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath("assets/");
    mtlLoader.load(`${fruit.material}.mtl`, function (materials) {
      materials.preload();

      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath("assets/");
      objLoader.load(`${fruit.model}.obj`, function (object) {
        object.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            var mesh = new THREE.Mesh(child.geometry, child.material);

            fruitModel = mesh;
            fruitModel.name = fruit.name;

            fruits.push(fruitModel);
          }
        });
      });
    });
    return fruits;
  });
};

// const init3DScene = async () => {
//   var tanFOV = Math.tan(((Math.PI / 180) * camera.fov) / 2);
//   var windowHeight = window.innerHeight;

//   window.addEventListener("resize", onWindowResize, false);

//   function onWindowResize(event) {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
//     camera.aspect = window.innerWidth / window.innerHeight;

//     // adjust the FOV
//     camera.fov =
//       (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / windowHeight));

//     camera.updateProjectionMatrix();
//     camera.lookAt(scene.position);

//     renderer.setSize(window.innerWidth, window.innerHeight);
//     renderer.render(scene, camera);
//   }
// };

const onWindowResize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  resetCamera();
};

window.addEventListener("resize", onWindowResize, false);

const initScene = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // camera.position.z = 5;
  camera.position.z = 500;
  scene.add(camera);
  resetCamera();
};

document.getElementsByTagName("button")[0].onclick = () => {
  if (net) {
    document.getElementsByClassName("intro")[0].style.display = "none";
    generateFruits();
    detectPoseInRealTime(video, net);
  }
};

export const initTrailOptions = () => {
  options = {
    headRed: 1.0,
    headGreen: 0.0,
    headBlue: 1.0,
    headAlpha: 0.75,
    tailRed: 0.0,
    tailGreen: 1.0,
    tailBlue: 1.0,
    tailAlpha: 0.35,
    trailLength: 100,
    textureTileFactorS: 10.0,
    textureTileFactorT: 0.8,
    dragTexture: false,
    depthWrite: false,
  };
};

export const initSceneGeometry = (onFinished) => {
  initTrailHeadGeometries();
  initTrailTarget();

  if (onFinished) {
    onFinished();
  }
};

let circlePoints;

const initTrailHeadGeometries = () => {
  circlePoints = [];
  var twoPI = Math.PI * 2;
  var index = 0;
  var scale = 10.0;
  var inc = twoPI / 32.0;

  for (var i = 0; i <= twoPI + inc; i += inc) {
    var vector = new THREE.Vector3();
    vector.set(Math.cos(i) * scale, Math.sin(i) * scale, 0);
    circlePoints[index] = vector;
    index++;
  }
};

const initTrailTarget = () => {
  var geometry = new THREE.CircleGeometry(5, 32);
  var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  trailTarget = new THREE.Mesh(geometry, material);
  trailTarget.position.set(0, 0, 0);
  trailTarget.scale.multiplyScalar(1);
  trailTarget.receiveShadow = false;

  scene.add(trailTarget);
};

const initTrailRenderers = (callback) => {
  trail = new THREE.TrailRenderer(scene, false);

  baseTrailMaterial = THREE.TrailRenderer.createBaseMaterial();

  var textureLoader = new THREE.TextureLoader();
  textureLoader.load("sparkle4.jpg", function (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;

    texturedTrailMaterial = THREE.TrailRenderer.createTexturedMaterial();
    texturedTrailMaterial.uniforms.texture.value = tex;

    continueInitialization();

    if (callback) {
      callback();
    }
  });

  function continueInitialization() {
    trailHeadGeometry = circlePoints;
    trailMaterial = baseTrailMaterial;
    initializeTrail();
  }
};

const initializeTrail = () => {
  trail.initialize(
    trailMaterial,
    Math.floor(options.trailLength),
    options.dragTexture ? 1.0 : 0.0,
    0,
    trailHeadGeometry,
    trailTarget
  );
  updateTrailColors();
  updateTrailTextureTileSize();
  trailMaterial.depthWrite = options.depthWrite;
  trail.activate();
};

const updateTrailColors = () => {
  trailMaterial.uniforms.headColor.value.set(
    options.headRed,
    options.headGreen,
    options.headBlue,
    options.headAlpha
  );
  trailMaterial.uniforms.tailColor.value.set(
    options.tailRed,
    options.tailGreen,
    options.tailBlue,
    options.tailAlpha
  );
};

const updateTrailTextureTileSize = () => {
  trailMaterial.uniforms.textureTileFactor.value.set(
    options.textureTileFactorS,
    options.textureTileFactorT
  );
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
