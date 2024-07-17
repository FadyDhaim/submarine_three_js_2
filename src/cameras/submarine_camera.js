import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { AppCamera } from "./app_camera"
import { Vector3 } from "three"

export class SubmarineCamera extends AppCamera {
    setupControls(renderer) {
        const controls = new OrbitControls(this, renderer.domElement)
        controls.maxPolarAngle = Math.PI * 0.495
        controls.target.set(0, 4, -4)
        controls.minDistance = 15.0
        controls.maxDistance = 40
        controls.update()
    }
    animate() {
        const { x, y, z } = this.parent.getWorldPosition(new Vector3(0, 0, 0))
        this.lookAt(x, y + 4, z - 4)
    }
}