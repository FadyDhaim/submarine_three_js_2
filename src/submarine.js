import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GUI } from 'dat.gui'
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
                Symbol.for('oppositeDirection'),
            deeperWater:
                Symbol.for('deeperWater'),
            closerToSurface:
                Symbol.for('closerToSurface'),
        },
        accelerating: Symbol('accelerating'),
        constantSpeed: Symbol('constantSpeed')
    }
})
const deceleratingBy = Object.freeze({
    damping:
        Symbol.for('damping'),
    braking:
        Symbol.for('braking'),
    oppositeDirection:
        Symbol.for('oppositeDirection'),
    //havnig reduced effective submersion speed for both going downward and upward:
    deeperWater:
        Symbol.for('deeperWater'),
    closerToSurface:
        Symbol.for('closerToSurface'),
})
const guiSpeeds = {
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
            }
        }
        this.maximumHoldTime = {
            forward: 360,   // 6 seconds
            submersion: 180, // 3 seconds
            rotation: {
                yaw: 180 // 3 seconds
            }
        }
        this.maximumSpeed = {
            forward: 6.0,
            submersion: -0.5,
            angular: 0.01, //or yaw rotation speed / rotation around y, sweeping half a cycle in 5 seconds (3.14 / (0.01 * 60))
        }
        this.maximumSelfRotation = {
            roll: Math.PI / 24, // 7.5 degrees
            pitch: Math.PI / 24 //7.5 degrees
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
            const speedsFolder = gui.addFolder('Speeds')
            speedsFolder.add(guiSpeeds, 'forward', 0.0, this.maximumSpeed.forward, 0.01).listen()
            speedsFolder.add(guiSpeeds, 'angular', 0.0, this.maximumSpeed.angular, 0.001).listen()
            speedsFolder.add(guiSpeeds, 'submersion', 0.0, Math.abs(this.maximumSpeed.submersion), 0.01).listen()
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
        setupInteractivity()
        setupGui()
    }


    //forward motion control:   1, 2, 3, 4
    /**
     * min: 50% maximum forward speed
     * max: 100% maximum forward speed
     * @returns the effective maximum forward speed based on the current depth, the deeper we are, the less the speed
     */
    effectiveMaximumForwardSpeed() {
        return (0.5 * this.maximumSpeed.forward) + ((this.maximumDepth - this.currentDepth()) / (this.maximumDepth - this.initialDepth)) * (0.5 * this.maximumSpeed.forward)
    }
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
            this.updateForwardMotionState(by)   //by damping or by braking
        }
        else {
            this.updateForwardMotionState(motionStates.idle)
        }
    }
    updateForwardMotionState(newState) {
        this.motionState.forward = newState
    }
    forwardSpeed() {
        return (this.holdTime.forward / this.maximumHoldTime.forward) * this.effectiveMaximumForwardSpeed()
    }

    //left and right rotation: 6
    effectiveMaximumAngularSpeed() {
        return (0.5 * this.maximumSpeed.angular) + ((this.maximumDepth - this.currentDepth()) / (this.maximumDepth - this.initialDepth)) * (0.5 * this.maximumSpeed.angular)
    }
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
    angularSpeed() {
        //positive or negative depends on the sign of yaw rotation hold time, the other two are always positive
        return (this.holdTime.rotation.yaw / this.maximumHoldTime.rotation.yaw) * this.effectiveMaximumAngularSpeed()
    }
    /**
     * self rotation around Z, as a result of steering left or right (A and B)
     */
    rotateRoll() {
        this.submarineMesh.rotation.z = (this.holdTime.rotation.yaw / this.maximumHoldTime.rotation.yaw) * this.maximumSelfRotation.roll
    }

    //submersion control operations: 7,
    /** 
    * @returns the current depth and ensures it doesn't go beyond the maximum depth and minimum / initial depth
    */
    currentDepth() {
        if (Math.abs(this.submarineMesh.position.y) > Math.abs(this.maximumDepth)) {
            this.submarineMesh.position.y = this.maximumDepth
        }
        if (Math.abs(this.submarineMesh.position.y) < Math.abs(this.initialDepth)) {
            this.submarineMesh.position.y = this.initialDepth
        }
        return this.submarineMesh.position.y
    }
    effectiveMaximumSubmersionSpeed() {
        //-10 -> -50
        const isDiving = this.holdTime.submersion > 0
        const isAscending = this.holdTime.submersion < 0
        if (isDiving) {
            //DM - D / DM - D0  *  MS
            return ((this.maximumDepth - this.currentDepth()) / (this.maximumDepth - this.initialDepth)) * this.maximumSpeed.submersion
        }
        else if (isAscending) {
            //D0 - D / D0 - DM
            return ((this.initialDepth - this.currentDepth()) / (this.initialDepth - this.maximumDepth)) * this.maximumSpeed.submersion
        }
        return 0 // H = 0 anyway
        //(-50 - (-50) / 40)
    }
    submersionSpeed() {
        return (this.holdTime.submersion / this.maximumHoldTime.submersion) * this.effectiveMaximumSubmersionSpeed()
    }
    accelerateDiving() {
        const currentSubmersionHoldTime = this.holdTime.submersion
        const tryIncreaseSubmersionHoldTime = () => {
            if (currentSubmersionHoldTime < this.maximumHoldTime.submersion) {
                this.holdTime.submersion = currentSubmersionHoldTime + 1
                return true
            }
            return false
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
        } else {
            const toleranceDueToNotHittingMaximumDepth = 0.1;
            if (Math.abs(this.currentDepth()) < (Math.abs(this.maximumDepth) - toleranceDueToNotHittingMaximumDepth)) {
                this.updateSubmersionMotionState(deceleratingBy.deeperWater)
            } else {
                this.updateSubmersionMotionState(motionStates.idle)
                this.neutralizePitch()
            }
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
            if (currentSubmersionHoldTime > - this.maximumHoldTime.submersion) {
                this.holdTime.submersion = currentSubmersionHoldTime - 1
                return true
            }
            return false
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
        } else {
            const toleranceDueToNotHittingInitialDepth = 0.1;
            if (Math.abs(this.currentDepth()) > (Math.abs(this.initialDepth) + toleranceDueToNotHittingInitialDepth)) {
                this.updateSubmersionMotionState(deceleratingBy.closerToSurface)    //even though we've hit the maximum hold time for going upward, but getting closer to the surface reduces the effective maximum speed for y axis
            } else {
                this.updateSubmersionMotionState(motionStates.idle)
                this.neutralizePitch()
            }
        }
    }
    /**
     * up or down according to whether diving or going up
     */
    rotatePitch() {
        this.submarineMesh.rotation.x = (this.holdTime.submersion / this.maximumHoldTime.submersion) * -this.maximumSelfRotation.pitch
    }
    /**
     * when hitting initial or maxium depth but still holding Q or E (still preserving the submersion hold time at max)
     */
    neutralizePitch() {
        const currentPitch = this.submarineMesh.rotation.x
        if (currentPitch == 0) {
            return
        }
        const step = this.maximumSelfRotation.pitch / this.maximumHoldTime.rotation.yaw //as we know by calling this function the hold time would have been at its max (try increase returning false)
        if (currentPitch > 0) {
            this.submarineMesh.rotation.x -= step
        }
        else {
            this.submarineMesh.rotation.x += step
        }
    }
    updateSubmersionMotionState(newState) {
        this.motionState.submersion = newState
    }
    animate() {
        const submarineMesh = this.submarineMesh
        this.considerDamping()
        const angularSpeed = this.angularSpeed()
        const forwardSpeed = this.forwardSpeed()
        const submersionSpeed = this.submersionSpeed()
        const considerMovingForward = () => {
            const yAngle = submarineMesh.rotation.y += angularSpeed
            submarineMesh.position.z -= Math.cos(yAngle) * forwardSpeed
            submarineMesh.position.x -= Math.sin(yAngle) * forwardSpeed
        }
        const considerDiving = () => {
            submarineMesh.position.y += submersionSpeed
        }
        considerMovingForward()
        considerDiving()
        this.updateGui(forwardSpeed, angularSpeed, submersionSpeed)
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
    updateGui(forwardSpeed, angularSpeed, submersionSpeed) {
        guiSpeeds.forward = forwardSpeed
        guiSpeeds.submersion = Math.abs(submersionSpeed)
        guiSpeeds.angular = Math.abs(angularSpeed)
        guiMotionState.forward = this.motionState.forward.description
        guiMotionState.angular = this.motionState.rotation.yaw.description + (this.holdTime.rotation.yaw > 0 ? ' left' : this.holdTime.rotation.yaw < 0 ? ' right' : '')
        guiMotionState.submersion = this.motionState.submersion.description + (this.holdTime.submersion > 0 ? ' down' : this.holdTime.submersion < 0 ? ' up' : '')
        const { x, y, z } = this.submarineMesh.position
        guiPosition.x = x
        guiPosition.y = y
        guiPosition.z = z
    }
}