import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { AppCamera } from "./app_camera"
import { Quaternion, Vector3 } from "three"
import { SubmarineSimulationApp } from "../main"

export class SubmarineCamera extends AppCamera {
    setupControls() {
        this.controls = new OrbitControls(this, SubmarineSimulationApp.renderer.domElement)
        this.offset = new Vector3(0, 4, -4)
        // this.controls.enableDamping = true
        // this.controls.dampingFactor = 0.005
        this.controls.maxPolarAngle = Math.PI * 0.495
        this.controls.minDistance = 15.0
        this.controls.maxDistance = 40.0
        this.controls.target.set(this.offset.x, this.offset.y, this.offset.z)
        this.controls.update()
    }
    animate(position, rollRotationPercentage) {
        this.lookAt(position.x, position.y + this.offset.y, position.z + this.offset.z)
        // console.log(rollRotationPercentage)
        this.up.set(-rollRotationPercentage * 0.3, 1, 0)
        // this.rotation.set(rotation.x, 0, rotation.z)
    }
    setDefaultView() {
        this.controls.saveState()
    }
    restoreDefaultView() {
        this.controls.reset()
    }
}

// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
// import { AppCamera } from "./app_camera"
// import { Quaternion, Vector3 } from "three"

// export class SubmarineCamera extends AppCamera {
//     setupControls(renderer) {
//         const controls = new OrbitControls(this, renderer.domElement)
//         controls.maxPolarAngle = Math.PI * 0.495
//         controls.target.set(0, 4, -4)
//         controls.minDistance = 15.0
//         controls.maxDistance = 40
//         controls.update()
//         this.controls = controls
//     }
//     // animate() {
//     //     const position = new Vector3()
//     //     const { x, y, z } = this.parent.getWorldPosition(position)
//     //     this.lookAt(x, y + 4, z - 4)
//     // }
//     animate() {
//         const position = new Vector3()
//         const quaternion = new Quaternion()

//         // Get the submarine's world position and quaternion
//         this.parent.getWorldPosition(position)
//         this.parent.getWorldQuaternion(quaternion)
//         console.log(quaternion)
//         // Set the camera's position relative to the submarine
//         const offset = new Vector3(0, 4, -15) // Adjust this offset as needed
//         offset.applyQuaternion(quaternion)
//         this.position.copy(position).add(offset)

//         // Set the camera's rotation to match the submarine's rotation
//         this.quaternion.copy(quaternion)

//         // Update the controls target
//         this.controls.target.set(position.x, position.y, position.z)
//         this.controls.update()
//     }
// }