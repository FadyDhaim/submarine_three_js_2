import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { AppCamera } from "./app_camera"
import { Vector3 } from "three"
import { SubmarineSimulationApp } from "../main"

export class SubmarineCamera extends AppCamera {
    setupControls() {
        this.controls = new OrbitControls(this, SubmarineSimulationApp.renderer.domElement)
        this.offset = new Vector3(0, 4, -4)
        this.controls.maxPolarAngle = Math.PI * 0.495
        this.controls.minDistance = 16.5
        this.controls.maxDistance = 40.0
        this.controls.target.set(this.offset.x, this.offset.y, this.offset.z)
        this.controls.update()
    }
    update(position, rollRotationPercentage, pitchRotationPercentage) {
        this.lookAt(position.x, position.y + this.offset.y, position.z + this.offset.z)
        this.up.set(-rollRotationPercentage * 0.3, 1, -pitchRotationPercentage * 0.3)
    }
    setDefaultView() {
        this.controls.saveState()
    }
    restoreDefaultView() {
        this.controls.reset()
    }
}