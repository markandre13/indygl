import type { mat4 } from "gl-matrix"
import type { Device } from "./Device"
import { Uniform } from "./Uniform"

// new Uniform(device.device!!, ["mat4x4f", "mat4x4f"])

export class ModelUniform extends Uniform {
    constructor(device: Device) {
        super(device.device!!, ["mat4x4f", "mat4x4f"])
    }
    get modelViewMatrix(): mat4 {
        return this.values[0]
    }
    get normalMatrix(): mat4 {
        return this.values[1]
    }
}
