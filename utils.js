const color = "aqua";
let previousLeftHandPosition = { x: 0, y: 0, z: -0.2 };

export const generateRandomXPosition = (min, max) => {
  return Math.round(Math.random() * (max - min)) + min;
};

export const generateRandomSpeed = (min, max) => {
  return Math.random() * (max - min) + min;
};

export const drawKeypoints = (keypoints, minConfidence, ctx, scale = 1) => {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const { y, x } = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 30, color);
  }
};

const drawPoint = (ctx, y, x, r, color) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
};

export const draw3DHand = () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
};

export const moveHands = (hands, camera, fruits, scene, e) => {
  hands.map((hand) => {
    const handVector = new THREE.Vector3();

    // handVector.x = (hand.coordinates.x / window.innerWidth) * 2 - 1;
    handVector.x = -(hand.coordinates.x / window.innerWidth) * 2 + 1;
    handVector.y = -(hand.coordinates.y / window.innerHeight) * 2 + 1;
    handVector.z = 0;

    handVector.unproject(camera);

    const cameraPosition = camera.position;
    const dir = handVector.sub(cameraPosition).normalize();
    const distance = -cameraPosition.z / dir.z;
    const pos = cameraPosition.clone().add(dir.multiplyScalar(distance));

    hand.mesh.position.copy(pos);
    hand.mesh.position.z = -0.2;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(handVector, camera);

    let intersects = raycaster.intersectObjects(fruits);

    if (intersects.length) {
      console.log(intersects[0].object);
      if (intersects[0].object.geometry.name === "fruit") {
        const fruit = intersects[0].object;
        console.log("touched a cube!!!", fruit);
      }
    }
  });
};
