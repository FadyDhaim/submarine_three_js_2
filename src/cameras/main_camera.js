import { AppCamera } from "./app_camera"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

export class MainCamera extends AppCamera {
    setupControls(renderer) {
        const controls = new OrbitControls(this, renderer.domElement)
        controls.maxPolarAngle = Math.PI * 0.495
        controls.target.set(0, 10, 0)
        controls.minDistance = 40.0
        controls.maxDistance = 200.0
        controls.update()
    }
}