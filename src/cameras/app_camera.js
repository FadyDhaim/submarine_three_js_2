import { PerspectiveCamera } from "three"

export class AppCamera extends PerspectiveCamera {
    //old values: 55, 1, 20000
    //new values: 45, 0.1, ~~
    constructor(fovy = 55, near = 1, far = 20000) {
        super(fovy, AppCamera.aspectRatio, near, far)
    }
    static aspectRatio
    setupControls() {
        throw new Error()
    }
}