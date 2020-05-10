import { draw3DHand, scene } from "./scene.js";
import { flipHorizontal } from "./constants.js";

// ---------------
// INITIALISATION
// ---------------

var net;
var handMesh;
var video;

export var hand;

export const loadPoseNet = async () => {
  net = await posenet.load({
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: 513,
    multiplier: 0.75,
  });

  video = await loadVideo();

  guiState.net = net;
  detectPoseInRealTime(video);
};

export const guiState = {
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

const loadVideo = async () => {
  const video = await setupCamera();
  video.play();
  return video;
};

const setupCamera = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }

  const video = document.getElementById("video");
  video.width = window.innerWidth;
  video.height = window.innerHeight;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });
  video.srcObject = stream;

  return new Promise(
    (resolve) => (video.onloadedmetadata = () => resolve(video))
  );
};

// --------------------
// REAL TIME DETECTION
// --------------------

const detectPoseInRealTime = async (video) => {
  async function poseDetectionFrame() {
    const imageScaleFactor = guiState.input.imageScaleFactor;
    const outputStride = +guiState.input.outputStride;
    const poses = [];

    const pose = await guiState.net.estimateSinglePose(
      video,
      imageScaleFactor,
      flipHorizontal,
      outputStride
    );
    poses.push(pose);

    const minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;

    poses.forEach(({ score, keypoints }) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          const leftWrist = keypoints.find((k) => k.part === "leftWrist");
          const rightWrist = keypoints.find((k) => k.part === "rightWrist");

          if (!hand) {
            if (rightWrist || leftWrist) {
              handMesh = draw3DHand();
              hand = {
                mesh: handMesh,
                coordinates: rightWrist
                  ? rightWrist.position
                  : leftWrist.position,
                name: rightWrist ? "rightHand" : "leftHand",
              };
              scene && scene.add(handMesh);
            }
          } else {
            hand.coordinates =
              hand.name === "rightHand"
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
