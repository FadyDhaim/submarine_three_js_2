import { MathUtils, PMREMGenerator, Scene, Vector3 } from "three"

export class AppSun extends Vector3 {
    constructor(mainScene, renderer, sky, water) {
        super()
        this.parameters = {
            elevation: 2,
            azimuth: 180
        }
        this.renderTarget = undefined
        this.pmremGenerator = new PMREMGenerator(renderer)
        this.sceneEnv = new Scene()
        this.scene = mainScene
        this.sky = sky
        this.water = water
        this.update = this.update.bind(this)
    }
    update() {
        const { elevation, azimuth } = this.parameters
        const phi = MathUtils.degToRad(90 - elevation)
        const theta = MathUtils.degToRad(azimuth)
        this.setFromSphericalCoords(1, phi, theta)
        this.sky.material.uniforms['sunPosition'].value.copy(this)
        this.water.material.uniforms['sunDirection'].value.copy(this).normalize()
        if (this.renderTarget !== undefined) this.renderTarget.dispose()
        this.sceneEnv.add(this.sky)
        this.renderTarget = this.pmremGenerator.fromScene(this.sceneEnv)
        this.scene.add(this.sky)
        this.scene.environment = this.renderTarget.texture
    }
    showGui(gui) {
        const sunFolder = gui.addFolder('Sun');
        sunFolder.add(this.parameters, 'elevation', 0, 90, 0.1).onChange(this.update);
        sunFolder.add(this.parameters, 'azimuth', - 180, 180, 0.1).onChange(this.update);
        sunFolder.open();
    }
}