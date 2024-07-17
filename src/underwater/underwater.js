import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
export class Underwater{
    constructor() {
        this.modelPath = '../../models/underwater.glb'
    }
    async load() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader()
            loader.load(this.modelPath, (model) => {
                const object = model.scene
                // object.scale.setScalar(200)
                object.scale.set(400, 200, 400)
                // object.position.y = -27.5
                object.position.y = -55
                resolve(object)
            })
        })
    }
}