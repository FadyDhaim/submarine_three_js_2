import { PerspectiveCamera } from "three"

export class AppCamera extends PerspectiveCamera {
    constructor(fovy = 55, near = 1, far = 20000) {
        super(fovy, AppCamera.aspectRatio, near, far)
    }
    static aspectRatio
    setupControls(renderer) {
        throw new Error()
    }
}