import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

// 상하: y 좌우: x 앞뒤: z
camera.position.x = 5;
camera.position.y = 5;
camera.position.z = 5;

const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xbbbbbb
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
floor.castShadow = true;
floor.name = "FLOOR";
scene.add(floor);

const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
directionalLight.castShadow = true;
directionalLight.position.set(3, 4, 5);
directionalLight.lookAt(0, 0, 0);
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.top = 2;
directionalLight.shadow.camera.bottom = -2;
directionalLight.shadow.camera.left = -0.5;
directionalLight.shadow.camera.right = 0.5;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 100;

scene.add(directionalLight);

const gltfLoader = new GLTFLoader();
const gltf = await gltfLoader.loadAsync("/dancer.glb");
console.log(gltf);
const character = gltf.scene;
const animationClips = gltf.animations;
character.position.y = 0.8;
character.scale.set(0.01, 0.01, 0.01);
character.traverse((obj) => {
    if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
    }
})

scene.add(character);

const mixer = new THREE.AnimationMixer(character);
const action = mixer.clipAction(animationClips[3]);
action.setLoop(THREE.LoopPingPong);
action.play();

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.03;
orbitControls.update();

const newPosition = new THREE.Vector3(1, 1, 1);
const rayCaster = new THREE.Raycaster();

renderer.domElement.addEventListener("pointerdown", (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = - ((e.clientY / window.innerHeight) * 2 - 1);

    rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersects = rayCaster.intersectObjects(scene.children);
    console.log("intersects", intersects);

    const intersectFloor = intersects.find(i => i.object.name === "FLOOR");
    console.log(intersectFloor);
    newPosition.copy(intersectFloor.point);
    newPosition.y = 1;
})

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
})

const clock = new THREE.Clock();
const targetVector = new THREE.Vector3();

const render = () => {
    character.lookAt(newPosition);
    targetVector.subVectors(newPosition, character.position)
        .normalize()
        .multiplyScalar(0.01);

    if (Math.abs(character.position.x - newPosition.x) >= 1 ||
        Math.abs(character.position.z - newPosition.z) >= 1) {
        character.position.x += targetVector.x;
        character.position.z += targetVector.z;
        action.stop();
    }
    action.play();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
    orbitControls.update();
    if (mixer) {
        mixer.update(clock.getDelta());
    }
}

render();