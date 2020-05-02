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
var fruitsObjects = [];
var fruits = [];
var controls;
var cameraZPosition;
var gameOver = false;
var frameLoop;

var hitScore = 0;
var score = 0;
var randomXPosition;
var randomYPosition;
