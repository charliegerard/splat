const color = "aqua";

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
  const geometry = new THREE.BoxGeometry(50, 50, 50);
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = 0;
  return mesh;
};

export const moveHands = (hands, camera, fruitsObjects, event) => {
  // hands.map((hand) => {
  //   const handVector = new THREE.Vector3();
  //   // the x coordinates seem to be flipped so i'm subtracting them from window innerWidth
  //   handVector.x =
  //     ((window.innerWidth - hand.coordinates.x) / window.innerWidth) * 2 - 1;
  //   handVector.y = -(hand.coordinates.y / window.innerHeight) * 2 + 1;

  //   handVector.unproject(camera);
  //   const cameraPosition = camera.position;
  //   const dir = handVector.sub(cameraPosition).normalize();
  //   const distance = -cameraPosition.z / dir.z;
  //   const pos = cameraPosition.clone().add(dir.multiplyScalar(distance));

  //   hand.mesh.position.copy(pos);
  //   hand.mesh.position.z = 0;

  //   const raycaster = new THREE.Raycaster();
  //   raycaster.setFromCamera(handVector, camera);

  //   let intersects = raycaster.intersectObjects(fruitsObjects, true);

  //   if (intersects.length > 0) {
  //     console.log("touched a fruit!!!");
  //     if (
  //       intersects[0].object.name === "apple" ||
  //       intersects[0].object.name === "banana"
  //     ) {
  //       const fruit = intersects[0].object;
  //       console.log("touched a fruit!!!");
  //     }
  //   }
  // });

  hands.map((hand) => {
    const handVector = new THREE.Vector3();
    // the x coordinates seem to be flipped so i'm subtracting them from window innerWidth
    handVector.x =
      ((window.innerWidth - hand.coordinates.x) / window.innerWidth) * 2 - 1;
    handVector.y = -(hand.coordinates.y / window.innerHeight) * 2 + 1;
    handVector.z = 0;

    // Test mouse
    var vec = new THREE.Vector3(); // create once and reuse
    var pos = new THREE.Vector3(); // create once and reuse

    vec.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      0.5
    );

    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    var distance = -camera.position.z / vec.z;
    let newPos = pos.copy(camera.position).add(vec.multiplyScalar(distance));

    // end test

    // handVector.unproject(camera);
    // const cameraPosition = camera.position;
    // const dir = handVector.sub(cameraPosition).normalize();
    // const distance = -cameraPosition.z / dir.z;
    // const newPos = cameraPosition.clone().add(dir.multiplyScalar(distance));

    hand.mesh.position.copy(newPos);
    hand.mesh.position.z = -0.2;

    let handGeometry = hand.mesh.geometry;

    var originPoint = hand.mesh.position.clone();

    for (
      var vertexIndex = 0;
      vertexIndex < handGeometry.vertices.length;
      vertexIndex++
    ) {
      var localVertex = handGeometry.vertices[vertexIndex].clone();
      // var globalVertex = localVertex.applyMatrix4(skateboard.matrix);
      var globalVertex = localVertex.applyMatrix4(hand.mesh.matrix);
      // var directionVector = globalVertex.sub(skateboard.position);
      var directionVector = globalVertex.sub(hand.mesh.position);

      var ray = new THREE.Raycaster(
        originPoint,
        directionVector.clone().normalize()
      );

      var collisionResults = ray.intersectObjects(fruitsObjects);

      if (collisionResults.length > 0) {
        if (collisionResults[0].distance < 500) {
          console.log("fruit!!!");
        }

        // console.log(collisionResults[0].object.name);
        // console.log("collisions: ", collisionResults[0].distance);
        // console.log("direction vector: ", directionVector.length());
      }

      // if (
      //   collisionResults.length > 0 &&
      //   collisionResults[0].distance < directionVector.length()
      // ) {
      //   console.log("collisionnnn");
      // }
    }

    // const raycaster = new THREE.Raycaster();
    // // raycaster.setFromCamera(handVector, camera);
    // raycaster.setFromCamera(vec, camera);

    // let intersects = raycaster.intersectObjects(fruitsObjects);

    // if (intersects.length > 0) {
    //   console.log("touched a fruit!!!");
    //   if (
    //     intersects[0].object.name === "apple" ||
    //     intersects[0].object.name === "banana"
    //   ) {
    //     const fruit = intersects[0].object;
    //     console.log("touched a fruit!!!");
    //   }
    // }
  });
};
