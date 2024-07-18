export class Submarine {
    constructor() {
        this.modelPath = '../models/submarine.glb'
        this.submarineMesh = null
        // this.velocity = {
        //     linear: 0.0,
        //     angular: 0.0
        // }
        this.motionState = motionStates.idle
        this.accelerationState = null
        this.maximumLinearSpeed = 6.0
        this.maximumSubmersionSpeed = -2.0
        this.initialDepth = -10.0
        this.maximumDepth = -50.0
        this.linearHoldTime = 0 //in frames
        this.maximumLinearHoldTime = 720  //6 seconds worth of frames @60 FPS
        this.submersionHoldTime = 0
        this.maximumSubmersionHoldTime = -180 //3s
        this.didDampenLastFrame = false
    }
    async load() {
        const loader = new GLTFLoader()
        return new Promise((resolve) => {
            loader.load(this.modelPath, (gltf) => {
                const submarineMesh = gltf.scene
                submarineMesh.position.set(0, this.initialDepth, 0)
                submarineMesh.castShadow = true
                submarineMesh.scale.setScalar(10)
                this.submarineMesh = submarineMesh
                this._setupInteractivity()
                resolve(submarineMesh)
            })
        })
    }
    animate() {
        if (this.accelerationState == accelerationStates.decelerating && this.linearHoldTime != 0) {
            if (!this.didDampenLastFrame) {
                this.dampenHoldTime()
            } else {
                this.didDampenLastFrame = false
            }
        }
        const velocity = this.holdTimeToLinearVelocity()
        this.submarineMesh.position.z -= velocity
        const currentDepth = this.submarineMesh.position.y
        if (currentDepth >= this.maximumDepth && currentDepth <= this.initialDepth) {
            const submersionVelocity = this.holdTimeToLinearSubmersionVelocity()
            let nextDepth = currentDepth + submersionVelocity
            nextDepth = clamp(nextDepth, this.maximumDepth, this.initialDepth)
            this.submarineMesh.position.y = nextDepth
        }
        // console.log(velocity)
    }
    _setupInteractivity() {
        window.addEventListener('keydown', (event) => {
            const key = event.key
            switch (key) {
                case 'w':
                case 'W':
                    break
                case 's':
                case 'S':
                    break
                case 'a':
                case 'A':
                    break
                case 'd':
                case 'D':
                    break
                case 'e':
                case 'E':
                    break
                case 'q':
                case 'Q':
                    break
            }
        })
        window.addEventListener('keyup', (event) => {
            const key = event.key
            switch (key) {
                case 'w':
                case 'W':
                    break
                case 's':
                case 'S':
                    break
                case 'a':
                case 'A':
                    break
                case 'd':
                case 'D':
                    break
                case 'e':
                case 'E':
                    break
                case 'q':
                case 'Q':
                    break
            }
        })
    }

    holdTimeToLinearVelocity() {
        let velocity
        const holdTime = this.linearHoldTime
        const idleOrNeutral = holdTime == 0
        if (idleOrNeutral) {
            velocity = 0
        }
        else {
            const _forwardVelocity = () => {
                return holdTime * (this.maximumForwardSpeed / this.maximumLinearHoldTime)
            }
            const _reverseVelocity = () => {
                return holdTime * (this.maximumReverseSpeed / this.maximumReverseHoldTime)
            }
            const goingForward = holdTime > 0
            const goingBackward = holdTime < 0
            if (goingForward) {
                velocity = _forwardVelocity()
            }
            else if (goingBackward) {
                velocity = _reverseVelocity()
            }
        }
        return velocity
    }
    holdTimeToLinearSubmersionVelocity() {
        let velocity
        const holdTime = this.submersionHoldTime
        const idleOrNeutral = holdTime == 0
        if (idleOrNeutral) {
            velocity = 0
        }
        else {
            velocity = holdTime * (this.maximumSubmersionSpeed / this.maximumSubmersionHoldTime)
        }
        return velocity
    }
    
    accelerateUpward() {
        this.pushSubmersionHoldTimeBackward()
    }
    accelerateDownward() {
        this.pushSubmersionHoldTimeAhead()
    }
    accelerateForward() {
        this.updateAccelerationState(accelerationStates.accelerating)
        this.pushHoldTimeAhead()
    }
    accelerateBackward() {
        this.updateAccelerationState(accelerationStates.accelerating)
        this.pushHoldTimeBackward()
    }
    pushHoldTimeAhead() {
        if (this.linearHoldTime < this.maximumLinearHoldTime) {
            this.linearHoldTime++
        }
    }
    pushHoldTimeBackward() {
        if (this.linearHoldTime > this.maximumReverseHoldTime) {
            this.linearHoldTime--
        }
    }
    pushSubmersionHoldTimeAhead() {
        if (this.submersionHoldTime > this.maximumSubmersionHoldTime) {
            this.submersionHoldTime--
        }
    }
    pushSubmersionHoldTimeBackward() {
        if (this.submersionHoldTime < Math.abs(this.maximumSubmersionHoldTime)) {
            this.submersionHoldTime++
        }
    }
    dampenHoldTime() {
        if (this.linearHoldTime > 0) {
            this.linearHoldTime--
        } else if (this.linearHoldTime < 0) {
            this.linearHoldTime++
        }
        if (this.linearHoldTime == 0) {
            this.markAsMotionless()
        }
        this.didDampenLastFrame = true
    }
    markAsMotionless() {
        this.updateMotionState(motionStates.idle)
        this.updateAccelerationState(null)
    }
    updateMotionState(value) {
        if (this.motionState != value) {
            this.motionState = value
        }
    }
    updateAccelerationState(value) {
        if (this.accelerationState != value) {
            this.accelerationState = value
        }
    }
}