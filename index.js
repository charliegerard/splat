const cubes = [];
let scene;
let cube;
// let direction = "up";
let speed;
let sound;
const videoWidth = window.innerWidth;
const videoHeight = window.innerHeight;

const generateRandomXPosition = (min, max) => {
  return Math.round(Math.random() * (max - min)) + min;
};

const generateRandomSpeed = (min, max) => {
  return Math.random() * (max - min) + min;
};

const generateFruits = () => {
  for (var i = 0; i < 4; i++) {
    var geometry = new THREE.BoxGeometry();
    var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    cube.position.x = generateRandomXPosition(-10, 10);
    cube.position.y = generateRandomXPosition(-10, -5);
    // speed = generateRandomSpeed(0.05, 0.1);
    speed = 0.05;
    cube.speed = speed;
    cube.soundPlayed = false;
    cube.direction = "up";

    cubes.push(cube);
    scene.add(cube);
  }
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

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

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

function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById("output");
  const ctx = canvas.getContext("2d");
  // since images are being fed from a webcam
  const flipHorizontal = false;

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  async function poseDetectionFrame() {
    if (guiState.changeToArchitecture) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();

      // Load the PoseNet model weights for either the 0.50, 0.75, 1.00, or 1.01
      // version
      //   guiState.net = await posenet.load(+guiState.changeToArchitecture);
      guiState.changeToArchitecture = null;
    }

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

    if (guiState.output.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-videoWidth, 0);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      ctx.restore();
    }

    poses.forEach(({ score, keypoints }) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          const leftWrist = keypoints.find((k) => k.part === "leftWrist");
          const rightWrist = keypoints.find((k) => k.part === "rightWrist");

          drawKeypoints([rightWrist, leftWrist], minPartConfidence, ctx);
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

const color = "aqua";

function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const { y, x } = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 30, color);
  }
}

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

window.onload = () => {
  bindPage();
};

const init = () => {
  scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  var renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  generateFruits();

  camera.position.z = 5;

  var animate = function () {
    requestAnimationFrame(animate);

    cubes.map((cube, index) => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      if (cube.direction === "up") {
        cube.position.y += cube.speed;
      }

      if (cube.position.y < 0 && !cube.soundPlayed && cube.direction === "up") {
        sound.play();
        cube.soundPlayed = true;
      }

      if (cube.position.y > 4) {
        cube.direction = "down";
      }

      if (cube.direction === "down") {
        cube.position.y -= cube.speed;
      }

      if (cube.position.y < -10) {
        scene.remove(cube);
        cubes.splice(index, 1);
      }
    });

    if (cubes.length === 0) {
      cube.direction = "up";
      generateFruits();
    }

    renderer.render(scene, camera);
  };

  animate();
};

window.onclick = () => {
  sound = new Howl({
    src: ["fruit.m4a"],
  });
  init();
};
