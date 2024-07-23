import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { Submarine } from './submarine'
import { AppCamera } from './cameras/app_camera'
import { MainCamera } from './cameras/main_camera'
import { AppSky } from './sky'
import { AppSun } from './sun'
import { AppWater } from './water'
import { ACESFilmicToneMapping, AmbientLight, DirectionalLight, FogExp2, Mesh, MeshBasicMaterial, Scene, WebGLRenderer } from 'three'
import { Underwater } from './underwater/underwater'


export class SubmarineSimulationApp {
    static renderer
    constructor() {
        this.setupRenderer()
        this.setupMainCamera()
        this.setupLights()
        this.setupScene()
        this.animate = this.animate.bind(this) // مشان نقدر نستخدم ذيس بقلب التابع يلي منستدعيه بكل فريم
    }
    setupRenderer() {
        const canvas = document.querySelector('#c') // جيب القماشة يلي رح نرندر عليها من ملف ال اتش تي م ل
        const renderer = new WebGLRenderer({ antialias: true, canvas })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.toneMapping = ACESFilmicToneMapping
        renderer.toneMappingExposure = 0.5
        SubmarineSimulationApp.renderer = renderer
    }
    setupMainCamera() {
        this.cameras = []
        AppCamera.aspectRatio = this.getAspectRatio()
        const mainCamera = new MainCamera()
        mainCamera.position.set(0, 30, 100)
        mainCamera.lookAt(0, 0, 0)
        mainCamera.setupControls(SubmarineSimulationApp.renderer)
        this.mainCamera = mainCamera
        this.cameras.push(mainCamera)
    }
    setupLights() {
        // const ambientLight = new AmbientLight(0x404040, 0.5); // Soft white light
        // const directionalLight = new DirectionalLight(0xffffff, 1.0);
        // directionalLight.position.set(1, 1, 1).normalize();
        // this.lights = [ambientLight, directionalLight]
    }
    setupScene() {
        const scene = new Scene()
        this.scene = scene
        const underwaterFog = new FogExp2(0x001e0f, 0.0008); // Adjust density as needed
        scene.fog = underwaterFog;
        // this.lights.forEach(light => scene.add(light))
        let animatableComponents = []
        this.animatableComponents = animatableComponents
        // Water
        const fogEnabled = scene.fog !== undefined
        const water = new AppWater(fogEnabled)
        scene.add(water)
        animatableComponents.push(water)
        const underwater = new Underwater()
        underwater.load().then((underwater) => {
            scene.add(underwater)
        })
        // Skybox
        const sky = new AppSky()
        scene.add(sky)

        const sun = new AppSun(scene, SubmarineSimulationApp.renderer, sky, water, underwater)
        sun.update()
        // Submarine
        let submarine = new Submarine()
        submarine.load().then(submarineStuff => {
            scene.add(submarineStuff.submarineMesh)
            animatableComponents.push(submarine)
            this.cameras.push(submarineStuff.submarineCamera)
        })
        
        // GUI 
        // const gui = new GUI()
        // water.showGui(gui)
        // sun.showGui(gui)
    }

    start() {
        SubmarineSimulationApp.renderer.setAnimationLoop(this.animate)
    }
    animate(time) {
        time *= 0.001  // حول الوقت من ميلي ثانية ل ثانية
        this.ensureResponsiveDisplay() //مشان وقت نبعبص بالنافذة
        
        for (let animtableComponent of this.animatableComponents) {
            animtableComponent.animate(time)
        }
        this.render()
    }
    
    render() {
        SubmarineSimulationApp.renderer.render(this.scene, this.cameras[1] ? this.cameras[1] : this.mainCamera) //كاميرا الغواصة
    }
    ensureResponsiveDisplay() {
        const resized = this.ensureRenderingAtFullResolution()
        if (resized) {
            this.ensureProperProjection()
        }
    }
    ensureProperProjection() {
        const aspectRatio = this.getAspectRatio()
        this.cameras.forEach(camera => {
            camera.aspect = aspectRatio
            camera.updateProjectionMatrix()
        })
    }
    getAspectRatio() {
        const canvas = SubmarineSimulationApp.renderer.domElement
        return canvas.clientWidth / canvas.clientHeight
    }
    ensureRenderingAtFullResolution() {
        const canvas = SubmarineSimulationApp.renderer.domElement
        const displayWidth = canvas.clientWidth
        const displayHeight = canvas.clientHeight
        const widthBeingRendered = canvas.width
        const heightBeingRendered = canvas.height
        const needsResize = displayWidth !== widthBeingRendered || displayHeight != heightBeingRendered
        if (needsResize) {
            SubmarineSimulationApp.renderer.setSize(displayWidth, displayHeight, false)
        }
        return needsResize
    }
}
function main() {
    const app = new SubmarineSimulationApp()
    app.start()
}
main()