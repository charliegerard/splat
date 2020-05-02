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
var newFruitSound, fruitSliced;
// Video & ML
var net, video;
// Fruits objects
var speed, fruitModel;
var fruitsObjects = [];
var fruits = [];
var controls;
var cameraZPosition;
