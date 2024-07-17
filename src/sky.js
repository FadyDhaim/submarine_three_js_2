import { Sky } from "three/examples/jsm/objects/Sky";
import { AppWater } from "./water";


export class AppSky extends Sky{
    constructor() {
        super()
        this.scale.setScalar(AppWater.SPATIAL_SIZE);
        const skyUniforms = this.material.uniforms;
        skyUniforms['turbidity'].value = 10;
        skyUniforms['rayleigh'].value = 2;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.8;
    }
}