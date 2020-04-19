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

export const moveHands = (hands, camera, cubes) => {
  hands.map((hand) => {
    const handVector = new THREE.Vector3();
    // handVector.x = (hand.coordinates.x / window.innerWidth) * 2 - 1;
    handVector.x = (hand.coordinates.x / window.innerWidth) * 2 - 1;
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

    const entities = cubes;
    const entitiesObjects = [];

    if (Array.from(entities).length) {
      for (var i = 0; i < Array.from(entities).length; i++) {
        const beatMesh = entities[i];
        entitiesObjects.push(beatMesh);
      }

      let intersects = raycaster.intersectObjects(entitiesObjects, true);
      if (intersects.length) {
        // const beat =
        //   intersects[0].object.el.attributes[0].ownerElement.parentEl.components
        //     .beat;
        // const beatColor = beat.attrValue.color;
        // const beatType = beat.attrValue.type;

        // if (beatColor === "red") {
        //   if (beatType === "arrow" || beatType === "dot") {
        //     beat.destroyBeat();
        //   }
        // }
        console.log("touched a cube!!!");
      }
    }
  });
};
