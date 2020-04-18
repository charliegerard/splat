const cubes = [];
let scene;
let cube;
let direction = "up";
let speed;

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
    speed = generateRandomSpeed(0.05, 0.1);
    cube.speed = speed;
    scene.add(cube);
    cubes.push(cube);
  }
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
      //   cube.position.y = generateRandomXPosition(-4, 4);

      if (direction === "up") {
        cube.position.y += cube.speed;
      }

      if (cube.position.y > 4) {
        direction = "down";
      }

      if (direction === "down") {
        cube.position.y -= cube.speed;
      }

      if (cube.position.y < -20) {
        scene.remove(cube);
        cubes.splice(index, 1);
      }
    });

    renderer.render(scene, camera);
  };

  animate();
};

init();
