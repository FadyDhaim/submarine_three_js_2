import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { AppCamera } from "./app_camera"
import { Quaternion, Vector3 } from "three"

export class SubmarineCamera extends AppCamera {
    setupControls(renderer) {
        const controls = new OrbitControls(this, renderer.domElement)
        controls.maxPolarAngle = Math.PI * 0.495
        controls.target.set(0, 4, -4)
        controls.minDistance = 15.0
        controls.maxDistance = 40
        controls.update()
        this.controls = controls
    }
    animate() {
        const { x, y, z } = this.parent.getWorldPosition(new Vector3(0, 0, 0))
        // const { rx, ry, rz } = this.parent.getWorldQuaternion(new Quaternion())
        // console.log(ry)
        // this.rotation.set(rx, ry, rz)
        this.lookAt(x, y + 4, z - 4)
    }
}