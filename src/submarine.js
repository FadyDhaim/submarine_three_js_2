import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import SubmarinePhysics from './physics/submarine_physics'
// const motionDirections = Object.freeze(
//     {
//         reverse: Symbol('reverse'),
//         forward: Symbol('forward'),
//     }
// )
export class Submarine {
    constructor() {
        this.modelPath = '../models/submarine.glb'
        this.mesh = null
        this.deltaTime = 0.1
        this.physics = new SubmarinePhysics()
        // this.maximumForwardSpeed = 6.0
        // this.maximumReverseSpeed = -4.0
        // this.maximumSubmersionSpeed = -2.0
        this.initialDepth = -10.0
        // this.maximumDepth = -50.0
        // this.holdTime = 0 //in frames
        // this.submersionHoldTime = 0
        // this.maximumForwardHoldTime = 360  //6 seconds worth of frames @60 FPS
        // this.maximumReverseHoldTime = -360
        // this.maximumSubmersionHoldTime = -180 //3s
        // this.didDampenLastFrame = false
    }
    async load() {
        const loader = new GLTFLoader()
        return new Promise((resolve, reject) => {
            loader.load(this.modelPath, (gltf) => {
                const submarineMesh = gltf.scene
                submarineMesh.position.set(0, this.initialDepth, 0)
                submarineMesh.castShadow = true
                submarineMesh.scale.setScalar(10)
                this.mesh = submarineMesh
                this._setupInteractivity()
                resolve(submarineMesh)
            })
        })
    }
    
    animate() {
        this.physics.LinearMotionInMoment(this.deltaTime)
        if (this.physics.isIncreaseWaterActive || this.physics.isDecreaseWaterActive) {
            this.physics.LinearMotionInMoment(this.deltaTime);
            const currentLocation = this.physics._location;
            this.mesh.position.set(currentLocation.x, this.initialDepth - currentLocation.y, currentLocation.z)
        }
        console.log('y = ' + this.mesh.position.y)
        console.log('z = ' + this.mesh.position.z)
    }
    _setupInteractivity() {
        window.addEventListener('keydown', (event) => {
            const key = event.key
            switch (key) {
                case 'w':
                    this.moveForward()
                    console.log('W Down')
                    break
                case 'e':
                    this.moveUpward()
                    console.log('E')
                    break
                case 'q':
                    this.moveDownward()
                    console.log('Q')
                    break
            }
        })
        window.addEventListener('keyup', (event) => {
            const key = event.key
            switch (key) {
                case 'w':
                    this.stall()
                    console.log('W Up')
                    break
                case 'q':
                    this.physics.isIncreaseWaterActive = false
                    break
                case 'e':
                    this.physics.isDecreaseWaterActive = false
                    break
            }
        })
    }
    moveForward() {
        this.physics.powerOn()
    }
    stall() {
        this.physics.powerOff()
    }
    moveUpward() {
        this.physics.decreaseWaterVolume()
    }
    moveDownward() {
        this.physics.increaseWaterVolume()
    }
}