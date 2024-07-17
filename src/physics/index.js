import * as THREE from 'three';
import SubmarinePhysics from './submarine_physics.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 5;

const submarine1 = new SubmarinePhysics();

document.addEventListener('keydown', (event) => {
    if (event.key === 'e' || event.key === 'E') {
        submarine1.increaseWaterVolume();
    } else if (event.key === 'q' || event.key === 'Q') {
        submarine1.decreaseWaterVolume();
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'e' || event.key === 'E') {
        submarine1.isIncreaseWaterActive = false;
    } else if (event.key === 'q' || event.key === 'Q') {
        submarine1.isDecreaseWaterActive = false;
    }
});

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = 0.1; 

    if (submarine1.isIncreaseWaterActive || submarine1.isDecreaseWaterActive) {
        submarine1.LinearMotionInMoment(deltaTime);
        cube.position.set(submarine1._location.x, submarine1._location.y, submarine1._location.z);
    }

    // Render the scene
    renderer.render(scene, camera);
}
animate();
