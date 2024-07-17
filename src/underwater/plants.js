import { ConeGeometry, MeshPhongMaterial } from "three";
import { AppWater } from "../water";

const plantGeometry = new ConeGeometry(10, 20, 20);
const plantMaterial = new MeshPhongMaterial({ color: 0x2e8b57, emissive: 0x002010 });

for (let i = 0; i < 10; i++) {
    const plant = new Mesh(plantGeometry, plantMaterial);
    plant.position.set(
        Math.random() * AppWater.SPATIAL_SIZE - AppWater.SPATIAL_SIZE / 2,
        Math.random() * 20,
        Math.random() * AppWater.SPATIAL_SIZE - AppWater.SPATIAL_SIZE / 2
    );
    plant.rotation.y = Math.random() * Math.PI * 2;
    scene.add(plant);
}
