import { mat4 } from "gl-matrix"
import type { Device } from "./Device"
import { Uniform } from "./Uniform"


export class SceneUniform extends Uniform {
    constructor(device: Device) {
        super(device.device!!, ["mat4x4f"])
    }
    perspective(fovy: number, aspect: number, near: number, far: number) {
        mat4.perspectiveZO(this.values[0], fovy, aspect, near, far)
    }
}
