import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GUI} from 'dat.gui'
const motionStates = Object.freeze({
    idle: Symbol('idle'),
    inMotion:
    {
        decelerating: {
            damping:
                Symbol.for('damping'),
            braking:
                Symbol.for('braking'),
            oppositeDirection:
                Symbol.for('oppositeDirection')
        },
        accelerating: Symbol('accelerating'),
        constantSpeed: Symbol('constantSpeed')
    }
})
const deceleratingBy = Object.freeze({
    damping: Symbol.for('damping'),
    braking: Symbol.for('braking'),
    oppositeDirection: Symbol.for('oppositeDirection'),
})
const guiListenables = {
    forwardSpeed: 0.0,
    forwardMotionState: '',
    angularSpeed: 0.0,
    rotationMotionState: ''
};
export class Submarine {
    constructor() {
        //رسم
        this.modelPath = '../models/submarine.glb'
        this.submarineMesh = null

        //حركة
        this.motionState = {
            forward: motionStates.idle,
            submersion: motionStates.idle,
            rotation: {
                yaw: motionStates.idle,
            },
        }
        this.holdTime = {
            forward: 0,
            submersion: 0,
            rotation: {
                yaw: 0
                //pitch
                //roll
            }
        }
        this.maximumHoldTime = {
            forward: 360,   // 6 seconds
            submersion: 360,
            rotation: {
                yaw: 180 // 3 seconds
            }
        }
        this.maximumSpeed = {
            forward: 6.0,
            submersion: -1.0,
            angular: 0.01, //or yaw rotation speed / rotation around y, sweeping half a cycle in 5 seconds (3.14 / (0.01 * 60))
        }
        this.initialDepth = -10.0
        this.maximumDepth = -50.0
        this.didDampenLastFrame = {
            forward: false,
        }
    }
    async load() {
        const loader = new GLTFLoader()
        return new Promise((resolve) => {
            loader.load(this.modelPath, (gltf) => {
                const submarineMesh = gltf.scene
                submarineMesh.castShadow = true
                submarineMesh.position.set(0, this.initialDepth, 0)
                submarineMesh.scale.setScalar(10)
                this.submarineMesh = submarineMesh
                this.setup()
                resolve(submarineMesh)
            })
        })
    }

    setup() {
        const setupInteractivity = () => {
            window.addEventListener('keydown', (event) => {
                const key = event.key
                switch (key) {
                    case 'w':
                    case 'W':
                        this.accelerateForward()
                        break
                    case 's':
                    case 'S':
                        this.decelerateForward(deceleratingBy.braking)
                        break
                    case 'a':
                    case 'A':
                        this.rotateYawLeft()
                        // this.rotateRollLeft() // Submarine should also roll when turning
                        break
                    case 'd':
                    case 'D':
                        this.rotateYawRight()
                        // this.rotateRollRight() // Submarine should also roll when turning
                        break
                    case 'e':
                    case 'E':
                        this.accelerateAscent()
                        this.rotatePitchUp() // Submarine should pitch up when ascending
                        break
                    case 'q':
                    case 'Q':
                        this.accelerateDive()
                        this.rotatePitchDown() // Submarine should pitch down when diving
                        break
                }
            })

            window.addEventListener('keyup', (event) => {
                const key = event.key
                switch (key) {
                    case 'w':
                    case 'W':
                    case 's':
                    case 'S':
                        this.decelerateForward(deceleratingBy.damping)
                        break
                    case 'a':
                    case 'A':
                    case 'd':
                    case 'D':
                        this.neutralizeYawRotation()
                        // Optionally add behavior to stop yaw/roll rotation
                        break
                    case 'e':
                    case 'E':
                        // Optionally add behavior to stop ascent/pitch rotation
                        break
                    case 'q':
                    case 'Q':
                        // Optionally add behavior to stop dive/pitch rotation
                        break
                }
            })
        }
        const setupGui = () => {
            const gui = new GUI()
            const motionFolder = gui.addFolder('Motion');
            motionFolder.add(guiListenables, 'forwardSpeed', 0.0, this.maximumSpeed.forward, 0.01).listen();
            motionFolder.add(guiListenables, 'forwardMotionState').listen();
            motionFolder.add(guiListenables, 'angularSpeed', 0.0, this.maximumSpeed.angular, 0.001).listen();
            motionFolder.add(guiListenables, 'rotationMotionState').listen();
            motionFolder.open();
        }
        setupInteractivity()
        setupGui()
    }
   

    //forward motion control:   1, 2, 3, 4
    accelerateForward() {
        const currentForwardHoldTime = this.holdTime.forward
        const tryIncreaseForwardHoldTime = () => {
            const maxForwardHoldTime = this.maximumHoldTime.forward
            if (currentForwardHoldTime < maxForwardHoldTime) {
                this.holdTime.forward = currentForwardHoldTime + 1
                return true
            }
            return false
        }
        if (tryIncreaseForwardHoldTime()) {
            this.updateForwardMotionState(motionStates.inMotion.accelerating)
        }
        else {
            this.updateForwardMotionState(motionStates.inMotion.constantSpeed)
        }
    }
    decelerateForward(by) {
        const currentForwardHoldTime = this.holdTime.forward
        const tryDecreaseForwardHoldTime = () => {
            if (currentForwardHoldTime > 0) {
                this.holdTime.forward = currentForwardHoldTime - 1
                return true
            }
            return false
        }
        if (tryDecreaseForwardHoldTime()) {
            this.updateForwardMotionState(by)   //by stalling or by braking
        }
        else {
            this.updateForwardMotionState(motionStates.idle)
        }
    }
    updateForwardMotionState(newState) {
        this.motionState.forward = newState
    }
    forwardSpeed() {
        return (this.holdTime.forward / this.maximumHoldTime.forward) * this.maximumSpeed.forward
    }
    //rotation
    rotateYawLeft() {
        const currentRotateYawHoldTime = this.holdTime.rotation.yaw
        const tryIncreaseRotateYawHoldTime = () => {
            if (currentRotateYawHoldTime < this.maximumHoldTime.rotation.yaw) {
                this.holdTime.rotation.yaw = currentRotateYawHoldTime + 1
                return true
            }
            return false
        }
        if (tryIncreaseRotateYawHoldTime()) {
            const newRotateYawHoldTime = this.holdTime.rotation.yaw
            const oldRotateYawHoldTime = currentRotateYawHoldTime
            if (Math.abs(newRotateYawHoldTime) > Math.abs(oldRotateYawHoldTime)) {
                this.updateYawRotationMotionState(motionStates.inMotion.accelerating)
            } else {
                // consider old : |-170| > new:  |-169|
                this.updateYawRotationMotionState(motionStates.inMotion.decelerating.oppositeDirection)
            }
        }
        else {
            this.updateYawRotationMotionState(motionStates.inMotion.constantSpeed)
        }
    }
    rotateYawRight() {
        const currentRotateYawHoldTime = this.holdTime.rotation.yaw
        const tryDecreaseRotateYawHoldTime = () => {
            if (currentRotateYawHoldTime > - this.maximumHoldTime.rotation.yaw) {
                this.holdTime.rotation.yaw = currentRotateYawHoldTime - 1
                return true
            }
            return false
        }
        if (tryDecreaseRotateYawHoldTime()) {
            const newRotateYawHoldTime = this.holdTime.rotation.yaw
            const oldRotateYawHoldTime = currentRotateYawHoldTime
            if (Math.abs(newRotateYawHoldTime) > Math.abs(oldRotateYawHoldTime)) {
                // consider old : |-170| > new:  |-171|
                this.updateYawRotationMotionState(motionStates.inMotion.accelerating)
            } else {
                this.updateYawRotationMotionState(motionStates.inMotion.decelerating.oppositeDirection)
            }
        }
        else {
            this.updateYawRotationMotionState(motionStates.inMotion.constantSpeed)
        }
    }
    neutralizeYawRotation() {
        const currentRotateYawHoldTime = this.holdTime.rotation.yaw
        const tryNeutralizeRotateYawHoldTime = () => {
            if (currentRotateYawHoldTime == 0) {
                return false
            }
            else if (currentRotateYawHoldTime > 0) {
                this.holdTime.rotation.yaw = currentRotateYawHoldTime - 1
            }
            else {
                this.holdTime.rotation.yaw = currentRotateYawHoldTime + 1
            }
            return true
        }
        if (tryNeutralizeRotateYawHoldTime()) {
            this.updateYawRotationMotionState(deceleratingBy.damping)
        } else {
            this.updateYawRotationMotionState(motionStates.idle)
        }
    }
    updateYawRotationMotionState(newState) {
        this.motionState.rotation.yaw = newState
    }
    angularSpeed() {
        //positive or negative depends on the sign of yaw rotation hold time, the other two are always positive
        return (this.holdTime.rotation.yaw / this.maximumHoldTime.rotation.yaw) * this.maximumSpeed.angular
    }
    animate() {
        const submarineMesh = this.submarineMesh
        this.considerDamping()
        const angularSpeed = this.angularSpeed()
        const yAngle = submarineMesh.rotation.y += angularSpeed
        const forwardSpeed = this.forwardSpeed()
        submarineMesh.position.x -= Math.sin(yAngle) * forwardSpeed
        submarineMesh.position.z -= Math.cos(yAngle) * forwardSpeed
        this.updateGui(forwardSpeed, angularSpeed)
        // console.log('forward speed: ' + forwardSpeed)
        // console.log('forward motion state: ' + this.motionState.forward.description)
        // console.log('angular speed: ' + angularSpeed)
        // console.log('rotation motion state: ' + this.motionState.rotation.yaw.description)
    }

    considerDamping() {
        const considerDampingForward = () => {
            if (this.motionState.forward === deceleratingBy.damping) {
                if (!this.didDampenLastFrame.forward) {
                    this.decelerateForward(deceleratingBy.damping)
                    this.didDampenLastFrame.forward = true
                }
                else {
                    this.didDampenLastFrame.forward = false
                }
            }
        }
        const considerDampingYawRotation = () => {
            if (this.motionState.rotation.yaw === deceleratingBy.damping) {
                this.neutralizeYawRotation()    //until the motion state of yaw rotation is idle (yaw hold time is already zero)
            }
        }
        considerDampingForward()
        considerDampingYawRotation()
    }
    updateGui(forwardSpeed, angularSpeed) {
        guiListenables.forwardSpeed = forwardSpeed;
        guiListenables.forwardMotionState = this.motionState.forward.description;
        guiListenables.angularSpeed = Math.abs(angularSpeed);
        guiListenables.rotationMotionState = this.motionState.rotation.yaw.description + (this.holdTime.rotation.yaw > 0 ? ' left' : this.holdTime.rotation.yaw < 0 ? ' right' : '');
    }
    //submersion motion control:
    accelerateDive() {
        if (this.submersionHoldTime < this.maximumSubmersionHoldTime) {
            this.submersionHoldTime++
            this.submersionSpeed = (this.submersionHoldTime / this.maximumSubmersionHoldTime) * this.maximumSubmersionSpeed
            this.decelerateSurface() // Reduce surface speed when diving
        }
    }

    accelerateAscent() {
        if (this.submersionHoldTime > -this.maximumSubmersionHoldTime) {
            this.submersionHoldTime--
            this.submersionSpeed = (this.submersionHoldTime / this.maximumSubmersionHoldTime) * this.maximumSubmersionSpeed
            this.decelerateSurface() // Reduce surface speed when ascending
        }
    }
    rotatePitchUp() {
        if (this.rotationHoldTime.pitch < this.maximumRotationHoldTime) {
            this.rotationHoldTime.pitch++
            this.rotationSpeed.pitch = (this.rotationHoldTime.pitch / this.maximumRotationHoldTime) * this.maximumRotationSpeed
        }
    }

    rotatePitchDown() {
        if (this.rotationHoldTime.pitch > -this.maximumRotationHoldTime) {
            this.rotationHoldTime.pitch--
            this.rotationSpeed.pitch = (this.rotationHoldTime.pitch / this.maximumRotationHoldTime) * this.maximumRotationSpeed
        }
    }

    rotateRollLeft() {
        if (this.rotationHoldTime.roll < this.maximumRotationHoldTime) {
            this.rotationHoldTime.roll++
            this.rotationSpeed.roll = (this.rotationHoldTime.roll / this.maximumRotationHoldTime) * this.maximumRotationSpeed
        }
    }

    rotateRollRight() {
        if (this.rotationHoldTime.roll > -this.maximumRotationHoldTime) {
            this.rotationHoldTime.roll--
            this.rotationSpeed.roll = (this.rotationHoldTime.roll / this.maximumRotationHoldTime) * this.maximumRotationSpeed
        }
    }
}

