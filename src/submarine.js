import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GUI } from 'dat.gui'
import { SubmarineCamera } from './cameras/submarine_camera'
const motionStates = Object.freeze({
    idle: Symbol('Idle'),
    inMotion:
    {
        decelerating: {
            damping:
                Symbol.for('Damping'),
            braking:
                Symbol.for('Braking'),
            oppositeDirection:
                Symbol.for('Decelerating. Reverse'),
            deeperWater:
                Symbol.for('Decelerating. Deeper water'),
            closerToSurface:
                Symbol.for('Decelerating. Surfacing'),
        },
        accelerating: Symbol('Accelerating'),
        constantSpeed: Symbol('Constant Speed')
    }
})
///convenience...
const deceleratingBy = Object.freeze({
    damping:
        Symbol.for('Damping'),
    braking:
        Symbol.for('Braking'),
    oppositeDirection:
        Symbol.for('Decelerating. Reverse'),
    //havnig reduced effective submersion speed for both going downward and upward:
    deeperWater:
        Symbol.for('Decelerating. Deeper water'),
    closerToSurface:
        Symbol.for('Decelerating. Surfacing'),
})
const guiVelocities = {
    forward: 0.0,
    angular: 0.0,
    submersion: 0.0,
}
const guiMotionState = {
    forward: '',
    angular: '',
    submersion: '',
}
const guiPosition = {
    x: 0.0,
    y: 0.0,
    z: 0.0,
}
export class Submarine {
    constructor() {
        //رسم
        this.modelPath = '../models/submarine.glb'
        this.mesh = null

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
            }
        }
        this.maximumHoldTime = {
            forward: 360,   // 6 seconds
            submersion: 180, // 3 seconds
            rotation: {
                yaw: 180 // 3 seconds
            }
        }
        this.maximumVelocity = {
            forward: 1.0,
            submersion: -0.5,
            angular: 0.004, //yaw rotation velocity... 0.28 degrees per frame => 16.8 degrees per second
        }
        this.maximumSelfRotation = {
            roll: Math.PI / 24, // 7.5 degrees
            pitch: Math.PI / 24 //7.5 degrees
        }
        this.initialDepth = -10.0
        this.maximumDepth = -100.0
        this.didDampenLastFrame = {
            forward: false,
        }
    }
    async load() {
        const loader = new GLTFLoader()
        return new Promise((resolve) => {
            loader.load(this.modelPath, (gltf) => {
                this.mesh = gltf.scene
                this.mesh.castShadow = true
                this.mesh.position.set(0, this.initialDepth, 0)
                this.mesh.scale.setScalar(10)
                this.camera = new SubmarineCamera()
                this.mesh.add(this.camera)
                this.setup()
                resolve({
                    'submarineMesh': this.mesh,
                    'submarineCamera': this.camera,
                })
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
                        break
                    case 'd':
                    case 'D':
                        this.rotateYawRight()
                        break
                    case 'e':
                    case 'E':
                        this.accelerateAscending()
                        break
                    case 'q':
                    case 'Q':
                        this.accelerateDiving()
                        break
                    case 'o':
                    case 'O':
                        this.camera.restoreDefaultView()
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
                        break
                    case 'q':
                    case 'Q':
                    case 'e':
                    case 'E':
                        this.neutralizeDiving()
                        break
                }
            })
        }
        const setupGui = () => {
            const gui = new GUI()
            const speedsFolder = gui.addFolder('Velocities')
            speedsFolder.add(guiVelocities, 'forward', 0.0, this.maximumVelocity.forward, 0.01).listen()
            speedsFolder.add(guiVelocities, 'angular', 0.0, this.maximumVelocity.angular, 0.0001).listen()
            speedsFolder.add(guiVelocities, 'submersion', 0.0, Math.abs(this.maximumVelocity.submersion), 0.01).listen()
            speedsFolder.open()
            const motionStateFolder = gui.addFolder('Motion States')
            motionStateFolder.add(guiMotionState, 'forward').listen()
            motionStateFolder.add(guiMotionState, 'angular').listen()
            motionStateFolder.add(guiMotionState, 'submersion').listen()
            motionStateFolder.open()
            const positionFolder = gui.addFolder('Position')
            positionFolder.add(guiPosition, 'x', 0.0).listen()
            positionFolder.add(guiPosition, 'y', 0.0).listen()
            positionFolder.add(guiPosition, 'z', 0.0).listen()
            positionFolder.open()
        }
        const setupCamera = () => {
            this.camera.setupControls()
            this.camera.setDefaultView()
        }
        setupInteractivity()
        setupGui()
        setupCamera()
    }


    //forward motion control:   5
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
                if (by === deceleratingBy.braking) {
                    // console.log('braking');
                    this.holdTime.forward = currentForwardHoldTime - 2
                    if (this.holdTime.forward < 0) {    //1 -> -1
                        this.holdTime.forward = 0
                    }
                } else {
                    this.holdTime.forward = currentForwardHoldTime - 1
                }
                return true
            }
            return false
        }
        if (tryDecreaseForwardHoldTime()) {
            this.updateForwardMotionState(by)   //by damping or by braking
        }
        else {
            this.updateForwardMotionState(motionStates.idle)
        }
    }
    updateForwardMotionState(newState) {
        this.motionState.forward = newState
    }
    /**
 * min: 50% maximum forward speed
 * max: 100% maximum forward speed
 * @returns the effective maximum forward speed based on the current depth, the deeper we are, the less the speed
 */
    effectiveMaximumForwardVelocity() {
        return (0.3 * this.maximumVelocity.forward) + ((this.maximumDepth - this.currentClampedDepth()) / (this.maximumDepth - this.initialDepth)) * (0.7 * this.maximumVelocity.forward)
    }
    forwardVelocity() {
        return (this.holdTime.forward / this.maximumHoldTime.forward) * this.effectiveMaximumForwardVelocity()
    }

    //left and right rotation: 7
    rotateYawLeft() {
        const currentRotateYawHoldTime = this.holdTime.rotation.yaw
        const tryIncreaseRotateYawHoldTime = () => {
            if (currentRotateYawHoldTime < this.maximumHoldTime.rotation.yaw) {
                const isRotatingRight = currentRotateYawHoldTime < 0
                if (isRotatingRight) {
                    this.holdTime.rotation.yaw = currentRotateYawHoldTime + 2
                }
                else {
                    this.holdTime.rotation.yaw = currentRotateYawHoldTime + 1
                }
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
                // consider old : |-170| > new:  |-168|
                this.updateYawRotationMotionState(motionStates.inMotion.decelerating.oppositeDirection)
            }
            this.rotateRoll()
        }
        else {
            this.updateYawRotationMotionState(motionStates.inMotion.constantSpeed)
        }
    }
    rotateYawRight() {
        const currentRotateYawHoldTime = this.holdTime.rotation.yaw
        const tryDecreaseRotateYawHoldTime = () => {
            if (currentRotateYawHoldTime > - this.maximumHoldTime.rotation.yaw) {
                const isRotatingLeft = currentRotateYawHoldTime > 0
                if (isRotatingLeft) {
                    this.holdTime.rotation.yaw = currentRotateYawHoldTime - 2
                }
                else {
                    this.holdTime.rotation.yaw = currentRotateYawHoldTime - 1
                }
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
            this.rotateRoll()
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
            if (currentRotateYawHoldTime > 0) {
                this.holdTime.rotation.yaw = currentRotateYawHoldTime - 1
            }
            else {
                this.holdTime.rotation.yaw = currentRotateYawHoldTime + 1
            }
            return true
        }
        if (tryNeutralizeRotateYawHoldTime()) {
            this.updateYawRotationMotionState(deceleratingBy.damping)
            this.rotateRoll()
        } else {
            this.updateYawRotationMotionState(motionStates.idle)
        }
    }
    updateYawRotationMotionState(newState) {
        this.motionState.rotation.yaw = newState
    }
    effectiveMaximumAngularVelocity() {
        return (0.3 * this.maximumVelocity.angular) + ((this.maximumDepth - this.currentClampedDepth()) / (this.maximumDepth - this.initialDepth)) * (0.7 * this.maximumVelocity.angular)
    }
    angularVelocity() {
        //positive or negative depends on the sign of yaw rotation hold time, the other two are always positive
        return (this.holdTime.rotation.yaw / this.maximumHoldTime.rotation.yaw) * this.effectiveMaximumAngularVelocity()
    }
    /**
     * self rotation around Z, as a result of steering left or right (A and B)
     */
    rotateRoll() {
        this.mesh.rotation.z = (this.holdTime.rotation.yaw / this.maximumHoldTime.rotation.yaw) * this.maximumSelfRotation.roll
    }

    //submersion control operations: 8,
    /** 
    * @returns D, that is the current depth and ensures it doesn't go beyond the maximum depth and minimum / initial depth
    */
    currentClampedDepth() {
        if (Math.abs(this.mesh.position.y) > Math.abs(this.maximumDepth)) {
            this.mesh.position.y = this.maximumDepth
        }
        if (Math.abs(this.mesh.position.y) < Math.abs(this.initialDepth)) {
            this.mesh.position.y = this.initialDepth
        }
        return this.mesh.position.y
    }
    effectiveMaximumSubmersionVelocity() {
        //-10 -> -50
        const isDiving = this.holdTime.submersion > 0
        const isAscending = this.holdTime.submersion < 0
        if (isDiving) {
            //DM - D / DM - D0  *  MS
            return ((this.maximumDepth - this.currentClampedDepth()) / (this.maximumDepth - this.initialDepth)) * this.maximumVelocity.submersion
        }
        else if (isAscending) {
            //D0 - D / D0 - DM  *  MS    -0.5   -0.1
            var ems = (this.initialDepth - this.currentClampedDepth()) / (this.initialDepth - this.maximumDepth) * this.maximumVelocity.submersion
            if (ems > 0.1 * this.maximumVelocity.submersion) {
                ems = 0.1 * this.maximumVelocity.submersion
            }
            return ems
        }
        return 0 // H = 0 anyway
        //(-50 - (-50) / 40)
    }
    submersionVelocity() {
        return (this.holdTime.submersion / this.maximumHoldTime.submersion) * this.effectiveMaximumSubmersionVelocity()
    }
    accelerateDiving() {
        const currentSubmersionHoldTime = this.holdTime.submersion
        const tryIncreaseSubmersionHoldTime = () => {
            if (Math.round(this.currentClampedDepth()) == this.maximumDepth) {
                const stillDiving = currentSubmersionHoldTime > 0
                if (stillDiving) {
                    this.holdTime.submersion = currentSubmersionHoldTime - 1
                    this.rotatePitch()
                }
                this.updateSubmersionMotionState(motionStates.idle) //almost idle
                return false
            }
            if (currentSubmersionHoldTime < this.maximumHoldTime.submersion) {
                const isAscending = currentSubmersionHoldTime < 0
                if (isAscending) {
                    this.holdTime.submersion = currentSubmersionHoldTime + 1
                } else {
                    this.holdTime.submersion = currentSubmersionHoldTime + 1
                }
                return true
            }
            else {
                this.updateSubmersionMotionState(deceleratingBy.deeperWater)
                return false
            }
        }
        if (tryIncreaseSubmersionHoldTime()) {
            const newSubmersionHoldTime = this.holdTime.submersion
            const oldSubmersionHoldTime = currentSubmersionHoldTime
            //0 -> 1 => |new| > |old|
            if (Math.abs(newSubmersionHoldTime) > Math.abs(oldSubmersionHoldTime)) {
                this.updateSubmersionMotionState(motionStates.inMotion.accelerating)
            }
            //-180 -> -179 => |new| < |old|
            else {
                this.updateSubmersionMotionState(deceleratingBy.oppositeDirection)
            }
            this.rotatePitch()
        }
    }
    neutralizeDiving() {
        const currentSubmersionHoldTime = this.holdTime.submersion
        const tryNeutralizeSubmersionHoldTime = () => {
            if (currentSubmersionHoldTime == 0) {
                return false
            }
            if (currentSubmersionHoldTime > 0) {
                this.holdTime.submersion = currentSubmersionHoldTime - 1
            }
            else {
                this.holdTime.submersion = currentSubmersionHoldTime + 1
            }
            return true
        }
        if (tryNeutralizeSubmersionHoldTime()) {
            this.updateSubmersionMotionState(motionStates.inMotion.decelerating.damping)
            this.rotatePitch()
        } else {
            this.updateSubmersionMotionState(motionStates.idle)
        }
    }
    accelerateAscending() {
        const currentSubmersionHoldTime = this.holdTime.submersion
        const tryDecreaseSubmersionHoldTime = () => {
            if (Math.round(this.currentClampedDepth()) == this.initialDepth) {
                const stillAscending = currentSubmersionHoldTime < 0
                if (stillAscending) {
                    this.holdTime.submersion = currentSubmersionHoldTime + 1
                    this.rotatePitch()
                }
                this.updateSubmersionMotionState(motionStates.idle)
                return false
            }
            if (currentSubmersionHoldTime >- this.maximumHoldTime.submersion) {
                const isDiving = currentSubmersionHoldTime > 0
                if (isDiving) {
                    //same if for now.... might get deleted
                    this.holdTime.submersion = currentSubmersionHoldTime - 1
                }
                else {
                    this.holdTime.submersion = currentSubmersionHoldTime - 1
                }
                return true
            }
            else {
                this.updateSubmersionMotionState(deceleratingBy.closerToSurface)
                return false
            }
        }
        if (tryDecreaseSubmersionHoldTime()) {
            const newSubmersionHoldTime = this.holdTime.submersion
            const oldSubmersionHoldTime = currentSubmersionHoldTime
            //0 -> -1 => |new| > |old|
            if (Math.abs(newSubmersionHoldTime) > Math.abs(oldSubmersionHoldTime)) {
                this.updateSubmersionMotionState(motionStates.inMotion.accelerating)
            }
            //180 -> 179 => |new| < |old|
            else {
                this.updateSubmersionMotionState(deceleratingBy.oppositeDirection)
            }
            this.rotatePitch()
        }
    }
    /**
     * up or down according to whether diving or going up
     * any update to the submersion hold time caused by either diving, ascending or damping, must call this method
     */
    rotatePitch() {
        this.mesh.rotation.x = (this.holdTime.submersion / this.maximumHoldTime.submersion) * -this.maximumSelfRotation.pitch
    }
    updateSubmersionMotionState(newState) {
        this.motionState.submersion = newState
    }
    animate() {
        const mesh = this.mesh
        this.considerDamping()
        const angularVelocity = this.angularVelocity()
        const forwardVelocity = this.forwardVelocity()
        const submersionVelocity = this.submersionVelocity()
        const considerRotating = () => {
            mesh.rotation.y += angularVelocity
        }
        const considerMovingForward = () => {
            const yAngle = mesh.rotation.y
            mesh.position.z -= Math.cos(yAngle) * forwardVelocity
            mesh.position.x -= Math.sin(yAngle) * forwardVelocity
        }
        const considerDiving = () => {
            mesh.position.y += submersionVelocity
        }
        const updateDependencies = () => {
            this.camera.update(mesh.position, mesh.rotation.z / this.maximumSelfRotation.roll, mesh.rotation.x / this.maximumSelfRotation.pitch)
            this.updateGui(forwardVelocity, angularVelocity, submersionVelocity)
        }
        considerRotating()
        considerMovingForward()
        considerDiving()
        updateDependencies()
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
        const considerDampingSubmersion = () => {
            if (this.motionState.submersion === deceleratingBy.damping) {
                this.neutralizeDiving()
            }
        }
        considerDampingForward()
        considerDampingYawRotation()
        considerDampingSubmersion()
    }
    updateGui(forwardVelocity, angularVelocity, submersionVelocity) {
        guiVelocities.forward = forwardVelocity
        guiVelocities.submersion = Math.abs(submersionVelocity)
        guiVelocities.angular = Math.abs(angularVelocity)
        guiMotionState.forward = this.motionState.forward.description
        guiMotionState.angular = (this.holdTime.rotation.yaw > 0 ? 'Left - ' : this.holdTime.rotation.yaw < 0 ? 'Right - ' : '') + this.motionState.rotation.yaw.description
        guiMotionState.submersion = (this.holdTime.submersion > 0 ? 'Diving - ' : this.holdTime.submersion < 0 ? 'Ascending - ' : '') + this.motionState.submersion.description
        const { x, y, z } = this.mesh.position
        guiPosition.x = x
        guiPosition.y = y
        guiPosition.z = z
    }
}