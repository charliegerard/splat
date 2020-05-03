// 3D scene
var camera, scene, renderer;
// Trails
var trailTarget,
  trailMaterial,
  trail,
  trailHeadGeometry,
  baseTrailMaterial,
  texturedTrailMaterial,
  circlePoints,
  lastTrailUpdateTime,
  lastTrailResetTime,
  options;
// Sounds
var newFruitSound, fruitSliced, bombSlicedSound;
// Video & ML
var net, video;
// Fruits objects
var speed, fruitModel;
const fruitsObjects = [];
const fruits = [];
var controls;
var cameraZPosition;
const gameOver = false;
var frameLoop;

const hitScore = 0;
const score = 0;
var randomXPosition;
var randomYPosition;

let hand;
let handMesh;
const scoreDivContent = document.getElementsByClassName("score-number")[0];
const canvas = document.getElementById("output");
const flipHorizontal = false;
